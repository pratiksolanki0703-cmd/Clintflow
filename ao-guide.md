# ClientFlow — AI Orchestration Guide

## Overview
ClientFlow ek freelancer-client portal SaaS hai. Flow: **Proposal → Contract → Project Progress → Invoice → Payment Tracking**.

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite
- **Routing:** React Router v7 (HashRouter for GitHub Pages)
- **Styling:** Tailwind CSS v4
- **Backend/Database:** Supabase (PostgreSQL)
- **State/Server:** TanStack Query v5
- **Forms:** react-hook-form + zod
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Deploy:** GitHub Pages (via GitHub Actions)
- **PDF:** jsPDF
- **UI lib:** lucide-react icons, sonner (toasts)

## Repo Structure
```
Clintflow/
├── app/                          # React app root
│   ├── src/
│   │   ├── App.tsx               # Main app with routes
│   │   ├── main.tsx              # Entry point (HashRouter)
│   │   ├── index.css             # Tailwind + global styles
│   │   ├── lib/
│   │   │   ├── supabase.ts       # Supabase client config
│   │   │   └── database.types.ts # Full TS type definitions for all tables
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx    # Auth logic (signup, signin, Google OAuth, reset password)
│   │   ├── components/           # Reusable UI (Button, Input, Card, Modal, Dropdown, etc.)
│   │   ├── pages/
│   │   │   ├── SignIn.tsx
│   │   │   ├── SignUp.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   ├── AuthCallback.tsx  # Google OAuth callback
│   │   │   ├── Dashboard.tsx     # Main dashboard after login
│   │   │   ├── Clients.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Proposals.tsx
│   │   │   ├── Invoices.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── ClientPortal.tsx  # Public client-facing portal (no login)
│   │   └── types/                # TypeScript types
│   ├── vite.config.ts            # base: '/Clintflow/'
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── supabase/
│   └── migrations/
│       └── 00001_init_schema.sql  # Full schema migration
└── .github/workflows/
    └── deploy.yml                # GitHub Actions → GitHub Pages
```

