# ClientFlow — Freelancer Client Portal
## Complete Product & Engineering Spec (Final — v2)

This is the single source of truth for the product. Build strictly to this document. No feature outside this scope. No placeholder/fake data left in production code. No unfinished states — every screen must have a loading (skeleton), empty, and error state. Written for a rebuild from scratch (e.g. via an AI coding agent) — assume no prior context beyond this document.

---

## 1. Product Summary

ClientFlow is a web app for solo freelancers and small agencies to manage the full client lifecycle — **Proposal → Contract → Project Progress → Invoice → Payment Tracking** — from one branded, shareable client portal.

**Tagline:** "Manage your clients professionally from one secure portal."

**The platform is NOT:**
- Not a marketplace (does not find clients) — not Fiverr/Upwork/LinkedIn
- Not accounting software — not Refrens/Tally/Vyapar/Zoho
- Not a CRM, ERP, or team management tool
- Not a payment gateway for client payments — the platform never receives, holds, verifies, or takes commission on any payment a client sends a freelancer

**Target users:** graphic designers, web/app developers, video/motion editors, copywriters, content writers, social media managers, consultants, photographers, small digital agencies.

**Core design principle: simplicity.** Every flow must feel like a small number of obvious steps done one at a time. No screen should ever feel complex, cluttered, or require the user to understand backend concepts.

---

## 2. Domain & Hosting Architecture

Two completely separate things, on two separate hosts:

1. **Main domain (e.g. `clientflow.com`)** — the public marketing/SEO website. Built in plain **HTML, CSS, and JavaScript** (no framework needed). This is where SEO content lives: landing page, comparison pages, profession-specific landing pages, blog, free templates — all the SEO keyword strategy content. This site must be fast, static, and crawlable.

2. **App subdomain (e.g. `app.clientflow.com`)** — the actual product (React + Supabase). This includes the freelancer dashboard (behind login) AND the client portal pages (`app.clientflow.com/{username}/{share_token}` — public, no login, but not meant to be indexed by search engines; add `noindex` meta tag on all app-subdomain pages since none of it needs to rank on Google).

Do not mix these two codebases. The main domain has zero dependency on Supabase/React; the app subdomain has zero SEO responsibility.

---

## 3. Tech Stack

- **Main domain:** static HTML/CSS/JS
- **App subdomain (product):** React, mobile-first
- **Backend/DB/Auth:** Supabase (Postgres + Auth + Storage)
- **Serverless functions:** Supabase Edge Functions (for AI calls, Razorpay webhook handling, scheduled credit resets)
- **AI provider:** Gemini API (Google) — see Section 10
- **Payment gateway (platform subscription billing only):** Razorpay — see Section 11
- **PDF generation:** jsPDF (client-side)
- **Email:** Resend (or equivalent)
- **WhatsApp sharing:** wa.me deep link with pre-filled text — no paid WhatsApp API
- **QR handling:** direct image upload only, no QR-generation library
- **File storage:** Supabase Storage

---

## 4. Core User Flow

```
Freelancer signs up (Email+Password or Google)
  → sets a permanent Username (live availability check, cannot be changed later)
  → optional skippable short survey (profession, referral source, client count range, solo/team)
  → lands on Dashboard (no forced onboarding checklist — self-serve via Settings + a "Guide" page)

Freelancer adds a Client
  → creates a Project under that client (name, description, budget, currency, deadline)
  → selects which Payment Methods to show on this project (editable later from the project's Edit screen)
  → builds a Proposal (manually or with AI assist) → sends the unique portal link

Client opens the link — NO LOGIN REQUIRED
  → reviews Proposal → Accepts / Rejects

On Accept:
  → Contract auto-generated from a fixed, reviewed template; client types name to sign
    (signed_at, signed_ip, and user_agent are all recorded)
  → Project Timeline (milestones) becomes visible
  → Freelancer manually updates each milestone: Not Started → In Progress → Completed
  → Invoice is generated (auto-filled from proposal, optional advance/final split via milestone_label)
  → Client portal shows: Proposal, Contract, Timeline, Invoice, active Payment Methods (QR download + text
    handle fallback), payment status

Client pays the freelancer DIRECTLY (UPI/Bank/PayPal/etc.) — platform is not involved in the money movement
  → Client may optionally enter a Transaction/UTR ID on the invoice as an informational payment claim
  → Freelancer independently verifies in their own bank/UPI app, then manually marks invoice status:
    Pending → Partially Paid → Paid / Overdue

Freelancer can send Reminders (email + WhatsApp deep link) for pending invoices
Project is marked Completed or Cancelled when done (never hard-deleted by default — see Section 9)
```

