# Frontend Design Bible

Version: 1.0
Document: 01_PRODUCT_RULES.md
Status: Frozen
Priority: Critical

---

# PURPOSE

This document defines the complete product philosophy, business rules and UX principles.

This document MUST NOT generate UI directly.

This document exists so the AI understands the product before modifying the frontend.

All future frontend decisions must follow this document.

---

# PRODUCT NAME

Temporary Name:

ClientFlow

The product name may change in future.

Never hardcode the product name.

Store it in a configuration file.

---

# PRODUCT TYPE

Freelancer SaaS

NOT Marketplace

NOT CRM for Sales

NOT ERP

NOT Accounting Software

NOT Payment Gateway

NOT Fiverr

NOT Upwork

NOT LinkedIn

---

# PRODUCT MISSION

The platform helps freelancers manage clients professionally.

The platform DOES NOT help users find clients.

The platform DOES NOT process payments.

The platform DOES NOT take commission.

The platform simply organizes the complete project journey.

---

# CORE PRINCIPLE

This product should feel like:

Linear

Notion

Stripe Dashboard

Vercel

GitHub

Simple

Clean

Fast

Professional

Minimal

Every screen should reduce stress.

Never overwhelm users.

---

# TARGET USERS

Primary Users

- Freelance Designers
- Web Developers
- App Developers
- Video Editors
- Motion Designers
- Writers
- Consultants
- Marketing Freelancers

Secondary Users

Small Agencies

---

# TARGET EXPERIENCE

A new freelancer should understand the product in less than 2 minutes.

No training required.

No documentation required.

Everything should feel obvious.

---

# PRODUCT PHILOSOPHY

Rule 1

Never make the user think.

Rule 2

One primary action per screen.

Rule 3

Everything important should be visible.

Rule 4

Never hide essential information.

Rule 5

Never create unnecessary clicks.

Rule 6

Keep UI clean.

Rule 7

Professional over fancy.

Rule 8

Speed over decoration.

---

# WHAT THIS PRODUCT MANAGES

Clients

Projects

Proposals

Contracts

Invoices

Project Timeline

Milestones

Payment Status

Notifications

Emails

AI Assistance

Business Profile

---

# WHAT THIS PRODUCT NEVER MANAGES

Finding Clients

Receiving Payments

Holding Money

Escrow

Commission

Freelancer Hiring

Job Marketplace

Live Chat Platform

Social Media

Accounting

Taxes

---

# PAYMENT PHILOSOPHY

The platform is NOT responsible for payments.

Payments happen outside the platform.

The platform only displays payment information.

Examples

UPI

Bank Transfer

PayPal

Wise

Stripe

Razorpay

Payoneer

Custom Payment Method

---

# IMPORTANT PAYMENT RULE

Never say

"Payment Successful"

Instead use

"Marked as Paid by Freelancer"

Reason

The platform never verifies money.

The freelancer manually updates payment status.

---

# PAYMENT STATUS

Pending

Partially Paid

Fully Paid

Overdue

Cancelled

Only freelancers can update payment status.

Clients cannot modify payment status.

---

# CLIENT RESPONSIBILITY

Client can

View

Accept Proposal

Reject Proposal

Accept Contract

View Timeline

View Invoice

View Payment Information

Download Files

Nothing else.

Clients never edit project data.

---

# FREELANCER RESPONSIBILITY

Create Project

Edit Project

Delete Project

Create Proposal

Generate Contract

Generate Invoice

Manage Timeline

Manage Milestones

Update Payment Status

Send Emails

Manage AI

Manage Client

Manage Business Profile

Everything important is controlled by the freelancer.

---

# SECURITY PHILOSOPHY

Every project has a unique secure URL.

Never use sequential IDs.

Example

Wrong

/project/1

Correct

/project/AX82KD92P

Client links must be impossible to guess.

---

# AI PHILOSOPHY

AI assists.

AI never decides.

Every AI output must be reviewed.

Every AI output must be editable.

AI never auto sends.

AI never auto saves.

AI never changes project data without confirmation.

---

# AI CREDIT RULE

Every AI action consumes credits.

Examples

Proposal

Contract

Milestones

Reminder

Invoice Description

Pricing Suggestion

Credits must always be visible.

The user should never wonder

"How many AI credits are left?"

---

# PRODUCT FEELING

The application should feel

Fast

Responsive

Modern

Trustworthy

Professional

Every interaction should provide immediate feedback.

No lag.

No confusing animations.

No unnecessary popups.

---

# SUCCESS MESSAGE STYLE

Correct

Project Created

Proposal Sent

Payment Status Updated

Milestone Completed

Wrong

Awesome!!

Yay!!

Congratulations!!

Avoid childish language.

---

# ERROR MESSAGE STYLE

Simple.

Human.

Professional.

Never expose technical errors.

Wrong

Supabase RPC failed

Correct

Unable to save changes.

Please try again.

---

END OF PART 1
