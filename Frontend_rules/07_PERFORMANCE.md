# 07_PERFORMANCE.md
Version: 1.0
Status: Frozen

---

# PURPOSE

This document defines frontend performance rules.

Every optimization must improve speed without changing business logic.

Never sacrifice reliability for micro-optimizations.

---

# PERFORMANCE GOAL

Dashboard

< 2 seconds

Client Portal

< 2 seconds

Navigation

Instant

Search

< 300ms

Button Response

Immediate

Animations

60 FPS

---

# GENERAL RULES

Never reload the entire application.

Never refresh the page after CRUD operations.

Update only affected components.

---

# API REQUESTS

Avoid duplicate requests.

Never request identical data twice.

Reuse cached responses whenever possible.

Batch requests when possible.

Cancel stale requests.

Retry only when necessary.

---

# CACHING

Cache:

- User Profile
- Business Profile
- Dashboard Summary
- Project List
- Client List
- Settings
- AI Credit Balance

Invalidate cache only after successful update.

---

# LOCAL STORAGE

Allowed

Theme

Sidebar State

Recent Searches

Draft Forms

Last Opened Project

Notification Read State

Onboarding Completed

Preferred Filters

Table View

Never Store

Password

Access Token

Refresh Token

Sensitive Client Data

Payment Information

Private Notes

---

# SESSION STORAGE

Use for temporary UI state.

Examples

Current Wizard Step

Temporary Filters

Modal State

Selected Tab

Never store important data.

---

# FORM DRAFTS

Automatically save drafts every 30 seconds.

Supported

Project

Proposal

Contract

Invoice

Restore draft after refresh.

Allow manual discard.

---

# LAZY LOADING

Lazy load

Analytics

Charts

Activity Log

Files

Invoices

Contracts

Images

Client Portal Attachments

Never lazy load

Dashboard

Topbar

Sidebar

Navigation

---

# CODE SPLITTING

Split by routes.

Each page loads independently.

Do not load unused pages.

---

# IMAGE OPTIMIZATION

Use modern formats.

Compress automatically.

Lazy load below-the-fold images.

Generate thumbnails.

Never load original image in list view.

---

# FILE PREVIEW

Load preview only on demand.

Do not preload PDFs.

Do not preload videos.

---

# SEARCH

Debounce

300ms

Minimum characters

2

Highlight matched text.

Return maximum 20 results.

---

# TABLES

Virtual scrolling for large datasets.

Pagination

20 rows default.

Remember page size locally.

---

# PAGINATION

Projects

Clients

Invoices

Contracts

Files

Never load everything.

Use incremental loading.

---

# INFINITE SCROLL

Allowed only for

Notifications

Activity Logs

Never use for settings.

---

# OPTIMISTIC UI

Apply to

Status Updates

Milestones

Notifications

Preferences

Profile Changes

Rollback if API fails.

Show clear error.

---

# SKELETON LOADING

Use skeletons for

Cards

Tables

Timeline

Lists

Forms

Never show blank screens.

---

# BUTTON LOADING

Disable button after click.

Show spinner.

Prevent duplicate requests.

Restore button after completion.

---

# OFFLINE HANDLING

Detect offline state.

Show offline banner.

Allow cached content.

Disable write actions.

Auto-sync when online.

---

# PREFETCHING

Prefetch

Next page

Frequently visited routes

Recently opened project

Never prefetch everything.

---

# MEMORY MANAGEMENT

Clean unused listeners.

Remove timers.

Cancel API requests on page leave.

Avoid memory leaks.

---

# REACT OPTIMIZATION

Use

Memoization

Lazy Components

Stable Keys

Avoid unnecessary renders.

Never overuse memoization.

---

# ERROR HANDLING

Friendly messages only.

Never expose

Stack Trace

SQL Errors

Supabase Errors

API Keys

Technical Details

Always provide Retry button.

---

# ACCESSIBILITY PERFORMANCE

Animations

Respect "Reduce Motion"

Keyboard navigation

Always responsive

Focus management

Never blocked by animations.

---

# MOBILE PERFORMANCE

Optimize for slow devices.

Reduce heavy shadows.

Reduce animations.

Lazy load large assets.

Touch response must feel instant.

---

# NETWORK OPTIMIZATION

Compress API responses.

Use HTTP caching where appropriate.

Avoid large JSON payloads.

Return only required fields.

---

# SECURITY PERFORMANCE

Never expose secrets to frontend.

Validate permissions server-side.

Never trust client state.

---

# MONITORING

Track

Page Load Time

API Response Time

Failed Requests

JS Errors

Slow Components

Future integration

Sentry

PostHog

OpenTelemetry

---

# SUCCESS METRICS

Dashboard opens instantly.

Scrolling stays smooth.

Search feels immediate.

Navigation never flashes.

Users never wait unnecessarily.

Performance improvements must never change business logic or UI behavior.

---

END OF FILE
