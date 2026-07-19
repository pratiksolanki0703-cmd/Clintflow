-- ============================================================
-- ClientFlow — Initial schema migration
-- ============================================================

-- 1. Drop existing tables + functions (cascade)
DROP VIEW IF EXISTS public.users_view;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

DROP TABLE IF EXISTS public.ai_credit_usage CASCADE;
DROP TABLE IF EXISTS public.reminders_log CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.milestones CASCADE;
DROP TABLE IF EXISTS public.milestone_templates CASCADE;
DROP TABLE IF EXISTS public.invoice_line_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.proposal_templates CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.project_payment_methods CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.project_creation_log CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.subscription_transactions CASCADE;
DROP TABLE IF EXISTS public.razorpay_config CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.ai_agents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Custom enums
CREATE TYPE payment_method_type  AS ENUM ('upi','paypal','bank_transfer','stripe','wise','payoneer','other');
CREATE TYPE project_status       AS ENUM ('active','completed','cancelled');
CREATE TYPE proposal_status      AS ENUM ('sent','accepted','declined');
CREATE TYPE milestone_status     AS ENUM ('not_started','in_progress','completed');
CREATE TYPE invoice_status       AS ENUM ('pending','partially_paid','paid','overdue');
CREATE TYPE subscription_status  AS ENUM ('created','paid','failed');
CREATE TYPE analytics_tier       AS ENUM ('basic','standard','advanced');
CREATE TYPE support_tier         AS ENUM ('none','priority','highest');
CREATE TYPE reminder_channel     AS ENUM ('email','whatsapp');
CREATE TYPE ai_feature_name      AS ENUM ('proposal_ai','milestone_ai','invoice_ai','email_ai');

-- 3. Tables ----------------------------------------------------

CREATE TABLE public.users (
  id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  text NOT NULL,
  username               text NOT NULL,
  business_name          text,
  logo_url               text,
  brand_color            text,
  gst_number             text,
  profession             text,
  referral_source        text,
  client_count_range     text,
  team_status            text,
  ai_credits_remaining   integer NOT NULL DEFAULT 5,
  ai_credits_topup       integer NOT NULL DEFAULT 0,
  plan_key               text NOT NULL DEFAULT 'free',
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_plans (
  plan_key                       text PRIMARY KEY,
  display_name                   text NOT NULL,
  price_monthly                  numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly                   numeric(10,2) NOT NULL DEFAULT 0,
  max_clients                    integer,
  max_projects_per_month         integer,
  emails_per_month               integer NOT NULL DEFAULT 0,
  ai_credits_per_month           integer NOT NULL DEFAULT 0,
  proposal_templates_limit      integer,
  has_custom_branding            boolean NOT NULL DEFAULT false,
  shows_powered_by_footer        boolean NOT NULL DEFAULT true,
  analytics_tier                 analytics_tier NOT NULL DEFAULT 'basic',
  support_tier                   support_tier NOT NULL DEFAULT 'none',
  is_active                      boolean NOT NULL DEFAULT true
);

CREATE TABLE public.ai_agents (
  name           ai_feature_name PRIMARY KEY,
  model          text NOT NULL,
  system_prompt  text NOT NULL,
  is_active      boolean NOT NULL DEFAULT true
);

CREATE TABLE public.clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  company     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  budget       numeric(12,2),
  currency     text NOT NULL DEFAULT 'INR',
  deadline     date,
  status       project_status NOT NULL DEFAULT 'active',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_methods (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type                payment_method_type NOT NULL,
  label               text NOT NULL,
  qr_image_url        text,
  link_or_handle      text,
  display_order       integer NOT NULL DEFAULT 0,
  is_active           boolean NOT NULL DEFAULT true
);

CREATE TABLE public.project_payment_methods (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  payment_method_id   uuid NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE
);

CREATE TABLE public.proposals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id          uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  service_description text NOT NULL,
  price               numeric(12,2) NOT NULL,
  timeline            text,
  status              proposal_status NOT NULL DEFAULT 'sent',
  share_token         text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contracts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id           uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  terms_text            text NOT NULL,
  client_signature_name text,
  signed_at             timestamptz,
  signed_ip             text,
  user_agent            text
);

