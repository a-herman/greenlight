'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { FeatureSummary, FeatureStatus, RiskLevel, GovernanceFunction, CheckStat } from '@/types'
import StatusPill from '@/components/ui/StatusPill'
import FeatureIcon from '@/components/ui/FeatureIcon'
import CheckDistributionChart from './CheckDistributionChart'

const STATUS_OPTIONS: FeatureStatus[] = ['Approved', 'Conditional', 'Held', 'In Review']
const RISK_OPTIONS: RiskLevel[]       = ['Low', 'Low-Medium', 'Medium', 'Medium-High', 'High', 'Variable', 'New category']
const FUNCTION_OPTIONS: GovernanceFunction[] = ['InfoSec', 'Legal', 'IT']

interface Props {
  features:   FeatureSummary[]
  kpi:        { total: number; approved: number; conditional: number; held: number; in_review: number }
  checkStats: CheckStat[]
}

export default function QueueDashboard({ features, kpi, checkStats }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const q            = searchParams.get('q')       ?? ''
  const statusFilter = searchParams.get('status')  ?? ''
  const riskFilter   = searchParams.get('risk')    ?? ''
  const fnFilter     = searchParams.get('function') ?? ''

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value); else params.delete(key)
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const f of features) counts[f.status] = (counts[f.status] ?? 0) + 1
    return counts
  }, [features])

  const filtered = useMemo(() => {
    const qLower = q.toLowerCase()
    return features.filter(f => {
      if (q && !f.name.toLowerCase().includes(qLower) && !f.product.toLowerCase().includes(qLower)) return false
      if (statusFilter && f.status !== statusFilter) return false
      if (riskFilter && f.risk_level !== riskFilter) return false
      if (fnFilter) {
        if (!f.flagged_functions.split(',').filter(Boolean).includes(fnFilter)) return false
      }
      return true
    })
  }, [features, q, statusFilter, riskFilter, fnFilter])

  const hasFilters     = q || statusFilter || riskFilter || fnFilter
  const awaitingReview = features.filter(f => f.status === 'Held' || f.status === 'Conditional')
  const timeline       = buildDashboardTimeline(features)

  return (
    <div className="max-w-[1320px] mx-auto px-12 py-10">

      {/* Breadcrumb */}
      <div className="text-[12px] text-tertiary mb-6">
        Copilot <span className="mx-1.5">›</span> Governance <span className="mx-1.5">›</span> Approval queue
      </div>

      {/* Page heading */}
      <h1 className="text-[28px] font-semibold text-ink leading-tight mb-1.5">Copilot governance</h1>
      <p className="text-[15px] text-secondary mb-10">
        Review new features and agents released by Microsoft against AccentureTEST enterprise policies.
      </p>

      {/* Asymmetric two-column layout */}
      <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 304px' }}>

        {/* ── Left column ─────────────────────────────────── */}
        <div className="flex flex-col gap-5 min-w-0">

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Features in review" value={kpi.total} delta="Tracked this cycle">
              <Sparkline data={[1, 1, 2, 1, 3, 2, 5, 7]} color="#A100FF" />
            </KpiCard>
            <KpiCard label="Approved" value={kpi.approved} delta="Ready to activate">
              <MiniProgressBar value={kpi.approved} total={kpi.total} color="#A100FF" />
            </KpiCard>
            <KpiCard label="Conditional" value={kpi.conditional} delta="Action required">
              <MiniProgressBar value={kpi.conditional} total={kpi.total} color="#D5A6FF" />
            </KpiCard>
            <KpiCard label="Held" value={kpi.held} delta="Escalation needed">
              <MiniProgressBar value={kpi.held} total={kpi.total} color="#FF52A0" />
            </KpiCard>
          </div>

          {/* Distribution chart card */}
          <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-6 py-5">
            <CheckDistributionChart data={checkStats} />
          </div>

          {/* Table card */}
          <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">

            {/* Filter bar */}
            <div className="px-5 py-4 border-b border-[#EEEEEE] flex items-center gap-5 flex-wrap">
              <input
                type="text"
                value={q}
                onChange={e => setParam('q', e.target.value)}
                placeholder="Search features or products…"
                className="text-[13px] text-ink placeholder:text-tertiary bg-transparent border border-[#EEEEEE] rounded-lg px-3 py-1.5 outline-none w-52 focus:border-accent transition-colors"
              />

              <div className="flex items-center gap-1 ml-1">
                <FilterTab label="All" count={features.length} active={!statusFilter} onClick={() => setParam('status', '')} />
                {STATUS_OPTIONS.map(s => {
                  const count = statusCounts[s] ?? 0
                  if (!count) return null
                  return (
                    <FilterTab
                      key={s}
                      label={s}
                      count={count}
                      active={statusFilter === s}
                      onClick={() => setParam('status', statusFilter === s ? '' : s)}
                    />
                  )
                })}
              </div>

              <div className="ml-auto flex items-center gap-4">
                <select
                  value={riskFilter}
                  onChange={e => setParam('risk', e.target.value)}
                  className={`text-[13px] bg-transparent outline-none cursor-pointer transition-colors ${
                    riskFilter ? 'text-accent font-medium' : 'text-secondary hover:text-ink'
                  }`}
                >
                  <option value="">Risk level</option>
                  {RISK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <select
                  value={fnFilter}
                  onChange={e => setParam('function', e.target.value)}
                  className={`text-[13px] bg-transparent outline-none cursor-pointer transition-colors ${
                    fnFilter ? 'text-accent font-medium' : 'text-secondary hover:text-ink'
                  }`}
                >
                  <option value="">Governance function</option>
                  {FUNCTION_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>

                {hasFilters && (
                  <button
                    onClick={() => router.push('/', { scroll: false })}
                    className="text-[13px] text-accent hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#EEEEEE]">
                  {['Feature / agent', 'Risk', 'Status', 'Policy checks', 'Released', ''].map((col, i) => (
                    <th key={i} className="text-left text-[11px] uppercase tracking-wider font-medium text-tertiary px-5 pb-3 pt-4 last:pr-5 first:pl-5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-[14px] text-tertiary px-5">
                      No features match the current filters.
                    </td>
                  </tr>
                )}
                {filtered.map(f => {
                  return (
                    <tr key={f.id} className="border-b border-[#EEEEEE] last:border-0 hover:bg-[#F5EDFF]/30 transition-colors group">

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <FeatureIcon label={f.icon_label} type={f.type} />
                          <div>
                            <Link href={`/features/${f.id}`} className="text-[14px] font-semibold text-ink hover:text-accent transition-colors">
                              {f.name}
                            </Link>
                            <div className="text-[12px] text-tertiary mt-0.5">{f.product} · {f.version}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="text-[13px] text-secondary">{f.risk_level}</span>
                      </td>

                      <td className="py-4 px-5">
                        <StatusPill status={f.status} />
                      </td>

                      <td className="py-4 px-5">
                        <FunctionBars f={f} />
                      </td>

                      <td className="py-4 px-5">
                        <span className="text-[13px] text-tertiary">{formatRelDate(f.released_date)}</span>
                      </td>

                      <td className="py-4 pr-5">
                        <Link href={`/features/${f.id}`} aria-label={`View ${f.name}`} className="flex justify-end text-tertiary group-hover:text-accent transition-colors">
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Table footer */}
            <div className="px-5 py-3.5 border-t border-[#EEEEEE] flex justify-between items-center text-[12px] text-tertiary">
              <span>Showing {filtered.length} of {features.length} features</span>
              <span>AccentureTEST · Policy pack v4.1</span>
            </div>
          </div>

        </div>

        {/* ── Right column ────────────────────────────────── */}
        <div className="flex flex-col gap-4 sticky top-10 self-start">

          {/* Awaiting review */}
          <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-semibold text-ink">Awaiting review</span>
              {awaitingReview.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent-soft text-accent text-[11px] font-semibold flex items-center justify-center">
                  {awaitingReview.length}
                </span>
              )}
            </div>
            {awaitingReview.length === 0 ? (
              <p className="text-[13px] text-tertiary">All clear — nothing pending.</p>
            ) : (
              <div className="space-y-3">
                {awaitingReview.map(f => (
                  <Link key={f.id} href={`/features/${f.id}`} className="flex items-center gap-2.5 group">
                    <FeatureIcon label={f.icon_label} type={f.type} />
                    <span className="flex-1 min-w-0 text-[13px] font-medium text-ink truncate group-hover:text-accent transition-colors">
                      {f.name}
                    </span>
                    <StatusPill status={f.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
            <div className="text-[13px] font-semibold text-ink mb-4">Recent activity</div>
            <div className="space-y-3.5">
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
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, delta, children }: {
  label: string; value: number; delta: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 flex flex-col">
      <div className="text-[11px] uppercase tracking-wider font-medium text-tertiary mb-3">{label}</div>
      <div className="text-[36px] font-light text-ink leading-none mb-1">{value}</div>
      <div className="text-[13px] text-secondary mb-4">{delta}</div>
      <div className="h-10 mt-auto">{children}</div>
    </div>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const W = 100; const H = 36; const pad = 2
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - 2 * pad)
    const y = H - pad - ((v - min) / range) * (H - 2 * pad)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MiniProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex flex-col justify-end h-full gap-1.5">
      <div className="text-[12px] text-tertiary">{Math.round(pct)}% of total</div>
      <div className="h-[3px] rounded-full bg-[#F0F0F0] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

const FN_BARS = [
  { key: 'infosec', label: 'IS', color: '#A100FF', pass: 'infosec_pass' as const, total: 'infosec_total' as const },
  { key: 'legal',   label: 'LP', color: '#00B5B0', pass: 'legal_pass'   as const, total: 'legal_total'   as const },
  { key: 'it',      label: 'IT', color: '#FFA800', pass: 'it_pass'      as const, total: 'it_total'      as const },
]

function FunctionBars({ f }: { f: FeatureSummary }) {
  const flagged = f.total_checks - f.pass_count
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-col gap-1">
        {FN_BARS.map(b => {
          const pass  = f[b.pass]
          const total = f[b.total]
          return (
            <div key={b.key} className="flex items-center gap-1.5">
              <span className="text-[10px] text-tertiary w-[14px] flex-shrink-0 leading-none">{b.label}</span>
              <div className="relative w-14 h-[2px] bg-[#E5E5E5] rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ width: total > 0 ? `${Math.round((pass / total) * 100)}%` : '0%', backgroundColor: b.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <span className="text-[12px] text-tertiary whitespace-nowrap">
        {f.pass_count}/{f.total_checks}
        {flagged > 0 && <span className="text-[#BE185D] ml-1">· {flagged} flagged</span>}
      </span>
    </div>
  )
}

function FilterTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[13px] font-medium transition-colors px-3 py-1 rounded-full ${
        active
          ? 'bg-accent-soft text-accent'
          : 'text-secondary hover:text-ink hover:bg-[#F5F5F5]'
      }`}
    >
      {label} <span className={`text-[12px] ${active ? 'text-accent' : 'text-tertiary'}`}>{count}</span>
    </button>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildDashboardTimeline(features: FeatureSummary[]) {
  const items: { dotClass: string; title: string; meta: string }[] = []

  const held = features.filter(f => f.status === 'Held')
  if (held.length) {
    items.push({
      dotClass: 'bg-danger',
      title: `${held.length} feature${held.length > 1 ? 's' : ''} blocked — escalation needed`,
      meta: held.map(f => f.name).join(', '),
    })
  }

  const conditional = features.filter(f => f.status === 'Conditional')
  if (conditional.length) {
    items.push({
      dotClass: 'bg-warn',
      title: `${conditional.length} conditional approval${conditional.length > 1 ? 's' : ''} awaiting action`,
      meta: 'Remediation required before activation',
    })
  }

  const approved = features.filter(f => f.status === 'Approved')
  if (approved.length) {
    items.push({
      dotClass: 'bg-ok',
      title: `${approved.length} feature${approved.length > 1 ? 's' : ''} cleared for activation`,
      meta: approved.map(f => f.name).join(', '),
    })
  }

  const totalChecks = features.reduce((n, f) => n + f.total_checks, 0)
  items.push({
    dotClass: 'bg-accent',
    title: `${totalChecks} policy checks evaluated`,
    meta: 'InfoSec, Legal & Privacy, IT Architecture',
  })

  items.push({
    dotClass: 'bg-accent',
    title: 'Governance cycle initiated',
    meta: `${features.length} Microsoft Copilot features tracked`,
  })

  return items
}

function formatRelDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const days = Math.round((now.getTime() - date.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7)  return `${days} days ago`
  if (days < 30) return `${Math.round(days / 7)} wks ago`
  return `${Math.round(days / 30)} mo ago`
}
