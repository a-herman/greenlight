export type RuleFunction = 'INFOSEC' | 'IT' | 'LEGAL' | 'OTHER'
export type RuleSeverity = 'H' | 'M' | 'L'
export type SheetRole = RuleFunction | 'META' | 'UNKNOWN'

export interface CanonicalRule {
  id: string
  title: string
  function: RuleFunction
  severity: RuleSeverity
  applies_to: string[]
  intent: string | null
  check_question: string | null
  required_evidence: string | null
  pass_criteria: string[]
  fail_criteria: string[]
  unknown_criteria: string[]
  primary_sources: string[]
  search_keywords: string[]
  verdict_logic: string | null
  customer_profile_dependency: string | null
  re_eval_trigger: string | null
  related_rules: string[]
  raw_extra: Record<string, unknown>
  source_sheet: string
  source_row: number
}

export interface SheetClassification {
  sheetName: string
  role: SheetRole
  confidence: number
  ruleCount: number
  unmappedColumns: string[]
}

export interface ColumnMapping {
  headerToField: Record<string, string>
  unmapped: string[]
}

export interface ValidationIssue {
  level: 'error' | 'warning'
  ruleId?: string
  message: string
}

export interface FieldChange {
  field: string
  old: unknown
  next: unknown
}

export interface DiffAction {
  action: 'NEW' | 'UPDATED' | 'UNCHANGED' | 'REMOVED'
  rule: CanonicalRule
  oldRule?: CanonicalRule
  changes?: FieldChange[]
  downstreamCount?: number
}

export interface ParsedFile {
  filename: string
  sheets: SheetClassification[]
  rules: CanonicalRule[]
  validation: ValidationIssue[]
  diff: DiffAction[]
  nextVersion: string
}
