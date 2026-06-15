import type { ColumnMapping } from './types'

// Canonical field names
const CANONICAL = new Set([
  'id', 'title', 'function', 'severity', 'applies_to', 'intent', 'check_question',
  'required_evidence', 'pass_criteria', 'fail_criteria', 'unknown_criteria',
  'primary_sources', 'search_keywords', 'verdict_logic', 'customer_profile_dependency',
  're_eval_trigger', 'related_rules',
])

const SYNONYMS: Record<string, string> = {
  // severity
  'risk level': 'severity', 'risk': 'severity', 'priority': 'severity',
  'criticality': 'severity', 'impact': 'severity', 'risk rating': 'severity',

  // title
  'name': 'title', 'rule': 'title', 'control': 'title', 'rule name': 'title',
  'control name': 'title', 'policy': 'title', 'requirement': 'title',
  'check name': 'title', 'control title': 'title',

  // function / category
  'function': 'function', 'category': 'function', 'domain': 'function',
  'area': 'function', 'governance area': 'function', 'pillar': 'function',

  // applies_to
  'applies to': 'applies_to', 'scope': 'applies_to', 'applicable to': 'applies_to',
  'target': 'applies_to', 'feature types': 'applies_to',

  // intent
  'description': 'intent', 'objective': 'intent', 'purpose': 'intent',
  'rationale': 'intent', 'goal': 'intent',

  // check_question
  'check question': 'check_question', 'audit question': 'check_question',
  'assessment question': 'check_question', 'question': 'check_question',
  'evaluation question': 'check_question',

  // required_evidence
  'required evidence': 'required_evidence', 'evidence required': 'required_evidence',
  'evidence': 'required_evidence', 'documentation': 'required_evidence',
  'proof': 'required_evidence',

  // criteria variants
  'pass criteria': 'pass_criteria', 'pass condition': 'pass_criteria',
  'passing criteria': 'pass_criteria', 'success criteria': 'pass_criteria',
  'fail criteria': 'fail_criteria', 'fail condition': 'fail_criteria',
  'failure criteria': 'fail_criteria', 'failure conditions': 'fail_criteria',
  'unknown criteria': 'unknown_criteria', 'inconclusive criteria': 'unknown_criteria',
  'unclear criteria': 'unknown_criteria',

  // primary_sources
  'primary sources': 'primary_sources', 'sources': 'primary_sources',
  'references': 'primary_sources', 'source urls': 'primary_sources',
  'documentation links': 'primary_sources', 'source links': 'primary_sources',

  // search_keywords
  'search keywords': 'search_keywords', 'keywords': 'search_keywords',
  'search terms': 'search_keywords', 'tags': 'search_keywords',

  // verdict_logic
  'verdict logic': 'verdict_logic', 'verdict': 'verdict_logic',
  'scoring': 'verdict_logic', 'logic': 'verdict_logic',

  // customer_profile_dependency
  'customer profile dependency': 'customer_profile_dependency',
  'customer profile': 'customer_profile_dependency',
  'profile dependency': 'customer_profile_dependency',
  'tenant type': 'customer_profile_dependency',
  'customer dependency': 'customer_profile_dependency',

  // re_eval_trigger
  're-eval trigger': 're_eval_trigger', 'reeval trigger': 're_eval_trigger',
  're-evaluation trigger': 're_eval_trigger', 'review trigger': 're_eval_trigger',
  'trigger': 're_eval_trigger', 're-evaluate when': 're_eval_trigger',

  // related_rules
  'related rules': 'related_rules', 'related': 'related_rules',
  'cross-references': 'related_rules', 'see also': 'related_rules',
  'related controls': 'related_rules', 'cross references': 'related_rules',
}

export function mapColumns(headers: string[]): ColumnMapping {
  const headerToField: Record<string, string> = {}
  const unmapped: string[] = []

  for (const rawHeader of headers) {
    const h = rawHeader.trim()
    if (!h) continue
    const lower = h.toLowerCase()

    if (CANONICAL.has(lower)) {
      headerToField[h] = lower
    } else if (SYNONYMS[lower]) {
      headerToField[h] = SYNONYMS[lower]
    } else {
      // Keyword inference: check if any canonical field keyword appears in header
      const inferred = inferByKeyword(lower)
      if (inferred) {
        headerToField[h] = inferred
      } else {
        unmapped.push(h)
      }
    }
  }

  return { headerToField, unmapped }
}

function inferByKeyword(lower: string): string | null {
  if (/\bseverity\b/.test(lower)) return 'severity'
  if (/\brisk\b/.test(lower)) return 'severity'
  if (/\btitle\b/.test(lower)) return 'title'
  if (/\bintent\b/.test(lower)) return 'intent'
  if (/\bpass\b/.test(lower) && /\bcriter/.test(lower)) return 'pass_criteria'
  if (/\bfail\b/.test(lower) && /\bcriter/.test(lower)) return 'fail_criteria'
  if (/\bunknown\b/.test(lower) && /\bcriter/.test(lower)) return 'unknown_criteria'
  if (/\bkeyword/.test(lower)) return 'search_keywords'
  if (/\bsource/.test(lower)) return 'primary_sources'
  if (/\bverdict\b/.test(lower)) return 'verdict_logic'
  if (/\bprofile\b/.test(lower)) return 'customer_profile_dependency'
  if (/\btrigger\b/.test(lower)) return 're_eval_trigger'
  if (/\brelated\b/.test(lower)) return 'related_rules'
  return null
}