## Deployment
- **URL:** https://pratiksolanki0703-cmd.github.io/Clintflow/
- **Trigger:** Push to `main` branch → GitHub Actions build + deploy
- **Config:** `vite.config.ts` has `base: '/Clintflow/'`
- **Router:** HashRouter (BrowserRouter won't work on GH Pages sub-path)

## Supabase Project

### Credentials
```env
VITE_SUPABASE_URL=https://bgxofarufuglpffrgnub.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJneG9mYXJ1ZnVnbHBmZnJnbnViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMzA5NzQsImV4cCI6MjA5OTgwNjk3NH0.2oNuPvwlQ_VRpQsxjJKQxhfTbGX4lBIw8s_HzauktCs
```
- Anon key is safe for frontend (RLS protects data)
- GitHub Secrets set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Management PAT: *(ask user for token — sbp_... not committed)*
- Project ref: `bgxofarufuglpffrgnub`

### Auth Config
- SMTP: Resend (`onboarding@resend.dev`) — already configured
- site_url: `https://pratiksolanki0703-cmd.github.io/Clintflow/`
- Email confirmation: ON (user must verify email before first login)
- Google OAuth: OFF (needs client ID setup)
- Signups: Enabled

### Database Schema (18 tables)
All tables live in `public` schema with **RLS enabled** and per-user policies.

| Table | Type | Notes |
|---|---|---|
| `users` | Core | PK: `id` → auth.users. Auto-created via trigger on signup |
| `clients` | User-owned | Linked to `users` |
| `projects` | User-owned | Linked to `users` + `clients` |
| `proposals` | User-owned | Has `share_token` for public sharing |
| `contracts` | Per-proposal | Linked to `proposals` |
| `milestones` | Per-project | Status: not_started / in_progress / completed |
| `milestone_templates` | Built-in + user | Shared via user_id = NULL for defaults |
| `invoices` | User-owned | Has `share_token`, line_items in JSONB |
| `payment_methods` | User-owned | Types: upi, paypal, bank_transfer, stripe, etc. |
| `proposal_templates` | Built-in + user | Like milestone_templates |
| `ai_agents` | Config | 4 rows: proposal_ai, milestone_ai, invoice_ai, email_ai |
| `ai_credit_usage` | User-owned | Tracks per-feature credit consumption |
| `subscription_plans` | Config | 3 plans: free, pro, business |
| `subscription_transactions` | User-owned | Razorpay orders |
| `razorpay_config` | Config | Single-row (id=1) config |
| `reminders_log` | Per-invoice | email/whatsapp channel |
| `project_payment_methods` | M2M | project ↔ payment_method |
| `project_creation_log` | (was auto-created by old setup, kept as-is) | |

### RLS Design
- **All user-owned tables (clients, projects, proposals, invoices, etc.):** `user_id = auth.uid()` check on SELECT/INSERT/UPDATE/DELETE
- **Child tables (milestones, contracts, reminders):** Check via parent table (e.g., `EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())`)
- **Config tables (subscription_plans, ai_agents, razorpay_config):** Public SELECT only
- **milestone_templates / proposal_templates:** User can see own + built-in (`user_id IS NULL`)
- **users table:** Users can only see/update their own row (`auth.uid() = id`)

### Auto-trigger: `handle_new_user()`
On `auth.users` INSERT → creates row in `public.users` with:
- `id` = auth user ID
- `email` from auth
- `username` from `raw_user_meta_data->>'username'` (falls back to email prefix)
- `plan_key` = 'free'
- `ai_credits_remaining` = 5

### Seed Data
- **subscription_plans:** free (₹0), pro (₹499/mo), business (₹1499/mo)
- **ai_agents:** 4 agents with gpt-4o-mini
- **milestone_templates:** 5 built-in templates
- **proposal_templates:** 1 built-in template (Standard Proposal)

## Current State (as of Jul 2026)

### ✅ Completed
- React + Vite project fully scaffolded
- All pages rendered (SignIn, SignUp, Dashboard, Clients, Projects, Proposals, Invoices, Settings, ClientPortal)
- Supabase client + Auth context working
- Full database schema created with RLS + triggers + seed data
- GitHub Pages deployment working (auto-deploy on push to main)
- site_url updated to live Pages URL

### ❌ Known Issues / Pending

**1. AuthContext signUp conflict with trigger**
- `AuthContext.tsx:75-91` manually inserts into `users` table after signup
- BUT the `handle_new_user()` trigger ALSO inserts on auth.users creation
- This causes a duplicate PK error on signup
- **Fix:** Remove the manual `.insert()` in `signUp` function, OR replace with `.upsert()` / update

**2. SignUp flow needs business_name & username**
- The code passes `username` in `signUp({ data: { username } })` meta data
- The trigger reads `raw_user_meta_data->>'username'` → works fine
- But `business_name` is passed in the manual insert → trigger doesn't set it
- **Fix:** If removing manual insert, add `business_name` to trigger OR handle via separate profile update step after signup

**3. Email confirmation ON but SMTP may fail**
- Resend SMTP is configured but may not send to all domains
- If user doesn't receive confirmation email, they can't login
- **Fix:** Either (a) Set `mailer_autoconfirm: true` in Supabase Auth settings, or (b) Verify Resend SMTP works

**4. Google OAuth not configured**
- `external_google_enabled: false` in auth config
- Code provides "Continue with Google" button but it will error
- **Fix:** Create OAuth client in Google Cloud Console, add client ID/secret to Supabase Auth settings

**5. SignOut doesn't clear session on server**
- `signOut()` in AuthContext calls `supabase.auth.signOut()` + sets state to null
- Works but no redirect added
- **Fix:** Add `navigate('/signin')` after signout

**6. Missing pages/features**
- Email/WhatsApp reminders not implemented (UI partial)
- Razorpay payment integration not started (backend + frontend)
- AI features (proposal AI, milestone AI, invoice AI, email AI) need integration with GPT
- Client portal public pages need full implementation
- Analytics dashboard not built

**7. AuthCallback.tsx redirect**
- After Google OAuth, `AuthCallback` should redirect to dashboard
- Currently likely works but needs testing

### Critical Frontend Files to Edit
| File | Purpose |
|---|---|
| `app/src/contexts/AuthContext.tsx` | Fix signUp duplicate insert (top priority) |
| `app/src/App.tsx` | Add route guards (redirect to /signin if not authenticated) |
| `app/src/pages/SignUp.tsx` | Ensure registration form passes username |
| `app/src/pages/ClientPortal.tsx` | Public client portal |

## How to Run Locally
```bash
cd app
cp .env.example .env   # Fill in Supabase creds
npm install
npm run dev            # → http://localhost:5173
```

## Build for Production
```bash
cd app
npm run build          # → app/dist/
```

## Troubleshooting
- **Build fails:** Check `vite.config.ts` base path, remove `tsc` from build script
- **Login fails:** Check browser console for Supabase errors. Verify user exists in `auth.users` AND `public.users`
- **RLS errors:** If you see "row-level security" errors, ensure the user is authenticated AND has a row in `public.users`
- **Deployment fails:** Check GitHub Actions logs. Common: missing GitHub secrets, Pages not enabled
