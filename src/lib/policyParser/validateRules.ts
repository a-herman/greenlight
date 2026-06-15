import type { CanonicalRule, ValidationIssue } from './types'

export function validateRules(rules: CanonicalRule[], severityWarnings: Array<{ ruleId: string; raw: string }>): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (rules.length === 0) {
    issues.push({ level: 'error', message: 'No parseable rule rows were detected in the uploaded file.' })
    return issues
  }

  // Duplicate IDs
  const idCounts = new Map<string, number>()
  for (const rule of rules) {
    idCounts.set(rule.id, (idCounts.get(rule.id) ?? 0) + 1)
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({ level: 'warning', ruleId: id, message: `Duplicate ID "${id}" appears ${count} times — first occurrence used.` })
    }
  }

  // Missing required fields
  for (const rule of rules) {
    if (!rule.title) {
      issues.push({ level: 'warning', ruleId: rule.id, message: `Rule ${rule.id}: title is missing; generated from intent or check question.` })
    }
    if (rule.pass_criteria.length === 0 && rule.fail_criteria.length === 0) {
      issues.push({ level: 'warning', ruleId: rule.id, message: `Rule ${rule.id} (${rule.title.slice(0, 40)}): no pass or fail criteria detected.` })
    }
  }

  // Severity guesses
  for (const { ruleId, raw } of severityWarnings) {
    issues.push({ level: 'warning', ruleId, message: `Rule ${ruleId}: severity "${raw}" not recognized — defaulted to M (Medium).` })
  }

  return issues
}
