import * as XLSX from 'xlsx'
import { detectStructure } from './detectStructure'
import { mapColumns } from './mapColumns'
import { normalizeRows } from './normalizeRule'
import { validateRules } from './validateRules'
import { diffRules, suggestNextVersion } from './diffRules'
import type { CanonicalRule, ParsedFile, SheetClassification } from './types'

export type { CanonicalRule, ParsedFile, SheetClassification }
export type { RuleFunction, RuleSeverity, DiffAction, ValidationIssue, FieldChange } from './types'
export { suggestNextVersion }

export function parseXlsxBuffer(
  buffer: Buffer,
  filename: string,
  currentRules: CanonicalRule[],
  downstreamCounts: Record<string, number> = {},
): ParsedFile {
  const wb = XLSX.read(buffer, { type: 'buffer' })

  const sheets: SheetClassification[] = detectStructure(wb)
  const allRules: CanonicalRule[] = []
  const allSeverityWarnings: Array<{ ruleId: string; raw: string }> = []

  for (const sheet of sheets) {
    if (sheet.role === 'META' || sheet.role === 'UNKNOWN') continue

    const ws = wb.Sheets[sheet.sheetName]
    if (!ws) continue
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]
    if (rawRows.length < 2) continue

    const headers = (rawRows[0] as unknown[]).map(h => String(h).trim())
    const mapping = mapColumns(headers)
    sheet.unmappedColumns = mapping.unmapped

    const { rules, severityWarnings } = normalizeRows(rawRows, mapping, sheet)
    sheet.ruleCount = rules.length
    allRules.push(...rules)
    allSeverityWarnings.push(...severityWarnings)
  }

  const validation = validateRules(allRules, allSeverityWarnings)
  const diff = diffRules(allRules, currentRules, downstreamCounts)

  // Suggest next version from latest in DB (passed via currentRules metadata)
  const nextVersion = suggestNextVersion(null) // caller can override

  return { filename, sheets, rules: allRules, validation, diff, nextVersion }
}
