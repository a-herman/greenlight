# Greenlight — Product Requirements Document

**Version:** 1.0  
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
17. [Out of Scope — MVP](#17-out-of-scope--mvp)
18. [Future Releases](#18-future-releases)

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

### 1.3 Core Workflow (MVP)

```
Microsoft ships a new Copilot feature
        ↓
Admin adds it to Greenlight's feature catalog
        ↓
Greenlight creates policy checks for the feature (based on the active policy library)
        ↓
Reviewers evaluate each check — marking Pass / Fail / Conditional / Needs Info
        ↓
Governance admin makes a final decision: Approve / Hold / Conditional
        ↓
Decision is logged in the audit trail
        ↓
Feature status is visible on the dashboard
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
| **Approved Source** | A trusted domain that reviewers are permitted to cite as evidence |
| **Feature Status** | The overall approval decision for a feature: In Review, Approved, Conditional, or Held |
| **Audit Log** | A time-stamped record of every meaningful action taken in the system |

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
| Update check status & findings | ✅ | ✅ (own function only) | ❌ |
| Approve / Hold / Flag a feature | ✅ | ❌ | ❌ |
| Manage feature catalog | ✅ | ❌ | ❌ |
| Import / manage policy rules | ✅ | ❌ | ❌ |
| Manage approved sources | ✅ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ |
| Manage user accounts | ✅ | ❌ | ❌ |

---

## 4. Release Scope

### MVP (Release 1)

The MVP delivers a complete manual governance workflow. A governance team can track every Copilot feature, record policy check outcomes, make approval decisions, and maintain a full audit trail — all without AI assistance.

**In scope:**
- Authentication with role-based access
- Dashboard (feature queue, status, pass rates)
- Feature detail pages with editable check status and findings
- Feature approval actions (Approve / Hold / Request Info)
- Feature catalog admin
- Policy library (bulk import + individual rule CRUD)
- Approved sources admin
- Basic audit log

**Not in scope for MVP:** See [Section 17](#17-out-of-scope--mvp)

### Release 2 — AI-Assisted Evaluation

An AI agent automatically runs policy checks for each feature by searching approved sources and evaluating findings against pass/fail criteria. This replaces the manual evidence-gathering step.

**Additions:**
- AI agent integration (Claude or OpenAI with web_search tool)
- Auto-run policy checks per feature
- Auto-populate findings and evidence
- Confidence scores and agent run history
- Re-evaluation triggers when policy updates or new Microsoft announcements are detected

### Release 3 — Enterprise Collaboration

**Additions:**
- Reviewer assignment (assign specific reviewers to features by governance function)
- Email / Microsoft Teams notifications
- PDF and Excel report export
- Settings page (org name, logo, notification preferences, user management)
- Full audit log UI with advanced filtering and export
- Role provisioning via Azure AD groups

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
| `/features/[id]` | All authenticated users |
| `/admin/*` | Admin only — Reviewers and Viewers get a 403 page |
| `/audit-log` | Admin and Reviewer |

### 6.5 User Management (MVP — minimal)

- Admin can create/delete user accounts via a simple admin-only page at `/admin/users`
- Fields: name, email, password (hashed), role (Admin / Reviewer / Viewer)
- No email verification or self-serve registration in MVP

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

**Review status** (NEW — replaces hardcoded data)
- Current feature status with timestamp: "Status set to Approved by Marcus Chen on Jun 10, 2026"
- If the feature has a reason note (from Conditional or Held decision), show it here

**Activity** (NEW — real data from audit log)
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
- A warning message appears: "X features will be removed — click Sync to apply"
- Clicking "Sync active / remove unchecked" applies the checkbox state to the database: unchecked features are deleted along with their policy checks

**Important:** Adding and editing are immediate (instant save). Removing requires the explicit Sync step to prevent accidental deletion.

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

**Empty state:** If no rules exist, show centered empty state with both "+ New rule" and "Import first version" CTAs.

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
  - Checkbox (checked = include in commit, unchecked = skip this rule)
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

Maintains the list of approved domains that reviewers are permitted to cite as evidence when evaluating policy checks. In Release 2, this list also restricts which domains the AI agent can search.

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
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,  -- bcrypt hash
  role        TEXT NOT NULL CHECK (role IN ('admin', 'reviewer', 'viewer')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  last_login  TEXT
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

## 17. Out of Scope — MVP

The following are explicitly NOT included in the MVP and should not be built until the releases specified:

| Capability | Target release |
|---|---|
| AI agent for automated policy check evaluation | Release 2 |
| Web search integration (approved sources used by AI) | Release 2 |
| Re-evaluation automation when policy changes | Release 2 |
| Confidence scores per check | Release 2 |
| Reviewer assignment / ownership | Release 3 |
| Email or Teams notifications | Release 3 |
| PDF / Excel report export | Release 3 |
| Advanced audit log filtering and export | Release 3 |
| Settings page | Release 3 |
| Self-serve user registration | Release 3 |
| Azure AD / SSO integration | Release 3 |
| Multi-tenant / team workspaces | Release 3 |
| Mobile / tablet responsive layout | Not planned |

---

## 18. Future Releases

### Release 2 — AI-Assisted Evaluation

The core idea: Greenlight's agent reads each policy rule's check question and search keywords, queries approved sources, retrieves relevant content, and evaluates findings against the pass/fail criteria. This removes the manual evidence-gathering burden from reviewers.

**AI agent workflow:**
1. Admin triggers evaluation for a feature (or it runs automatically when a feature is added)
2. For each policy check on the feature:
   a. Agent constructs a search query from `search_keywords` and `check_question`
   b. Agent searches only `approved_sources` domains
   c. Agent retrieves and reads relevant pages
   d. Agent evaluates content against `pass_criteria`, `fail_criteria`, `unknown_criteria`
   e. Agent sets check status, populates `finding`, adds `evidence` items with URLs and excerpts
3. Agent writes a confidence score per check (0–1)
4. Reviewers review AI-populated checks, correct where needed
5. Admin makes final approval decision

**Requirements:**
- Agent run must be triggerable manually per feature and also on a schedule
- Each agent run is recorded with start time, duration, model used, token count
- Checks updated by agent are marked with `source: 'ai'`; checks manually overridden are marked `source: 'human'`
- Human overrides take precedence and are not overwritten by subsequent agent runs unless explicitly reset

### Release 3 — Enterprise Collaboration

**Reviewer assignment:** Each feature is assigned specific reviewers per governance function (InfoSec reviewer, Legal reviewer, IT reviewer). Only assigned reviewers can update checks in their function.

**Notifications:** When a feature is assigned for review, the assigned reviewer receives an email or Teams message. When all checks in a reviewer's function are complete, the admin is notified.

**Reporting:** Export a feature's full governance record as a PDF (cover page, check outcomes, evidence list, approval decision, signatories). Export the full policy library as Excel.

**Settings:** Admin UI for org name, logo upload, notification preferences, SMTP configuration.

**Azure AD integration:** Map Azure AD groups to Greenlight roles. Users log in with their Accenture Microsoft account (SSO).
