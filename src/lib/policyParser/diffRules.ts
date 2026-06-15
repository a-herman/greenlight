import type { CanonicalRule, DiffAction, FieldChange } from './types'

// ── Levenshtein similarity ────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = temp
    }
  }
  return dp[n]
}

function similarity(a: string, b: string): number {
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return 1
  const maxLen = Math.max(la.length, lb.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(la, lb) / maxLen
}

// ── Field-level diffing ───────────────────────────────────────────────────────

const COMPARE_FIELDS: Array<keyof CanonicalRule> = [
  'title', 'function', 'severity', 'applies_to', 'intent', 'check_question',
  'required_evidence', 'pass_criteria', 'fail_criteria', 'unknown_criteria',
  'primary_sources', 'search_keywords', 'verdict_logic', 'customer_profile_dependency',
  're_eval_trigger', 'related_rules',
]

function fieldEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i])
  }
  return a === b
}

function computeChanges(oldRule: CanonicalRule, newRule: CanonicalRule): FieldChange[] {
  const changes: FieldChange[] = []
  for (const field of COMPARE_FIELDS) {
    const oldVal = oldRule[field]
    const newVal = newRule[field]
    if (!fieldEqual(oldVal, newVal)) {
      changes.push({ field, old: oldVal, next: newVal })
    }
  }
  return changes
}

// ── Main diff ─────────────────────────────────────────────────────────────────

export function diffRules(
  parsed: CanonicalRule[],
  current: CanonicalRule[],
  downstreamCounts: Record<string, number> = {},
): DiffAction[] {
  const currentById = new Map(current.map(r => [r.id, r]))
  const parsedById = new Map(parsed.map(r => [r.id, r]))

  const result: DiffAction[] = []
  const matchedCurrentIds = new Set<string>()

  for (const newRule of parsed) {
    // 1. Try exact ID match
    const byId = currentById.get(newRule.id)
    if (byId) {
      matchedCurrentIds.add(newRule.id)
      const changes = computeChanges(byId, newRule)
      result.push(changes.length > 0
        ? { action: 'UPDATED', rule: newRule, oldRule: byId, changes }
        : { action: 'UNCHANGED', rule: newRule }
      )
      continue
    }

    // 2. Fall back to title similarity match
    let bestMatch: CanonicalRule | null = null
    let bestScore = 0
    for (const cur of current) {
      if (matchedCurrentIds.has(cur.id)) continue
      const score = similarity(newRule.title, cur.title)
      if (score >= 0.85 && score > bestScore) {
        bestScore = score
        bestMatch = cur
      }
    }

    if (bestMatch) {
      matchedCurrentIds.add(bestMatch.id)
      const changes = computeChanges(bestMatch, newRule)
      result.push(changes.length > 0
        ? { action: 'UPDATED', rule: newRule, oldRule: bestMatch, changes }
        : { action: 'UNCHANGED', rule: newRule }
      )
    } else {
      result.push({ action: 'NEW', rule: newRule })
    }
  }

  // Rules in current DB not matched by parsed = REMOVED
  for (const cur of current) {
    if (!matchedCurrentIds.has(cur.id)) {
      result.push({
        action: 'REMOVED',
        rule: cur,
        downstreamCount: downstreamCounts[cur.id] ?? 0,
      })
    }
  }

  return result
}

export function suggestNextVersion(latest: string | null | undefined): string {
  if (!latest) return 'v1.0'
  const match = latest.match(/^v?(\d+)\.(\d+)$/)
  if (!match) return latest + '.1'
  return `v${match[1]}.${Number(match[2]) + 1}`
}