CREATE TABLE public.milestones (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title        text NOT NULL,
  status       milestone_status NOT NULL DEFAULT 'not_started',
  order_index  integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.milestone_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title         text NOT NULL,
  is_built_in   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  proposal_id     uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  line_items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount     numeric(12,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'INR',
  gst_amount      numeric(12,2),
  milestone_label text,
  status          invoice_status NOT NULL DEFAULT 'pending',
  transaction_id  text,
  share_token     text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  paid_at         timestamptz
);

CREATE TABLE public.reminders_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  channel     reminder_channel NOT NULL
);

CREATE TABLE public.proposal_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  content      text NOT NULL,
  is_built_in  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_credit_usage (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature_name  ai_feature_name NOT NULL,
  credits_used  integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.razorpay_config (
  id              integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  key_id          text,
  key_secret      text,
  webhook_secret  text,
  is_live_mode    boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_key            text NOT NULL,
  razorpay_order_id   text NOT NULL,
  razorpay_payment_id text,
  amount              numeric(12,2) NOT NULL,
  currency            text NOT NULL DEFAULT 'INR',
  status              subscription_status NOT NULL DEFAULT 'created',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 4. Indexes --------------------------------------------------
CREATE INDEX idx_clients_user            ON public.clients(user_id);
CREATE INDEX idx_projects_user           ON public.projects(user_id);
CREATE INDEX idx_projects_client         ON public.projects(client_id);
CREATE INDEX idx_payment_methods_user    ON public.payment_methods(user_id);
CREATE INDEX idx_proposals_user          ON public.proposals(user_id);
CREATE INDEX idx_proposals_project       ON public.proposals(project_id);
CREATE INDEX idx_proposals_share_token   ON public.proposals(share_token);
CREATE INDEX idx_milestones_project      ON public.milestones(project_id);
CREATE INDEX idx_invoices_user           ON public.invoices(user_id);
CREATE INDEX idx_invoices_project        ON public.invoices(project_id);
CREATE INDEX idx_invoices_share_token    ON public.invoices(share_token);
CREATE INDEX idx_ai_credit_usage_user    ON public.ai_credit_usage(user_id);
CREATE INDEX idx_subs_txn_user           ON public.subscription_transactions(user_id);

-- 5. Row Level Security --------------------------------------
ALTER TABLE public.users                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payment_methods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_usage             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_transactions   ENABLE ROW LEVEL SECURITY;

-- public.users policies (user can only see/modify own row)
CREATE POLICY users_select_own    ON public.users    FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_insert_own    ON public.users    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update_own    ON public.users    FOR UPDATE USING (auth.uid() = id);

-- For all user-owned tables: SELECT / INSERT / UPDATE / DELETE WHERE user_id = auth.uid()

CREATE POLICY clients_sel    ON public.clients    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY clients_ins    ON public.clients    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY clients_upd    ON public.clients    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY clients_del    ON public.clients    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY projects_sel   ON public.projects   FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY projects_ins   ON public.projects   FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY projects_upd   ON public.projects   FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY projects_del   ON public.projects   FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY pm_sel    ON public.payment_methods  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY pm_ins    ON public.payment_methods  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY pm_upd    ON public.payment_methods  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY pm_del    ON public.payment_methods  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY ppm_sel   ON public.project_payment_methods FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);
CREATE POLICY ppm_ins   ON public.project_payment_methods FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);
CREATE POLICY ppm_del   ON public.project_payment_methods FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

CREATE POLICY proposals_sel  ON public.proposals     FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY proposals_ins  ON public.proposals     FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY proposals_upd  ON public.proposals     FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY proposals_del  ON public.proposals     FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY milestones_sel  ON public.milestones   FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);
CREATE POLICY milestones_ins  ON public.milestones   FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);
CREATE POLICY milestones_upd  ON public.milestones   FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);
CREATE POLICY milestones_del  ON public.milestones   FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
);

