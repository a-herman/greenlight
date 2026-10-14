import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { FeatureSummary, FeatureDetail, PolicyCheck, Evidence, CheckStat } from '@/types'
import { FEATURES, POLICY_CHECKS, EVIDENCE } from './seed-data'
import type { CatalogEntry } from './catalog-format'
import { slugifyId } from './catalog-format'
import { generateChecksForFeature } from './check-generator'
import type { SourceEntry } from './source-format'
import type { CanonicalRule } from './policyParser/types'
import { parseXlsxBuffer } from './policyParser'

const DB_PATH = path.join(process.cwd(), 'data', 'greenlight.db')

declare global {
  // eslint-disable-next-line no-var
  var __greenlightDb: Database.Database | undefined
}

// Reset to false on every HMR re-evaluation so migrateSchema runs on the cached connection
let migrationDone = false

function getDb(): Database.Database {
  if (!globalThis.__greenlightDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    const db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
    if (needsSeed(db)) seedDb(db)
    globalThis.__greenlightDb = db
  }
  if (!migrationDone) {
    migrateSchema(globalThis.__greenlightDb)
    migrationDone = true
    seedPolicyLibrary(globalThis.__greenlightDb)
  }
  return globalThis.__greenlightDb
}

const SEED_CHECKLIST = path.join(process.cwd(), 'policies', 'Microsoft Copilot Governance Checklist.xlsx')

// Fresh databases get the checklist committed in policies/ as v1.0. Keyed on policy_versions
// (not rule count) so a library the admin has deliberately emptied is never re-imported.
function seedPolicyLibrary(db: Database.Database) {
  const { n } = db.prepare('SELECT COUNT(*) as n FROM policy_versions').get() as { n: number }
  if (n > 0 || !fs.existsSync(SEED_CHECKLIST)) return
  const parsed = parseXlsxBuffer(fs.readFileSync(SEED_CHECKLIST), path.basename(SEED_CHECKLIST), [])
  if (parsed.rules.length === 0) return
  commitPolicyVersion({
    versionLabel: 'v1.0',
    filename: path.basename(SEED_CHECKLIST),
    notes: 'Auto-imported on first run',
    rulesToUpsert: parsed.rules,
    ruleIdsToArchive: [],
  })
}