---

## 5. Database Schema

```sql
users
- id, email, username (unique, permanent, immutable), business_name, logo_url,
  brand_color, gst_number (nullable), profession, referral_source, client_count_range,
  team_status, ai_credits_remaining, ai_credits_topup, plan_key (FK -> subscription_plans.plan_key),
  created_at

clients
- id, user_id (FK), name, email, phone, company, created_at

projects
- id, user_id (FK), client_id (FK), name, description, budget, currency, deadline,
  status ('active' | 'completed' | 'cancelled'), created_at

payment_methods
- id, user_id (FK), type ('upi' | 'paypal' | 'bank_transfer' | 'stripe' | 'wise' | 'payoneer' | 'other'),
  -- NOTE: Razorpay is intentionally NOT included as a client-facing payment method option right now.
  label, qr_image_url (nullable), link_or_handle (nullable text — UPI ID / PayPal.me / IBAN / SWIFT / anything),
  display_order, is_active

project_payment_methods
- id, project_id (FK), payment_method_id (FK)
  -- selected at project creation (with a sensible default), editable anytime from the project's Edit screen

proposals
- id, user_id (FK), project_id (FK), service_description, price, timeline,
  status ('sent' | 'accepted' | 'declined'), share_token (unique, random, non-sequential), created_at

contracts
- id, proposal_id (FK), terms_text, client_signature_name, signed_at, signed_ip, user_agent

milestones
- id, project_id (FK), title, status ('not_started' | 'in_progress' | 'completed'),
  order_index, created_at, completed_at

milestone_templates
- id, user_id (FK, nullable for built-in templates), title, is_built_in, created_at

invoices
- id, user_id (FK), project_id (FK), proposal_id (FK, nullable),
  line_items (JSON), total_amount, currency, gst_amount, milestone_label (nullable, e.g. "50% Advance"),
  status ('pending' | 'partially_paid' | 'paid' | 'overdue'),
  transaction_id (nullable text — client-entered payment reference, informational only, never verified by the platform),
  share_token (unique), created_at, paid_at

reminders_log
- id, invoice_id (FK), sent_at, channel ('email' | 'whatsapp')

proposal_templates
- id, user_id (FK, nullable for built-in), title, content, is_built_in, created_at

-- ===== AI SYSTEM =====
ai_agents
- name (unique text key, e.g. 'proposal_ai', 'milestone_ai', 'invoice_ai', 'email_ai')
- model (text — Gemini model name, e.g. 'gemini-2.0-flash'; if empty, backend uses its own default)
- system_prompt (text)
- is_active (bool)
  -- editable anytime directly in Supabase, no redeploy needed to change prompt wording or model per feature

ai_credit_usage
- id, user_id (FK), feature_name, credits_used, created_at

-- ===== PLATFORM SUBSCRIPTION BILLING (separate from client payment_methods) =====
subscription_plans
- plan_key (unique text, e.g. 'free', 'starter', 'professional', 'agency')
- display_name, price_monthly, price_yearly
- max_clients (nullable = unlimited), max_projects_per_month (nullable = unlimited)
- emails_per_month, ai_credits_per_month, proposal_templates_limit (nullable = unlimited)
- has_custom_branding (bool), shows_powered_by_footer (bool)
- analytics_tier ('basic' | 'standard' | 'advanced'), support_tier ('none' | 'priority' | 'highest')
- is_active (bool)
  -- ALL pricing/limit numbers live here, not hardcoded in app code — changing a price or a limit
  -- is a single row edit in Supabase, no code change or redeploy required

razorpay_config
- id, key_id, key_secret, webhook_secret, is_live_mode (bool), is_active (bool), updated_at
  -- a single-row table. Currently empty — Razorpay keys are not yet available and will be
  -- inserted manually into this table later (via Supabase Studio) once obtained. All billing
  -- code must read credentials from this table at request time, never from hardcoded values
  -- or environment variables, so keys can be added/rotated without a redeploy.

subscription_transactions
- id, user_id (FK), plan_key (FK), razorpay_order_id, razorpay_payment_id (nullable),
  amount, currency, status ('created' | 'paid' | 'failed'), created_at
```

