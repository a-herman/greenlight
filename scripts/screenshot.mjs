/**
 * Captures full-page screenshots of all Greenlight UI views.
 * Requires the dev server running on localhost:3000.
 * Usage: node scripts/screenshot.mjs
 *
 * The app uses overflow-y:auto on <main> (not <body>), so standard
 * fullPage:true doesn't capture below the fold. This script expands
 * the <main> element to its full scroll height before shooting.
 */

// Resolve playwright from the npx cache
// To use a local install instead: npm install -D playwright && npx playwright install chromium
const { createRequire } = await import('module')
const req = createRequire(import.meta.url)
let playwright
try {
  playwright = req('playwright')
} catch {
  playwright = req('/Users/andrew.herman/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js')
}
const { chromium } = playwright

import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'screenshots')
mkdirSync(OUT, { recursive: true })

const BASE = 'http://localhost:3000'

// Expand the inner <main> container so fullPage:true captures everything.
// The layout uses: html.h-full > body.h-full.flex-col > main.flex-1.overflow-y-auto
// We need to remove the height constraints so the document grows to full content height.
async function expandForFullPage(page) {
  await page.evaluate(() => {
    // Remove fixed heights from html/body so document height can grow
    document.documentElement.style.height = 'auto'
    document.body.style.height = 'auto'
    document.body.style.minHeight = 'unset'

    // Expand the <main> scroll container to show all its content
    const main = document.querySelector('main')
    if (main) {
      const fullH = main.scrollHeight
      main.style.height = fullH + 'px'
      main.style.overflow = 'visible'
      main.style.minHeight = 'unset'
      main.style.flex = 'none'
    }

    // Also expand any other overflow:auto containers inside main
    // (e.g. virtualized lists, nested scrollable panels)
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el)
      if (
        (s.overflowY === 'auto' || s.overflowY === 'scroll') &&
        el.tagName !== 'HTML' && el.tagName !== 'BODY'
      ) {
        el.style.overflowY = 'visible'
        el.style.height = el.scrollHeight + 'px'
        el.style.flex = 'none'
      }
    })
  })
}

async function capture(page, name, path, { clip } = {}) {
  console.log(`→ ${name}: ${path}`)
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 })
  await page.waitForTimeout(600)  // let animations settle

  if (!clip) {
    await expandForFullPage(page)
    await page.waitForTimeout(200)
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true })
  } else {
    await page.screenshot({ path: join(OUT, `${name}.png`), clip })
  }
  console.log(`  ✓ ${name}.png`)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()

// ── Login page ────────────────────────────────────────────────────────────────
// Don't expand for login — it's a centered card, fullPage looks fine as-is
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, '01-login.png'), fullPage: true })
console.log('  ✓ 01-login.png')

// ── Dashboard ─────────────────────────────────────────────────────────────────
await capture(page, '02-dashboard', '/')

// ── Feature detail ────────────────────────────────────────────────────────────
// Use a known good feature ID from the seeded data
await capture(page, '03-feature-detail', '/features/f7-claude-foundry')

// ── Policy library (list) ─────────────────────────────────────────────────────
await capture(page, '04-policy-library', '/admin/policies')

// ── Policy rule edit ──────────────────────────────────────────────────────────
await capture(page, '05-policy-rule-edit', '/admin/policies/IS-01')

// ── Policy import — Step 1 upload ────────────────────────────────────────────
await capture(page, '06-policy-import', '/admin/policies/import')

// ── Policy new rule ───────────────────────────────────────────────────────────
await capture(page, '07-policy-new-rule', '/admin/policies/new')

// ── Feature catalog ───────────────────────────────────────────────────────────
await capture(page, '08-feature-catalog', '/admin/features')

// ── Approved sources ──────────────────────────────────────────────────────────
await capture(page, '09-approved-sources', '/admin/sources')

// ── Second feature for variety (a different status) ───────────────────────────
await capture(page, '10-feature-detail-2', '/features/f1-copilot-chat')

await browser.close()
console.log('\nAll screenshots saved to screenshots/')
