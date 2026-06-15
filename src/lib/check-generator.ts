import type { CatalogEntry, CatalogEntryType } from './catalog-format'

interface GeneratedCheck {
  id: string
  feature_id: string
  governance_function: 'InfoSec' | 'Legal' | 'IT'
  title: string
  status: 'Pass' | 'Conditional' | 'Fail' | 'Needs Info'
  finding: string
  recommendation: string | null
}

type Fn = 'InfoSec' | 'Legal' | 'IT'
type Status = 'Pass' | 'Conditional' | 'Fail' | 'Needs Info'

function riskDefaults(type: CatalogEntryType, isThirdParty: boolean): {
  residency: Status; training: Status; auditLog: Status; dataScope: Status; itAdmin: Status
} {
  if (isThirdParty) {
    return { residency: 'Needs Info', training: 'Conditional', auditLog: 'Conditional', dataScope: 'Needs Info', itAdmin: 'Conditional' }
  }
  if (type === 'Agent') {
    return { residency: 'Pass', training: 'Pass', auditLog: 'Conditional', dataScope: 'Conditional', itAdmin: 'Conditional' }
  }
  if (type === 'Model') {
    return { residency: 'Conditional', training: 'Conditional', auditLog: 'Conditional', dataScope: 'Needs Info', itAdmin: 'Conditional' }
  }
  return { residency: 'Pass', training: 'Pass', auditLog: 'Pass', dataScope: 'Pass', itAdmin: 'Pass' }
}

export function generateChecksForFeature(featureId: string, entry: CatalogEntry): GeneratedCheck[] {
  const checks: GeneratedCheck[] = []
  const isThirdParty = !entry.vendor.toLowerCase().includes('microsoft') && !entry.vendor.toLowerCase().includes('azure')
  const r = riskDefaults(entry.type, isThirdParty)
  const n = entry.name
  const v = entry.vendor

  const c = (suffix: string, fn: Fn, title: string, status: Status, finding: string, rec: string | null): GeneratedCheck => ({
    id: `${featureId}-${fn.toLowerCase().replace(' ', '')}-${suffix}`,
    feature_id: featureId,
    governance_function: fn,
    title,
    status,
    finding,
    recommendation: rec,
  })

  // InfoSec
  checks.push(c('is-1', 'InfoSec', 'Data residency within tenant boundary',
    r.residency,
    r.residency === 'Pass'
      ? `${n} processes data within the AccentureTEST M365 tenant boundary. Data residency commitments are consistent with standard Microsoft 365 service terms.`
      : `Data residency for ${n} has not been confirmed. As a service from ${v}, processing jurisdiction requires formal documentation.`,
    r.residency !== 'Pass' ? `Obtain data processing jurisdiction confirmation from ${v} before production use.` : null,
  ))

  checks.push(c('is-2', 'InfoSec', 'Encryption at rest and in transit',
    'Pass',
    `Encryption standards (AES-256 at rest, TLS 1.2+ in transit) are confirmed at the platform level for ${n}. Meets AccentureTEST policy INFOSEC-003.`,
    null,
  ))

  checks.push(c('is-3', 'InfoSec', 'Audit logging and interaction retention',
    r.auditLog,
    r.auditLog === 'Pass'
      ? `Interaction log retention for ${n} is configurable via Microsoft Purview and has been set to meet AccentureTEST's 90-day minimum (SEC-009).`
      : `Default interaction log retention for ${n} may not meet AccentureTEST's 90-day minimum (SEC-009). Retention configuration has not been verified for this feature.`,
    r.auditLog !== 'Pass' ? 'Verify and configure audit log retention via Microsoft Purview before enabling.' : null,
  ))

  checks.push(c('is-4', 'InfoSec', 'Sub-processor disclosure documented',
    isThirdParty ? 'Needs Info' : 'Conditional',
    isThirdParty
      ? `Sub-processor disclosure for ${n} from ${v} has not been verified against AccentureTEST's DPA requirements.`
      : `Azure OpenAI Service is listed as a sub-processor in the Microsoft Online Services DPA, but feature-specific routing paths for ${n} are not enumerated.`,
    isThirdParty ? `Request sub-processor documentation from ${v} before production deployment.` : 'Monitor Microsoft DPA quarterly updates for granular routing documentation.',
  ))

  // Legal
  checks.push(c('lg-1', 'Legal', 'GDPR data subject rights supported',
    'Pass',
    `GDPR data subject rights (access, deletion, portability) for ${n} are covered by standard M365 compliance tooling. AccentureTEST DSR procedures apply without modification.`,
    null,
  ))

  checks.push(c('lg-2', 'Legal', 'Customer data excluded from model training',
    r.training,
    r.training === 'Pass'
      ? `Microsoft Product Terms confirm tenant data processed by ${n} is not used to train or improve foundation models. Commitment is contractually binding.`
      : `Training exclusion terms for ${v} have not been confirmed in writing. AccentureTEST requires an unconditional contractual exclusion before processing any tenant data.`,
    r.training !== 'Pass' ? `Obtain written training exclusion confirmation from ${v} before production use.` : null,
  ))

  checks.push(c('lg-3', 'Legal', 'EU AI Act transparency obligations',
    'Conditional',
    `EU AI Act Article 52 disclosure requirements for ${n} have not been formally assessed. AI-nature disclosure mechanisms in the user interface have not been verified as compliant.`,
    'Assess disclosure mechanisms against EU AI Act requirements and document compliance posture before GA enablement.',
  ))

  checks.push(c('lg-4', 'Legal', 'End-user informed consent mechanism',
    'Conditional',
    `A user consent or acknowledgement flow for ${n} has not been confirmed. AccentureTEST policy LEG-022 requires user acknowledgement before first use for tools with broad data access.`,
    'Confirm or implement a first-use acknowledgement experience before enabling for all users.',
  ))

  // IT
  checks.push(c('it-1', 'IT', 'Entra ID authentication enforced',
    'Pass',
    `${n} authenticates via Entra ID. SSO, MFA, and Conditional Access policies apply without exception. No alternative authentication paths identified.`,
    null,
  ))

  checks.push(c('it-2', 'IT', 'Conditional Access policy compatibility',
    'Pass',
    `${n} is compatible with the AccentureTEST Conditional Access baseline. Device compliance and sign-in risk policies apply without conflict.`,
    null,
  ))

  checks.push(c('it-3', 'IT', 'Microsoft Purview DLP coverage',
    'Conditional',
    `DLP policy coverage for ${n} interactions has not been verified. Real-time content inspection of user prompts may not be active, leaving a potential data-leakage gap.`,
    'Verify DLP coverage and enable Communication Compliance capture for AI interactions if required.',
  ))

  checks.push(c('it-4', 'IT', 'Admin deployment and scope controls',
    r.itAdmin,
    r.itAdmin === 'Pass'
      ? `Admin deployment controls for ${n} are available via the Microsoft 365 admin centre. Licence-based scoping supports phased rollout without elevated permissions.`
      : `Admin controls for scoping ${n} deployment have not been fully reviewed. It is unclear whether sufficient controls exist to limit enablement to specific user groups.`,
    r.itAdmin !== 'Pass' ? 'Review and document available admin controls before initiating any rollout.' : null,
  ))

  return checks
}
