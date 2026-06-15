import type { RiskLevel } from '@/types'

export default function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className="text-[13px] text-secondary">{level}</span>
}
