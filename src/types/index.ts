export type RiskLevel =
  | 'Low'
  | 'Low-Medium'
  | 'Medium'
  | 'Medium-High'
  | 'High'
  | 'Variable'
  | 'New category'

export type FeatureStatus = 'Approved' | 'Conditional' | 'Held' | 'In Review'

export type GovernanceFunction = 'InfoSec' | 'Legal' | 'IT'

export type CheckStatus = 'Pass' | 'Conditional' | 'Fail' | 'Needs Info'

export type FeatureType = 'Feature' | 'Agent' | 'Tool'

export interface Evidence {
  id: string
  check_id: string
  source_title: string
  source_url: string
  excerpt: string
  accessed_date: string
}

export interface PolicyCheck {
  id: string
  feature_id: string
  governance_function: GovernanceFunction
  title: string
  status: CheckStatus
  finding: string
  recommendation: string | null
  evidence: Evidence[]
}

export interface FeatureSummary {
  id: string
  name: string
  type: FeatureType
  product: string
  version: string
  risk_level: RiskLevel
  status: FeatureStatus
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
  flagged_functions: string  // comma-separated GovernanceFunction values
  infosec_pass: number
  infosec_total: number
  legal_pass: number
  legal_total: number
  it_pass: number
  it_total: number
}

export interface FeatureDetail extends Omit<FeatureSummary, 'flagged_functions'> {
  checks: PolicyCheck[]
}

export interface CheckStat {
  function: string
  pass: number
  conditional: number
  fail: number
  needs_info: number
}
