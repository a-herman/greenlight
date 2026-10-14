# Greenlight

AI governance dashboard for reviewing Microsoft 365 Copilot features and agents against an enterprise policy library. The full product spec is in [REQUIREMENTS.md](REQUIREMENTS.md), and UI screenshots are in [screenshots/](screenshots/).

## Prerequisites

- **Node.js 20+** (developed on Node 25): `brew install node`
- **Git**: `brew install git`
- **macOS:** Xcode command-line tools (`xcode-select --install`). These are needed to compile `better-sqlite3`.

## Setup

```bash
git clone https://github.com/a-herman/greenlight.git
cd greenlight
npm install
npm run dev
```

Open http://localhost:3000.

## Data

No separate seed or import step is needed. On first run the app creates `data/greenlight.db` (SQLite) and fills it with:

| Data | Source |
|---|---|
| 7 Copilot features, 97 policy checks, 32 evidence citations | `src/lib/seed-data.ts` |
| Policy library: 52 rules, imported as version **v1.0** | `policies/Microsoft Copilot Governance Checklist.xlsx` |

The policy library is imported only when the database has no policy versions yet. After that, manage the rules in the app at **Policies**, either by editing rules individually or with **Import new version** for an updated spreadsheet.

`data/` is git-ignored, so edits made in the app stay on your machine.

- **Reset to a clean state:** stop the server, delete `data/`, and run `npm run dev` again.
- **Keep your edits when moving machines:** copy `data/greenlight.db` across.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `node scripts/screenshot.mjs` | Regenerate `screenshots/` (needs the dev server running, plus `npm i -D playwright && npx playwright install chromium`) |

## Notes for developers

This project uses **Next.js 16**, which has breaking changes from earlier versions. For example, route `params` is a Promise and must be awaited. Read the guides in `node_modules/next/dist/docs/` before changing framework code (see [AGENTS.md](AGENTS.md)).
