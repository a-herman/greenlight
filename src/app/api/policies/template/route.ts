import * as XLSX from 'xlsx'
import { getCurrentRules } from '@/lib/db'

const HEADERS = [
  'ID', 'Title', 'Severity', 'Applies To', 'Intent', 'Check Question',
  'Required Evidence', 'Primary Sources', 'Search Keywords',
  'Pass Criteria', 'Fail Criteria', 'Unknown Criteria',
  'Verdict Logic', 'Customer Profile Dependency', 'Re-eval Trigger', 'Related Rules',
]

export async function GET() {
  const rules = getCurrentRules()

  const rows = rules.map(r => [
    r.id, r.title, r.severity,
    r.applies_to.join(' · '),
    r.intent ?? '',
    r.check_question ?? '',
    r.required_evidence ?? '',
    r.primary_sources.join(' · '),
    r.search_keywords.join('; '),
    r.pass_criteria.map(c => `• ${c}`).join('\n'),
    r.fail_criteria.map(c => `• ${c}`).join('\n'),
    r.unknown_criteria.map(c => `• ${c}`).join('\n'),
    r.verdict_logic ?? '',
    r.customer_profile_dependency ?? '',
    r.re_eval_trigger ?? '',
    r.related_rules.join('; '),
  ])

  // Group by function into separate sheets
  const byFn = new Map<string, typeof rows>()
  for (let i = 0; i < rules.length; i++) {
    const fn = rules[i].function
    const list = byFn.get(fn) ?? []
    list.push(rows[i])
    byFn.set(fn, list)
  }

  const wb = XLSX.utils.book_new()
  for (const [fn, fnRows] of byFn) {
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...fnRows])
    // Column widths
    ws['!cols'] = HEADERS.map((_, i) => ({ wch: [6, 40, 10, 30, 60, 60, 60, 60, 60, 80, 80, 80, 80, 40, 60, 30][i] ?? 20 }))
    XLSX.utils.book_append_sheet(wb, ws, fn)
  }

  if (wb.SheetNames.length === 0) {
    // Empty library — create a template sheet
    const ws = XLSX.utils.aoa_to_sheet([HEADERS])
    XLSX.utils.book_append_sheet(wb, ws, 'INFOSEC')
  }

  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  return new Response(new Uint8Array(xlsxBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="greenlight-policy-template.xlsx"',
    },
  })
}
