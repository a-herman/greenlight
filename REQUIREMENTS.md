# Greenlight — Product Requirements Document

**Version:** 2.0  
**Date:** June 2026  
**Owner:** Andrew Herman, Accenture  
**Status:** Draft for development team review

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Glossary](#2-glossary)
3. [User Roles](#3-user-roles)
4. [Release Scope](#4-release-scope)
5. [UX Design System](#5-ux-design-system)
6. [Authentication & Access Control](#6-authentication--access-control)
7. [Navigation & Layout](#7-navigation--layout)
8. [Dashboard](#8-dashboard)
9. [Feature Detail & Review Workflow](#9-feature-detail--review-workflow)
10. [Feature Catalog Admin](#10-feature-catalog-admin)
11. [Policy Library](#11-policy-library)
12. [Approved Sources Admin](#12-approved-sources-admin)
13. [Audit Log](#13-audit-log)
14. [Data Model](#14-data-model)
15. [API Endpoints](#15-api-endpoints)
16. [Non-Functional Requirements](#16-non-functional-requirements)
17. [Feature Discovery Agent](#17-feature-discovery-agent)
18. [AI Policy Evaluation Agent](#18-ai-policy-evaluation-agent)
19. [Reviewer Assignment](#19-reviewer-assignment)
20. [Notifications](#20-notifications)
21. [Report Export](#21-report-export)
22. [Settings Page](#22-settings-page)
23. [Azure AD / SSO Integration](#23-azure-ad--sso-integration)
24. [Feature & Settings Identification Agent](#24-feature--settings-identification-agent)
25. [Product Update Monitoring Agent](#25-product-update-monitoring-agent)

---

## 1. Product Overview

### 1.1 Purpose

Greenlight is an internal AI governance platform for Accenture. It manages the policy-driven review and approval process for Microsoft 365 Copilot features before they are activated for end users. Greenlight ensures that every Copilot feature is evaluated against Accenture's AI governance policy framework — covering information security, legal & privacy, and IT & architecture — and that a clear approval record exists for every deployment decision.

### 1.2 The Problem It Solves

Accenture deploys Microsoft 365 Copilot to tens of thousands of employees. Microsoft continuously ships new Copilot features, agents, and integrations. Without a structured process:
- Features can reach users before governance review
- Policy compliance is tracked in spreadsheets with no audit trail
- Reviewers have no single place to see what needs attention
- There is no consistent record of why a feature was approved or blocked

### 1.3 Core Workflow

```
Feature Discovery Agent crawls learn.microsoft.com and Microsoft roadmap sources
on a schedule → surfaces newly discovered features to admin as suggestions
        ↓  (or admin adds a feature manually)
Admin reviews discovered features and adds selected ones to Greenlight's feature catalog
        ↓
Greenlight creates policy checks for the feature (based on the active policy library)
        ↓
AI Policy Evaluation Agent automatically searches approved sources, evaluates each check,
and populates findings + evidence with a confidence score
        ↓
Reviewers review AI findings, correct where needed, and mark checks
Pass / Fail / Conditional / Needs Info
        ↓
Governance admin makes a final decision: Approve / Hold / Conditional
        ↓
Decision is logged in the audit trail; report exported for stakeholders
        ↓
Feature status is visible on the dashboard
        ↓
Product Update Monitoring Agent tracks Microsoft documentation for changes
to approved features → flags features for re-evaluation when updates detected
```

### 1.4 Tech Stack (Prototype → Production Guidance)

| Layer | Prototype (current) | Production recommendation |
|---|---|---|
| Framework | Next.js 16.2, App Router | Keep |
| Language | TypeScript | Keep |
| Styling | Tailwind CSS v4 | Keep |
| Database | SQLite (better-sqlite3) | Replace with PostgreSQL |
| Auth | None | NextAuth.js (Azure AD / Entra ID) |
| Deployment | localhost only | Vercel or Azure App Service |
| File storage | In-memory / local | Azure Blob Storage for xlsx uploads |

---

## 2. Glossary

| Term | Definition |
|---|---|
| **Feature** | A Microsoft Copilot capability, agent, tool, or model that Accenture is evaluating for deployment |
| **Policy Rule** | A specific governance requirement from Accenture's AI governance checklist (e.g. "Data residency verification") |
| **Policy Check** | The evaluation of a single feature against a single policy rule. Has a status: Pass, Fail, Conditional, or Needs Info |
| **Evidence** | A source document, URL, or excerpt that supports a check's outcome |
| **Policy Version** | A dated snapshot of the full policy rule library, imported from an Excel file |
| **Governance Function** | The domain a policy rule belongs to: InfoSec, IT & Architecture, or Legal & Privacy |
| **Approved Source** | A trusted domain that reviewers are permitted to cite as evidence and that AI agents are restricted to when searching |
| **Feature Status** | The overall approval decision for a feature: In Review, Approved, Conditional, or Held |
| **Audit Log** | A time-stamped record of every meaningful action taken in the system |
| **AI Agent** | An automated process that uses a Claude language model and web search (restricted to approved sources) to evaluate policy checks, discover new features, or monitor for product updates |
| **Confidence Score** | A number between 0.0 and 1.0 output by the AI Policy Evaluation Agent indicating how strongly the available evidence supports the verdict assigned to a check |
| **Agent Run** | A single execution of an AI agent against a feature — records model used, checks evaluated/updated, token counts, and completion status |
| **Reviewer Assignment** | The mapping of a specific Reviewer user to a governance function on a specific feature — determines who receives notifications and who may edit checks for that function |
| **SSO** | Single Sign-On via Azure AD / Entra ID — allows Accenture users to sign into Greenlight using their Microsoft credentials |
| **PKCE** | Proof Key for Code Exchange — the OAuth 2.0 extension used to secure the SSO authorization code flow |
| **Feature Discovery** | The automated process of crawling Microsoft documentation and roadmap sources to find newly released Copilot features before they are manually added to Greenlight |
| **Update Detection** | The automated process of re-crawling documentation for features already in Greenlight to detect Microsoft product changes that may affect governance status |

---

## 3. User Roles

### 3.1 Role Summary

| Role | Who | What they can do |
|---|---|---|
| **Admin** | Governance team lead | Everything — manage policy library, feature catalog, sources, approve/hold features, view audit log |
| **Reviewer** | Legal, InfoSec, IT reviewers | Update check status and findings on features assigned to their governance function; cannot manage policy library or catalog |
| **Viewer** | Stakeholders, leadership | Read-only access to dashboard and feature detail pages |

### 3.2 Role-Based Access Matrix

| Capability | Admin | Reviewer | Viewer |
|---|---|---|---|
| View dashboard | ✅ | ✅ | ✅ |
| View feature details | ✅ | ✅ | ✅ |
| Update check status & findings | ✅ | ✅ (assigned function only) | ❌ |
| Approve / Hold / Flag a feature | ✅ | ❌ | ❌ |
| Manage feature catalog | ✅ | ❌ | ❌ |
| Import / manage policy rules | ✅ | ❌ | ❌ |
| Manage approved sources | ✅ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ |
| Manage user accounts | ✅ | ❌ | ❌ |
| Trigger AI policy evaluation | ✅ | ❌ | ❌ |
| Assign reviewers to features | ✅ | ❌ | ❌ |
| Export PDF / Excel reports | ✅ | ✅ | ❌ |
| View notifications (own) | ✅ | ✅ | ✅ |
| Configure settings | ✅ | ❌ | ❌ |
| Review feature discovery suggestions | ✅ | ❌ | ❌ |

---

## 4. Release Scope

### Single Release — Full Scope

Greenlight is built as a complete, production-ready governance platform in a single release. All capabilities — manual review workflow, AI-assisted evaluation, reviewer collaboration, notifications, reporting, and enterprise authentication — are in scope.

**In scope:**
- Authentication with role-based access (email/password and Azure AD / Entra ID SSO)
- Dashboard with KPI cards, filters, and check distribution chart
- Feature detail pages with editable check status, findings, recommendations, and evidence
- Feature approval actions (Approve / Hold / Conditional) with reason notes and audit trail
- Feature catalog admin (add, edit, sync, remove)
- Policy library: bulk import from Excel, individual rule CRUD, version history
- Approved sources admin
- Audit log with full-text search, filtering, and export
- **AI agent:** automated policy check evaluation via web search restricted to approved sources (see [Section 18](#18-ai-policy-evaluation-agent))
- Confidence scores and agent run history per feature
- Re-evaluation automation when policy versions are updated
- **Reviewer assignment:** assign specific users per governance function per feature (see [Section 19](#19-reviewer-assignment))
- Email and Microsoft Teams notifications for key governance events (see [Section 20](#20-notifications))
- PDF report export per feature (cover page, check outcomes, evidence, approval decision) (see [Section 21](#21-report-export))
- Excel report export (policy library download)
- Settings page — organization profile, user management, notification configuration, AI agent config, SSO setup (see [Section 22](#22-settings-page))
- Azure AD / Entra ID SSO with group-to-role mapping (see [Section 23](#23-azure-ad--sso-integration))
- **Feature Discovery Agent:** scheduled crawl of learn.microsoft.com and Microsoft roadmap to surface new Copilot features for admin review (see [Section 17](#17-feature-discovery-agent))
- **Feature & Settings Identification Agent:** monitors M365 admin center documentation for new configurable AI/Copilot settings that require governance decisions (see [Section 24](#24-feature--settings-identification-agent))
- **Product Update Monitoring Agent:** tracks documentation for features already in Greenlight and flags changes requiring re-evaluation (see [Section 25](#25-product-update-monitoring-agent))

---

## 5. UX Design System

### 5.1 Design Principles

- **Clarity over density** — governance is a serious workflow. Each page should have one clear purpose.
- **Status is always visible** — every feature and check shows its status at a glance, never buried.
- **Confidence in actions** — destructive or irreversible actions require a two-step confirmation.
- **Consistent feedback** — every user action produces immediate visual feedback (toast, loading state, or inline update).

### 5.2 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `accent` | `#A100FF` | Primary brand color, primary buttons, active states |
| `accent-dark` | `#7B00CC` | Hover state for primary buttons |
| `accent-soft` | `#F5EDFF` | Light purple backgrounds for badges, empty states |
| `ink` | `#1A1A1A` | Primary text |
| `secondary` | `#6B6B6B` | Secondary text, labels |
| `tertiary` | `#9E9E9E` | Placeholder text, metadata |
| `page-bg` | `#FAFAFA` | Page background |
| `card-border` | `#EEEEEE` | Card and table borders |

**Status colors:**

| Status | Background | Text | Usage |
|---|---|---|---|
| Pass | `#F5EDFF` | `#A100FF` | Policy check passed |
| Conditional | `#F5EDFF` | `#D5A6FF` | Conditional approval |
| Fail | `#FFE4F0` | `#FF52A0` | Policy check failed |
| Needs Info | `#DBEAFE` | `#1D4ED8` | More information required |
| Approved | `#F0FDF4` | `#166534` | Feature approved for deployment |
| Held | `#FFE4F0` | `#BE185D` | Feature blocked |
| In Review | `#F5F5F5` | `#6B6B6B` | Under active review |

**Severity colors (policy rules):**

| Severity | Background | Text |
|---|---|---|
| High | `#FFE4F0` | `#BE185D` |
| Medium | `#F5EDFF` | `#9333EA` |
| Low | `#F5F5F5` | `#6B6B6B` |

### 5.3 Typography

- **Font family:** System UI stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Page headings:** 28px, semibold, `#1A1A1A`
- **Section headings:** 15–16px, semibold, `#1A1A1A`
- **Body / labels:** 13–14px, regular, `#1A1A1A` or `#6B6B6B`
- **Metadata / captions:** 11–12px, `#9E9E9E`
- **Monospace (IDs, code):** `font-mono`, 12px, `#9E9E9E`

### 5.4 Component Patterns

**Cards:** `bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]`

**Primary button:** `bg-accent text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-accent-dark shadow-[0_1px_3px_rgba(161,0,255,0.3)]`

**Secondary button:** `bg-white border border-[#EEEEEE] text-secondary rounded-lg px-4 py-2.5 hover:text-ink`

**Destructive button:** Two-step confirm pattern — first click shows a red-styled confirm button, second click executes. Never execute a destructive action on a single click.

**Form inputs:** `h-9 rounded-lg border border-[#EEEEEE] px-3 text-[13px] bg-white focus:border-accent outline-none`

**Toast notifications:** Fixed bottom-right, 4 second auto-dismiss. Dark background for success (`bg-ink text-white`), pink for error (`bg-[#FFE4F0] text-[#BE185D]`).

**Breadcrumbs:** `text-[12px] text-tertiary` with `›` separator. Last segment is `text-ink` (current page).

### 5.5 Layout

- **Max content width:** 1320px, centered, `px-12 py-10`
- **Narrow content (forms, detail pages):** 1000px max
- **Top navigation bar:** Fixed, full-width, white with border-bottom
- **Page structure:** Breadcrumb → Page title + actions → Content

---

## 6. Authentication & Access Control

### 6.1 Overview

All routes except `/login` require authentication. Unauthenticated users are redirected to `/login`. Role determines what actions are visible and permitted.

### 6.2 Login Page (`/login`)

**Layout:** Centered card on a `#FAFAFA` background. Greenlight logo/wordmark above the card.

**Fields:**
- Email address (text input, required)
- Password (password input, required)
- "Sign in" primary button

**Behavior:**
- On submit, validate credentials against user table in DB
- On success, create a session and redirect to `/` (dashboard)
- On failure, show inline error: "Invalid email or password." — do not specify which field is wrong
- No "Forgot password" in MVP (admin resets passwords directly in DB or settings)

**Session:**
- Use HTTP-only secure cookie
- Session duration: 8 hours (work day), with "Remember me" option for 30 days
- On session expiry, redirect to `/login` with `?expired=1` to show a message

### 6.3 Logout

- "Sign out" link in the top navigation bar (user menu or standalone link)
- Clears session cookie and redirects to `/login`

### 6.4 Route Protection

| Path pattern | Who can access |
|---|---|
| `/login` | Anyone (unauthenticated) |
| `/` | All authenticated users |
| `/features/[id]` | All authenticated users (edit actions: Admin + assigned Reviewer) |
| `/admin/features` | Admin only |
| `/admin/features/discovered` | Admin only |
| `/admin/policies` | Admin only |
| `/admin/policies/[id]` | Admin only |
| `/admin/policies/import` | Admin only |
| `/admin/sources` | Admin only |
| `/admin/settings` | Admin only |
| `/admin/settings-inventory` | Admin only |
| `/audit-log` | Admin and Reviewer |
| All other `/admin/*` | Admin only — Reviewers and Viewers get a 403 page |

### 6.5 User Management

- Admin manages user accounts in Settings → Users (see [Section 22.7](#227-users))
- Fields: name, email, password (hashed), role (Admin / Reviewer / Viewer), `fallback_auth_allowed`
- Invite flow: Admin sends an invitation email with a one-time setup link
- Azure AD sync: when SSO is configured, users can be provisioned automatically from AD groups (see [Section 23](#23-azure-ad--sso-integration))

---

## 7. Navigation & Layout

### 7.1 Top Navigation Bar

Present on every authenticated page. Fixed at top.

**Left side:** Greenlight logo/wordmark (links to `/`)

**Center nav links:**

| Label | Route | Who sees it |
|---|---|---|
| Dashboard | `/` | All |
| Policies | `/admin/policies` | Admin only |
| Features | `/admin/features` | Admin only |
| Sources | `/admin/sources` | Admin only |
| Audit log | `/audit-log` | Admin + Reviewer |
| Settings | `/admin/settings` | Admin only |

- Active link is visually distinguished (accent color underline or bold)
- Links the current user cannot access are hidden (not shown as disabled)

**Right side:** User name/avatar with dropdown → Sign out

### 7.2 Breadcrumbs

Every page below the top level shows a breadcrumb trail:  
`Copilot › Governance › [Section] › [Page]`

### 7.3 404 and Error Pages

- Unknown routes: friendly 404 with link back to dashboard
- Authorization failure: friendly "You don't have access to this page" with link back to dashboard
- Server error: friendly error page with retry option

---

## 8. Dashboard

**Route:** `/`  
**Access:** All authenticated users

### 8.1 Purpose

The dashboard is the main operational view. It shows every feature under governance, grouped by their current approval status, with enough context for a reviewer or stakeholder to quickly understand the state of the review queue.

### 8.2 Page Layout

```
[Breadcrumb]
[Page title: "Copilot governance queue"]
[Subtitle: "{N} features · Last updated {date}"]

[KPI cards row]
[Filter bar]
[Check distribution chart]
[Feature cards by status group]
```

### 8.3 KPI Cards

Four summary cards displayed in a horizontal row:

| Card | Value | Color |
|---|---|---|
| Total features | Count of all non-archived features | Neutral |
| Approved | Count with status = Approved | Green |
| Conditional | Count with status = Conditional | Purple |
| Held | Count with status = Held | Pink/red |

### 8.4 Filter Bar

Inline filter controls above the feature list:

- **Search:** Text input — filters by feature name or product/vendor name
- **Status:** Multi-select pill buttons: All / In Review / Approved / Conditional / Held
- **Risk level:** Dropdown — All / Low-Medium / Medium-High / Variable
- **Governance function:** Dropdown — All / InfoSec / Legal & Privacy / IT & Architecture (filters to features that have at least one non-passing check in that function)

Filters apply in real time (client-side, no page reload).

### 8.5 Check Distribution Chart

A horizontal stacked bar chart showing the breakdown of all policy checks across governance functions:

- Rows: InfoSec, Legal & Privacy, IT & Architecture
- Segments: Pass (purple), Conditional (light purple), Fail (pink), Needs Info (blue)
- Shows count and percentage per segment
- Read-only, informational

### 8.6 Feature Cards

Features are grouped into collapsible sections by status (order: Held → Conditional → In Review → Approved).

Each feature card displays:
- Feature icon (two-letter initials, accent-soft background)
- Feature name (bold)
- Type badge (Feature / Agent / Tool / Model)
- Product/vendor name
- Release version and date
- Current status pill
- Pass rate: "X of Y checks passed" with a thin progress bar
- Flagged governance functions (shown as small colored pills when a function has non-passing checks)
- Clicking the card navigates to `/features/[id]`

### 8.7 Empty State

If no features exist: centered illustration, "No features tracked yet", button linking to `/admin/features`.

---

## 9. Feature Detail & Review Workflow

**Route:** `/features/[id]`  
**Access:** All authenticated users (edit actions: Admin + Reviewer with matching governance function)

### 9.1 Purpose

This is the primary workspace for reviewing a feature. Reviewers read policy check requirements, look up evidence, record their findings, and mark each check with an outcome. Admins make the final approval decision.

### 9.2 Page Layout

```
[Back to dashboard link]
[Feature header: name, type badge, status pill, action buttons]
[Feature metadata bar: version, product, owner, released date, risk]
[Pass rate summary: X of Y checks passed, function breakdown]
[Policy checks panel — main content area]
[Audit sidebar — right rail]
```

### 9.3 Feature Header

- **Feature name** (large heading)
- **Type badge** (Feature / Agent / Tool / Model)
- **Current status pill** (In Review / Approved / Conditional / Held)
- **Action buttons** (Admin only):
  - **Approve for activation** — sets status to Approved
  - **Mark conditional** — sets status to Conditional (requires a reason note)
  - **Block feature** — sets status to Held (requires a reason note)

**Action button behavior:**
- Buttons are always visible to Admin; hidden from Reviewer and Viewer
- Clicking "Approve for activation": single-click confirmation dialog — "Approve [feature name] for deployment to all eligible users?" → Confirm / Cancel
- Clicking "Mark conditional" or "Block feature": opens a modal with a required text field for the reason → Submit / Cancel
- On success: status pill updates immediately (optimistic UI), toast appears, event logged to audit log
- All three actions are reversible — admin can change the status again at any time

### 9.4 Feature Metadata Bar

A horizontal row of labeled metadata fields (read-only):
- Type · Product/Vendor · Version · Released date · Microsoft owner · Risk level · Policy pack

### 9.5 Pass Rate Summary

- Large fraction: "X of Y checks passed"
- Three mini-cards (one per governance function): InfoSec / Legal & Privacy / IT & Architecture
  - Each shows: pass count / total count, progress bar, and a status indicator if any check in that function is non-passing

### 9.6 Policy Checks Panel

The main content area. Checks are grouped by governance function (InfoSec, Legal & Privacy, IT & Architecture), each group in a collapsible section that is expanded by default.

#### 9.6.1 Check Row (Collapsed State)

Each check displays in a single row:
- **Status pill** — Pass / Fail / Conditional / Needs Info — clickable for inline status change (Admin + Reviewer with matching function)
- **Check title**
- **Expand icon** — clicking anywhere on the row expands the detail panel

**Inline status change (quick update):**
- Clicking the status pill opens a small popover/dropdown with the four status options
- Selecting a new status saves immediately (no confirm needed for status changes)
- Status pill updates instantly (optimistic UI), toast confirms save
- Logged to audit log

#### 9.6.2 Check Detail Panel (Expanded State)

Expanding a check row reveals the full detail panel below it:

**Read-only information (from the policy rule):**
- **Intent** — what this check is evaluating
- **Check question** — the specific question the reviewer must answer
- **Required evidence** — what documentation is needed to make a determination
- **Pass / Fail / Unknown criteria** — the rules for each verdict

**Editable fields (Admin + Reviewer with matching function):**
- **Status** — dropdown (Pass / Fail / Conditional / Needs Info)
- **Finding** — free-text textarea — the reviewer's written assessment of what they found
- **Recommendation** — free-text textarea — what action should be taken (if any)
- **Evidence** — list of evidence items, each with:
  - Source URL (text input, validated as URL)
  - Source title (text input)
  - Excerpt (textarea — quoted text from the source)
  - Accessed date (auto-set to today, editable)
  - × Remove button
  - "+ Add evidence" button to add another item

**Save button** — saves status, finding, recommendation, and all evidence in one action. Shows loading state during save. Toast on success/failure.

**Collapse button** — collapses the panel (discards unsaved changes with a brief warning if the form is dirty)

### 9.7 Audit Sidebar

Right-rail sidebar (fixed width ~280px) visible on the feature detail page.

**Sections:**

**Feature info** (read-only)
- Type, released date, version, Microsoft owner, policy pack, risk tier

**Review status**
- Current feature status with timestamp: "Status set to Approved by [Admin Name] on [date]"
- If the feature has a reason note (from Conditional or Held decision), show it here

**Activity**
- Chronological list of the 10 most recent audit events for this feature
- Each event: timestamp, actor name, description (e.g. "INFOSEC-003 marked as Pass by Priya Sharma")
- "View full history" link to audit log filtered to this feature

---

## 10. Feature Catalog Admin

**Route:** `/admin/features`  
**Access:** Admin only

### 10.1 Purpose

Admins maintain the list of Copilot features that Greenlight is tracking. When a new feature is added, Greenlight automatically creates the associated policy checks based on the active policy library.

### 10.2 Page Layout

```
[Breadcrumb]
[Page title: "Features under governance"]
[Description]
[Two-column layout: Add/Edit form (left) | Feature list (right)]
[Sync button below form]
```

### 10.3 Add / Edit Feature Form (Left Column)

A card with labeled form fields:

| Field | Control | Validation |
|---|---|---|
| Category | Select dropdown | Required. Options from VALID_CATEGORIES list |
| Name | Text input | Required |
| Vendor | Text input | Required |
| Type | Select dropdown | Required. Feature / Agent / Tool / Model |
| Summary | Textarea | Optional. Brief description of what the feature does |
| Documentation URL | URL input | Optional. Primary Microsoft learn.microsoft.com page for this feature — used by the Product Update Monitoring Agent |
| Preview release | Checkbox | Optional |

**"Add feature" button:**
- Disabled if Name or Vendor is empty
- On click: saves the feature to the database immediately (no Apply step needed)
- New feature appears instantly in the list on the right
- A toast confirms success
- The dashboard reflects the new feature on next navigation

**"Save changes" button (edit mode):**
- Appears when the pencil icon is clicked on an existing feature
- Saves the edited feature to the database immediately
- "Cancel" link returns to add mode without saving

### 10.4 Feature List (Right Column)

Features grouped by category, each group in a card.

Each feature row shows:
- Checkbox — checked = active (tracked), unchecked = will be removed on sync
- Feature icon (two-letter initials)
- Feature name with "preview" badge if applicable
- Vendor
- Type badge
- Pencil edit icon

**Removing features:**
- Unchecking the checkbox marks the feature for removal but does not immediately delete it
- A yellow warning banner appears: "X features will be removed — this will permanently delete all their policy checks, findings, and evidence. Click Sync to apply."
- Clicking "Sync active / remove unchecked" shows a confirmation modal that lists the features to be deleted by name. User must type "REMOVE" to confirm.
- On confirmation: unchecked features are soft-deleted (`archived_at` set) and their policy checks are archived. Audit events are logged for each removed feature.

**Important:** Adding and editing are immediate (instant save). Removing requires the explicit Sync step — then the confirmation modal — to prevent accidental data loss.

### 10.5 Automatically Generated Policy Checks

When a new feature is added, Greenlight automatically generates a set of policy checks based on:
- The feature's type (Feature, Agent, Tool, Model)
- The active policy rule library

Each policy check is initialized with:
- Status: "Needs Info"
- Finding: empty
- Recommendation: empty
- No evidence

The checks are visible immediately on the feature's detail page.

---

## 11. Policy Library

### 11.1 Policy Library List

**Route:** `/admin/policies`  
**Access:** Admin only

#### Purpose

Shows all active policy rules. Admins can browse, add individual rules, or import a full new version from an Excel file.

#### Page Layout

```
[Breadcrumb]
[Page title: "Policy library"]
[Subtitle: "{N} active rules · {version label}"]
[Action buttons: Download template | + New rule | Import new version]
[Rules grouped by governance function]
```

#### Rule List

Rules grouped into cards by governance function (InfoSec / IT & Architecture / Legal & Privacy / Other). Each card:
- Section header with function label and rule count
- Each rule is a clickable row linking to `/admin/policies/[id]`
- Row shows: rule ID (monospace), title, applies-to list (truncated), severity badge, chevron

**Empty state:** If no rules exist, show centered empty state with three CTAs: "+ New rule", "Import first version", and "Download blank template" (downloads a pre-formatted empty Excel file so the admin can fill it in before importing).

---

### 11.2 Policy Rule Detail / Edit Page

**Route:** `/admin/policies/[id]`  
**Access:** Admin only

#### Page Layout

```
[Breadcrumb: Policies › {rule-id}]
[Rule ID (monospace) + Severity badge]
[Page title: rule title]
[Action buttons: Remove rule | Save changes]
[Inline toast if save succeeds/fails]
[Five section cards]
```

#### Section Cards

**1. Core details**
- Rule ID (read-only — set at creation, never editable)
- Title (text input)
- Function (select: InfoSec / IT & Architecture / Legal & Privacy / Other)
- Severity (select: High / Medium / Low)
- Applies to (textarea — one item per line)

**2. Evaluation context**
- Intent (textarea)
- Check question (textarea)
- Required evidence (textarea)

**3. Criteria (one criterion per line)**
Three side-by-side textareas with colored labels:
- Pass criteria (green label)
- Fail criteria (pink label)
- Unknown / insufficient (gray label)

**4. References**
- Primary sources (textarea — one per line)
- Search keywords (textarea — semicolon-separated)
- Related rules (textarea — semicolon-separated)

**5. Logic & triggers**
- Verdict logic (textarea)
- Customer profile dependency (textarea)
- Re-evaluation trigger (textarea)

#### Save Behavior

- "Save changes" button saves all fields immediately to the database
- Loading state on the button during save
- Inline success toast: "Rule {id} saved."
- Inline error toast if save fails

#### Remove Rule

- "Remove rule" button → on first click shows "Confirm remove" (red style)
- Second click archives the rule (`archived_at` set to now) and redirects to `/admin/policies`
- Removed rules are soft-deleted (not physically deleted); data is preserved in `policy_versions` snapshots

---

### 11.3 New Policy Rule Page

**Route:** `/admin/policies/new`  
**Access:** Admin only

Same layout as the edit page with these differences:
- Page title: "New policy rule"
- Rule ID field is editable — auto-generated from the title as the user types (slugified), but the user can override it
- Button label: "Create rule"
- On success: redirects to `/admin/policies/[new-id]`

---

### 11.4 Policy Import Flow

**Route:** `/admin/policies/import`  
**Access:** Admin only

This is a multi-step wizard for importing a new policy version from an Excel file. The Excel format matches the Microsoft Copilot Governance Checklist structure. The parser uses fuzzy matching to handle variations in sheet names and column headers.

#### Step 1: Upload

```
[Current library stats: X active rules · version label]
[Large drag-and-drop zone]
  [Upload icon]
  ["Drop your governance checklist here"]
  ["or click to browse"]
  [".xlsx files only · max 10 MB"]
[Back link]
```

**Behavior:**
- Accepts `.xlsx` files only, max 10 MB
- Drag-and-drop or click-to-browse
- On file selection: automatically begins parsing (transitions to Step 2)
- If file is wrong type or too large: inline error message below the drop zone

#### Step 2: Parsing

```
[Spinner animation]
["Parsing {filename}…"]
["Reading sheets, mapping columns, running diff against {N} current rules"]
```

- Shown while the server parses the file (typically < 2 seconds)
- Transitions to Step 3 on completion, or shows an error if parsing fails completely

#### Step 3: Review

This is the main review screen. It shows what will change if the user commits this import.

**Header bar:**
- Filename
- Parse timestamp
- "Discard" button (returns to Step 1, discards the session)

**Metric cards row (4 cards):**
- Total rules detected
- New (rules not in current library)
- Updated (rules that have changed)
- Removed (rules in current library not in the import file)

**Detected structure panel:**
- Lists each sheet in the uploaded file with its detected governance function and rule count
- Admin can override the detected function via a dropdown if the auto-detection is wrong
- Sheets classified as META (README, overview) or UNKNOWN are shown grayed out

**Validation banner** (shown if there are warnings or errors):
- Error level: red banner, expandable list. If there are blocking errors and 0 rules parsed, commit is disabled
- Warning level: yellow banner, expandable list. Non-blocking; commit is still allowed

**Diff list:**
- Filter tabs: All changes / New / Updated / Removed
- Each rule shown as a card with:
  - Checkbox — behavior depends on action badge:
    - NEW: checked = add this rule; unchecked = skip (don't add)
    - UPDATED: checked = apply the update; unchecked = keep the existing version unchanged
    - REMOVED: checked = remove this rule from the library; unchecked = keep the existing rule despite it not being in the import file
    - UNCHANGED: always shown, checkbox locked (no action needed)
  - Action badge: NEW (purple) / UPDATED (blue) / REMOVED (pink) / UNCHANGED (gray)
  - Rule ID (monospace)
  - Rule title
  - Severity badge
  - "Details" toggle — expands to show field-level before/after comparison for UPDATED rules

**Sticky commit bar** (fixed at bottom):
- Version label input (pre-filled with suggested next version, e.g. "v2.4")
- "Re-evaluate all features after commit" checkbox
- "Discard" ghost button
- "Publish {N} rules" primary button

**Commit behavior:**
- On "Publish": transitions to Step 4 (committing spinner)
- Sends: session ID, version label, list of included rule IDs, re-evaluate flag
- On success: redirects to `/admin/policies` with a success toast

#### Step 4: Committing

```
[Spinner]
["Publishing {version label}…"]
```

#### Parser Specification (for engineers)

The xlsx parser must handle real-world governance checklists that may not follow a strict format.

**Sheet classification:**
- Score each sheet using keyword matching against known governance function terms
- Minimum 3 recognized column headers required to classify as a rules sheet
- Sheets matching `/readme|overview|verdict|taxonomy|instruction/i` are classified as META and skipped

**Column mapping:**
- Fuzzy match column headers against 55+ known synonyms
- Examples: "Risk Level" → severity, "Name" → title, "Pass Criteria" → pass_criteria
- Levenshtein similarity ≥ 0.85 used as fallback

**Value normalization:**
- Severity: H/High/Critical/1/Red → H; M/Medium/2/Yellow → M; L/Low/3/Green → L
- Multi-value fields: split on newlines + bullet characters (•, ·, -, *) for criteria; split on ·, ;, commas for list fields

**Diff algorithm:**
1. Match by rule ID first (exact match)
2. Fall back to title similarity (Levenshtein ≥ 0.85) for rules that may have been renumbered
3. Rules in current library with no match = REMOVED

---

## 12. Approved Sources Admin

**Route:** `/admin/sources`  
**Access:** Admin only

### 12.1 Purpose

Maintains the list of approved domains that reviewers are permitted to cite as evidence when evaluating policy checks. This list also restricts which domains the AI agent searches when running automated evaluations (see [Section 18](#18-ai-policy-evaluation-agent)).

### 12.2 Page Layout

```
[Breadcrumb]
[Page title: "Approved sources"]
[Description]
[Domain count]
[Table: Domain | Vendor | Notes | Delete]
["+ Add source" row at bottom]
[Apply changes button]
```

### 12.3 Source Table

| Column | Input type | Validation |
|---|---|---|
| Domain | Text input (monospace) | Required. Valid hostname format only. No protocol or path (e.g. `learn.microsoft.com` not `https://learn.microsoft.com/path`) |
| Vendor | Text input | Required when domain is set |
| Notes | Text input | Optional description |
| × | Delete button | Immediately deletes from DB (no Apply needed for deletions) |

### 12.4 Behavior

**Deletion (×):** Removes the row from the UI and immediately deletes from the database. No Apply step required. This is intentional — deletions are low-risk and should be instant.

**Adding:** Click "+ Add source" to add an empty row. Fill in the fields, then click "Apply changes" to save new rows to the database.

**Apply changes:** Saves all current rows to the database (replaces the entire source list). Shows "Fix errors to apply" if any row has validation errors.

**Reset to default:** Restores the factory default list of Microsoft domains.

---

## 13. Audit Log

**Route:** `/audit-log`  
**Access:** Admin + Reviewer

### 13.1 Purpose

A time-stamped record of all meaningful actions taken in Greenlight. Supports accountability, compliance reporting, and debugging.

### 13.2 Events to Log

| Event type | Description | Actors |
|---|---|---|
| `user.login` | User signed in | All |
| `user.logout` | User signed out | All |
| `feature.status_changed` | Feature approval status changed (to Approved, Held, Conditional, In Review) | Admin |
| `check.status_changed` | Policy check status updated | Admin, Reviewer |
| `check.finding_updated` | Check finding or recommendation edited | Admin, Reviewer |
| `check.evidence_added` | Evidence item added to a check | Admin, Reviewer |
| `check.evidence_removed` | Evidence item removed from a check | Admin, Reviewer |
| `feature.created` | Feature added to catalog | Admin |
| `feature.removed` | Feature removed from catalog | Admin |
| `policy.version_imported` | New policy version committed | Admin |
| `policy.rule_created` | Individual rule created | Admin |
| `policy.rule_updated` | Individual rule edited | Admin |
| `policy.rule_archived` | Individual rule removed | Admin |
| `source.created` | Approved source domain added | Admin |
| `source.deleted` | Approved source domain removed | Admin |
| `user.created` | User account provisioned (manually or via SSO) | Admin / System |
| `user.role_changed` | User's role updated | Admin |
| `user.deactivated` | User account deactivated | Admin |
| `reviewer.assigned` | Reviewer assigned to a feature's governance function | Admin |
| `reviewer.unassigned` | Reviewer removed from a feature's governance function | Admin |
| `agent.evaluation_started` | AI policy evaluation run started | Admin / System |
| `agent.evaluation_completed` | AI policy evaluation run completed successfully | System |
| `agent.evaluation_failed` | AI policy evaluation run failed | System |
| `feature.discovered` | Feature Discovery Agent found a new feature suggestion | System |
| `feature.update_detected` | Product Update Monitoring Agent detected a content change | System |
| `settings.changed` | Organization settings updated | Admin |

### 13.3 Log Entry Fields

Each log entry records:
- `id` — unique identifier
- `timestamp` — UTC datetime
- `actor_id` — user ID
- `actor_name` — user's display name (denormalized for readability)
- `event_type` — one of the types above
- `resource_type` — feature / check / policy_rule / source / user
- `resource_id` — the ID of the affected resource
- `resource_label` — human-readable name (e.g. feature name, rule title)
- `detail` — free-text description of the change (e.g. "Status changed from In Review to Approved. Reason: All checks passed.")
- `metadata` — JSON blob for additional structured data (before/after values, etc.)

### 13.4 Audit Log Page

**Layout:**
```
[Breadcrumb]
[Page title: "Audit log"]
[Filter bar: date range | actor | event type | resource type | search]
[Log table]
[Pagination]
```

**Table columns:** Timestamp · Actor · Action (human-readable event description) · Resource

**Filter bar:**
- Date range picker (default: last 30 days)
- Actor dropdown (list of all users)
- Event type multi-select
- Resource type multi-select
- Free-text search

**Row detail:** Clicking a log row expands an inline detail view showing the full description and any metadata.

---

## 14. Data Model

### 14.1 Tables

#### `users` (NEW for MVP)
```sql
CREATE TABLE users (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  email                 TEXT UNIQUE NOT NULL,
  password              TEXT,          -- bcrypt hash; NULL for SSO-only accounts
  role                  TEXT NOT NULL CHECK (role IN ('admin', 'reviewer', 'viewer')),
  azure_oid             TEXT UNIQUE,   -- Azure AD object ID; NULL for local-only accounts
  fallback_auth_allowed INTEGER NOT NULL DEFAULT 1,  -- 1 = can still use email/password even when SSO enforced
  archived_at           TEXT,          -- soft-delete; NULL = active account
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  last_login            TEXT
);
```

#### `sessions` (NEW for MVP)
```sql
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,  -- random UUID
  user_id     TEXT NOT NULL REFERENCES users(id),
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `features` (existing, no changes needed)
```
id, name, type, product, version, risk_level, status,
summary, icon_label, released_date, ms_owner, policy_pack,
category, is_preview
```

#### `policy_checks` (existing — add `updated_by` and `updated_at`)
```sql
ALTER TABLE policy_checks ADD COLUMN updated_by TEXT;  -- user id
ALTER TABLE policy_checks ADD COLUMN updated_at TEXT;
```

#### `evidence` (existing — no changes needed)
```
id, check_id, source_title, source_url, excerpt, accessed_date
```

#### `sources` (existing — no changes needed)
```
domain, vendor, notes, created_at, updated_at
```

#### `policy_rules` (existing — no changes needed)
#### `policy_versions` (existing — no changes needed)
#### `policy_version_rules` (existing — no changes needed)

#### `audit_log` (NEW for MVP)
```sql
CREATE TABLE audit_log (
  id             TEXT PRIMARY KEY,
  timestamp      TEXT NOT NULL DEFAULT (datetime('now')),
  actor_id       TEXT NOT NULL,
  actor_name     TEXT NOT NULL,
  event_type     TEXT NOT NULL,
  resource_type  TEXT NOT NULL,
  resource_id    TEXT NOT NULL,
  resource_label TEXT NOT NULL,
  detail         TEXT NOT NULL,
  metadata       TEXT NOT NULL DEFAULT '{}'  -- JSON
);
```

#### `feature_status_history` (NEW for MVP)
Tracks the full history of feature status changes with reasons:
```sql
CREATE TABLE feature_status_history (
  id          TEXT PRIMARY KEY,
  feature_id  TEXT NOT NULL REFERENCES features(id),
  status      TEXT NOT NULL,
  reason      TEXT,
  changed_by  TEXT NOT NULL,  -- user id
  changed_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `policy_checks` additions (source + confidence)
```sql
ALTER TABLE policy_checks ADD COLUMN source     TEXT NOT NULL DEFAULT 'human';  -- 'human' | 'ai'
ALTER TABLE policy_checks ADD COLUMN confidence REAL;  -- 0.0–1.0; null for human-entered checks
```

#### `agent_runs` (NEW)
Records each AI evaluation run against a feature:
```sql
CREATE TABLE agent_runs (
  id               TEXT PRIMARY KEY,
  feature_id       TEXT NOT NULL REFERENCES features(id),
  triggered_by     TEXT NOT NULL,           -- user id or 'system'
  trigger_reason   TEXT NOT NULL,           -- 'manual' | 'feature_added' | 'policy_updated' | 'scheduled'
  model            TEXT NOT NULL,           -- e.g. 'claude-opus-4-8'
  status           TEXT NOT NULL,           -- 'running' | 'completed' | 'failed'
  checks_evaluated INTEGER NOT NULL DEFAULT 0,
  checks_updated   INTEGER NOT NULL DEFAULT 0,
  input_tokens     INTEGER,
  output_tokens    INTEGER,
  error_message    TEXT,
  started_at       TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at     TEXT
);
```

#### `agent_check_evaluations` (NEW)
Per-check results recorded within each agent run:
```sql
CREATE TABLE agent_check_evaluations (
  id              TEXT PRIMARY KEY,
  run_id          TEXT NOT NULL REFERENCES agent_runs(id),
  check_id        TEXT NOT NULL REFERENCES policy_checks(id),
  status_assigned TEXT NOT NULL,           -- Pass | Fail | Conditional | Needs Info
  confidence      REAL NOT NULL,           -- 0.0–1.0
  finding_text    TEXT NOT NULL DEFAULT '',
  search_queries  TEXT NOT NULL DEFAULT '[]',  -- JSON array of queries used
  sources_visited TEXT NOT NULL DEFAULT '[]',  -- JSON array of URLs visited
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `feature_reviewer_assignments` (NEW)
Maps reviewers to features by governance function (one row per feature+function):
```sql
CREATE TABLE feature_reviewer_assignments (
  id          TEXT PRIMARY KEY,
  feature_id  TEXT NOT NULL REFERENCES features(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  function    TEXT NOT NULL CHECK (function IN ('INFOSEC', 'IT', 'LEGAL')),
  assigned_by TEXT NOT NULL REFERENCES users(id),
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (feature_id, function)
);
```

#### `notification_events` (NEW)
Events queued for in-app and external delivery:
```sql
CREATE TABLE notification_events (
  id           TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES users(id),
  event_type   TEXT NOT NULL,              -- see Section 20 for types
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  feature_id   TEXT,                       -- null for non-feature events
  sent_email   INTEGER NOT NULL DEFAULT 0, -- boolean
  sent_teams   INTEGER NOT NULL DEFAULT 0, -- boolean
  read_at      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `settings` (NEW)
Key-value store for organization-wide configuration:
```sql
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `invitation_tokens` (NEW)
One-time setup links for user account activation:
```sql
CREATE TABLE invitation_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  token       TEXT UNIQUE NOT NULL,  -- random hex, included in invite email link
  expires_at  TEXT NOT NULL,         -- 72-hour expiry
  used_at     TEXT,                  -- NULL = unused
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

#### `user_notification_preferences` (NEW)
Per-user, per-event-type, per-channel notification settings:
```sql
CREATE TABLE user_notification_preferences (
  user_id    TEXT NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,          -- matches event types in Section 20
  channel    TEXT NOT NULL CHECK (channel IN ('email', 'teams')),  -- 'inapp' is always on
  enabled    INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, event_type, channel)
);
```

#### `features` additions (documentation and monitoring)
```sql
ALTER TABLE features ADD COLUMN summary           TEXT;    -- brief description of the feature
ALTER TABLE features ADD COLUMN documentation_url TEXT;    -- primary Microsoft learn.microsoft.com page
ALTER TABLE features ADD COLUMN last_monitored_at TEXT;    -- when Product Update Agent last checked
ALTER TABLE features ADD COLUMN content_hash      TEXT;    -- hash of last-seen documentation content
```

#### `feature_discovery_suggestions` (NEW)
Features surfaced by the Feature Discovery Agent awaiting admin review:
```sql
CREATE TABLE feature_discovery_suggestions (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  vendor           TEXT NOT NULL DEFAULT 'Microsoft',
  type             TEXT,                -- Feature | Agent | Tool | Model (agent's best guess)
  summary          TEXT,
  documentation_url TEXT NOT NULL,
  source_domain    TEXT NOT NULL,       -- which approved source this was found on
  discovered_at    TEXT NOT NULL DEFAULT (datetime('now')),
  status           TEXT NOT NULL DEFAULT 'pending'  -- 'pending' | 'accepted' | 'dismissed' | 'snoozed'
    CHECK (status IN ('pending', 'accepted', 'dismissed', 'snoozed')),
  snoozed_until    TEXT,
  reviewed_by      TEXT REFERENCES users(id),
  reviewed_at      TEXT,
  feature_id       TEXT REFERENCES features(id)  -- set when accepted and added to catalog
);
```

---

## 15. API Endpoints

### Existing (no changes needed)
- `POST /api/policies/import/parse` — Parse uploaded xlsx, return diff
- `POST /api/policies/import/commit` — Commit parsed policy version
- `GET /api/policies/template` — Download current rules as xlsx

### New — MVP

#### Authentication
- `POST /api/auth/login` — Validate credentials, create session
- `POST /api/auth/logout` — Invalidate session

#### User Management
- `GET /api/users` — List all users (Admin only)
- `PATCH /api/users/[id]` — Update user name, email, or role (Admin only)
- `DELETE /api/users/[id]` — Deactivate user account — sets `archived_at` (Admin only)
- `POST /api/users/invite` — Create invitation token and send setup email (Admin only); body: `{ name, email, role }`
- `GET /api/invitations/[token]` — Validate invitation token (unauthenticated); returns `{ valid, name, email }`
- `POST /api/invitations/[token]/accept` — Complete account setup: set password, mark token used (unauthenticated); body: `{ password }`
- `POST /api/users/[id]/reset-password` — Send password reset email to user (Admin only)

#### Notification Preferences
- `GET /api/users/me/notification-preferences` — Get the current user's notification preferences
- `PATCH /api/users/me/notification-preferences` — Update preferences; body: `{ event_type, channel, enabled }`

#### Feature Status
- `PATCH /api/features/[id]/status` — Update feature approval status
  - Body: `{ status, reason? }`
  - Auth: Admin only
  - Returns: updated feature, logs audit event

#### Policy Checks
- `PATCH /api/checks/[id]` — Update check status, finding, recommendation
  - Body: `{ status?, finding?, recommendation? }`
  - Auth: Admin + Reviewer (matching governance function)
  - Returns: updated check, logs audit event

#### Evidence
- `POST /api/checks/[id]/evidence` — Add evidence item
  - Body: `{ source_title, source_url, excerpt, accessed_date? }`
  - Returns: new evidence item, logs audit event
- `DELETE /api/evidence/[id]` — Remove evidence item
  - Auth: Admin + Reviewer
  - Logs audit event

#### Audit Log
- `GET /api/audit-log` — Query audit log entries
  - Query params: `from`, `to`, `actor`, `event_type`, `resource_type`, `resource_id`, `q`, `limit`, `offset`
  - Returns: `{ entries: [...], total: N }`
- `GET /api/audit-log/export` — Download audit log as Excel
  - Query params: same as above; streams a `.xlsx` file

### New — AI Agent

- `POST /api/features/[id]/evaluate` — Trigger AI evaluation run
  - Body: `{ reset_human_overrides?: boolean }`
  - Auth: Admin only
  - Creates an `agent_runs` record, queues the evaluation job
  - Returns: `{ run_id: string }`

- `GET /api/features/[id]/agent-runs` — List agent run history for a feature
  - Auth: Admin + Reviewer
  - Returns: `{ runs: AgentRun[] }`

- `GET /api/agent-runs/[runId]` — Get run details including per-check evaluations
  - Auth: Admin + Reviewer
  - Returns: `AgentRun & { evaluations: AgentCheckEvaluation[] }`

- `POST /api/checks/[id]/reset-to-ai` — Allow AI to overwrite a manually-overridden check on next run
  - Auth: Admin only

### New — Reviewer Assignment

- `GET /api/features/[id]/assignments` — List reviewer assignments for a feature
  - Auth: Admin + Reviewer
  - Returns: `{ assignments: ReviewerAssignment[] }`

- `PUT /api/features/[id]/assignments/[function]` — Assign or replace a reviewer
  - Body: `{ user_id: string }`
  - Auth: Admin only
  - On success: sends assignment notification if notifications are enabled

- `DELETE /api/features/[id]/assignments/[function]` — Remove reviewer assignment
  - Auth: Admin only

### New — Notifications

- `GET /api/notifications` — List notifications for the authenticated user
  - Query params: `unread_only?`, `limit?`, `offset?`
  - Returns: `{ notifications: NotificationEvent[], unread_count: number }`

- `PATCH /api/notifications/[id]/read` — Mark a notification as read

- `POST /api/notifications/mark-all-read` — Mark all notifications as read for the current user

### New — Reports

- `GET /api/reports/features/[id]/pdf` — Generate and download PDF governance report
  - Auth: Admin + Reviewer
  - Response: `application/pdf`; file name: `greenlight-[feature-id]-[date].pdf`

- `GET /api/reports/features/[id]/excel` — Generate and download Excel report for a feature
  - Auth: Admin + Reviewer
  - Response: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### New — Settings

- `GET /api/settings` — Get all settings (org, auth, notifications, agent config)
  - Auth: Admin only
  - Returns: `Record<string, string>`

- `PATCH /api/settings` — Update one or more settings
  - Body: `Record<string, string>`
  - Auth: Admin only

- `POST /api/settings/test-sso` — Validate Azure AD SSO configuration without saving
  - Auth: Admin only

- `POST /api/settings/test-notifications` — Send a test notification to configured channels
  - Auth: Admin only

### New — Azure AD / SSO

- `GET /api/auth/sso/azure` — Initiate Microsoft SSO (PKCE flow); redirects to Microsoft's authorization endpoint

- `GET /api/auth/sso/azure/callback` — Handle OAuth callback: validate state, exchange code, provision user, create session; redirects to `/` on success

### New — Feature Discovery Agent

- `POST /api/agents/discovery/run` — Trigger a manual feature discovery scan (Admin only); returns `{ run_id }`
- `GET /api/features/suggestions` — List feature discovery suggestions (Admin only); query params: `status?`, `limit?`, `offset?`
- `PATCH /api/features/suggestions/[id]` — Accept, dismiss, or snooze a suggestion (Admin only); body: `{ action: 'accept' | 'dismiss' | 'snooze', snooze_days?: number }`

### New — Product Update Monitoring Agent

- `POST /api/agents/monitor/run` — Trigger a manual monitoring scan for all tracked features (Admin only)
- `POST /api/agents/monitor/features/[id]` — Trigger monitoring scan for a specific feature (Admin only)

---

## 16. Non-Functional Requirements

### 16.1 Performance
- Dashboard must load in < 2 seconds with up to 100 features
- Policy import parse step must complete in < 5 seconds for files up to 10 MB
- All admin save operations must complete in < 1 second

### 16.2 Security
- All passwords stored as bcrypt hashes (min cost factor 12)
- Session tokens stored in HTTP-only, Secure, SameSite=Strict cookies
- No sensitive data in localStorage or URL parameters
- All write endpoints validate that the authenticated user has the required role
- File uploads: validate MIME type server-side (not just extension), enforce size limit
- SQL: use parameterized queries only (never string interpolation) — already enforced by better-sqlite3 prepared statements

### 16.3 Data Integrity
- All destructive operations (feature removal, rule archiving) are soft-deletes — data is never physically deleted
- Policy rule versions are snapshot-preserved in `policy_version_rules`
- Audit log entries are append-only (no updates or deletes)

### 16.4 Browser Support
- Chrome 120+, Edge 120+, Safari 17+
- No IE11 support required
- Minimum viewport: 1280px wide (admin tool, not mobile)

### 16.5 Accessibility
- All interactive elements must be keyboard-navigable
- Status indicators must not rely on color alone (include text labels)
- Minimum contrast ratio: 4.5:1 for body text

### 16.6 Database (Production)
- Migrate from SQLite to PostgreSQL before any multi-user production deployment
- SQLite is appropriate for single-server development and prototype environments only
- Use connection pooling (PgBouncer or Prisma) in production

---

## 17. Feature Discovery Agent

**Route:** `/admin/features/discovered`  
**Access:** Admin only

### 17.1 Purpose

The Feature Discovery Agent crawls approved Microsoft documentation sources on a configurable schedule to find newly released Copilot features, agents, and integrations that Accenture has not yet added to Greenlight. It surfaces these as a suggestion queue so admins can review and add relevant features to the catalog — replacing the need to manually monitor Microsoft release notes.

### 17.2 Discovery Sources

The agent crawls only domains present in the `approved_sources` list. Recommended sources to seed for feature discovery:

| Domain | What it contains |
|---|---|
| `learn.microsoft.com` | Feature documentation, Copilot feature pages, release announcements |
| `techcommunity.microsoft.com` | Microsoft 365 blog posts, new feature announcements |
| `support.microsoft.com` | Feature availability and rollout pages |

Discovery source scanning is configured separately from policy evaluation search — both are restricted to the `approved_sources` list but the discovery agent focuses on feature catalogue pages rather than evidence documents.

### 17.3 What the Agent Extracts

For each page or article identified as announcing a new feature:
- Feature name
- Type classification (Feature / Agent / Tool / Model) — inferred from content
- Vendor (always Microsoft for these sources)
- Summary — a 1–2 sentence description extracted or summarized from the page
- Documentation URL — the canonical page URL
- Release date (if detectable)
- Product area (e.g. "Microsoft 365 Copilot", "Copilot Studio", "Teams")

### 17.4 Deduplication

Before creating a suggestion, the agent checks for duplicates:
1. Exact URL match against `feature_discovery_suggestions.documentation_url`
2. Exact URL match against `features.documentation_url`
3. Fuzzy name match (Levenshtein ≥ 0.85) against existing features

If a match is found, the suggestion is suppressed (not re-surfaced).

### 17.5 Trigger Modes

| Trigger | Who | When |
|---|---|---|
| Scheduled | System | Configurable: off / daily / weekly (set in Settings → Agent) |
| Manual scan | Admin | "Scan for new features" button on `/admin/features/discovered` |

### 17.6 Suggestion Queue UI (`/admin/features/discovered`)

```
[Breadcrumb: Features › Discovered]
[Page title: "Discovered features"]
[Subtitle: "X suggestions pending review · Last scan: {relative time}"]
["Scan for new features" button (Admin)]

[Filter bar: Status (Pending / Accepted / Dismissed) | Source domain]

[Suggestion cards — one per discovered feature]
```

**Each suggestion card shows:**
- Feature name + inferred type badge
- Summary (1–2 sentences)
- Source domain and documentation URL (clickable)
- Discovered date
- Action buttons:
  - **Accept** — opens a pre-filled "Add feature" form (fields populated from the suggestion); on save, creates the feature, links `feature_discovery_suggestions.feature_id`, marks suggestion as `accepted`
  - **Dismiss** — marks as `dismissed` (never re-surface this URL); shows undo for 5 seconds
  - **Snooze** — marks as `snoozed` with a configurable re-surface date (7 / 30 / 90 days)

**Empty state (no pending suggestions):**
"No new features found. The last scan ran {time}. Run a new scan to check for updates."

### 17.7 Notification

When the discovery agent finds new suggestions, an in-app notification is created for all Admin users:
- Event type: `feature.discovered` (see Section 20)
- Message: "Feature Discovery Agent found {N} new Copilot feature(s) to review"
- Links to `/admin/features/discovered`

### 17.8 Agent Settings (in `/admin/settings` → Agent)

| Setting | Control | Default |
|---|---|---|
| Feature discovery schedule | Select: Off / Daily / Weekly | Weekly |
| Auto-add discovered features | Toggle | Off |
| Minimum sources scanned per run | Number (1–50) | 10 |

When **Auto-add** is enabled, the agent bypasses the suggestion queue and directly adds discovered features to the catalog (they still appear in the suggestions list as `accepted`). This mode is recommended only after the source list has been carefully curated.

---

## 18. AI Policy Evaluation Agent

**Route:** Feature detail page (Run Evaluation button) + `/admin/settings` (Agent section)  
**Access:** Trigger evaluation — Admin only. View results — Admin + Reviewer.

### 18.1 Purpose

The AI agent reads each policy rule's check question, intent, and search keywords, then searches only approved source domains, reads relevant pages, evaluates content against the rule's pass/fail/unknown criteria, and writes findings and evidence directly into the feature's policy checks. This eliminates the manual evidence-gathering step for reviewers.

### 18.2 Trigger Modes

| Trigger | Who | When |
|---|---|---|
| Manual per feature | Admin | "Run evaluation" button on feature detail page |
| Automatic on add | System | When a new feature is added to the catalog (configurable off) |
| Policy update trigger | System | When a new policy version is committed with "Re-evaluate all features" checked |
| Scheduled | System | Configurable weekly schedule set in Settings → Agent |

### 18.3 Per-Check Evaluation Workflow

For each active policy check on the feature, ordered by severity (High → Medium → Low):

1. Construct a search query combining the rule's `search_keywords` and the feature name
2. Search only domains in the `approved_sources` list
3. Retrieve and read the most relevant pages (configurable max; default 5 per check)
4. Evaluate page content against `pass_criteria`, `fail_criteria`, and `unknown_criteria`
5. Select the verdict that best fits the evidence
6. Write a concise `finding` summarizing what was found and why the verdict was chosen
7. Add `evidence` items: URL, title, excerpt, accessed date
8. Assign a `confidence` score (0.0–1.0) reflecting how strongly the evidence supports the verdict

### 18.4 Human Override Behavior

- All checks populated by the agent are flagged `source: 'ai'` with a confidence score
- When a reviewer or admin manually changes a check's status, finding, or recommendation, the check becomes `source: 'human'`
- Subsequent agent runs **do not overwrite** `source: 'human'` checks
- Admin can click "Reset to AI" on an individual check to re-enable AI overwriting on the next run
- Before triggering a manual run, admin can check "Reset all human overrides" to force full re-evaluation

### 18.5 Agent Run Record

Every run creates an `agent_runs` record with: feature ID, triggered by, trigger reason, model used, status (running / completed / failed), checks evaluated, checks updated, token counts, error message, start time, completion time.

### 18.6 UI — Feature Detail Page

**"Run evaluation" button (Admin only)**  
Located in the feature header action bar. If a run is already in progress, shows "Evaluating…" (spinner, disabled). Clicking opens a small popover:
- "This will auto-fill checks that haven't been manually overridden."
- Checkbox: "Reset human overrides and re-evaluate all checks"
- "Start evaluation" / Cancel buttons

**Agent status bar**  
Shown below the pass rate summary when any run exists for the feature:  
`Last evaluated: {relative time} · {N} checks updated · {model} · Avg confidence: {score}`  
"View run history" link opens the agent runs panel.

**Agent runs panel (expandable section or slide-out)**  
Lists all runs for the feature, newest first. Each row: timestamp, triggered by, status badge, checks evaluated, checks updated, duration. Clicking expands per-check evaluations from that run.

**AI vs. human indicator on check rows**  
- Checks set by the agent show a sparkle icon and a confidence badge (e.g. "87%")
- Manually overridden checks show a "Manually reviewed" label
- "Reset to AI" micro-action available to Admin on AI-evaluated checks

### 18.7 Agent Settings (in `/admin/settings` → Agent)

| Setting | Control | Default |
|---|---|---|
| AI model | Select: claude-opus-4-8 / claude-sonnet-4-6 / claude-haiku-4-5 | claude-opus-4-8 |
| Max sources per check | Number input (1–20) | 5 |
| Confidence threshold (highlight) | Number input (0.0–1.0) | 0.90 |
| Auto-evaluate on new feature | Toggle | On |
| Scheduled re-evaluation | Toggle + day + time picker | Off |
| Anthropic API key | Password input (encrypted at rest) | — |

**Note on Confidence Threshold:** The threshold is a display/highlight threshold, not an auto-approval gate. Checks where the agent's confidence score meets or exceeds this threshold are highlighted with a green confidence badge ("high confidence") to help reviewers quickly identify checks the agent is most certain about. All checks — regardless of confidence — still require human review before a feature can be approved. The agent never automatically approves features.

**Note on missing API key:** If the Anthropic API key is not configured in Settings, the "Run evaluation" button on the feature detail page is disabled and shows a tooltip: "Configure your Anthropic API key in Settings → Agent to enable AI evaluation." Scheduled and automatic evaluation runs are silently skipped until the key is configured.

---

## 19. Reviewer Assignment

**Route:** Feature detail page — Audit Sidebar (Reviewers section)  
**Access:** Assign — Admin only. View assignments — all authenticated users.

### 19.1 Purpose

Each feature can have one assigned reviewer per governance function. Assigned reviewers receive notifications, are highlighted on the dashboard, and (when enforced) are the only Reviewers who can update checks in their function on that feature.

### 19.2 Data Model

`feature_reviewer_assignments` — one row per (feature_id, function) pair. Assigning a different user to a function replaces the existing row.

### 19.3 UI — Feature Detail Page (Audit Sidebar)

**Reviewers card** (new section below Review Status in the right-rail sidebar):

```
┌─ Reviewers ─────────────────────────────────────────────┐
│ InfoSec         Marcus Chen         [Change] [×]        │
│ IT & Arch       Priya Sharma        [Change] [×]        │
│ Legal & Privacy (unassigned)        [+ Assign]          │
└──────────────────────────────────────────────────────────┘
```

- Clicking "Assign" or "Change" opens an inline dropdown populated with Reviewer and Admin-role users
- Selecting a user and confirming calls `PUT /api/features/[id]/assignments/[function]`
- If notifications are enabled, an assignment email/Teams message is sent immediately
- × removes the assignment

### 19.4 Dashboard — Assigned Features

For the current user, features they are assigned to show an "Assigned to you" pill on the feature card. Reviewer users see a "My assignments" quick-filter in the dashboard filter bar.

### 19.5 Role-Based Check Editing Enforcement

When assignments are configured and "Enforce reviewer assignments" is enabled in Settings → Organization:
- Reviewer users can only edit checks in functions they are assigned to on that specific feature
- Unassigned function checks are greyed out in the UI with a tooltip: "Assigned to [Name]" or "Unassigned — contact Admin"
- Admins always retain full edit access regardless of assignment
- When enforcement is **disabled** (default), any Reviewer can edit any check on any feature — assignments are advisory only (notifications still fire)

---

## 20. Notifications

**Access:** Notification preferences — user profile. Infrastructure config — Settings → Notifications.

### 20.1 Purpose

Keep reviewers and admins informed of key governance events without requiring continuous dashboard monitoring. Delivered in-app (bell icon) and optionally via email and/or Microsoft Teams.

### 20.2 Notification Types

| Event type | Recipients | Message |
|---|---|---|
| `feature.assigned` | Assigned reviewer | "You've been assigned to review [Feature] — [Function] checks" |
| `feature.approved` | All assigned reviewers | "[Feature] has been approved for deployment" |
| `feature.held` | All assigned reviewers | "[Feature] has been blocked by [Admin Name]" |
| `feature.conditional` | All assigned reviewers | "[Feature] has been conditionally approved" |
| `function.complete` | Admin | "All [Function] checks for [Feature] are now complete" — fires when every check in a governance function transitions out of "Needs Info" status (i.e., all are Pass, Fail, or Conditional) |
| `check.flagged_fail` | Admin + assigned function reviewer | "[Check title] has been marked Fail on [Feature]" |
| `policy.version_imported` | All Reviewers | "New policy version [label] imported — [N] rules changed" |
| `agent.evaluation_complete` | Admin | "AI evaluation of [Feature] complete — [N] checks updated" |
| `agent.evaluation_failed` | Admin | "AI evaluation of [Feature] failed: [error summary]" |

### 20.3 Delivery Channels

**In-app:** Bell icon in the top nav bar with unread count badge. Clicking opens a panel (newest first) showing the 20 most recent notifications with icon, subject, relative timestamp, and a link to the relevant page. "Mark as read" per notification and "Mark all as read" bulk action. A "View all" link at the bottom navigates to `/notifications` (full paginated history).

**Email:** One email per event to each recipient. Includes a "View in Greenlight" link. Sent via configured SMTP or SendGrid.

**Microsoft Teams:** Adaptive Card per event sent via an incoming webhook URL. Includes event details and a "View in Greenlight" button.

### 20.4 User Notification Preferences

Each user can toggle notification delivery per channel (In-app / Email / Teams) per event type in their profile settings. "Quiet hours" option suppresses email and Teams delivery during specified hours; in-app notifications are still created.

### 20.5 Constraints

- Admins cannot disable `agent.evaluation_failed` notifications
- In-app notifications are always created regardless of channel preferences
- If email or Teams is not configured in Settings, those delivery channels are silently skipped

---

## 21. Report Export

**Access:** Admin + Reviewer

### 21.1 Purpose

Export a feature's complete governance record as PDF for stakeholder distribution, or export the policy library as Excel for offline reference.

### 21.2 PDF Governance Report (per feature)

**Trigger:** "Export PDF" button on the feature detail page (top-right action area).  
**File name:** `greenlight-[feature-id]-[YYYY-MM-DD].pdf`

**Content:**

**Cover page:**
- Greenlight wordmark + organization name and logo
- Feature name, type badge, current status (large)
- Report generated date and time
- Overall pass rate + function-level breakdown

**Executive Summary:**
- Feature metadata (product, version, risk level, Microsoft owner)
- Approval decision, deciding admin name, date, reason note
- Policy check summary table: per governance function — total, passed, failed, conditional, needs info; overall pass rate bar

**Full Check Detail (one section per governance function):**
- Each check: ID, title, status pill, confidence score (if AI-evaluated), finding text, recommendation text, evidence items (URL, title, excerpt)
- AI-evaluated checks labeled with an AI badge

**Audit Record (final page):**
- Chronological list of all audit events for the feature
- Reviewer assignments at time of report
- Agent run history summary

**Format:** PDF, A4/Letter. Accent color `#A100FF` used for section headers. Generated server-side using Puppeteer (headless Chromium renders an HTML template, then `page.pdf()` produces the file). This ensures fonts, colors, and layout exactly match the UI. The PDF is streamed directly to the browser response — not stored on disk. If generation fails (e.g., Puppeteer not available in the deployment environment), the endpoint returns a 500 with a user-visible error: "PDF generation failed — contact your administrator." As a fallback, the Excel report remains available.

### 21.3 Excel Policy Library Export

Already partially implemented via `GET /api/policies/template`. Produces an Excel file in the same format as the import template with all current active rules. Enhancements needed:
- Cover sheet with: version label, export date, rule count, column name legend
- Used for offline reference, re-importing after manual edits, or sharing with external reviewers

---

## 22. Settings Page

**Route:** `/admin/settings`  
**Access:** Admin only

### 22.1 Purpose

Central console for configuring Greenlight's organization profile, authentication, AI agent, notifications, and user management.

### 22.2 Page Layout

```
[Breadcrumb]
[Page title: "Settings"]
[Left sidebar nav: Organization · Authentication · Agent · Notifications · Users]
[Right: active section form card]
[Save changes button per section]
```

### 22.3 Organization

| Field | Control | Notes |
|---|---|---|
| Organization name | Text input | Shown in nav bar and PDF report cover |
| Organization logo | File upload (PNG/SVG ≤ 500 KB) | Shown in nav bar and PDF cover |
| Support email | Email input | "From" address for notification emails |
| Greenlight base URL | URL input | Used in email/Teams notification links |
| Enforce reviewer assignments | Toggle | When on, Reviewers can only edit checks in their assigned governance function (see Section 19.5). Default: Off |

### 22.4 Authentication

| Field | Control | Notes |
|---|---|---|
| Session duration | Number + unit select (hours/days) | Default: 8 hours |
| "Remember me" duration | Number + unit select | Default: 30 days |
| Azure AD tenant ID | Text input | From Azure AD app registration |
| Azure AD client ID | Text input | From Azure AD app registration |
| Azure AD client secret | Password input (masked, encrypted at rest) | |
| Group → role mapping | Table: Group ID/Name → Admin/Reviewer/Viewer | Add/remove rows |
| Test SSO connection | Button | Uses the currently-entered (not yet saved) field values to attempt an OAuth metadata fetch against Microsoft's well-known endpoint. Shows "Connection validated" or an error inline without saving any values |
| Disable email/password login | Toggle | When on, only SSO sign-in is available. Accounts with `fallback_auth_allowed = true` are exempt |

### 22.5 Agent

See [Section 18.7](#187-agent-settings-in-adminsettings--agent) for the full field list.

### 22.6 Notifications

| Field | Control | Notes |
|---|---|---|
| Enable email | Toggle | Master switch — off = no emails sent |
| SMTP host | Text input | e.g. `smtp.sendgrid.net` |
| SMTP port | Number input | e.g. `587` |
| SMTP username | Text input | |
| SMTP password | Password input (encrypted at rest) | |
| From address | Email input | |
| Enable Teams | Toggle | Master switch |
| Teams webhook URL | URL input | Incoming webhook from a Teams channel |
| Send test notification | Button | Sends a sample event to configured channels |

### 22.7 Users

Embedded user management (replaces a standalone `/admin/users` page).

**User table columns:** Name · Email · Role (editable inline select) · Last login · Status · Actions

- **Status**: Active / Pending (invited but setup not completed) / Inactive (archived)
- **Actions**: Edit name/email, Deactivate (sets `archived_at`, revokes sessions), Reset password (sends email with setup link)

**"Invite user" button** — opens a modal with name, email, role → sends invitation email with a one-time setup link (valid 72 hours). The user appears in the table with status "Pending" until they complete account setup.

**"Sync from Azure AD" button** (visible when SSO is configured) — syncs user list from configured AD groups, provisions new users, updates roles for existing users based on current group membership. Shows a preview of changes before applying.

**Deactivated users** retain all their audit log entries and check edits; their name is shown as "[Deactivated user]" in the UI where relevant.

---

## 23. Azure AD / SSO Integration

### 23.1 Purpose

Allow Accenture users to sign in with their standard Microsoft account via Azure AD / Entra ID, removing separate password management. Roles are assigned from Azure AD group membership, enabling role governance through existing IT processes.

### 23.2 Login Page — SSO Configured

When Azure AD credentials are set in Settings, the login page shows a "Sign in with Microsoft" primary button above the email/password form:

```
┌──────────────────────────────────────────────────┐
│           [Greenlight wordmark]                  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │   Sign in with Microsoft                 │ → redirect to Microsoft
│  └──────────────────────────────────────────┘    │
│                                                  │
│        ── or sign in with email ──               │
│  Email ________________________________________  │
│  Password ______________________________________  │
│                              [Sign in]           │
└──────────────────────────────────────────────────┘
```

When SSO is not configured, only the email/password form is shown.

### 23.3 SSO Flow

1. User clicks "Sign in with Microsoft"
2. App generates PKCE verifier + challenge, stores state in an HTTP-only cookie
3. App redirects to Microsoft's authorization endpoint with: tenant ID, client ID, `redirect_uri`, `scope=openid email profile`, PKCE challenge
4. User completes Microsoft authentication (existing Accenture SSO session may auto-complete this)
5. Microsoft redirects to `/api/auth/sso/azure/callback` with auth code + state
6. App validates state, exchanges code for tokens using PKCE verifier
7. App decodes the ID token: extracts `email`, `name`, `oid` (Azure object ID). **Note on group membership:** Azure AD only includes group claims in the ID token if the app registration is configured to emit them (and the tenant has ≤ 150 groups). For larger tenants, the app must call the Microsoft Graph API (`GET /v1.0/me/memberOf`) using the access token to retrieve groups. Greenlight must handle both paths: check for groups in the ID token first; fall back to a Graph API call if not present
8. User lookup / provisioning:
   - Existing user (matched by email or Azure OID): update `last_login`, sync role from group mapping
   - New user: provision record with role from AD group membership; no group match → Viewer by default
9. App creates session, sets HTTP-only session cookie
10. Redirect to `/` (dashboard)

### 23.4 Group-Based Role Mapping

Configured in Settings → Authentication. Groups are evaluated in priority order: Admin → Reviewer → Viewer. If a user belongs to multiple mapped groups, the highest-privilege role wins.

| Azure AD Group | Greenlight Role |
|---|---|
| (configured by Admin) | Admin |
| (configured by Admin) | Reviewer |
| (configured by Admin) | Viewer |

If a user belongs to no mapped group, they are assigned Viewer by default. The Admin can change this to "Deny access" in Settings.

### 23.5 Session and Sign-Out

- Session duration follows the Settings → Authentication configuration
- Silent token refresh: when a session nears expiry, Greenlight attempts a background token refresh via Azure AD. If refresh fails (account disabled, token revoked), the session is invalidated and the user is redirected to `/login`
- Single sign-out: when a user clicks "Sign out", Greenlight invalidates the local session and redirects to Microsoft's logout endpoint to terminate the Azure AD session

### 23.6 Fallback Authentication

Email/password login remains available for:
- Admin accounts (in case SSO is misconfigured)
- Service or test accounts
- Accounts with `fallback_auth_allowed = true` in the users table

Admins can disable email/password login globally for all other accounts in Settings → Authentication.

---

## 24. Feature & Settings Identification Agent

**Route:** `/admin/settings-inventory`  
**Access:** Admin only

### 24.1 Purpose

Microsoft regularly adds new configurable settings, policy controls, and toggle switches to the M365 admin center that affect how Copilot and AI features behave. The Feature & Settings Identification Agent monitors Microsoft's admin center documentation and release notes to maintain a living inventory of these settings — so Accenture's governance team always knows what can be turned on or off, and which settings carry governance implications that need a policy decision.

This is distinct from the Feature Discovery Agent (Section 17), which discovers Copilot features to add to the governance catalog. This agent focuses on **admin-level settings and controls** that affect the behavior of already-deployed features.

### 24.2 What the Agent Monitors

Sources crawled (restricted to approved_sources list):

| Domain | What it contains |
|---|---|
| `learn.microsoft.com/microsoft-365/admin` | M365 admin center docs, policy controls |
| `learn.microsoft.com/microsoft-365-copilot` | Copilot-specific admin settings |
| `admin.microsoft.com` (docs only) | Admin center feature documentation |

For each setting or policy control identified:
- Setting name and description
- Location in M365 admin center (navigation path, e.g. "Settings → Org settings → Microsoft Copilot")
- Governance function relevance (InfoSec / IT / Legal — inferred from content)
- Data handling implications (e.g. "affects data sent to Microsoft", "controls external sharing")
- Link to official documentation
- Date first detected

### 24.3 Settings Inventory UI (`/admin/settings-inventory`)

```
[Breadcrumb: Admin › Settings Inventory]
[Page title: "M365 Settings Inventory"]
[Subtitle: "{N} settings tracked · {N} need governance decision · Last updated: {date}"]
["Scan for new settings" button]

[Filter bar: Governance function | Review status | Search]

[Settings cards — grouped by governance function]
```

**Each setting card shows:**
- Setting name + governance function badge
- Description (1–3 sentences from documentation)
- Admin center navigation path
- Governance review status pill:
  - **Needs Decision** — newly discovered or changed; admin has not yet set a governance stance
  - **Reviewed** — admin has documented a stance
  - **Changes Detected** — setting previously reviewed but documentation indicates Microsoft changed it
- Admin's governance stance (when Reviewed): Approved / Blocked / Conditional (free-text note)
- "Mark as reviewed" / "Update stance" action

### 24.4 Governance Stance

For each setting, an Admin can record Accenture's organizational stance:

| Stance | Meaning |
|---|---|
| Approved | This setting is authorized for use; governance team has reviewed it |
| Blocked | This setting must not be enabled; governance team has blocked it |
| Conditional | Approved under specific conditions (document conditions in notes) |

Recording a stance creates an audit log event (`settings.changed`).

### 24.5 Trigger Modes

| Trigger | Who | When |
|---|---|---|
| Scheduled | System | Configurable: off / weekly (set in Settings → Agent) |
| Manual scan | Admin | "Scan for new settings" button |

### 24.6 Notifications

When new settings are discovered or existing settings show content changes:
- Event type: `feature.discovered` (reuses existing type; subject indicates it's a settings discovery)
- Recipients: All Admins
- Message: "Settings Identification Agent found {N} new/changed admin settings that need governance review"

### 24.7 Agent Settings (in `/admin/settings` → Agent)

| Setting | Control | Default |
|---|---|---|
| Settings inventory schedule | Select: Off / Weekly | Weekly |

---

## 25. Product Update Monitoring Agent

**Route:** Feature detail page (monitoring status indicator) + Settings → Agent  
**Access:** Trigger manual scan — Admin only. View monitoring status — Admin + Reviewer.

### 25.1 Purpose

After Accenture approves a feature, Microsoft may later change how it works — updating its data handling, adding new capabilities, changing privacy controls, or modifying sharing behavior. The Product Update Monitoring Agent tracks the primary documentation page for each feature in Greenlight and alerts the governance team when substantive content changes are detected, ensuring that approved features remain compliant over time.

### 25.2 How Change Detection Works

1. Agent retrieves the feature's `documentation_url`
2. Fetches the current page content
3. Computes a semantic hash of the relevant page sections (excluding navigation, ads, "last updated" dates, and other boilerplate)
4. Compares against `features.content_hash` (the last stored hash)
5. If the hash has changed, extracts a summary of what changed using a brief Claude analysis of the diff
6. Updates `features.content_hash` and `features.last_monitored_at`
7. If a substantive change is detected:
   - Sets a `monitoring_flag` on the feature (displayed in the UI as a banner)
   - Creates an audit log entry: `feature.update_detected`
   - Sends notification to Admin and assigned reviewers (all functions)
   - Optionally triggers a new AI policy evaluation run (if auto-trigger is enabled in Settings)

**Note:** Features with no `documentation_url` are skipped. The feature detail page shows a "No documentation URL configured — not monitored" indicator for these features.

### 25.3 UI — Feature Detail Page

**Monitoring status indicator** (shown in the Feature Metadata Bar):
- Green dot + "Monitored — last checked {relative time}" — when no changes detected
- Orange dot + "Update detected {date}" — when a change has been flagged
- Gray dot + "Not monitored" — when no `documentation_url` is set

**Update detected banner** (shown at top of feature detail page when flagged):
```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️  Microsoft has updated documentation for this feature.          │
│  Detected: {date}. Changes may affect governance status.           │
│  [View changes summary]  [Dismiss]  [Trigger re-evaluation]        │
└─────────────────────────────────────────────────────────────────────┘
```

- "View changes summary" — expands a panel showing the Claude-generated summary of what changed in the documentation
- "Dismiss" — clears the flag (Admin only); creates an audit event; the feature continues to be monitored on future runs
- "Trigger re-evaluation" — starts a new AI policy evaluation run (Admin only)

### 25.4 Trigger Modes

| Trigger | Who | When |
|---|---|---|
| Scheduled | System | Configurable: off / weekly / daily (set in Settings → Agent) |
| Manual (all features) | Admin | "Scan all features for updates" in Settings → Agent or via `POST /api/agents/monitor/run` |
| Manual (one feature) | Admin | "Check for updates" button on feature detail page header (Admin only) |

### 25.5 Minimum Change Threshold

To avoid noise from trivial content changes (typo fixes, formatting updates, navigation changes), the agent applies a minimum change threshold before flagging a feature. This is configurable in Settings → Agent.

- Default: 10% of monitored content sections must differ to trigger a flag
- Below threshold: update `content_hash` and `last_monitored_at` silently (no notification, no flag)

### 25.6 Agent Settings (in `/admin/settings` → Agent)

| Setting | Control | Default |
|---|---|---|
| Product update monitoring schedule | Select: Off / Daily / Weekly | Weekly |
| Minimum content change threshold | Number input (1–50%) | 10% |
| Auto-trigger AI re-evaluation on update detected | Toggle | Off |
