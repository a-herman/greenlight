'use client'
import { useState, useMemo } from 'react'
import type { PolicyCheck, GovernanceFunction } from '@/types'
import { STATUS_DOT } from '@/lib/status'
import StatusPill from '@/components/ui/StatusPill'

const TABS: { id: GovernanceFunction; label: string }[] = [
  { id: 'InfoSec', label: 'InfoSec' },
  { id: 'Legal',   label: 'Legal & Privacy' },
  { id: 'IT',      label: 'IT & Architecture' },
]

const EVIDENCE_BG: Record<string, string> = {
  Fail:         'border border-[#FF52A0] bg-[#FFE4F0]',
  Conditional:  'border border-[#D5A6FF] bg-[#F5EDFF]',
  'Needs Info': 'border border-[#93C5FD] bg-[#DBEAFE]',
}

const EVIDENCE_LABEL: Record<string, string> = {
  Pass:         'Cited evidence',
  'Needs Info': 'Missing content',
  Fail:         'Control failure',
}

export default function PolicyChecksPanel({ checks }: { checks: PolicyCheck[] }) {
  const [active, setActive] = useState<GovernanceFunction>('InfoSec')

  const byFn = useMemo(() => {
    const map: Record<GovernanceFunction, PolicyCheck[]> = { InfoSec: [], Legal: [], IT: [] }
    for (const c of checks) map[c.governance_function].push(c)
    return map
  }, [checks])

  const activeChecks = byFn[active]

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Tabs */}
      <div className="flex gap-8 border-b border-[#EEEEEE] px-6">
        {TABS.map(tab => {
          const tabChecks = byFn[tab.id]
          const issues    = tabChecks.filter(c => c.status !== 'Pass').length
          const isActive  = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`py-4 text-[14px] font-medium transition-colors border-b-[2px] -mb-px ${
                isActive
                  ? 'text-accent border-accent'
                  : 'text-secondary border-transparent hover:text-ink'
              }`}
            >
              {tab.label}
              {issues > 0 && (
                <span className={`ml-2 text-[12px] font-normal ${isActive ? 'text-accent' : 'text-tertiary'}`}>
                  {issues} flagged
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Check items */}
      <div className="divide-y divide-[#EEEEEE]">
        {activeChecks.map(check => (
          <CheckItem key={check.id} check={check} />
        ))}
        {activeChecks.length === 0 && (
          <p className="text-[14px] text-tertiary p-6">No checks for this function.</p>
        )}
      </div>
    </div>
  )
}

function CheckItem({ check }: { check: PolicyCheck }) {
  const dot          = STATUS_DOT[check.status] ?? 'bg-tertiary'
  const evidenceBg   = EVIDENCE_BG[check.status] ?? 'border border-[#EEEEEE] bg-[#FAFAFA]'
  const evidenceLabel = EVIDENCE_LABEL[check.status] ?? 'Policy gap'

  return (
    <div className="px-6 py-6">
      {/* Title + badge */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 mt-[7px] ${dot}`} />
          <h3 className="text-[15px] font-semibold text-ink leading-snug">{check.title}</h3>
        </div>
        <StatusPill status={check.status} />
      </div>

      {/* Finding */}
      <p className="text-[14px] text-secondary leading-relaxed ml-[19px] mb-4">{check.finding}</p>

      {/* Evidence */}
      {check.evidence.length > 0 && (
        <div className={`ml-[19px] rounded-lg p-4 mb-3 ${evidenceBg}`}>
          <div className="text-[11px] uppercase tracking-wider font-medium text-tertiary mb-2.5">
            {evidenceLabel}
          </div>
          {check.evidence.map(ev => (
            <p key={ev.id} className="text-[13px] text-secondary leading-relaxed mb-1.5 last:mb-0">
              {ev.excerpt}{' '}
              <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                [{ev.source_title}]
              </a>
            </p>
          ))}
        </div>
      )}

      {/* Recommendation */}
      {check.recommendation && (
        <div className="ml-[19px] text-[13px] text-secondary leading-relaxed">
          <span className="font-semibold text-ink">Recommendation </span>
          {check.recommendation}
        </div>
      )}
    </div>
  )
}
