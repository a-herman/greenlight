'use client'
import { useState, useRef, useTransition } from 'react'
import { DEFAULT_SOURCES, parseSourcesText } from '@/lib/source-format'
import { applySourcesAction, deleteSourceAction } from './actions'

function isValidDomain(d: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-.]*\.[a-zA-Z]{2,}$/.test(d) && !d.includes('/')
}

interface Row { domain: string; vendor: string; notes: string }
interface Toast { id: number; message: string; ok: boolean }

function rowHasError(row: Row): boolean {
  if (!row.domain && !row.vendor && !row.notes) return false
  if (!row.domain || !isValidDomain(row.domain)) return true
  if (!row.vendor.trim()) return true
  return false
}

function parseToRows(text: string): Row[] {
  return parseSourcesText(text).entries
}

function serializeRows(rows: Row[]): string {
  return rows
    .filter(r => r.domain || r.vendor || r.notes)
    .map(r => `${r.domain} | ${r.vendor} | ${r.notes}`)
    .join('\n')
}

const INPUT = 'h-8 rounded-lg border px-2.5 bg-white outline-none transition-colors w-full'

export default function SourceAdmin({
  initialText,
  defaultText,
}: {
  initialText: string
  defaultText: string
}) {
  const [rows, setRows]              = useState<Row[]>(() => parseToRows(initialText))
  const [toasts, setToasts]          = useState<Toast[]>([])
  const [isPending, startTransition] = useTransition()
  const toastIdRef                   = useRef(0)

  const hasErrors = rows.some(rowHasError)

  function updateRow(i: number, patch: Partial<Row>) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }

  function handleDeleteRow(i: number) {
    const domain = rows[i].domain.trim()
    setRows(prev => prev.filter((_, idx) => idx !== i))
    if (domain) {
      startTransition(async () => { await deleteSourceAction(domain) })
    }
  }

  function addRow() {
    setRows(prev => [...prev, { domain: '', vendor: '', notes: '' }])
  }

  function handleReset() {
    setRows(parseToRows(defaultText))
  }

  function pushToast(message: string, ok: boolean) {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, ok }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  function handleApply() {
    if (hasErrors || isPending) return
    startTransition(async () => {
      const result = await applySourcesAction(serializeRows(rows))
      pushToast(result.message, result.ok)
    })
  }

  const validCount = rows.filter(r => r.domain || r.vendor || r.notes).length

  return (
    <>
      <div className="max-w-[800px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] text-secondary">
            {validCount} domain{validCount !== 1 ? 's' : ''}
          </span>
          {hasErrors && (
            <span className="text-[12px] font-medium text-[#BE185D]">Fix errors to apply</span>
          )}
        </div>

        <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Header */}
          <div
            className="grid px-4 py-2.5 border-b border-[#EEEEEE] bg-[#FAFAFA]"
            style={{ gridTemplateColumns: '1fr 130px 1fr 32px', gap: '8px' }}
          >
            {['Domain', 'Vendor', 'Notes', ''].map(label => (
              <span key={label} className="text-[11px] font-semibold text-tertiary uppercase tracking-wide">
                {label}
              </span>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, i) => {
            const domainInvalid = row.domain !== '' && !isValidDomain(row.domain)
            const vendorInvalid = !!row.domain && !row.vendor.trim()
            return (
              <div
                key={i}
                className="grid px-4 py-2 border-b border-[#EEEEEE] last:border-0 items-center"
                style={{ gridTemplateColumns: '1fr 130px 1fr 32px', gap: '8px' }}
              >
                <input
                  value={row.domain}
                  onChange={e => updateRow(i, { domain: e.target.value.trim() })}
                  placeholder="learn.microsoft.com"
                  className={`${INPUT} font-mono text-[12px] ${domainInvalid ? 'border-[#FF52A0] bg-[#FFF5F8]' : 'border-[#EEEEEE] focus:border-accent'}`}
                />
                <input
                  value={row.vendor}
                  onChange={e => updateRow(i, { vendor: e.target.value })}
                  placeholder="Microsoft"
                  className={`${INPUT} text-[13px] ${vendorInvalid ? 'border-[#FF52A0] bg-[#FFF5F8]' : 'border-[#EEEEEE] focus:border-accent'}`}
                />
                <input
                  value={row.notes}
                  onChange={e => updateRow(i, { notes: e.target.value })}
                  placeholder="Optional description"
                  className={`${INPUT} text-[13px] border-[#EEEEEE] focus:border-accent`}
                />
                <button
                  onClick={() => handleDeleteRow(i)}
                  aria-label="Remove"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[16px] text-tertiary hover:text-[#BE185D] hover:bg-[#FFE4F0] transition-colors"
                >
                  ×
                </button>
              </div>
            )
          })}

          <button
            onClick={addRow}
            className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-accent hover:bg-accent-soft transition-colors"
          >
            + Add source
          </button>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={handleApply}
            disabled={hasErrors || isPending}
            className="bg-accent text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-accent-dark transition-colors shadow-[0_1px_3px_rgba(161,0,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Applying…' : 'Apply changes'}
          </button>
          <button onClick={handleReset} className="text-[14px] text-secondary hover:text-accent transition-colors">
            Reset to default
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`text-[13px] font-medium px-4 py-3 rounded-xl shadow-lg ${t.ok ? 'bg-ink text-white' : 'bg-[#FFE4F0] text-[#BE185D]'}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  )
}