function migrateSchema(db: Database.Database) {
  const cols = (db.prepare('PRAGMA table_info(features)').all() as { name: string }[]).map(r => r.name)
  if (!cols.includes('category')) db.exec("ALTER TABLE features ADD COLUMN category TEXT NOT NULL DEFAULT ''")
  if (!cols.includes('is_preview')) db.exec('ALTER TABLE features ADD COLUMN is_preview INTEGER NOT NULL DEFAULT 0')

  // Backfill categories for the 7 original seed features
  const seedCategories: Record<string, string> = {
    'f1-copilot-chat':    'Microsoft 365 Copilot',
    'f2-researcher-agent':'First-party preinstalled agents',
    'f3-analyst-agent':   'First-party preinstalled agents',
    'f4-sales-agent':     'Dynamics 365 agents',
    'f5-copilot-office':  'Microsoft 365 Copilot',
    'f6-app-builder':     'Copilot Studio',
    'f7-claude-foundry':  'Azure AI Foundry',
  }
  const update = db.prepare("UPDATE features SET category = ? WHERE id = ? AND category = ''")
  for (const [id, cat] of Object.entries(seedCategories)) update.run(cat, id)

  const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name)
  if (!tables.includes('sources')) {
    db.exec(`
      CREATE TABLE sources (
        domain TEXT PRIMARY KEY,
        vendor TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
  }
  if (!tables.includes('policy_rules')) {
    db.exec(`
      CREATE TABLE policy_rules (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        function TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'M',
        applies_to TEXT NOT NULL DEFAULT '[]',
        intent TEXT,
        check_question TEXT,
        required_evidence TEXT,
        pass_criteria TEXT NOT NULL DEFAULT '[]',
        fail_criteria TEXT NOT NULL DEFAULT '[]',
        unknown_criteria TEXT NOT NULL DEFAULT '[]',
        primary_sources TEXT NOT NULL DEFAULT '[]',
        search_keywords TEXT NOT NULL DEFAULT '[]',
        verdict_logic TEXT,
        customer_profile_dependency TEXT,
        re_eval_trigger TEXT,
        related_rules TEXT NOT NULL DEFAULT '[]',
        raw_extra TEXT NOT NULL DEFAULT '{}',
        source_sheet TEXT NOT NULL DEFAULT '',
        source_row INTEGER NOT NULL DEFAULT 0,
        current_version_id INTEGER,
        archived_at TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE policy_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version_label TEXT NOT NULL,
        committed_at TEXT NOT NULL DEFAULT (datetime('now')),
        committed_by TEXT NOT NULL DEFAULT 'admin',
        source_filename TEXT NOT NULL,
        rule_count INTEGER NOT NULL DEFAULT 0,
        notes TEXT
      );
      CREATE TABLE policy_version_rules (
        version_id INTEGER NOT NULL REFERENCES policy_versions(id),
        rule_id TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        PRIMARY KEY (version_id, rule_id)
      );
    `)
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS features (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      product TEXT NOT NULL,
      version TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      icon_label TEXT NOT NULL,
      released_date TEXT NOT NULL,
      ms_owner TEXT NOT NULL,
      policy_pack TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS policy_checks (
      id TEXT PRIMARY KEY,
      feature_id TEXT NOT NULL REFERENCES features(id),
      governance_function TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      finding TEXT NOT NULL,
      recommendation TEXT
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      check_id TEXT NOT NULL REFERENCES policy_checks(id),
      source_title TEXT NOT NULL,
      source_url TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      accessed_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sources (
      domain TEXT PRIMARY KEY,
      vendor TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

function needsSeed(db: Database.Database): boolean {
  const row = db.prepare('SELECT COUNT(*) as n FROM features').get() as { n: number }
  return row.n === 0
}

function seedDb(db: Database.Database) {
  const insertFeature = db.prepare(`
    INSERT INTO features (id, name, type, product, version, risk_level, status, summary, icon_label, released_date, ms_owner, policy_pack)
    VALUES (@id, @name, @type, @product, @version, @risk_level, @status, @summary, @icon_label, @released_date, @ms_owner, @policy_pack)
  `)

  const insertCheck = db.prepare(`
    INSERT INTO policy_checks (id, feature_id, governance_function, title, status, finding, recommendation)
    VALUES (@id, @feature_id, @governance_function, @title, @status, @finding, @recommendation)
  `)

  const insertEvidence = db.prepare(`
    INSERT INTO evidence (id, check_id, source_title, source_url, excerpt, accessed_date)
    VALUES (@id, @check_id, @source_title, @source_url, @excerpt, @accessed_date)
  `)

  const seedAll = db.transaction(() => {
    for (const f of FEATURES) insertFeature.run(f)
    for (const c of POLICY_CHECKS) insertCheck.run(c)
    for (const e of EVIDENCE) insertEvidence.run(e)
  })

  seedAll()
}

// ─── Query functions ─────────────────────────────────────────────────────────

interface RawFeatureSummary {
  id: string
  name: string
  type: string
  product: string
  version: string
  risk_level: string
  status: string
  summary: string
  icon_label: string
  released_date: string
  ms_owner: string
  policy_pack: string
  total_checks: number
  pass_count: number
  conditional_count: number
  fail_count: number
  needs_info_count: number
  flagged_functions: string | null
  infosec_pass: number
  infosec_total: number
  legal_pass: number
  legal_total: number
  it_pass: number
  it_total: number
}

export function getFeatures(): FeatureSummary[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT
      f.*,
      COUNT(pc.id)                                                                           AS total_checks,
      SUM(CASE WHEN pc.status = 'Pass'        THEN 1 ELSE 0 END)                            AS pass_count,
      SUM(CASE WHEN pc.status = 'Conditional' THEN 1 ELSE 0 END)                            AS conditional_count,
      SUM(CASE WHEN pc.status = 'Fail'        THEN 1 ELSE 0 END)                            AS fail_count,
      SUM(CASE WHEN pc.status = 'Needs Info'  THEN 1 ELSE 0 END)                            AS needs_info_count,
      GROUP_CONCAT(
        DISTINCT CASE WHEN pc.status != 'Pass' THEN pc.governance_function END
      )                                                                                      AS flagged_functions,
      SUM(CASE WHEN pc.governance_function = 'InfoSec' AND pc.status = 'Pass' THEN 1 ELSE 0 END) AS infosec_pass,
      SUM(CASE WHEN pc.governance_function = 'InfoSec' THEN 1 ELSE 0 END)                        AS infosec_total,
      SUM(CASE WHEN pc.governance_function = 'Legal'   AND pc.status = 'Pass' THEN 1 ELSE 0 END) AS legal_pass,
      SUM(CASE WHEN pc.governance_function = 'Legal'   THEN 1 ELSE 0 END)                        AS legal_total,
      SUM(CASE WHEN pc.governance_function = 'IT'      AND pc.status = 'Pass' THEN 1 ELSE 0 END) AS it_pass,
      SUM(CASE WHEN pc.governance_function = 'IT'      THEN 1 ELSE 0 END)                        AS it_total
    FROM features f
    LEFT JOIN policy_checks pc ON pc.feature_id = f.id
    GROUP BY f.id
    ORDER BY
      CASE f.status
        WHEN 'Held'        THEN 1
        WHEN 'Conditional' THEN 2
        WHEN 'In Review'   THEN 3
        WHEN 'Approved'    THEN 4
      END,
      f.released_date DESC
  `).all() as RawFeatureSummary[]

  return rows.map(r => ({
    ...r,
    flagged_functions: r.flagged_functions ?? '',
  })) as FeatureSummary[]
}

