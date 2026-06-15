import type { WorkBook } from 'xlsx'
import type { SheetClassification, SheetRole, RuleFunction } from './types'
import * as XLSX from 'xlsx'

// Keyword → function score boosts
const FN_KEYWORDS: Array<[RegExp, RuleFunction, number]> = [
  [/infosec|info.?sec|information.?security|cyber|security|sec\b/i, 'INFOSEC', 3],
  [/\bIT\b|tech(nology)?|architecture|arch\b|infrastructure|technical/i, 'IT', 2],
  [/legal|privacy|compliance|regulatory|\bLP\b|gdpr|data.?protect/i, 'LEGAL', 3],
]

const META_PATTERN = /readme|read.me|overview|verdict|taxonomy|feature|instruction|guide|legend|key\b|notes/i

const RULE_HEADER_SIGNALS = new Set([
  'id', 'title', 'name', 'rule', 'control', 'severity', 'risk', 'intent',
  'check', 'criteria', 'applies', 'source', 'keyword', 'verdict', 'evidence',
])

function scoreSheetName(name: string): Partial<Record<RuleFunction, number>> {
  const scores: Partial<Record<RuleFunction, number>> = {}
  for (const [re, fn, weight] of FN_KEYWORDS) {
    if (re.test(name)) scores[fn] = (scores[fn] ?? 0) + weight
  }
  return scores
}

function hasRuleHeaders(headers: string[]): boolean {
  const matches = headers.filter(h =>
    RULE_HEADER_SIGNALS.has(h.toLowerCase().split(/[\s/]/)[0])
  )
  return matches.length >= 3
}

function detectFunctionFromHeaders(headers: string[]): RuleFunction | null {
  const joined = headers.join(' ').toLowerCase()
  const scores: Partial<Record<RuleFunction, number>> = {}
  for (const [re, fn, weight] of FN_KEYWORDS) {
    if (re.test(joined)) scores[fn] = (scores[fn] ?? 0) + weight
  }
  const best = Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number))[0]
  return best ? (best[0] as RuleFunction) : null
}

export function detectStructure(wb: WorkBook): SheetClassification[] {
  return wb.SheetNames.map(name => {
    // Metadata sheets
    if (META_PATTERN.test(name)) {
      return { sheetName: name, role: 'META' as SheetRole, confidence: 0.9, ruleCount: 0, unmappedColumns: [] }
    }

    const ws = wb.Sheets[name]
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
    if (rawRows.length < 2) {
      return { sheetName: name, role: 'UNKNOWN' as SheetRole, confidence: 0, ruleCount: 0, unmappedColumns: [] }
    }

    const headers = (rawRows[0] ?? []).map(h => String(h).trim()).filter(Boolean)
    if (!hasRuleHeaders(headers)) {
      return { sheetName: name, role: 'META' as SheetRole, confidence: 0.5, ruleCount: 0, unmappedColumns: [] }
    }

    // Score by name
    const nameScores = scoreSheetName(name)

    // Score by header content (for combined-sheet detection)
    const headerFn = detectFunctionFromHeaders(headers)

    // Pick best function
    const best = (Object.entries(nameScores) as [RuleFunction, number][])
      .sort((a, b) => b[1] - a[1])[0]

    let role: SheetRole
    let confidence: number
    if (best && best[1] > 0) {
      role = best[0]
      confidence = Math.min(best[1] / 4, 1)
    } else if (headerFn) {
      role = headerFn
      confidence = 0.4
    } else {
      role = 'OTHER'
      confidence = 0.2
    }

    return {
      sheetName: name,
      role,
      confidence,
      ruleCount: rawRows.length - 1,
      unmappedColumns: [],
    }
  })
}
