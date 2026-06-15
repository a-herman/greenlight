import type { CanonicalRule, ColumnMapping, SheetClassification, RuleFunction, RuleSeverity } from './types'

// ── Severity normalization ────────────────────────────────────────────────────
const SEVERITY_MAP: Record<string, RuleSeverity> = {
  h: 'H', high: 'H', critical: 'H', '1': 'H', red: 'H', p1: 'H', 'p-1': 'H',
  m: 'M', medium: 'M', moderate: 'M', '2': 'M', yellow: 'M', p2: 'M', 'p-2': 'M',
  l: 'L', low: 'L', minor: 'L', '3': 'L', green: 'L', p3: 'L', 'p-3': 'L',
}

function normalizeSeverity(raw: string): { value: RuleSeverity; guessed: boolean } {
  const key = raw.trim().toLowerCase()
  if (SEVERITY_MAP[key]) return { value: SEVERITY_MAP[key], guessed: false }
  // Try first char
  const first = key[0]
  if (first && SEVERITY_MAP[first]) return { value: SEVERITY_MAP[first], guessed: true }
  return { value: 'M', guessed: true }
}

// ── Multi-value splitting ─────────────────────────────────────────────────────

// For bullet-listed criteria fields (split on newlines, strip bullet chars)
function splitBulletList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map(s => s.replace(/^[\s•·\-*]+/, '').trim())
    .filter(s => s.length > 2)
}

// For delimited list fields (applies_to, keywords, sources, related_rules)
function splitDelimited(value: string): string[] {
  return value
    .split(/[·•;\n]/)
    .flatMap(s => (s.includes(',') && s.length < 200 ? s.split(',') : [s]))
    .map(s => s.replace(/^[\s\-*•]+/, '').trim())
    .filter(Boolean)
}

// ── ID generation ─────────────────────────────────────────────────────────────
const FN_PREFIX: Record<RuleFunction, string> = {
  INFOSEC: 'INF', IT: 'IT', LEGAL: 'LP', OTHER: 'OT',
}

function generateId(fn: RuleFunction, seq: number): string {
  return `${FN_PREFIX[fn]}-${String(seq).padStart(3, '0')}`
}

function normalizeId(raw: string): string {
  return raw.trim().replace(/\s+/g, '-').toUpperCase()
}

// ── Function inference from sheet role ────────────────────────────────────────
function sheetRoleToFunction(role: SheetClassification['role']): RuleFunction {
  if (role === 'INFOSEC' || role === 'IT' || role === 'LEGAL' || role === 'OTHER') return role
  return 'OTHER'
}

// ── Cell value to string ──────────────────────────────────────────────────────
function cellStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

// ── Main normalization ────────────────────────────────────────────────────────

export type SeverityWarning = { ruleId: string; raw: string }

export function normalizeRows(
  rawRows: unknown[][],
  mapping: ColumnMapping,
  sheet: SheetClassification,
): { rules: CanonicalRule[]; severityWarnings: SeverityWarning[] } {
  const headers = (rawRows[0] ?? []).map(h => String(h).trim())
  const fn = sheetRoleToFunction(sheet.role)
  const seqCounts = { INFOSEC: 0, IT: 0, LEGAL: 0, OTHER: 0 }
  const usedIds = new Set<string>()
  const rules: CanonicalRule[] = []
  const severityWarnings: SeverityWarning[] = []

  for (let rowIdx = 1; rowIdx < rawRows.length; rowIdx++) {
    const row = rawRows[rowIdx] as unknown[]
    if (row.every(c => !cellStr(c))) continue // blank row

    // Build field map from this row
    const fields: Record<string, string> = {}
    const rawExtra: Record<string, unknown> = {}

    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
      const header = headers[colIdx]
      const canonical = mapping.headerToField[header]
      const value = cellStr(row[colIdx])
      if (canonical) {
        // Merge into existing if already set (handles duplicate mapped columns)
        if (!fields[canonical]) fields[canonical] = value
      } else if (header) {
        rawExtra[header] = row[colIdx]
      }
    }

    // Title: required
    const title = fields['title'] ?? ''
    const intent = fields['intent'] ?? null

    const effectiveTitle = title ||
      (intent ? intent.slice(0, 80) : null) ||
      (fields['check_question'] ? fields['check_question'].slice(0, 80) : null)

    if (!effectiveTitle) continue // skip rows with no discernible title

    // ID
    let ruleId = fields['id'] ? normalizeId(fields['id']) : ''
    if (!ruleId) {
      seqCounts[fn]++
      ruleId = generateId(fn, seqCounts[fn])
    }
    // Deduplicate
    if (usedIds.has(ruleId)) {
      seqCounts[fn]++
      ruleId = generateId(fn, seqCounts[fn])
    }
    usedIds.add(ruleId)

    // Severity
    const severityRaw = fields['severity'] ?? ''
    const { value: severity, guessed } = normalizeSeverity(severityRaw)
    if (guessed && severityRaw) {
      severityWarnings.push({ ruleId, raw: severityRaw })
    }

    // Function: prefer explicit function column, else sheet role
    let ruleFn: RuleFunction = fn
    if (fields['function']) {
      const fLower = fields['function'].toLowerCase()
      if (/infosec|security|sec\b/.test(fLower)) ruleFn = 'INFOSEC'
      else if (/\bit\b|tech|arch/.test(fLower)) ruleFn = 'IT'
      else if (/legal|privacy|compli/.test(fLower)) ruleFn = 'LEGAL'
    }

    rules.push({
      id: ruleId,
      title: effectiveTitle,
      function: ruleFn,
      severity,
      applies_to: splitDelimited(fields['applies_to'] ?? ''),
      intent: intent || null,
      check_question: fields['check_question'] || null,
      required_evidence: fields['required_evidence'] || null,
      pass_criteria: splitBulletList(fields['pass_criteria'] ?? ''),
      fail_criteria: splitBulletList(fields['fail_criteria'] ?? ''),
      unknown_criteria: splitBulletList(fields['unknown_criteria'] ?? ''),
      primary_sources: splitDelimited(fields['primary_sources'] ?? ''),
      search_keywords: splitDelimited(fields['search_keywords'] ?? ''),
      verdict_logic: fields['verdict_logic'] || null,
      customer_profile_dependency: fields['customer_profile_dependency'] || null,
      re_eval_trigger: fields['re_eval_trigger'] || null,
      related_rules: splitDelimited(fields['related_rules'] ?? ''),
      raw_extra: rawExtra,
      source_sheet: sheet.sheetName,
      source_row: rowIdx,
    })
  }

  return { rules, severityWarnings }
}
