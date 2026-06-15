import { getPolicyRuleCount, getLatestPolicyVersion } from '@/lib/db'
import ImportFlow from './ImportFlow'

export default function ImportPolicyPage() {
  const ruleCount = getPolicyRuleCount()
  const latest = getLatestPolicyVersion()
  return <ImportFlow ruleCount={ruleCount} latestVersion={latest?.version_label ?? null} />
}