**Critical implementation notes:**
- `share_token` values must be random and non-sequential (e.g. nanoid, 10+ characters) — never guessable, never auto-incrementing.
- Monthly project-creation counting for Free-plan limits must be an incrementing log, not a live count of existing projects — it must NOT decrement when a project is deleted (prevents a create-delete-recreate loophole).
- Every number that defines a plan (client limit, project limit, AI credits, etc.) is read from `subscription_plans` at runtime — never hardcoded in frontend or backend code.

---

## 6. Client Portal Access & Security

- URL pattern: `app.clientflow.com/{username}/{share_token}`
- Zero login for clients — access is entirely through the unguessable `share_token`.
- Add `<meta name="robots" content="noindex">` on every app-subdomain page — this app is not meant to rank in search (see Section 2).
- Supabase Row Level Security (RLS):
  - Anonymous (client) requests may only read the single row matching the exact `share_token` provided — never a list, never another user's data.
  - Logged-in freelancers can only ever see their own clients/projects/invoices/proposals.

---

## 7. Milestones

- Freelancer sets milestones via: (a) built-in templates (Website, Logo, Video, Content, Consulting, etc.), (b) their own saved personal templates, or (c) AI generation (freelancer describes the project, AI drafts milestones, freelancer must review/edit/save — nothing is ever auto-sent).
- Status is a simple 3-state control per milestone: Not Started → In Progress → Completed, changed manually by the freelancer. No approval workflow, no ticketing system.
- Client sees milestone status live and read-only on their portal.

---

## 8. Payment Methods & QR (Client-Facing — Manual Only)

- Freelancer manages a personal list of payment methods in Settings (UPI, PayPal, Bank Transfer, Stripe, Wise, Payoneer, Custom). **Razorpay is NOT included as a client-facing option right now** — do not add it to this list. This section is about how a freelancer's *clients* pay the *freelancer*, and is entirely separate from the platform's own Razorpay billing (Section 11).
- QR codes are handled via **direct image upload only** (no auto-generation). Enforce on upload:
  - Max file size: 200 KB
  - Formats: JPG/PNG only
  - Recommended dimensions: 500x500px (square)
- Every payment method also has an optional `link_or_handle` text field as a fallback, shown alongside the QR so a client can still pay if the QR doesn't scan.
- Selection of which payment methods appear on a project happens at project creation (sensible default) and can be changed anytime afterward from the project's Edit screen — per-project, not per-client.
- Client portal shows a **Download QR** button for each visible payment method.
- Payment tracking is entirely manual: the platform never receives, holds, or verifies client money, and takes zero commission. Client may optionally enter a Transaction/UTR ID on the invoice as an informational claim; the freelancer independently verifies before manually updating invoice status.

---

## 9. PDFs & Project Deletion

