'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CanonicalRule, RuleFunction, RuleSeverity } from '@/lib/policyParser/types'
import { savePolicyRuleAction, archivePolicyRuleAction } from './actions'

// ── Styles ────────────────────────────────────────────────────────────────────
const LABEL    = 'text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-1.5 block'
const FIELD    = 'w-full rounded-lg border border-[#EEEEEE] px-3 py-2 text-[13px] bg-white outline-none focus:border-accent transition-colors'
const TEXTAREA = `${FIELD} resize-y min-h-[80px] leading-relaxed`

const FN_OPTIONS: { value: RuleFunction; label: string }[] = [
  { value: 'INFOSEC', label: 'InfoSec' },
  { value: 'IT',      label: 'IT & Architecture' },
  { value: 'LEGAL',   label: 'Legal & Privacy' },
  { value: 'OTHER',   label: 'Other' },
]
const SEV_OPTIONS: { value: RuleSeverity; label: string }[] = [
  { value: 'H', label: 'High' },
  { value: 'M', label: 'Medium' },
  { value: 'L', label: 'Low' },
]
const SEV_COLOR: Record<string, string> = {
  H: 'bg-[#FFE4F0] text-[#BE185D]',
  M: 'bg-[#F5EDFF] text-[#9333EA]',
  L: 'bg-[#F5F5F5] text-[#6B6B6B]',
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 30)
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
      <h2 className="text-[13px] font-semibold text-ink mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RuleEditor({ rule }: { rule: CanonicalRule | null }) {
  const isNew = rule === null
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)
  const [archiveConfirm, setArchiveConfirm] = useState(false)

  // ── Form state ──────────────────────────────────────────────────────────────
  const [id,            setId]           = useState(rule?.id ?? '')
  const [idTouched,     setIdTouched]    = useState(!isNew)
  const [title,         setTitle]        = useState(rule?.title ?? '')
  const [fn,            setFn]           = useState<RuleFunction>(rule?.function ?? 'INFOSEC')
  const [severity,      setSeverity]     = useState<RuleSeverity>(rule?.severity ?? 'M')
  const [appliesTo,     setAppliesTo]    = useState((rule?.applies_to ?? []).join('\n'))
  const [intent,        setIntent]       = useState(rule?.intent ?? '')
  const [checkQ,        setCheckQ]       = useState(rule?.check_question ?? '')
  const [reqEvidence,   setReqEvidence]  = useState(rule?.required_evidence ?? '')
  const [passCrit,      setPassCrit]     = useState((rule?.pass_criteria ?? []).join('\n'))
  const [failCrit,      setFailCrit]     = useState((rule?.fail_criteria ?? []).join('\n'))
  const [unknownCrit,   setUnknownCrit]  = useState((rule?.unknown_criteria ?? []).join('\n'))
  const [srcs,          setSrcs]         = useState((rule?.primary_sources ?? []).join('\n'))
  const [keywords,      setKeywords]     = useState((rule?.search_keywords ?? []).join('; '))
  const [relatedRules,  setRelatedRules] = useState((rule?.related_rules ?? []).join('; '))
  const [verdictLogic,  setVerdictLogic] = useState(rule?.verdict_logic ?? '')
  const [custProfile,   setCustProfile]  = useState(rule?.customer_profile_dependency ?? '')
  const [reEvalTrig,    setReEvalTrig]   = useState(rule?.re_eval_trigger ?? '')

  // Auto-generate ID from title for new rules
  useEffect(() => {
    if (isNew && !idTouched && title) setId(slugify(title))
  }, [title, isNew, idTouched])

  const canSave = id.trim().length > 0 && title.trim().length > 0

  function buildRule(): CanonicalRule {
    return {
      id:                          id.trim(),
      title:                       title.trim(),
      function:                    fn,
      severity,
      applies_to:                  appliesTo.split('\n').map(s => s.trim()).filter(Boolean),
      intent:                      intent.trim() || null,
      check_question:              checkQ.trim() || null,
      required_evidence:           reqEvidence.trim() || null,
      pass_criteria:               passCrit.split('\n').map(s => s.trim()).filter(Boolean),
      fail_criteria:               failCrit.split('\n').map(s => s.trim()).filter(Boolean),
      unknown_criteria:            unknownCrit.split('\n').map(s => s.trim()).filter(Boolean),
      primary_sources:             srcs.split('\n').map(s => s.trim()).filter(Boolean),
      search_keywords:             keywords.split(';').map(s => s.trim()).filter(Boolean),
      verdict_logic:               verdictLogic.trim() || null,
      customer_profile_dependency: custProfile.trim() || null,
      re_eval_trigger:             reEvalTrig.trim() || null,
      related_rules:               relatedRules.split(';').map(s => s.trim()).filter(Boolean),
      raw_extra:                   rule?.raw_extra ?? {},
      source_sheet:                rule?.source_sheet ?? 'MANUAL',
      source_row:                  rule?.source_row ?? 0,
    }
  }

  function handleSave() {
    if (!canSave || isPending) return
    startTransition(async () => {
      const built = buildRule()
      const result = await savePolicyRuleAction(built)
      if (result.ok && isNew) {
        router.push(`/admin/policies/${encodeURIComponent(built.id)}`)
      } else {
        setToast({ message: result.message, ok: result.ok })
        if (result.ok) router.refresh()
      }
    })
  }

  function handleArchive() {
    if (isPending) return
    startTransition(async () => {
      const result = await archivePolicyRuleAction(rule!.id)
      if (result.ok) router.push('/admin/policies')
      else setToast({ message: result.message, ok: false })
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-[12px] text-tertiary mb-6">
        Copilot <span className="mx-1.5">›</span> Governance <span className="mx-1.5">›</span>
        <Link href="/admin/policies" className="hover:text-accent transition-colors">Policies</Link>
        <span className="mx-1.5">›</span>
        <span className="text-ink">{isNew ? 'New rule' : rule.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-ink leading-tight mb-1">
            {isNew ? 'New policy rule' : title || rule.id}
          </h1>
          {!isNew && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[13px] font-mono text-tertiary">{rule.id}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SEV_COLOR[rule.severity] ?? ''}`}>
                {rule.severity === 'H' ? 'High' : rule.severity === 'M' ? 'Medium' : 'Low'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && !archiveConfirm && (
            <button
              onClick={() => setArchiveConfirm(true)}
              className="text-[13px] font-medium px-4 py-2.5 rounded-lg border border-[#EEEEEE] text-secondary hover:text-[#BE185D] hover:border-[#FF52A0] bg-white transition-colors"
            >
              Remove rule
            </button>
          )}
          {archiveConfirm && (
            <>
              <button
                onClick={() => setArchiveConfirm(false)}
                className="text-[13px] text-secondary hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={isPending}
                className="text-[13px] font-semibold px-4 py-2.5 rounded-lg bg-[#FFE4F0] text-[#BE185D] hover:bg-[#FFCCE0] transition-colors disabled:opacity-40"
              >
                {isPending ? 'Removing…' : 'Confirm remove'}
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave || isPending}
            className="bg-accent text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-dark transition-colors shadow-[0_1px_3px_rgba(161,0,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving…' : isNew ? 'Create rule' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Inline toast */}
      {toast && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-[13px] font-medium ${toast.ok ? 'bg-[#F0FDF4] text-[#166534]' : 'bg-[#FFE4F0] text-[#BE185D]'}`}>
          {toast.message}
        </div>
      )}

      <div className="space-y-5">
        {/* Core */}
        <SectionCard title="Core details">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>
                Rule ID
                {isNew && <span className="ml-1 normal-case font-normal text-tertiary">(auto-generated, editable)</span>}
              </label>
              <input
                value={id}
                onChange={e => { setId(e.target.value); setIdTouched(true) }}
                disabled={!isNew}
                placeholder="e.g. INFOSEC-042"
                className={`${FIELD} ${!isNew ? 'opacity-60 cursor-not-allowed bg-[#FAFAFA]' : ''}`}
              />
            </div>
            <div>
              <label className={LABEL}>Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Data residency verification"
                className={FIELD}
              />
            </div>
            <div>
              <label className={LABEL}>Function</label>
              <select value={fn} onChange={e => setFn(e.target.value as RuleFunction)} className={`${FIELD} cursor-pointer`}>
                {FN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as RuleSeverity)} className={`${FIELD} cursor-pointer`}>
                {SEV_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Applies to <span className="normal-case font-normal text-tertiary">(one per line)</span></label>
              <textarea
                value={appliesTo}
                onChange={e => setAppliesTo(e.target.value)}
                placeholder={'Microsoft 365 Copilot\nTeams'}
                className={TEXTAREA}
              />
            </div>
          </div>
        </SectionCard>

        {/* Evaluation context */}
        <SectionCard title="Evaluation context">
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Intent</label>
              <textarea value={intent} onChange={e => setIntent(e.target.value)} placeholder="What this rule checks for…" className={`${TEXTAREA} min-h-[60px]`} />
            </div>
            <div>
              <label className={LABEL}>Check question</label>
              <textarea value={checkQ} onChange={e => setCheckQ(e.target.value)} placeholder="Does the feature…?" className={`${TEXTAREA} min-h-[60px]`} />
            </div>
            <div>
              <label className={LABEL}>Required evidence</label>
              <textarea value={reqEvidence} onChange={e => setReqEvidence(e.target.value)} placeholder="What documentation is needed…" className={`${TEXTAREA} min-h-[60px]`} />
            </div>
          </div>
        </SectionCard>

        {/* Criteria */}
        <SectionCard title="Criteria (one per line)">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={`${LABEL} text-[#166534]`}>Pass criteria</label>
              <textarea
                value={passCrit}
                onChange={e => setPassCrit(e.target.value)}
                placeholder={'Evidence clearly shows…\nDocumentation confirms…'}
                className={`${TEXTAREA} min-h-[140px] focus:border-[#16A34A]`}
              />
            </div>
            <div>
              <label className={`${LABEL} text-[#BE185D]`}>Fail criteria</label>
              <textarea
                value={failCrit}
                onChange={e => setFailCrit(e.target.value)}
                placeholder={'Confirmed that data…\nNo evidence of…'}
                className={`${TEXTAREA} min-h-[140px] focus:border-[#FF52A0]`}
              />
            </div>
            <div>
              <label className={`${LABEL} text-[#6B6B6B]`}>Unknown / insufficient</label>
              <textarea
                value={unknownCrit}
                onChange={e => setUnknownCrit(e.target.value)}
                placeholder={'No public documentation…\nInsufficient detail…'}
                className={`${TEXTAREA} min-h-[140px]`}
              />
            </div>
          </div>
        </SectionCard>

        {/* References */}
        <SectionCard title="References">
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Primary sources <span className="normal-case font-normal text-tertiary">(one per line)</span></label>
              <textarea value={srcs} onChange={e => setSrcs(e.target.value)} placeholder={'Microsoft Privacy Statement\nGDPR Article 28'} className={TEXTAREA} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Search keywords <span className="normal-case font-normal text-tertiary">(semicolon-separated)</span></label>
                <textarea value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="data residency; storage location; EU" className={`${TEXTAREA} min-h-[60px]`} />
              </div>
              <div>
                <label className={LABEL}>Related rules <span className="normal-case font-normal text-tertiary">(semicolon-separated)</span></label>
                <textarea value={relatedRules} onChange={e => setRelatedRules(e.target.value)} placeholder="INFOSEC-001; LEGAL-003" className={`${TEXTAREA} min-h-[60px]`} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Logic & triggers */}
        <SectionCard title="Logic & triggers">
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Verdict logic</label>
              <textarea value={verdictLogic} onChange={e => setVerdictLogic(e.target.value)} placeholder="If Pass criteria are met, verdict = Pass…" className={TEXTAREA} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Customer profile dependency</label>
                <textarea value={custProfile} onChange={e => setCustProfile(e.target.value)} placeholder="Depends on tenant data residency settings…" className={`${TEXTAREA} min-h-[60px]`} />
              </div>
              <div>
                <label className={LABEL}>Re-evaluation trigger</label>
                <textarea value={reEvalTrig} onChange={e => setReEvalTrig(e.target.value)} placeholder="When Microsoft publishes a new DPA…" className={`${TEXTAREA} min-h-[60px]`} />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
