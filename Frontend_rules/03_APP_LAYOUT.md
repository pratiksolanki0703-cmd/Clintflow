# 03_APP_LAYOUT.md
Version: 1.0
Status: Frozen

---

# PURPOSE

This document defines the complete application layout.

Every page must follow the same layout.

Users should never feel they are entering a different application.

---

# APP STRUCTURE

Desktop

-------------------------------------------------------
Sidebar | Topbar
        |
        | Main Content
        |
-------------------------------------------------------

Mobile

----------------------
Topbar
----------------------

Main Content

----------------------

Bottom Navigation

----------------------

---

# DESKTOP LAYOUT

Always use:

Permanent Sidebar

Sticky Topbar

Scrollable Content Area

Sidebar and Topbar never scroll.

Only page content scrolls.

---

# SIDEBAR

Position

Left

Fixed

Width

Collapsed

72px

Expanded

260px

User can collapse manually.

Remember preference using local storage.

Never auto collapse.

---

# SIDEBAR ORDER

Dashboard

Clients

Projects

Proposals

Contracts

Invoices

Payments

Analytics

AI Tools

Settings

Logout

Never change order.

Never hide menu items based on plan.

Instead disable premium features.

---

# SIDEBAR BEHAVIOR

Current page

Highlighted.

Hover

Soft background.

Icons always visible.

Labels disappear only when collapsed.

Collapsed sidebar shows tooltip on hover.

---

# TOPBAR

Always Sticky.

Contains only:

Global Search

Notification Icon

AI Credit Counter

Profile Menu

Nothing else.

Never duplicate sidebar items.

---

# GLOBAL SEARCH

Searches

Clients

Projects

Invoices

Contracts

Proposals

Keyboard Shortcut

Ctrl + K

Search opens command palette.

Results grouped by category.

Recent searches stored locally.

Maximum:

10 recent searches.

---

# COMMAND PALETTE

Supports

Search

Quick Navigation

Quick Create

Keyboard Friendly

ESC closes.

---

# NOTIFICATION ICON

Bell icon.

Unread badge.

Click opens notification panel.

Panel width

380px

Notifications grouped by:

Today

Yesterday

Earlier

Mark all as read.

Clear all not allowed.

History preserved.

---

# AI CREDIT DISPLAY

Topbar.

Always visible.

Format

78 / 100 Credits

Progress Bar

Upgrade Button

Low credits

Orange

Zero credits

Red

Never hide AI balance.

---

# PROFILE MENU

Contains

Avatar

Name

Current Plan

Business Profile

Account

Billing

Notifications

Help

Theme

Logout

Never overload.

---

# PAGE HEADER

Every page starts with

Title

Description

Primary Action

Optional Filters

Example

Projects

Manage all client projects.

+ New Project

---

# PAGE CONTENT

Maximum width

1400px

Centered

Padding

24px

Never stretch content edge-to-edge.

---

# QUICK ACTIONS

Dashboard only.

Contains

New Client

New Project

New Proposal

Generate Invoice

Generate Contract

Each action one click.

---

# BREADCRUMB

Visible after Dashboard.

Example

Dashboard

>

Projects

>

Website Redesign

Never longer than four levels.

---

# FILTER BAR

Placed below page header.

Contains

Search

Status Filter

Date Filter

Sort

Reset

Filters stay sticky.

---

# ACTION MENUS

Three-dot menu.

Contains secondary actions.

Example

Duplicate

Archive

Export

Delete

Primary actions never inside menu.

---

# FLOATING ACTION BUTTON

Mobile only.

Used only for

New Project

New Client

Never use multiple FABs.

---

# MOBILE NAVIGATION

Bottom Navigation

Maximum five icons.

Dashboard

Projects

Clients

Notifications

Profile

Everything else inside More menu.

---

# RESPONSIVE RULES

Desktop

Sidebar visible.

Tablet

Sidebar collapses.

Mobile

Bottom Navigation.

Never horizontally scroll.

---

# DASHBOARD LAYOUT

Top

Welcome Card

Today's Summary

Middle

Active Projects

Pending Actions

Bottom

Recent Activity

Upcoming Deadlines

Never place analytics first.

Users should continue work immediately.

---

# EMPTY STATES

Every page includes

Illustration

Short Description

Primary Button

Example

No Clients Yet

Create your first client.

Button

New Client

---

# LOADING STATES

Skeleton Cards

Skeleton Tables

Skeleton Lists

No blank screens.

---

# ERROR STATES

Friendly message.

Retry button.

Never expose backend errors.

---

# OFFLINE MODE

Show

Offline Banner

Allow viewing cached data.

Disable write actions.

Sync automatically when online.

---

# LOCAL STORAGE

Allowed

Theme

Sidebar State

Recent Searches

Draft Forms

Last Opened Project

Notification Panel State

Never store

Passwords

Access Tokens

Sensitive Client Data

Payment Details

---

# API OPTIMIZATION

Do not fetch same data twice.

Cache dashboard.

Cache client list.

Cache project list.

Refresh only changed components.

Avoid full page reloads.

Prefetch next page when appropriate.

---

# USER EXPERIENCE RULES

Every important action

Maximum

3 clicks.

Every save action

Instant feedback.

Every delete action

Confirmation required.

Every page

Must work without reading documentation.

---

# FINAL GOAL

The application should feel like a premium SaaS.

Simple enough for a first-time freelancer.

Powerful enough for experienced freelancers.

Users should feel productive within the first two minutes.

END OF FILE
