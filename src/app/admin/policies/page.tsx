import Link from 'next/link'
import { getCurrentRules, getLatestPolicyVersion, getPolicyRuleCount } from '@/lib/db'

export default function PoliciesPage() {
  const rules  = getCurrentRules()
  const latest = getLatestPolicyVersion()
  const count  = getPolicyRuleCount()

  const byFunction = new Map<string, typeof rules>()
  for (const rule of rules) {
    const list = byFunction.get(rule.function) ?? []
    list.push(rule)
    byFunction.set(rule.function, list)
  }

  const FN_LABEL: Record<string, string> = { INFOSEC: 'InfoSec', IT: 'IT & Architecture', LEGAL: 'Legal & Privacy', OTHER: 'Other' }
  const FN_COLOR: Record<string, string> = { INFOSEC: 'text-[#A100FF]', IT: 'text-[#FFA800]', LEGAL: 'text-[#00B5B0]', OTHER: 'text-secondary' }
  const SEV_COLOR: Record<string, string> = { H: 'bg-[#FFE4F0] text-[#BE185D]', M: 'bg-[#F5EDFF] text-[#9333EA]', L: 'bg-[#F5F5F5] text-[#6B6B6B]' }

  return (
    <div className="max-w-[1320px] mx-auto px-12 py-10">
      <div className="text-[12px] text-tertiary mb-6">
        Copilot <span className="mx-1.5">›</span> Governance <span className="mx-1.5">›</span> Policies
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-ink leading-tight mb-1.5">Policy library</h1>
          <p className="text-[15px] text-secondary">
            {count === 0
              ? 'No rules imported yet.'
              : `${count} active rules${latest ? ` · ${latest.version_label}` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {count > 0 && (
            <a
              href="/api/policies/template"
              className="text-[14px] font-medium text-secondary hover:text-ink transition-colors px-4 py-2.5 rounded-lg border border-[#EEEEEE] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              Download template
            </a>
          )}
          <Link
            href="/admin/policies/new"
            className="text-[14px] font-medium text-secondary hover:text-ink transition-colors px-4 py-2.5 rounded-lg border border-[#EEEEEE] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          >
            + New rule
          </Link>
          <Link
            href="/admin/policies/import"
            className="bg-accent text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-dark transition-colors shadow-[0_1px_3px_rgba(161,0,255,0.3)]"
          >
            Import new version
          </Link>
        </div>
      </div>

      {count === 0 ? (
        <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 4v14M4 11h14" stroke="#A100FF" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div className="text-[16px] font-semibold text-ink mb-2">No policy rules yet</div>
          <p className="text-[14px] text-secondary mb-6">Upload a governance checklist or add rules individually.</p>
          <div className="flex items-center gap-3 justify-center">
            <Link href="/admin/policies/new" className="text-[14px] font-medium text-accent hover:text-accent-dark transition-colors px-5 py-2.5 rounded-lg border border-accent">
              + New rule
            </Link>
            <Link href="/admin/policies/import" className="bg-accent text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-dark transition-colors shadow-[0_1px_3px_rgba(161,0,255,0.3)]">
              Import first version
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byFunction.entries()).map(([fn, fnRules]) => (
            <div key={fn} className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EEEEEE] flex items-center justify-between">
                <span className={`text-[13px] font-semibold uppercase tracking-wide ${FN_COLOR[fn] ?? 'text-secondary'}`}>
                  {FN_LABEL[fn] ?? fn}
                </span>
                <span className="text-[12px] text-tertiary">{fnRules.length} rules</span>
              </div>
              <div className="divide-y divide-[#EEEEEE]">
                {fnRules.map(rule => (
                  <Link
                    key={rule.id}
                    href={`/admin/policies/${encodeURIComponent(rule.id)}`}
                    className="px-6 py-3 flex items-center gap-4 hover:bg-[#FAFAFA] transition-colors"
                  >
                    <span className="text-[12px] font-mono text-tertiary w-20 flex-shrink-0">{rule.id}</span>
                    <span className="flex-1 text-[13px] font-medium text-ink truncate">{rule.title}</span>
                    {rule.applies_to.length > 0 && (
                      <span className="text-[11px] text-tertiary hidden xl:block truncate max-w-[200px]">
                        {rule.applies_to.slice(0, 2).join(', ')}{rule.applies_to.length > 2 ? ` +${rule.applies_to.length - 2}` : ''}
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${SEV_COLOR[rule.severity] ?? ''}`}>
                      {rule.severity === 'H' ? 'High' : rule.severity === 'M' ? 'Medium' : 'Low'}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-tertiary flex-shrink-0">
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
