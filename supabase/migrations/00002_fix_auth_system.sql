-- ============================================================
-- ClientFlow — Fix auth system: unique username, OTP reset, rate limiting
-- SAFE migration — won't delete data, handles edge cases
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. Username UNIQUE constraint (safe approach)
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Check if constraint already exists (skip if it does)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_username_unique' 
    AND conrelid = 'public.users'::regclass
  ) THEN
    -- Check for duplicate usernames first
    IF EXISTS (
      SELECT 1 FROM public.users 
      WHERE username IN (
        SELECT username FROM public.users 
        GROUP BY username HAVING COUNT(*) > 1
      )
    ) THEN
      RAISE WARNING 'Duplicate usernames found! Fix them manually before adding UNIQUE constraint.';
      RAISE WARNING 'Duplicates: %', (
        SELECT string_agg(DISTINCT username, ', ')
        FROM public.users
        WHERE username IN (
          SELECT username FROM public.users 
          GROUP BY username HAVING COUNT(*) > 1
        )
      );
      -- Rename duplicates by appending random suffix
      UPDATE public.users
      SET username = username || '-' || substr(md5(random()::text), 1, 4)
      WHERE username IN (
        SELECT username FROM public.users 
        GROUP BY username HAVING COUNT(*) > 1
      )
      AND id NOT IN (
        SELECT MIN(id) FROM public.users 
        GROUP BY username HAVING COUNT(*) > 1
      );
    END IF;

    -- Now safe to add constraint
    ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);
    RAISE NOTICE 'UNIQUE constraint added to users.username';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on users.username — skipping';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- 2. password_resets table (for OTP tracking)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.password_resets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  otp           text NOT NULL,
  expires_at    timestamptz NOT NULL,
  used          boolean NOT NULL DEFAULT false,
  attempts      integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Drop existing index if any, then recreate
DROP INDEX IF EXISTS idx_password_resets_email;
CREATE INDEX idx_password_resets_email ON public.password_resets(email);

-- Enable RLS (idempotent)
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Drop policies first to avoid "policy already exists" errors
DROP POLICY IF EXISTS password_resets_anon_insert ON public.password_resets;
DROP POLICY IF EXISTS password_resets_anon_select ON public.password_resets;
DROP POLICY IF EXISTS password_resets_anon_update ON public.password_resets;

CREATE POLICY password_resets_anon_insert ON public.password_resets
  FOR INSERT WITH CHECK (true);
CREATE POLICY password_resets_anon_select ON public.password_resets
  FOR SELECT USING (true);
CREATE POLICY password_resets_anon_update ON public.password_resets
  FOR UPDATE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_resets TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ════════════════════════════════════════════════════════════
-- 3 + 4. Helper functions (SECURITY DEFINER — bypass RLS)
-- ════════════════════════════════════════════════════════════

-- Function: Check if username is available (for unauthenticated signup page)
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE username = p_username
  ) INTO v_exists;
  
  RETURN jsonb_build_object(
    'available', NOT v_exists,
    'message', CASE WHEN v_exists THEN 'This username is already taken' ELSE 'Username available' END
  );
END;
$$;

-- Function: Generate and store OTP for password reset
CREATE OR REPLACE FUNCTION public.generate_password_reset_otp(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp text;
  v_recent_count integer;
BEGIN
  -- Rate limit: max 3 OTP requests per email in last 15 minutes
  SELECT COUNT(*) INTO v_recent_count
  FROM public.password_resets
  WHERE email = p_email
    AND created_at > now() - interval '15 minutes';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Too many OTP requests. Please try again later.';
  END IF;

  -- Generate random 6-digit OTP
  v_otp := LPAD(FLOOR(random() * 999999)::text, 6, '0');

  -- Store OTP with 10-minute expiry
  INSERT INTO public.password_resets (email, otp, expires_at)
  VALUES (p_email, v_otp, now() + interval '10 minutes');

  RETURN v_otp;
END;
$$;

-- Function: Verify OTP for password reset
CREATE OR REPLACE FUNCTION public.verify_password_reset_otp(p_email text, p_otp text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.password_resets;
BEGIN
  SELECT * INTO v_record
  FROM public.password_resets
  WHERE email = p_email
    AND otp = p_otp
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_record.id IS NULL THEN
    -- Increment attempts on latest record
    UPDATE public.password_resets
    SET attempts = attempts + 1
    WHERE email = p_email
      AND used = false
      AND expires_at > now();
    RETURN false;
  END IF;

  -- Mark as used
  UPDATE public.password_resets
  SET used = true
  WHERE id = v_record.id;

  RETURN true;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 5. Server-side rate limiting for OTP sends (signup + forgot password)
-- Called by the frontend BEFORE calling supabase.auth.signInWithOtp()
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(p_email text, p_purpose text DEFAULT 'forgot_password')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count integer;
  v_latest_attempt timestamptz;
  v_allowed boolean;
  v_message text;
  v_remaining_secs integer;
BEGIN
  -- Count OTP sends for this email in the last 15 minutes
  SELECT COUNT(*) INTO v_recent_count
  FROM public.password_resets
  WHERE email = p_email
    AND created_at > now() - interval '15 minutes';

  IF v_recent_count >= 3 THEN
    -- Find when the oldest recent attempt was made to calculate remaining lockout
    SELECT MIN(created_at) INTO v_latest_attempt
    FROM public.password_resets
    WHERE email = p_email
      AND created_at > now() - interval '15 minutes';

    v_remaining_secs := EXTRACT(EPOCH FROM (v_latest_attempt + interval '15 minutes' - now()))::integer;
    v_allowed := false;
    v_message := 'Too many attempts. Please try again in ' || GREATEST(1, v_remaining_secs / 60)::text || ' minute(s).';
  ELSE
    v_allowed := true;
    v_message := 'OK';
  END IF;

  -- Log the attempt for rate tracking (both signup & forgot-password)
  INSERT INTO public.password_resets (email, otp, expires_at)
  VALUES (p_email, 'rate-check-' || p_purpose, now() + interval '15 minutes');

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'message', v_message,
    'remaining', v_recent_count,
    'limit', 3
  );
END;
$$;

-- ════════════════════════════════════════════════════════════
-- 6. Grant permissions
-- ════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_password_reset_otp(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_password_reset_otp(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_otp_rate_limit(text, text) TO anon, authenticated;
