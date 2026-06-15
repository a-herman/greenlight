/**
 * Captures screenshots of all Greenlight UI views.
 * Requires the dev server to be running on localhost:3000.
 * Usage: node scripts/screenshot.mjs
 *
 * Playwright must be available via npx. Run once to install:
 *   npx playwright install chromium
 */

// Resolve playwright from npx cache or local install
let chromium
try {
  const local = await import('playwright').catch(() => null)
  chromium = local?.chromium
  if (!chromium) throw new Error('not local')
} catch {
  // Try the npx-cached version
  const { createRequire } = await import('module')
  const req = createRequire(import.meta.url)
  chromium = req('playwright').chromium
}

import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'screenshots')
mkdirSync(OUT, { recursive: true })

const BASE = 'http://localhost:3000'

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()

async function capture(name, path) {
  console.log(`→ ${name}: ${path}`)
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true })
  console.log(`  ✓ ${name}.png`)
}

async function firstLink(selector) {
  return page.$$eval(selector, els => els.map(e => e.getAttribute('href')).filter(Boolean)[0] ?? null)
}

await capture('01-login', '/login')

await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 10000 })
const needsAuth = page.url().includes('/login')

if (needsAuth) {
  // Attempt default seed credentials
  await page.fill('input[type="email"], input[name="email"]', 'admin@accenture.com').catch(() => {})
  await page.fill('input[type="password"], input[name="password"]', 'password').catch(() => {})
  await page.click('button[type="submit"]').catch(() => {})
  await page.waitForTimeout(1500)
}

// Dashboard
await page.screenshot({ path: join(OUT, '02-dashboard.png'), fullPage: true })
console.log('  ✓ 02-dashboard.png')

// Feature detail — follow first feature link
const featureHref = await firstLink('a[href^="/features/"]')
if (featureHref) await capture('03-feature-detail', featureHref)
else console.log('  (no features — skipping 03-feature-detail)')

// Policy library and drill-in
await capture('04-policy-library', '/admin/policies')
const ruleHref = await firstLink('a[href^="/admin/policies/"]:not([href$="/new"]):not([href$="/import"])')
if (ruleHref) await capture('05-policy-rule-edit', ruleHref)
else console.log('  (no rules — skipping 05-policy-rule-edit)')

await capture('06-policy-import-step1', '/admin/policies/import')
await capture('07-policy-new-rule',     '/admin/policies/new')
await capture('08-feature-catalog',     '/admin/features')
await capture('09-approved-sources',    '/admin/sources')
await capture('10-audit-log',           '/audit-log')

await browser.close()
console.log('\nAll screenshots saved to screenshots/')
