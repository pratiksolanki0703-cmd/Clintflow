# 08_DEVELOPER_RULES.md
Version: 1.0
Status: Frozen

---

# PURPOSE

This document defines the engineering standards for the project.

These rules must be followed for every future feature.

If any rule conflicts with convenience, follow this document.

Business logic is always more important than implementation shortcuts.

---

# GENERAL RULES

Never rewrite working code without reason.

Never introduce breaking changes.

Never change business logic while redesigning UI.

Never modify database schema unless explicitly requested.

Never change API contracts without approval.

Always preserve backwards compatibility.

---

# PROJECT STRUCTURE

Separate the application into:

- Components
- Pages
- Layouts
- Hooks
- Services
- Types
- Utilities
- Constants
- Contexts
- Assets

Avoid putting unrelated code in one file.

---

# COMPONENT RULES

Components must have a single responsibility.

One component = One purpose.

Avoid huge files.

Prefer composition over duplication.

Reusable components should never contain page-specific business logic.

---

# FILE SIZE

Recommended

Component

< 250 lines

Page

< 400 lines

Utility

< 200 lines

If larger, split into smaller modules.

---

# NAMING

Use clear names.

Correct

ProjectCard

ClientTable

PaymentStatusBadge

Wrong

Card2

ComponentA

NewFile

---

# TYPESCRIPT

Use strict typing.

Avoid "any".

Create shared types.

Prefer interfaces for object models.

---

# STATE MANAGEMENT

Local UI State

React State

Shared App State

Context

Server Data

TanStack Query

Avoid prop drilling.

Avoid unnecessary global state.

---

# API LAYER

Never call Supabase directly inside UI components.

Always use service files.

Example

ProjectService

ClientService

InvoiceService

PaymentService

This keeps UI clean.

---

# ERROR HANDLING

Every async action must handle

Loading

Success

Failure

Unexpected Error

Never ignore errors.

---

# LOGGING

Development

Console logs allowed.

Production

Remove console logs.

Use monitoring tools instead.

---

# FORM RULES

Always validate before submission.

Display inline errors.

Keep user input after failed submission.

Never clear form automatically.

---

# DATABASE RULES

Frontend must never assume database values.

Always handle

null

empty arrays

missing fields

future schema additions

---

# SECURITY

Never trust frontend validation.

Backend always validates.

Never expose

Service Keys

Secrets

Environment Variables

Internal IDs

---

# AUTHENTICATION

Protected routes require authentication.

Public Client Portal never exposes dashboard data.

Redirect unauthenticated users safely.

---

# ROUTING

Use nested routing where appropriate.

Avoid deep URL structures.

Examples

/projects

/projects/:id

/projects/:id/files

Avoid unnecessary nesting.

---

# PERFORMANCE

Lazy load heavy pages.

Memoize expensive calculations.

Virtualize long lists.

Debounce search.

Throttle expensive events.

Use optimistic UI carefully.

---

# CACHING

Cache server data using React Query.

Invalidate only affected queries.

Avoid global refreshes.

---

# ACCESSIBILITY

Every interactive element must be keyboard accessible.

Use semantic HTML.

Provide labels for form controls.

Maintain proper heading hierarchy.

---

# RESPONSIVE DESIGN

Mobile-first.

Support

360px

768px

1024px

1440px

Never use fixed widths where responsive layouts are better.

---

# DESIGN CONSISTENCY

Always use shared design tokens.

Never hardcode

Colors

Spacing

Radius

Fonts

Shadows

Animation values

---

# ICONS

Use one icon library only.

Recommended

Lucide React

Do not mix icon libraries.

---

# TESTING

Before merging any feature verify

UI works

Mobile works

Dark mode works

Loading state works

Error state works

Empty state works

No console errors

---

# CODE REVIEW CHECKLIST

Every feature must answer

Does it break existing functionality?

Is it reusable?

Is it responsive?

Is it accessible?

Is it optimized?

Does it match design system?

Is business logic unchanged?

If any answer is "No",

do not merge.

---

# GIT RULES

Use meaningful commits.

Examples

feat: add client portal timeline

fix: resolve payment status refresh bug

refactor: extract project card component

Avoid commits like

update

fix

changes

---

# DEPENDENCIES

Do not install a new package unless necessary.

Prefer existing libraries.

Every dependency increases maintenance cost.

---

# FUTURE FEATURES

Every new feature must follow existing architecture.

Never create parallel systems.

Extend existing components whenever possible.

---

# AI CODING RULES

When modifying the project:

- Read the relevant document first.
- Modify only the requested module.
- Never refactor unrelated code.
- Preserve API contracts.
- Preserve database schema.
- Preserve business rules.
- Keep the UI consistent with the Design System.
- Explain major architectural changes before applying them.
- If uncertain, ask instead of guessing.

---

# FINAL GOAL

The codebase should remain:

- Clean
- Modular
- Maintainable
- Scalable
- Predictable
- Easy for AI coding agents to understand

A new developer or AI should be able to understand the project structure within 30 minutes without reading the entire codebase.

---

END OF FILE
