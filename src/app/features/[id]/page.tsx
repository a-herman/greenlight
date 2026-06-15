import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFeatureById } from '@/lib/db'
import StatusPill from '@/components/ui/StatusPill'
import FeatureIcon from '@/components/ui/FeatureIcon'
import PolicyChecksPanel from '@/components/audit/PolicyChecksPanel'
import AuditSidebar from '@/components/audit/AuditSidebar'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FeatureAuditPage({ params }: Props) {
  const { id }   = await params
  const feature  = getFeatureById(id)
  if (!feature) notFound()

  const flaggedCount = feature.fail_count + feature.conditional_count + feature.needs_info_count

  const fnStats = (['InfoSec', 'Legal', 'IT'] as const).map(fn => {
    const fnChecks = feature.checks.filter(c => c.governance_function === fn)
    return {
      fn,
      total:       fnChecks.length,
      pass:        fnChecks.filter(c => c.status === 'Pass').length,
      conditional: fnChecks.filter(c => c.status === 'Conditional').length,
      fail:        fnChecks.filter(c => c.status === 'Fail').length,
      needs_info:  fnChecks.filter(c => c.status === 'Needs Info').length,
    }
  })

  return (
    <div className="max-w-[1320px] mx-auto px-12 py-10">

      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline mb-8">
        ← Approval queue
      </Link>

      {/* Feature header — transparent on page bg */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-5">
          <FeatureIcon label={feature.icon_label} type={feature.type} size="lg" />
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-[28px] font-semibold text-ink leading-tight">{feature.name}</h1>
              <span className="text-[11px] font-semibold text-accent bg-accent-soft px-2.5 py-1 rounded-full uppercase tracking-wide">
                {feature.type}
              </span>
            </div>
            <div className="text-[15px] text-secondary">{feature.product} · {feature.version} · {feature.ms_owner}</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 pt-1 flex-shrink-0">
          <StatusPill status={feature.status} size="lg" />
          <span className="text-[12px] text-tertiary">
            {feature.pass_count} of {feature.total_checks} checks passed
            {flaggedCount > 0 && <span className="text-[#BE185D]"> · {flaggedCount} flagged</span>}
          </span>
        </div>
      </div>

      {/* Summary text */}
      <p className="text-[15px] text-secondary leading-relaxed mb-8 max-w-3xl">{feature.summary}</p>

      {/* Actions */}
      <div className="flex items-center gap-6 mb-10">
        <button className="bg-accent text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-dark transition-colors shadow-[0_1px_3px_rgba(161,0,255,0.3)]">
          Approve for activation
        </button>
        <button className="text-[14px] font-medium text-secondary hover:text-accent transition-colors">
          Request info from Microsoft
        </button>
        <button className="text-[14px] font-medium text-danger hover:underline transition-colors">
          Block feature
        </button>
      </div>

      {/* Per-function stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {fnStats.map(s => <FunctionStatCard key={s.fn} {...s} />)}
      </div>

      {/* Two-column body */}
      <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 280px', alignItems: 'start' }}>
        <PolicyChecksPanel checks={feature.checks} />
        <AuditSidebar feature={feature} />
      </div>

    </div>
  )
}

const FN_COLOR: Record<string, string> = {
  InfoSec: '#A100FF',
  Legal:   '#00B5B0',
  IT:      '#FFA800',
}

const FN_LABEL: Record<string, string> = {
  InfoSec: 'InfoSec',
  Legal:   'Legal & Privacy',
  IT:      'IT & Architecture',
}

function FunctionStatCard({ fn, total, pass, conditional, fail, needs_info }: {
  fn: string; total: number; pass: number; conditional: number; fail: number; needs_info: number
}) {
  const color = FN_COLOR[fn]
  const issues: string[] = []
  if (conditional > 0) issues.push(`${conditional} conditional`)
  if (fail > 0)        issues.push(`${fail} failed`)
  if (needs_info > 0)  issues.push(`${needs_info} needs info`)

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
      <div className="text-[11px] uppercase tracking-wider font-medium mb-3" style={{ color }}>
        {FN_LABEL[fn]}
      </div>
      <div className="text-[36px] font-light text-ink leading-none mb-3">
        {pass}<span className="text-[20px] text-tertiary"> / {total}</span>
      </div>
      <div className="h-[6px] rounded-full overflow-hidden flex mb-2">
        {total > 0 ? (
          <>
            {pass > 0        && <div style={{ flex: pass,        backgroundColor: '#A100FF' }} />}
            {conditional > 0 && <div style={{ flex: conditional, backgroundColor: '#D5A6FF' }} />}
            {fail > 0        && <div style={{ flex: fail,        backgroundColor: '#FF52A0' }} />}
            {needs_info > 0  && <div style={{ flex: needs_info,  backgroundColor: '#93C5FD' }} />}
          </>
        ) : (
          <div className="flex-1 bg-[#E5E5E5]" />
        )}
      </div>
      {issues.length > 0
        ? <div className="text-[12px] text-tertiary">{issues.join(' · ')}</div>
        : <div className="text-[12px] text-[#7B00CC]">All checks passed</div>
      }
    </div>
  )
}