CREATE POLICY mtemplates_sel  ON public.milestone_templates FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY mtemplates_ins  ON public.milestone_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY mtemplates_upd  ON public.milestone_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY mtemplates_del  ON public.milestone_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY ptemplates_sel  ON public.proposal_templates FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY ptemplates_ins  ON public.proposal_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ptemplates_upd  ON public.proposal_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY ptemplates_del  ON public.proposal_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY invoices_sel  ON public.invoices  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY invoices_ins  ON public.invoices  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY invoices_upd  ON public.invoices  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY invoices_del  ON public.invoices  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY reminders_sel  ON public.reminders_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid())
);
CREATE POLICY reminders_ins  ON public.reminders_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.user_id = auth.uid())
);

CREATE POLICY aicredit_sel  ON public.ai_credit_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY aicredit_ins  ON public.ai_credit_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY subs_txn_sel  ON public.subscription_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY subs_txn_ins  ON public.subscription_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY subs_txn_upd  ON public.subscription_transactions FOR UPDATE USING (auth.uid() = user_id);

-- 6. Public-read for templates & global config tables (no user_id)
-- (subscription_plans, ai_agents, razorpay_config) — only readable publicly, writable via service role
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_config    ENABLE ROW LEVEL SECURITY;

CREATE POLICY sp_sel  ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY aa_sel  ON public.ai_agents          FOR SELECT USING (true);
CREATE POLICY rc_sel  ON public.razorpay_config    FOR SELECT USING (true);

-- 7. Trigger: auto-create `users` row on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  v_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  INSERT INTO public.users (id, email, username, plan_key, ai_credits_remaining)
  VALUES (new.id, new.email, v_username, 'free', 5)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Seed data ----------------------------------------------

INSERT INTO public.subscription_plans (plan_key, display_name, price_monthly, price_yearly, max_clients, max_projects_per_month, emails_per_month, ai_credits_per_month, proposal_templates_limit, has_custom_branding, shows_powered_by_footer, analytics_tier, support_tier, is_active) VALUES
  ('free',     'Free',     0,    0,    3,  2,  5,   5,   3,  false, true,  'basic',    'none',     true),
  ('pro',      'Pro',      499,  4990, 50, 20, 100, 100, 50,  true,  false, 'standard', 'priority',  true),
  ('business', 'Business', 1499, 14990, NULL, NULL, 500, 500, NULL, true, false, 'advanced',  'highest',   true);

INSERT INTO public.ai_agents (name, model, system_prompt, is_active) VALUES
  ('proposal_ai',  'gpt-4o-mini', 'You write professional freelancer proposals based on user input.', true),
  ('milestone_ai', 'gpt-4o-mini', 'You break project scope into clear milestones with deliverables.',  true),
  ('invoice_ai',   'gpt-4o-mini', 'You help create polite, professional invoice reminder emails.',    true),
  ('email_ai',     'gpt-4o-mini', 'You write client communication emails for freelancers.',           true);

INSERT INTO public.milestone_templates (title, is_built_in) VALUES
  ('Discovery & Requirements', true),
  ('Design / Mockups',         true),
  ('Development',              true),
  ('Review & Revisions',        true),
  ('Final Delivery & Handover', true);

INSERT INTO public.proposal_templates (title, content, is_built_in) VALUES
  ('Standard Proposal', '# Project Overview
Brief summary of what the client wants.

# Scope of Work
- Deliverable 1
- Deliverable 2

# Timeline
Week 1: ...

# Pricing
Total: ₹XX,000

# Terms
50% upfront, 50% on delivery.', true);

-- 9. Grant necessary access to anon + authenticated
GRANT SELECT ON public.subscription_plans  TO anon, authenticated;
GRANT SELECT ON public.ai_agents           TO anon, authenticated;
GRANT SELECT ON public.razorpay_config     TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users                     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestone_templates      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders_log            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_templates       TO authenticated;
GRANT SELECT, INSERT          ON public.ai_credit_usage                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_transactions TO authenticated;

-- Allow usage of sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