export function getFeatureById(id: string): FeatureDetail | null {
  const db = getDb()

  const feature = db.prepare(`
    SELECT
      f.*,
      COUNT(pc.id)                                                     AS total_checks,
      SUM(CASE WHEN pc.status = 'Pass'       THEN 1 ELSE 0 END)       AS pass_count,
      SUM(CASE WHEN pc.status = 'Conditional' THEN 1 ELSE 0 END)      AS conditional_count,
      SUM(CASE WHEN pc.status = 'Fail'       THEN 1 ELSE 0 END)       AS fail_count,
      SUM(CASE WHEN pc.status = 'Needs Info' THEN 1 ELSE 0 END)       AS needs_info_count
    FROM features f
    LEFT JOIN policy_checks pc ON pc.feature_id = f.id
    WHERE f.id = ?
    GROUP BY f.id
  `).get(id) as RawFeatureSummary | undefined

  if (!feature) return null

  const checksRaw = db.prepare(
    'SELECT * FROM policy_checks WHERE feature_id = ? ORDER BY governance_function, id'
  ).all(id) as Omit<PolicyCheck, 'evidence'>[]

  const evidenceRaw = db.prepare(`
    SELECT e.* FROM evidence e
    JOIN policy_checks pc ON pc.id = e.check_id
    WHERE pc.feature_id = ?
    ORDER BY e.id
  `).all(id) as Evidence[]

  const evidenceByCheck = new Map<string, Evidence[]>()
  for (const ev of evidenceRaw) {
    const arr = evidenceByCheck.get(ev.check_id) ?? []
    arr.push(ev)
    evidenceByCheck.set(ev.check_id, arr)
  }

  const checks: PolicyCheck[] = checksRaw.map(c => ({
    ...c,
    governance_function: c.governance_function as PolicyCheck['governance_function'],
    status: c.status as PolicyCheck['status'],
    evidence: evidenceByCheck.get(c.id) ?? [],
  }))

  return {
    ...feature,
    risk_level: feature.risk_level as FeatureDetail['risk_level'],
    status: feature.status as FeatureDetail['status'],
    type: feature.type as FeatureDetail['type'],
    checks,
  }
}

