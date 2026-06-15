'use client'
import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { DiffAction, SheetClassification, ValidationIssue, RuleFunction } from '@/lib/policyParser'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParseResponse {
  sessionId: string
  filename: string
  parsedAt: string
  sheets: SheetClassification[]
  summary: { total: number; new: number; updated: number; removed: number; unchanged: number }
  validation: ValidationIssue[]
  diff: DiffAction[]
  nextVersion: string
  currentStats: { ruleCount: number; latestVersion: string | null }
}

type Step = 'upload' | 'parsing' | 'review' | 'committing'
type ActionFilter = 'ALL' | 'NEW' | 'UPDATED' | 'REMOVED'

// ── Color maps ────────────────────────────────────────────────────────────────

const ACTION_BADGE: Record<string, string> = {
  NEW:       'bg-[#F5EDFF] text-[#7B00CC]',
  UPDATED:   'bg-[#DBEAFE] text-[#1D4ED8]',
  REMOVED:   'bg-[#FFE4F0] text-[#BE185D]',
  UNCHANGED: 'bg-[#F5F5F5] text-[#6B6B6B]',
}
const SEV_BADGE: Record<string, string> = {
  H: 'bg-[#FFE4F0] text-[#BE185D]',
  M: 'bg-[#F5EDFF] text-[#9333EA]',
  L: 'bg-[#F5F5F5] text-[#6B6B6B]',
}
const FN_LABEL: Record<string, string> = { INFOSEC: 'InfoSec', IT: 'IT & Arch', LEGAL: 'Legal & Privacy', OTHER: 'Other', META: 'Metadata', UNKNOWN: 'Unrecognized' }
const FN_OPTIONS: RuleFunction[] = ['INFOSEC', 'IT', 'LEGAL', 'OTHER']

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-6 py-5 flex-1 min-w-0">
      <div className={`text-[28px] font-semibold leading-none mb-1 ${color}`}>{value}</div>
      <div className="text-[12px] font-medium text-secondary">{label}</div>
    </div>
  )
}