**PDFs:**
- Invoice PDF: downloadable by both freelancer and client, generated client-side via jsPDF (needed for the freelancer's accounting/GST records).
- Contract PDF: generated after client signature; includes the fixed terms text, typed signature name, and signed timestamp. Keep the legal terms text fixed and reviewed — do not let AI freely generate legal language.

**Deletion policy:**
- Default action is **Cancel**, not delete: sets `projects.status = 'cancelled'`. The client portal link stays reachable, showing a "This project has been cancelled" state. Invoice/contract history is preserved.
- **Permanent delete** is a separate, explicit action requiring extra confirmation (e.g. typing "DELETE"). Only then do the linked proposal/contract/invoice cascade-delete and the `share_token` URL start returning a not-found state.

---

## 10. AI System (Gemini API)

**Provider:** Gemini API (not Anthropic/OpenAI). All AI calls in this product go through Gemini.

**Touchpoints (4 total — all optional, nothing in the app requires AI; manual entry always works):**
1. Proposal Writer (`proposal_ai`)
2. Milestone Generator (`milestone_ai`)
3. Invoice Line-item Description Writer (`invoice_ai`)
4. Reminder Message Writer (`email_ai`)

(Pricing Suggestion was considered and explicitly rejected — the platform does not want to act as a pricing authority, and generic AI market-rate guesses for the Indian freelance market would be unreliable.)

**Architecture:**
1. The `ai_agents` table (Section 5) holds one row per feature: `name`, `model`, `system_prompt`.
2. A single **Supabase Edge Function** handles all 4 features. The frontend calls this one function with `{ name, inputs }`.
3. The Edge Function:
   a. Runs the atomic credit check-and-deduct (see below) — if it fails, return an "out of credits" response immediately and never call Gemini.
   b. Looks up the row in `ai_agents` matching `name` to get the `system_prompt` and `model`.
   c. Combines the system prompt with the user's `inputs` and calls the Gemini API using that model (fixed API key stored as an Edge Function secret, never exposed to the frontend).
   d. Logs the call in `ai_credit_usage`.
   e. If the Gemini call fails, refunds the credit that was deducted in step (a).
4. AI output is always returned to an editable text area in the UI — the freelancer reviews/edits before it's saved or sent anywhere. Nothing AI-generated is sent to a client automatically.

**Credit system:**
- 1 AI response = 1 credit.
- Credit check-and-deduct must be a single atomic database operation, to prevent race conditions from concurrent/duplicate requests:
  ```sql
  UPDATE users
  SET ai_credits_remaining = ai_credits_remaining - 1
  WHERE id = :user_id AND ai_credits_remaining > 0
  RETURNING ai_credits_remaining;
  ```
  Zero rows returned → reject the request before ever calling Gemini.
- Credit priority: consume `ai_credits_remaining` (plan-included, resets monthly) first, then `ai_credits_topup` (purchased, never expires).
- On plan upgrade or the monthly billing-cycle reset, `ai_credits_remaining` is reset to the new plan's `ai_credits_per_month` value (read from `subscription_plans`) via a scheduled Edge Function.

**Data privacy:** No freelancer or client data is used for AI model training or any commercial purpose beyond generating the requested output. State this explicitly on the Privacy Policy page.

---

## 11. Platform Subscription Billing (Razorpay)

This is entirely separate from Section 8 (client-to-freelancer payments, which stay manual forever). This section is about **ClientFlow charging its own freelancer users** for Starter/Professional/Agency plans.

- Razorpay credentials are **not hardcoded**. They live in the single-row `razorpay_config` table (Section 5), currently empty. Once Razorpay approval/keys are obtained, they will be inserted manually into this table (directly in Supabase, no code change). All billing code must read from this table at request time.
- All plan pricing/limits live in `subscription_plans` (Section 5) — changing a price, a client limit, an AI credit allotment, or adding a new plan tier is a table edit, never a code change or redeploy.
- Flow when a freelancer clicks "Upgrade":
  1. Backend reads the target plan's price from `subscription_plans` and the active credentials from `razorpay_config`.
  2. Creates a Razorpay Order, logs it in `subscription_transactions` with status `created`.
  3. Freelancer completes payment on Razorpay's checkout.
  4. A Razorpay webhook (Supabase Edge Function) confirms payment, updates the transaction to `paid`, updates `users.plan_key`, and resets `ai_credits_remaining` to the new plan's allotment.
- Until real Razorpay keys are inserted, this flow should fail gracefully with a clear "Billing temporarily unavailable" message rather than crashing — check `razorpay_config.is_active` before attempting any billing action.

---

## 12. Signup, Login & Password Recovery

- Signup methods: Email + Password, and Google login.
- Email verification is **not required** to start using the app — a freelancer can use the product immediately after signup. Use Supabase Auth's built-in email OTP in the background: send a verification OTP on signup, but do not block any feature on it; show a small non-blocking "Verify your email" reminder until confirmed.
- **Forgot Password:** standard Supabase Auth OTP flow — user enters their email, receives a 6-digit OTP, enters the OTP plus a new password to complete the reset. No email links needed, just the OTP code (simpler for mobile users).
- Signup flow: choose method → credentials/consent → dedicated Username screen (live availability check, clear warning that it is permanent and can never be changed) → optional skippable survey (profession/business type, how they heard about ClientFlow, current client count range, solo vs. team) → Dashboard.
- No mandatory onboarding checklist. A separate "Guide" page (screenshots, and video where useful) is available for self-serve help. All setup (payment methods, branding, etc.) happens through Settings whenever the freelancer chooses — one thing at a time, never all at once.

---

## 13. Pricing Reference (values currently in `subscription_plans` — editable anytime)

| Feature | Free | Starter ₹149/mo | Professional ₹299/mo | Agency ₹699/mo |
|---|---|---|---|---|
| Active Clients | 5 | Unlimited | Unlimited | Unlimited |
| New Projects / Month | 5 | Unlimited | Unlimited | Unlimited |
| Core flow (Portal, Proposal, Contract, Timeline, Invoice, Payment Tracking) | ✅ | ✅ | ✅ | ✅ |
| Emails / Month | 20 | 100 | 500 | 2000 |
| AI Credits / Month | 5 | 75 | 400 | 1500 |
| Proposal Templates | 3 | 20 | Unlimited | Unlimited |
| Custom Branding | ❌ (basic only) | ✅ | ✅ | ✅ |
| "Powered by ClientFlow" footer | Shown | Removed | Removed | Removed |
| Analytics | Basic | Standard | Advanced | Advanced |
| Priority Support | ❌ | ✅ | ✅ | Highest |
| Future Team Features | ❌ | ❌ | ❌ | Planned |

- Core features are never locked by plan — only usage limits differ.
- The Free-plan gate is a monthly new-project-creation count, not a live "active projects" cap.
- AI credit top-up packs (any plan): 25 credits = ₹49, 100 credits = ₹149, 500 credits = ₹499.
- Annual billing: ~16% discount vs. monthly.
- These are starting values only — expect to adjust post-launch using real conversion data, via the `subscription_plans` table, with no code changes.

---

## 14. Explicitly Out of Scope

- ❌ Payment gateway integration for client payments (Razorpay/Stripe checkout for the freelancer's own clients) — stays fully manual, forever, per Section 8. (Razorpay in this build is used ONLY for ClientFlow's own subscription billing, Section 11.)
- ❌ Public API access for freelancers to connect their own site/app — deferred indefinitely.
- ❌ Custom domain support — removed from the roadmap entirely.
- ❌ Username changes — permanent for all users at launch. (A future premium "change username" feature has been discussed but is not part of this build; if ever added later, it must include an old-to-new redirect so previously shared client links never break.)
- ❌ Payment proof screenshots — replaced by the simpler `transaction_id` text field on invoices; no image upload, no extra storage table for this.
- Other future-only ideas not part of this build: client comments, e-signatures, calendar integration, public portfolio pages, team/multi-user accounts, "client viewed this" tracking, recurring/retainer invoices, a non-AI "Your Pricing History" feature.

---

## 15. Engineering & UI Quality Bar

- **English only** in all code, comments, database field names, and internal documentation.
- **No bugs** — every interactive flow (signup, project creation, proposal accept/reject, milestone update, invoice status change, AI generation, payment method edit, plan upgrade) must be fully tested end to end before considered done.
- **Clean structure** — consistent file/folder organization, no dead code, no unused/duplicate components, no leftover placeholder/test files in the final build.
- **Simplicity over cleverness** — every screen should feel like a small, obvious next step. Avoid multi-purpose screens; prefer one clear action per screen/section.
- **Proper animations** — smooth, purposeful transitions (page transitions, button states, modal open/close) — polish appropriate to a professional client-facing product, not decorative excess.
- **Skeleton loading states** required on every data-fetching screen (dashboard, client portal, invoice view, project list) — never a blank screen or a raw spinner-only state.
- Every screen needs at least four states: loading (skeleton), empty (no data yet), error (fetch failed), and populated.