export function getCheckStats(): CheckStat[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT
      governance_function,
      SUM(CASE WHEN status = 'Pass'        THEN 1 ELSE 0 END) AS pass,
      SUM(CASE WHEN status = 'Conditional' THEN 1 ELSE 0 END) AS conditional,
      SUM(CASE WHEN status = 'Fail'        THEN 1 ELSE 0 END) AS fail,
      SUM(CASE WHEN status = 'Needs Info'  THEN 1 ELSE 0 END) AS needs_info
    FROM policy_checks
    GROUP BY governance_function
    ORDER BY CASE governance_function
      WHEN 'InfoSec' THEN 1
      WHEN 'Legal'   THEN 2
      WHEN 'IT'      THEN 3
    END
  `).all() as { governance_function: string; pass: number; conditional: number; fail: number; needs_info: number }[]

  return rows.map(r => ({
    function:    r.governance_function,
    pass:        r.pass,
    conditional: r.conditional,
    fail:        r.fail,
    needs_info:  r.needs_info,
  }))
}

export function getFeatureCatalogText(): string {
  const db = getDb()
  const rows = db.prepare(`
    SELECT id, name, type, product, category, is_preview
    FROM features
    WHERE category != ''
    ORDER BY category, name
  `).all() as { id: string; name: string; type: string; product: string; category: string; is_preview: number }[]
  if (rows.length === 0) return ''
  return rows.map(r => {
    const parts = [r.category, r.name, r.product, r.type, r.is_preview ? 'preview' : '']
    return `[${r.id}] ${parts.join(' | ')}`
  }).join('\n')
}

export function applyFeatureCatalog(entries: CatalogEntry[]): { total: number } {
  const db = getDb()

  const existingIds = new Set(
    (db.prepare('SELECT id FROM features').all() as { id: string }[]).map(r => r.id),
  )

  const upsertFeature = db.prepare(`
    INSERT INTO features
      (id, name, type, product, version, risk_level, status, summary,
       icon_label, released_date, ms_owner, policy_pack, category, is_preview)
    VALUES
      (@id, @name, @type, @product, @version, @risk_level, @status, @summary,
       @icon_label, @released_date, @ms_owner, @policy_pack, @category, @is_preview)
    ON CONFLICT(id) DO UPDATE SET
      name       = excluded.name,
      type       = excluded.type,
      product    = excluded.product,
      category   = excluded.category,
      is_preview = excluded.is_preview
  `)

  const insertCheck = db.prepare(`
    INSERT OR IGNORE INTO policy_checks
      (id, feature_id, governance_function, title, status, finding, recommendation)
    VALUES
      (@id, @feature_id, @governance_function, @title, @status, @finding, @recommendation)
  `)

  const deleteEvidence = db.prepare(`
    DELETE FROM evidence WHERE check_id IN (SELECT id FROM policy_checks WHERE feature_id = ?)
  `)
  const deleteChecks  = db.prepare('DELETE FROM policy_checks WHERE feature_id = ?')
  const deleteFeature = db.prepare('DELETE FROM features WHERE id = ?')

  const riskForType: Record<string, string> = {
    Feature: 'Low-Medium',
    Agent:   'Medium-High',
    Tool:    'Variable',
    Model:   'Variable',
  }

  const catalogIds = new Set<string>()

  const syncAll = db.transaction(() => {
    for (const entry of entries) {
      const id = entry.id ?? slugifyId(entry.name)
      catalogIds.add(id)
      const isNew = !existingIds.has(id)

      const iconLabel = entry.name
        .split(/\s+/)
        .map(w => w[0] ?? '')
        .join('')
        .toUpperCase()
        .slice(0, 2)

      upsertFeature.run({
        id,
        name:         entry.name,
        type:         entry.type,
        product:      entry.vendor,
        version:      entry.preview ? 'Preview' : 'v1.0',
        risk_level:   riskForType[entry.type] ?? 'Variable',
        status:       'In Review',
        summary:      `${entry.name} is a ${entry.type.toLowerCase()} from ${entry.vendor}.${entry.preview ? ' This is a preview release.' : ''}`,
        icon_label:   iconLabel,
        released_date: new Date().toISOString().slice(0, 10),
        ms_owner:     entry.vendor,
        policy_pack:  'AccentureTEST AI Governance v4.1',
        category:     entry.category,
        is_preview:   entry.preview ? 1 : 0,
      })

      if (isNew) {
        for (const check of generateChecksForFeature(id, entry)) {
          insertCheck.run(check)
        }
      }
    }

    for (const existingId of existingIds) {
      if (!catalogIds.has(existingId)) {
        deleteEvidence.run(existingId)
        deleteChecks.run(existingId)
        deleteFeature.run(existingId)
      }
    }
  })

  syncAll()
  return { total: entries.length }
}

export function getSourcesText(): string {
  const db = getDb()
  const rows = db.prepare(
    'SELECT domain, vendor, notes FROM sources ORDER BY CASE vendor WHEN \'Microsoft\' THEN 0 ELSE 1 END, vendor, domain'
  ).all() as SourceEntry[]
  if (rows.length === 0) return ''
  return rows.map(r => `${r.domain} | ${r.vendor} | ${r.notes}`).join('\n')
}

export function applySources(entries: SourceEntry[]): { total: number } {
  const db = getDb()
  const sync = db.transaction(() => {
    db.exec('DELETE FROM sources')
    const insert = db.prepare(
      'INSERT INTO sources (domain, vendor, notes) VALUES (@domain, @vendor, @notes)'
    )
    for (const e of entries) insert.run(e)
  })
  sync()
  return { total: entries.length }
}

// ─── Policy library ──────────────────────────────────────────────────────────

function parseRule(row: Record<string, unknown>): CanonicalRule {
  const json = (f: string) => {
    try { return JSON.parse(row[f] as string) } catch { return [] }
  }
  return {
    id: row.id as string,
    title: row.title as string,
    function: row.function as CanonicalRule['function'],
    severity: row.severity as CanonicalRule['severity'],
    applies_to: json('applies_to'),
    intent: (row.intent as string | null) ?? null,
    check_question: (row.check_question as string | null) ?? null,
    required_evidence: (row.required_evidence as string | null) ?? null,
    pass_criteria: json('pass_criteria'),
    fail_criteria: json('fail_criteria'),
    unknown_criteria: json('unknown_criteria'),
    primary_sources: json('primary_sources'),
    search_keywords: json('search_keywords'),
    verdict_logic: (row.verdict_logic as string | null) ?? null,
    customer_profile_dependency: (row.customer_profile_dependency as string | null) ?? null,
    re_eval_trigger: (row.re_eval_trigger as string | null) ?? null,
    related_rules: json('related_rules'),
    raw_extra: (() => { try { return JSON.parse(row.raw_extra as string) } catch { return {} } })(),
    source_sheet: (row.source_sheet as string) ?? '',
    source_row: (row.source_row as number) ?? 0,
  }
}

export function getCurrentRules(): CanonicalRule[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM policy_rules WHERE archived_at IS NULL').all() as Record<string, unknown>[]
  return rows.map(parseRule)
}

export function getLatestPolicyVersion(): { id: number; version_label: string } | null {
  const db = getDb()
  return db.prepare('SELECT id, version_label FROM policy_versions ORDER BY id DESC LIMIT 1').get() as { id: number; version_label: string } | null
}

export function commitPolicyVersion(params: {
  versionLabel: string
  filename: string
  notes: string | null
  rulesToUpsert: CanonicalRule[]
  ruleIdsToArchive: string[]
}): number {
  const db = getDb()

  const insertVersion = db.prepare(`
    INSERT INTO policy_versions (version_label, source_filename, rule_count, notes)
    VALUES (@version_label, @source_filename, @rule_count, @notes)
  `)
  const upsertRule = db.prepare(`
    INSERT INTO policy_rules
      (id, title, function, severity, applies_to, intent, check_question, required_evidence,
       pass_criteria, fail_criteria, unknown_criteria, primary_sources, search_keywords,
       verdict_logic, customer_profile_dependency, re_eval_trigger, related_rules,
       raw_extra, source_sheet, source_row, updated_at)
    VALUES
      (@id, @title, @function, @severity, @applies_to, @intent, @check_question, @required_evidence,
       @pass_criteria, @fail_criteria, @unknown_criteria, @primary_sources, @search_keywords,
       @verdict_logic, @customer_profile_dependency, @re_eval_trigger, @related_rules,
       @raw_extra, @source_sheet, @source_row, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, function=excluded.function, severity=excluded.severity,
      applies_to=excluded.applies_to, intent=excluded.intent, check_question=excluded.check_question,
      required_evidence=excluded.required_evidence, pass_criteria=excluded.pass_criteria,
      fail_criteria=excluded.fail_criteria, unknown_criteria=excluded.unknown_criteria,
      primary_sources=excluded.primary_sources, search_keywords=excluded.search_keywords,
      verdict_logic=excluded.verdict_logic, customer_profile_dependency=excluded.customer_profile_dependency,
      re_eval_trigger=excluded.re_eval_trigger, related_rules=excluded.related_rules,
      raw_extra=excluded.raw_extra, source_sheet=excluded.source_sheet, source_row=excluded.source_row,
      archived_at=NULL, updated_at=datetime('now')
  `)
  const insertVersionRule = db.prepare(`
    INSERT OR REPLACE INTO policy_version_rules (version_id, rule_id, snapshot_json)
    VALUES (@version_id, @rule_id, @snapshot_json)
  `)
  const archiveRule = db.prepare(`
    UPDATE policy_rules SET archived_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ? AND archived_at IS NULL
  `)

  const ruleToRow = (r: CanonicalRule) => ({
    id: r.id, title: r.title, function: r.function, severity: r.severity,
    applies_to: JSON.stringify(r.applies_to), intent: r.intent,
    check_question: r.check_question, required_evidence: r.required_evidence,
    pass_criteria: JSON.stringify(r.pass_criteria), fail_criteria: JSON.stringify(r.fail_criteria),
    unknown_criteria: JSON.stringify(r.unknown_criteria), primary_sources: JSON.stringify(r.primary_sources),
    search_keywords: JSON.stringify(r.search_keywords), verdict_logic: r.verdict_logic,
    customer_profile_dependency: r.customer_profile_dependency, re_eval_trigger: r.re_eval_trigger,
    related_rules: JSON.stringify(r.related_rules), raw_extra: JSON.stringify(r.raw_extra),
    source_sheet: r.source_sheet, source_row: r.source_row,
  })

  let versionId = 0
  db.transaction(() => {
    const info = insertVersion.run({
      version_label: params.versionLabel,
      source_filename: params.filename,
      rule_count: params.rulesToUpsert.length,
      notes: params.notes,
    })
    versionId = Number(info.lastInsertRowid)

    for (const rule of params.rulesToUpsert) {
      upsertRule.run(ruleToRow(rule))
      insertVersionRule.run({ version_id: versionId, rule_id: rule.id, snapshot_json: JSON.stringify(rule) })
    }
    for (const id of params.ruleIdsToArchive) {
      archiveRule.run(id)
    }
    // update current_version_id for all upserted rules
    db.prepare('UPDATE policy_rules SET current_version_id = ? WHERE id IN (' +
      params.rulesToUpsert.map(() => '?').join(',') + ')')
      .run(versionId, ...params.rulesToUpsert.map(r => r.id))
  })()

  return versionId
}

export function getPolicyRuleCount(): number {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as n FROM policy_rules WHERE archived_at IS NULL').get() as { n: number }
  return row.n
}

export function getPolicyRule(id: string): CanonicalRule | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM policy_rules WHERE id = ? AND archived_at IS NULL').get(id) as Record<string, unknown> | undefined
  return row ? parseRule(row) : null
}

export function upsertSinglePolicyRule(rule: CanonicalRule): void {
  const db = getDb()
  const ruleToRow = (r: CanonicalRule) => ({
    id: r.id, title: r.title, function: r.function, severity: r.severity,
    applies_to: JSON.stringify(r.applies_to), intent: r.intent,
    check_question: r.check_question, required_evidence: r.required_evidence,
    pass_criteria: JSON.stringify(r.pass_criteria), fail_criteria: JSON.stringify(r.fail_criteria),
    unknown_criteria: JSON.stringify(r.unknown_criteria), primary_sources: JSON.stringify(r.primary_sources),
    search_keywords: JSON.stringify(r.search_keywords), verdict_logic: r.verdict_logic,
    customer_profile_dependency: r.customer_profile_dependency, re_eval_trigger: r.re_eval_trigger,
    related_rules: JSON.stringify(r.related_rules), raw_extra: JSON.stringify(r.raw_extra),
    source_sheet: r.source_sheet, source_row: r.source_row,
  })
  db.prepare(`
    INSERT INTO policy_rules
      (id, title, function, severity, applies_to, intent, check_question, required_evidence,
       pass_criteria, fail_criteria, unknown_criteria, primary_sources, search_keywords,
       verdict_logic, customer_profile_dependency, re_eval_trigger, related_rules,
       raw_extra, source_sheet, source_row, updated_at)
    VALUES
      (@id, @title, @function, @severity, @applies_to, @intent, @check_question, @required_evidence,
       @pass_criteria, @fail_criteria, @unknown_criteria, @primary_sources, @search_keywords,
       @verdict_logic, @customer_profile_dependency, @re_eval_trigger, @related_rules,
       @raw_extra, @source_sheet, @source_row, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, function=excluded.function, severity=excluded.severity,
      applies_to=excluded.applies_to, intent=excluded.intent, check_question=excluded.check_question,
      required_evidence=excluded.required_evidence, pass_criteria=excluded.pass_criteria,
      fail_criteria=excluded.fail_criteria, unknown_criteria=excluded.unknown_criteria,
      primary_sources=excluded.primary_sources, search_keywords=excluded.search_keywords,
      verdict_logic=excluded.verdict_logic, customer_profile_dependency=excluded.customer_profile_dependency,
      re_eval_trigger=excluded.re_eval_trigger, related_rules=excluded.related_rules,
      raw_extra=excluded.raw_extra, source_sheet=excluded.source_sheet, source_row=excluded.source_row,
      archived_at=NULL, updated_at=datetime('now')
  `).run(ruleToRow(rule))
}

export function archiveSinglePolicyRule(id: string): void {
  const db = getDb()
  db.prepare("UPDATE policy_rules SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(id)
}

export function upsertSingleFeature(entry: CatalogEntry): { id: string } {
  const db = getDb()
  const id = entry.id ?? slugifyId(entry.name)
  const existing = db.prepare('SELECT id FROM features WHERE id = ?').get(id) as { id: string } | undefined
  const isNew = !existing
  const iconLabel = entry.name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
  const riskForType: Record<string, string> = { Feature: 'Low-Medium', Agent: 'Medium-High', Tool: 'Variable', Model: 'Variable' }

  const upsert = db.prepare(`
    INSERT INTO features
      (id, name, type, product, version, risk_level, status, summary,
       icon_label, released_date, ms_owner, policy_pack, category, is_preview)
    VALUES
      (@id, @name, @type, @product, @version, @risk_level, @status, @summary,
       @icon_label, @released_date, @ms_owner, @policy_pack, @category, @is_preview)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, type=excluded.type, product=excluded.product,
      category=excluded.category, is_preview=excluded.is_preview
  `)
  const insertCheck = db.prepare(`
    INSERT OR IGNORE INTO policy_checks
      (id, feature_id, governance_function, title, status, finding, recommendation)
    VALUES (@id, @feature_id, @governance_function, @title, @status, @finding, @recommendation)
  `)

  db.transaction(() => {
    upsert.run({
      id, name: entry.name, type: entry.type, product: entry.vendor,
      version: entry.preview ? 'Preview' : 'v1.0',
      risk_level: riskForType[entry.type] ?? 'Variable',
      status: 'In Review',
      summary: `${entry.name} is a ${entry.type.toLowerCase()} from ${entry.vendor}.${entry.preview ? ' This is a preview release.' : ''}`,
      icon_label: iconLabel,
      released_date: new Date().toISOString().slice(0, 10),
      ms_owner: entry.vendor,
      policy_pack: 'AccentureTEST AI Governance v4.1',
      category: entry.category,
      is_preview: entry.preview ? 1 : 0,
    })
    if (isNew) {
      for (const check of generateChecksForFeature(id, entry)) insertCheck.run(check)
    }
  })()

  return { id }
}

export function deleteSource(domain: string): void {
  const db = getDb()
  db.prepare('DELETE FROM sources WHERE domain = ?').run(domain)
}