function DiffRow({
  item,
  included,
  onToggle,
}: {
  item: DiffAction
  included: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const rule = item.rule
  const hasChanges = item.action === 'UPDATED' && (item.changes?.length ?? 0) > 0

  return (
    <div className={`border-b border-[#EEEEEE] last:border-0 ${!included ? 'opacity-40' : ''}`}>
      <div className="px-5 py-3 flex items-center gap-3">
        {item.action !== 'UNCHANGED' && (
          <input
            type="checkbox"
            checked={included}
            onChange={onToggle}
            className="w-4 h-4 flex-shrink-0 accent-[#A100FF] cursor-pointer"
          />
        )}
        {item.action === 'UNCHANGED' && <div className="w-4 flex-shrink-0" />}

        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 w-[76px] text-center ${ACTION_BADGE[item.action]}`}>
          {item.action}
        </span>

        <span className="font-mono text-[12px] text-tertiary w-16 flex-shrink-0">{rule.id}</span>

        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-medium text-ink truncate block">{rule.title}</span>
          {item.action === 'UPDATED' && hasChanges && (
            <span className="text-[11px] text-secondary">{item.changes!.length} field{item.changes!.length !== 1 ? 's' : ''} changed</span>
          )}
          {item.action === 'REMOVED' && (item.downstreamCount ?? 0) > 0 && (
            <span className="text-[11px] text-[#BE185D]">{item.downstreamCount} feature evaluation{item.downstreamCount !== 1 ? 's' : ''} reference this rule</span>
          )}
        </div>

        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${SEV_BADGE[rule.severity] ?? ''}`}>
          {rule.severity === 'H' ? 'High' : rule.severity === 'M' ? 'Med' : 'Low'}
        </span>

        {hasChanges && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[11px] text-accent hover:text-accent-dark font-medium flex-shrink-0 transition-colors"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        )}
      </div>

      {expanded && hasChanges && (
        <div className="px-5 pb-3 ml-[148px]">
          <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-lg overflow-hidden text-[12px]">
            <div className="grid grid-cols-3 px-3 py-1.5 bg-[#F0F0F0] font-semibold text-tertiary uppercase tracking-wide text-[10px]">
              <span>Field</span><span>Before</span><span>After</span>
            </div>
            {item.changes!.map(ch => {
              const isSevChange = ch.field === 'severity'
              const sevEsc = isSevChange && String(ch.old) > String(ch.next)
              return (
                <div key={ch.field} className="grid grid-cols-3 px-3 py-1.5 border-t border-[#EEEEEE]">
                  <span className="font-mono text-secondary">{ch.field}</span>
                  <span className="text-[#BE185D] truncate pr-2">{renderFieldValue(ch.old)}</span>
                  <span className="text-[#7B00CC] truncate flex items-center gap-1">
                    {renderFieldValue(ch.next)}
                    {sevEsc && <span className="ml-1 text-[10px] bg-[#FFE4F0] text-[#BE185D] px-1 rounded">Escalated</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function renderFieldValue(v: unknown): string {
  if (Array.isArray(v)) return v.length === 0 ? '—' : v.slice(0, 3).join(', ') + (v.length > 3 ? ` +${v.length - 3}` : '')
  if (v === null || v === undefined || v === '') return '—'
  return String(v).slice(0, 100)
}

// ── Upload step ───────────────────────────────────────────────────────────────

function UploadStep({
  ruleCount,
  latestVersion,
  onFile,
  error,
}: {
  ruleCount: number
  latestVersion: string | null
  onFile: (f: File) => void
  error: string | null
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <div className="max-w-[680px] mx-auto">
      {ruleCount > 0 && (
        <div className="mb-6 text-[13px] text-secondary">
          Current library: <span className="font-medium text-ink">{ruleCount} active rules</span>
          {latestVersion && <span className="ml-1">· last published as <span className="font-medium">{latestVersion}</span></span>}
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
          dragging ? 'border-accent bg-accent-soft' : 'border-[#D4D4D4] bg-white hover:border-accent hover:bg-[#FAFAFA]'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 4v14M7 11l7-7 7 7" stroke="#A100FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 20v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="#A100FF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="text-[16px] font-semibold text-ink mb-1">Drop your governance checklist here</div>
        <div className="text-[13px] text-secondary mb-4">or click to browse · .xlsx files only · max 10 MB</div>
        <div className="inline-block bg-accent text-white text-[13px] font-semibold px-5 py-2 rounded-lg shadow-[0_1px_3px_rgba(161,0,255,0.3)]">
          Choose file
        </div>
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 bg-[#FFE4F0] border border-[#FF52A0] rounded-xl text-[13px] text-[#BE185D] font-medium">
          {error}
        </div>
      )}

      {ruleCount > 0 && (
        <div className="mt-6 text-center">
          <a href="/api/policies/template" className="text-[13px] text-accent hover:text-accent-dark font-medium transition-colors">
            Download current library as template →
          </a>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportFlow({
  ruleCount,
  latestVersion,
}: {
  ruleCount: number
  latestVersion: string | null
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ParseResponse | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Review state
  const [included, setIncluded] = useState<Set<string>>(new Set())
  const [fnOverrides, setFnOverrides] = useState<Record<string, RuleFunction>>({})
  const [filter, setFilter] = useState<ActionFilter>('ALL')
  const [validationExpanded, setValidationExpanded] = useState(false)
  const [versionLabel, setVersionLabel] = useState('')
  const [reevaluate, setReevaluate] = useState(false)
  const [commitError, setCommitError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setUploadError(null)
    setStep('parsing')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/policies/import/parse', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error ?? 'Parse failed')
        setStep('upload')
        return
      }
      setPreview(data as ParseResponse)
      setSessionId(data.sessionId)
      setVersionLabel(data.nextVersion)
      // Default: include all actionable rows
      const defaultIncluded = new Set<string>(
        (data.diff as DiffAction[])
          .filter(d => d.action !== 'UNCHANGED')
          .map(d => d.rule.id)
      )
      setIncluded(defaultIncluded)
      setStep('review')
    } catch (err) {
      setUploadError(String(err))
      setStep('upload')
    }
  }

  function toggleInclude(id: string) {
    setIncluded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleCommit() {
    if (!sessionId || !preview) return
    setStep('committing')
    setCommitError(null)
    try {
      const res = await fetch('/api/policies/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          versionLabel,
          includedRuleIds: Array.from(included),
          reevaluate,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCommitError(data.error ?? 'Commit failed')
        setStep('review')
        return
      }
      router.push('/admin/policies?imported=' + encodeURIComponent(versionLabel))
    } catch (err) {
      setCommitError(String(err))
      setStep('review')
    }
  }

  function handleDiscard() {
    setStep('upload')
    setPreview(null)
    setSessionId(null)
    setUploadError(null)
  }

  // ── Render: upload / parsing ─────────────────────────────────────────────
  if (step === 'upload' || step === 'parsing') {
    return (
      <div className="max-w-[1320px] mx-auto px-12 py-10">
        <div className="text-[12px] text-tertiary mb-6">
          Copilot <span className="mx-1.5">›</span> Governance <span className="mx-1.5">›</span>{' '}
          <a href="/admin/policies" className="hover:text-ink transition-colors">Policies</a>{' '}
          <span className="mx-1.5">›</span> Import
        </div>
        <h1 className="text-[28px] font-semibold text-ink leading-tight mb-1.5">Import policy version</h1>
        <p className="text-[15px] text-secondary mb-10">
          Upload a governance checklist to review and publish as a new policy version.
        </p>

        {step === 'parsing' ? (
          <div className="max-w-[680px] mx-auto text-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin mx-auto mb-6" />
            <div className="text-[16px] font-semibold text-ink mb-1">Parsing your file…</div>
            <div className="text-[13px] text-secondary">Detecting sheets, mapping columns, and diffing against the current library.</div>
          </div>
        ) : (
          <UploadStep ruleCount={ruleCount} latestVersion={latestVersion} onFile={handleFile} error={uploadError} />
        )}
      </div>
    )
  }

  // ── Render: committing ──────────────────────────────────────────────────
  if (step === 'committing') {
    return (
      <div className="max-w-[1320px] mx-auto px-12 py-10 text-center py-24">
        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin mx-auto mb-6" />
        <div className="text-[16px] font-semibold text-ink">Publishing {versionLabel}…</div>
      </div>
    )
  }

  // ── Render: review ──────────────────────────────────────────────────────
  if (!preview) return null

  const { summary, validation, diff, sheets, filename, parsedAt } = preview
  const errors = validation.filter(v => v.level === 'error')
  const warnings = validation.filter(v => v.level === 'warning')
  const hasErrors = errors.length > 0 && summary.total === 0

  const filteredDiff = filter === 'ALL'
    ? diff.filter(d => d.action !== 'UNCHANGED')
    : diff.filter(d => d.action === filter)

  const publishCount = Array.from(included).length
  const totalUnmapped = sheets.reduce((acc, s) => acc + s.unmappedColumns.length, 0)

  return (
    <div className="max-w-[1320px] mx-auto px-12 py-10 pb-32">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[12px] text-tertiary mb-2">
            Copilot <span className="mx-1.5">›</span> Governance <span className="mx-1.5">›</span>{' '}
            <a href="/admin/policies" className="hover:text-ink transition-colors">Policies</a>{' '}
            <span className="mx-1.5">›</span> Import
          </div>
          <h1 className="text-[24px] font-semibold text-ink leading-tight">{filename}</h1>
          <div className="text-[13px] text-secondary mt-0.5">
            Parsed {new Date(parsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {summary.total} rules detected
          </div>
        </div>
        <button
          onClick={handleDiscard}
          className="text-[14px] font-medium text-secondary hover:text-[#BE185D] transition-colors px-4 py-2 rounded-lg border border-[#EEEEEE] bg-white"
        >
          Discard
        </button>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────────────── */}
      <div className="flex gap-4 mb-8">
        <MetricCard label="Rules parsed" value={summary.total} color="text-ink" />
        <MetricCard label="New" value={summary.new} color="text-[#7B00CC]" />
        <MetricCard label="Updated" value={summary.updated} color="text-[#1D4ED8]" />
        <MetricCard label="Removed" value={summary.removed} color="text-[#BE185D]" />
      </div>

      {/* ── Detected structure ───────────────────────────────────────────── */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#EEEEEE]">
          <span className="text-[13px] font-semibold text-ink">Detected structure</span>
        </div>
        <div className="divide-y divide-[#EEEEEE]">
          {sheets.map(sheet => (
            <div key={sheet.sheetName} className="px-6 py-3 flex items-center gap-4">
              <span className="text-[13px] font-mono text-ink flex-1">{sheet.sheetName}</span>
              <div className="flex items-center gap-2">
                {(sheet.role === 'INFOSEC' || sheet.role === 'IT' || sheet.role === 'LEGAL' || sheet.role === 'OTHER') ? (
                  <select
                    value={fnOverrides[sheet.sheetName] ?? sheet.role}
                    onChange={e => setFnOverrides(prev => ({ ...prev, [sheet.sheetName]: e.target.value as RuleFunction }))}
                    className="h-7 text-[12px] rounded-lg border border-[#EEEEEE] px-2 bg-white outline-none focus:border-accent cursor-pointer"
                  >
                    {FN_OPTIONS.map(fn => <option key={fn} value={fn}>{FN_LABEL[fn]}</option>)}
                  </select>
                ) : (
                  <span className="text-[12px] text-tertiary px-2 py-0.5 bg-[#F5F5F5] rounded-lg">{FN_LABEL[sheet.role] ?? sheet.role}</span>
                )}
                <span className="text-[12px] text-tertiary w-16 text-right">
                  {sheet.role === 'META' || sheet.role === 'UNKNOWN' ? '—' : `${sheet.ruleCount} rules`}
                </span>
              </div>
            </div>
          ))}
        </div>
        {totalUnmapped > 0 && (
          <div className="px-6 py-3 border-t border-[#EEEEEE] bg-[#FAFAFA]">
            <span className="text-[12px] text-secondary">
              {totalUnmapped} unmapped column{totalUnmapped !== 1 ? 's' : ''} will be preserved as metadata:{' '}
              <span className="font-mono">{sheets.flatMap(s => s.unmappedColumns).join(', ')}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Validation banner ────────────────────────────────────────────── */}
      {validation.length > 0 && (
        <div className={`rounded-xl border mb-6 overflow-hidden ${hasErrors ? 'border-[#FF52A0] bg-[#FFF5F8]' : 'border-[#D5A6FF] bg-[#F5EDFF]'}`}>
          <button
            className="w-full px-5 py-3 flex items-center justify-between text-left"
            onClick={() => setValidationExpanded(e => !e)}
          >
            <div className="flex items-center gap-3">
              {hasErrors ? (
                <span className="text-[13px] font-semibold text-[#BE185D]">
                  {errors.length} error{errors.length !== 1 ? 's' : ''} — fix before publishing
                </span>
              ) : (
                <span className="text-[13px] font-semibold text-[#7B00CC]">
                  {warnings.length} warning{warnings.length !== 1 ? 's' : ''} · no errors
                </span>
              )}
            </div>
            <span className="text-[12px] text-secondary">{validationExpanded ? 'Hide' : 'Show'}</span>
          </button>
          {validationExpanded && (
            <div className="px-5 pb-4 space-y-1.5">
              {[...errors, ...warnings].map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]">
                  <span className={`flex-shrink-0 font-bold ${issue.level === 'error' ? 'text-[#BE185D]' : 'text-[#9333EA]'}`}>
                    {issue.level === 'error' ? '✕' : '⚠'}
                  </span>
                  <span className="text-secondary">{issue.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Diff list ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[#EEEEEE] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ink">Changes</span>
          <div className="flex items-center gap-1">
            {(['ALL', 'NEW', 'UPDATED', 'REMOVED'] as ActionFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[12px] font-medium px-3 py-1 rounded-lg transition-colors ${
                  filter === f ? 'bg-accent text-white' : 'text-secondary hover:text-ink'
                }`}
              >
                {f === 'ALL' ? `All (${diff.filter(d => d.action !== 'UNCHANGED').length})` : `${f} (${diff.filter(d => d.action === f).length})`}
              </button>
            ))}
          </div>
        </div>

        {filteredDiff.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-tertiary">No {filter === 'ALL' ? 'changes' : filter.toLowerCase() + ' rules'} detected.</div>
        ) : (
          <div>
            {filteredDiff.map(item => (
              <DiffRow
                key={item.rule.id + item.action}
                item={item}
                included={included.has(item.rule.id)}
                onToggle={() => toggleInclude(item.rule.id)}
              />
            ))}
          </div>
        )}

        {summary.unchanged > 0 && (
          <div className="px-5 py-2.5 border-t border-[#EEEEEE] bg-[#FAFAFA] text-[12px] text-tertiary">
            {summary.unchanged} rule{summary.unchanged !== 1 ? 's' : ''} unchanged — not shown
          </div>
        )}
      </div>

      {commitError && (
        <div className="mb-4 px-4 py-3 bg-[#FFE4F0] border border-[#FF52A0] rounded-xl text-[13px] text-[#BE185D] font-medium">
          {commitError}
        </div>
      )}

      {/* ── Sticky commit bar ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EEEEEE] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] z-40">
        <div className="max-w-[1320px] mx-auto px-12 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-[12px] font-semibold text-tertiary uppercase tracking-wide">Version</label>
            <input
              value={versionLabel}
              onChange={e => setVersionLabel(e.target.value)}
              placeholder="v1.0"
              className="h-8 rounded-lg border border-[#EEEEEE] px-3 text-[13px] font-mono bg-white outline-none focus:border-accent transition-colors w-28"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reevaluate}
              onChange={e => setReevaluate(e.target.checked)}
              className="w-4 h-4 accent-[#A100FF] cursor-pointer"
            />
            <span className="text-[13px] text-secondary">Re-evaluate all features after commit</span>
          </label>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="text-[14px] font-medium text-secondary hover:text-ink transition-colors px-4 py-2 rounded-lg border border-[#EEEEEE]"
            >
              Discard
            </button>
            <button
              onClick={handleCommit}
              disabled={hasErrors || publishCount === 0 || !versionLabel.trim()}
              className="bg-accent text-white text-[14px] font-semibold px-6 py-2.5 rounded-lg hover:bg-accent-dark transition-colors shadow-[0_1px_3px_rgba(161,0,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Publish {publishCount > 0 ? `${publishCount} change${publishCount !== 1 ? 's' : ''}` : 'changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
