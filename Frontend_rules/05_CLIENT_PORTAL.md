# 05_CLIENT_PORTAL.md
Version: 1.0
Status: Frozen

---

# PURPOSE

The Client Portal is the only page the client sees.

It must be extremely simple.

The client should never feel like they are using a complicated project management tool.

The portal exists only to answer one question:

**"Where is my project right now?"**

---

# ACCESS

Client accesses the portal using a secure unique URL.

Example

domain.com/p/7HKd93XaLm

No login required by default.

Future:
Optional PIN protection.

Never expose freelancer dashboard.

---

# PAGE STRUCTURE

Top Navigation

↓

Project Hero Card

↓

Progress Section

↓

Timeline

↓

Milestones

↓

Files

↓

Proposal

↓

Contract

↓

Invoice

↓

Payment

↓

Contact Freelancer

↓

Footer

---

# HERO SECTION

Display

Project Name

Current Status

Progress %

Client Name

Freelancer Business Name

Last Updated

Primary Button

Download Latest Files

Secondary Button

Contact Freelancer

---

# PROJECT STATUS

Display only

Waiting for Approval

Planning

In Progress

Revision

Final Review

Completed

Cancelled

Never show internal statuses like

Draft

Archived

Blocked

---

# PROGRESS CARD

Large Progress Bar

Example

68% Complete

Display

Completed Milestones

Remaining Milestones

Estimated Delivery Date

Last Updated

Never show technical information.

---

# TIMELINE

Vertical timeline.

Example

✔ Proposal Accepted

✔ Contract Signed

✔ Advance Received

✔ Design Started

✔ Homepage Completed

○ Final Delivery

Each completed step shows date.

Future steps remain inactive.

---

# MILESTONES

Each milestone card displays

Title

Short Description

Status

Completion Date

Optional Preview

Client cannot edit milestones.

---

# PAYMENT SECTION

Purpose

Only display payment information.

Never process payments.

Display

Project Amount

Advance Amount

Remaining Amount

Current Payment Status

Visible Payment Methods

Example

UPI QR

Bank Details

PayPal Link

Wise Link

Stripe Payment Link

Custom Payment Link

Client clicks external links.

Platform never verifies payment.

---

# FILES

Categories

Requirements

Deliverables

Invoice

Contract

Other

Each file displays

Name

Size

Date

Download Button

Preview Button

Hidden files remain invisible.

---

# PROPOSAL

Client can

View

Download PDF

Accept

Reject

After acceptance

Proposal becomes locked.

---

# CONTRACT

Display contract.

Buttons

Accept

Download

Print

Once accepted

Lock contract.

No editing.

---

# INVOICE

Display

Invoice Number

Issue Date

Due Date

Amount

Currency

Status

Buttons

Download PDF

Print

---

# CONTACT FREELANCER

Simple contact card.

Display

Business Name

Email

Phone (Optional)

Website

WhatsApp (Optional)

Social Links (Optional)

Never include live chat.

---

# ACTIVITY SECTION

Client visible only.

Examples

Project Started

Milestone Completed

Invoice Sent

File Uploaded

Payment Status Updated

Hide private freelancer actions.

---

# NOTIFICATIONS

Client only sees project-related updates.

Examples

New File Uploaded

Milestone Completed

Invoice Ready

Project Completed

No marketing notifications.

---

# MOBILE EXPERIENCE

Client Portal must be mobile-first.

Most clients will open from email or WhatsApp.

Everything must work comfortably with one hand.

Large buttons.

Large touch targets.

Readable typography.

No horizontal scrolling.

---

# BRANDING

Display freelancer branding.

Business Logo

Business Name

Accent Color

Optional Cover Image

Do not allow excessive customization.

Keep layout consistent.

---

# EMPTY STATES

Example

No files shared yet.

No invoice available.

No proposal yet.

Each empty state explains what it means.

---

# LOADING

Use skeleton loaders.

Never show blank pages.

---

# ERROR STATES

Examples

Project not found.

Project no longer available.

Access disabled.

Use friendly language.

Never expose technical details.

---

# SECURITY

Never expose

Private Notes

Internal Activity

AI Usage

Freelancer Dashboard

Analytics

Billing

Settings

Only shared project information is visible.

---

# PERFORMANCE

Load project overview first.

Lazy load

Files

Timeline

Invoices

Contracts

Images

Client should see first content in under 2 seconds on average connection.

---

# UX GOAL

The client should open the link and understand the project status within **10 seconds** without asking the freelancer for updates.

The portal should reduce unnecessary messages like:

"Any update?"

"When will it be completed?"

"Can you send the latest file?"

---

END OF FILE
