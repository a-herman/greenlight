import type { FeatureDetail } from '@/types'

const REVIEWERS = [
  { initials: 'MC', name: 'Marcus Chen',   role: 'InfoSec reviewer',     color: 'bg-accent',    status: 'Pending'  as const },
  { initials: 'PS', name: 'Priya Sharma',  role: 'Legal & Privacy lead', color: 'bg-[#7C3AED]', status: 'Pending'  as const },
  { initials: 'JO', name: "James O'Brien", role: 'IT architecture',      color: 'bg-[#0891B2]', status: 'Approved' as const },
]

export default function AuditSidebar({ feature }: { feature: FeatureDetail }) {
  const timeline = buildTimeline(feature)

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">

      {/* Details */}
      <div className="p-6 border-b border-[#EEEEEE]">
        <SectionLabel>Details</SectionLabel>
        <div className="mt-3 space-y-2.5">
          {[
            ['Type',            feature.type],
            ['Released',        formatDate(feature.released_date)],
            ['Version',         feature.version],
            ['Microsoft owner', feature.ms_owner],
            ['Policy pack',     feature.policy_pack],
            ['Risk tier',       feature.risk_level],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-baseline gap-3">
              <span className="text-[12px] text-tertiary flex-shrink-0">{k}</span>
              <span className="text-[13px] text-ink font-medium text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviewers */}
      <div className="p-6 border-b border-[#EEEEEE]">
        <SectionLabel>Reviewers</SectionLabel>
        <div className="mt-3 space-y-3">
          {REVIEWERS.map(r => (
            <div key={r.initials} className="flex items-center gap-2.5">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 ${r.color}`}>
                {r.initials}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink">{r.name}</div>
                <div className="text-[11px] text-tertiary">{r.role}</div>
              </div>
              <span className={`text-[12px] font-medium flex-shrink-0 ${r.status === 'Approved' ? 'text-[#7B00CC]' : 'text-[#9333EA]'}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="p-6">
        <SectionLabel>Recent activity</SectionLabel>
        <div className="mt-3 space-y-4">
          {timeline.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 mt-[5px] ${item.dotClass}`} />
              <div>
                <div className="text-[13px] font-medium text-ink leading-snug">{item.title}</div>
                <div className="text-[11px] text-tertiary mt-0.5">{item.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-wider font-medium text-tertiary">{children}</div>
  )
}

function buildTimeline(f: FeatureDetail) {
  const items: { dotClass: string; title: string; meta: string }[] = []

  if (f.fail_count > 0 || f.needs_info_count > 0) {
    items.push({ dotClass: 'bg-danger', title: `${f.fail_count + f.needs_info_count} issue(s) escalated`, meta: 'Requires CIO team decision' })
  }
  if (f.conditional_count > 0) {
    items.push({ dotClass: 'bg-accent', title: `${f.conditional_count} conditional findings`, meta: 'Auto-assessed by governance engine' })
  }

  const { itPassed, itTotal } = f.checks.reduce(
    (acc, c) => c.governance_function === 'IT'
      ? { itTotal: acc.itTotal + 1, itPassed: acc.itPassed + (c.status === 'Pass' ? 1 : 0) }
      : acc,
    { itPassed: 0, itTotal: 0 }
  )
  items.push({ dotClass: 'bg-ok', title: "James O'Brien reviewed IT checks", meta: `${itPassed} of ${itTotal} passed` })

  const evCount = f.checks.reduce((n, c) => n + c.evidence.length, 0)
  items.push({ dotClass: 'bg-accent', title: 'Evidence pulled from Microsoft sources', meta: `${evCount} citations gathered` })
  items.push({ dotClass: 'bg-accent', title: 'Feature detected in Microsoft release notes', meta: `${f.name} · ${f.version}` })

  return items
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
