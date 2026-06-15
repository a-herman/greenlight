import type { FeatureStatus, CheckStatus } from '@/types'

type Status = FeatureStatus | CheckStatus

const BADGE: Record<string, string> = {
  Approved:    'bg-[#F5EDFF] text-[#7B00CC]',
  Conditional: 'bg-[#F5EDFF] text-[#9333EA]',
  Held:        'bg-[#FFE4F0] text-[#BE185D]',
  'In Review': 'bg-[#DBEAFE] text-[#1D4ED8]',
  Pass:        'bg-[#F5EDFF] text-[#7B00CC]',
  Fail:        'bg-[#FFE4F0] text-[#BE185D]',
  'Needs Info':'bg-[#DBEAFE] text-[#1D4ED8]',
}

export default function StatusPill({ status, size = 'sm' }: { status: Status; size?: 'sm' | 'lg' }) {
  const cls = BADGE[status] ?? 'bg-[#F5F5F5] text-secondary'
  return (
    <span className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${
      size === 'lg' ? 'text-[13px] px-3 py-[5px]' : 'text-[12px] px-2.5 py-1'
    } ${cls}`}>
      {status}
    </span>
  )
}
