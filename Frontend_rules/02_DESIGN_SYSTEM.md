# 02_DESIGN_SYSTEM.md
Version: 1.0
Status: Frozen

---

# PURPOSE

This document defines the visual language of the application.

Every page must follow these rules.

Never invent a different style for different pages.

Consistency is more important than creativity.

---

# DESIGN GOAL

The application should feel like:

- Linear
- Notion
- Vercel
- Stripe Dashboard
- GitHub

NOT like:

- WordPress Admin
- Bootstrap Admin Templates
- Old CRM Software

The feeling should be:

Professional

Premium

Modern

Minimal

Fast

Clean

---

# DESIGN PRINCIPLES

Less UI

More Content

Less Decoration

More Clarity

Less Colors

More Hierarchy

Every component must have a purpose.

---

# DESIGN TOKENS

Never hardcode colors.

Every color must come from a central theme file.

Support Light Mode and Dark Mode.

Future themes must work without rewriting components.

---

# SPACING SYSTEM

Use only:

4px

8px

12px

16px

20px

24px

32px

48px

64px

Never use random spacing.

---

# BORDER RADIUS

Small

8px

Medium

12px

Large

16px

Cards and modals should feel soft.

Never use sharp corners.

---

# SHADOWS

Use subtle shadows only.

Avoid heavy floating cards.

Hierarchy should come from spacing first.

Not shadows.

---

# TYPOGRAPHY

Use one font family.

Hierarchy:

Page Title

Section Title

Card Title

Body

Caption

Never use more than 5 text sizes.

---

# ICONS

Use only one icon library.

Recommended:

Lucide Icons

Icons must always have labels where required.

Never rely on icons only.

---

# BUTTONS

Primary

Filled

Main brand color

Secondary

Outlined

Ghost

Transparent

Danger

Red

Loading

Spinner inside button

Buttons must have equal height.

Never stretch buttons unnecessarily.

---

# INPUTS

Every input must have:

Label

Placeholder

Validation

Error Text

Required fields clearly marked.

---

# SEARCH

Search bar always remains same across app.

Rounded corners.

Search icon on left.

Clear button on right.

Debounce search.

---

# DROPDOWNS

Maximum height.

Scrollable.

Searchable when more than 10 items.

Selected item highlighted.

---

# CARDS

Cards should contain:

Title

Important Information

Actions

Avoid decorative elements.

Cards must have consistent padding.

---

# TABLES

Every table supports:

Search

Sorting

Pagination

Responsive mode

Status badges

Empty state

Loading state

Never horizontally scroll on desktop.

---

# STATUS COLORS

Success

Green

Warning

Orange

Error

Red

Information

Blue

Neutral

Gray

Never assign different colors to same status.

---

# STATUS BADGES

Pending

Gray

In Progress

Blue

Completed

Green

Blocked

Red

Cancelled

Gray

Always use same colors everywhere.

---

# MODALS

Modal must contain:

Title

Description

Content

Primary Button

Cancel Button

Close icon

ESC closes modal.

Click outside closes modal.

Except destructive actions.

---

# DRAWERS

Use drawer instead of modal for:

Edit Client

Edit Project

Quick Preview

Drawer slides from right.

---

# TOASTS

Top Right Desktop.

Bottom Mobile.

Duration:

3 seconds

Types:

Success

Warning

Error

Info

Never stack more than 3.

---

# LOADING

Never use blank pages.

Use Skeleton UI.

Only buttons use spinner.

---

# EMPTY STATES

Every empty state contains:

Illustration

Title

Description

Primary Action

Example:

No Projects Yet

Create your first project.

Button:

New Project

---

# ANIMATIONS

Animations must be fast.

150ms–250ms

No bouncing.

No unnecessary movement.

Purpose only.

---

# PAGE TRANSITIONS

Subtle Fade

Subtle Slide

Never dramatic transitions.

---

# RESPONSIVE

Desktop

Laptop

Tablet

Mobile

Every screen must be designed separately.

Never shrink desktop UI.

---

# MOBILE

Bottom Navigation

Maximum five icons.

FAB only when necessary.

Forms must be thumb friendly.

---

# ACCESSIBILITY

Minimum touch size:

44px

Keyboard navigation supported.

Visible focus ring.

Good color contrast.

---

# DARK MODE

Dark mode is first-class support.

Do not invert colors.

Design separately.

Cards, inputs and modals should have proper dark surfaces.

---

# COMPONENT REUSE

Never duplicate components.

Reuse:

Button

Input

Card

Modal

Badge

Avatar

Dropdown

Table

Toast

Timeline

Progress

Everything must come from reusable components.

---

# PERFORMANCE DESIGN RULES

Icons lazy loaded.

Images optimized.

Charts lazy loaded.

Avoid unnecessary re-renders.

Use virtual scrolling for long lists.

Avoid layout shifts.

---

# FUTURE PROOFING

Every color

Every spacing

Every radius

Every font

Every animation

must be configurable.

Changing brand identity should require editing only the theme files.

Never hardcode UI values inside components.

---

END OF FILE
