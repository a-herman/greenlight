'use client'
import { useState, useMemo, useRef, useTransition } from 'react'
import { parseCatalogText, VALID_CATEGORIES } from '@/lib/catalog-format'
import type { CatalogEntry } from '@/lib/catalog-format'
import { applyFeatureCatalogAction, upsertFeatureAction } from './actions'

const TYPES = ['Feature', 'Agent', 'Tool', 'Model'] as const

const TYPE_COLOR: Record<string, string> = {
  Feature: 'bg-[#F5EDFF] text-[#7B00CC]',
  Agent:   'bg-[#FFE4F0] text-[#BE185D]',
  Tool:    'bg-[#DBEAFE] text-[#1D4ED8]',
  Model:   'bg-[#F5F5F5] text-[#6B6B6B]',
}

// Unique ID for stable React keys — not the DB feature id
let _uid = 0
function nextUid() { return ++_uid }

interface FeatureItem {
  uid:      number
  id:       string | null
  category: string
  name:     string
  vendor:   string
  type:     string
  preview:  boolean
  active:   boolean
}

interface FormState {
  mode:     'add' | 'edit'
  editUid:  number | null
  category: string
  name:     string
  vendor:   string
  type:     string
  preview:  boolean
}

interface Toast { id: number; message: string; ok: boolean }

const DEFAULT_FORM: FormState = {
  mode:     'add',
  editUid:  null,
  category: VALID_CATEGORIES[0],
  name:     '',
  vendor:   '',
  type:     'Feature',
  preview:  false,
}

function parseToItems(text: string): FeatureItem[] {
  return parseCatalogText(text).entries.map(e => ({
    uid:      nextUid(),
    id:       e.id,
    category: e.category as string,
    name:     e.name,
    vendor:   e.vendor,
    type:     e.type as string,
    preview:  e.preview,
    active:   true,
  }))
}

function serializeItems(items: FeatureItem[]): string {
  return items
    .filter(item => item.active && item.name.trim())
    .map(item => {
      const idPrefix = item.id ? `[${item.id}] ` : ''
      return `${idPrefix}${item.category} | ${item.name} | ${item.vendor} | ${item.type} | ${item.preview ? 'preview' : ''}`
    })
    .join('\n')
}

function itemToEntry(item: FeatureItem): CatalogEntry {
  return {
    id:       item.id,
    category: item.category as CatalogEntry['category'],
    name:     item.name,
    vendor:   item.vendor,
    type:     item.type as CatalogEntry['type'],
    preview:  item.preview,
  }
}

function iconFor(name: string): string {
  return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path d="M8.5 2L11 4.5L4 11.5H1.5V9L8.5 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const LABEL = 'text-[11px] font-semibold text-tertiary uppercase tracking-wide mb-1.5 block'
const FIELD = 'w-full h-9 rounded-lg border border-[#EEEEEE] px-3 text-[13px] bg-white outline-none focus:border-accent transition-colors'

export default function FeatureAdmin({
  initialText,
  defaultText,
}: {
  initialText: string
  defaultText: string
}) {
  const [items, setItems]            = useState<FeatureItem[]>(() => parseToItems(initialText))
  const [form, setForm]              = useState<FormState>(DEFAULT_FORM)
  const [toasts, setToasts]          = useState<Toast[]>([])
  const [isPending, startTransition] = useTransition()
  const toastIdRef                   = useRef(0)

  const formInvalid = !form.name.trim() || !form.vendor.trim()

  function toggleActive(uid: number) {
    setItems(prev => prev.map(item => item.uid === uid ? { ...item, active: !item.active } : item))
  }

  function handleEdit(uid: number) {
    const item = items.find(i => i.uid === uid)
    if (!item) return
    setForm({ mode: 'edit', editUid: uid, category: item.category, name: item.name, vendor: item.vendor, type: item.type, preview: item.preview })
  }

  function handleCancelEdit() {
    setForm(DEFAULT_FORM)
  }

  function pushToast(message: string, ok: boolean) {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, ok }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  function handleSaveForm() {
    if (formInvalid || isPending) return
    const entry = itemToEntry({
      uid: 0, id: form.mode === 'edit' ? (items.find(i => i.uid === form.editUid)?.id ?? null) : null,
      category: form.category, name: form.name, vendor: form.vendor,
      type: form.type, preview: form.preview, active: true,
    })

    startTransition(async () => {
      const result = await upsertFeatureAction(entry)
      if (result.ok) {
        if (form.mode === 'add') {
          setItems(prev => [...prev, {
            uid: nextUid(), id: result.id, category: form.category, name: form.name,
            vendor: form.vendor, type: form.type, preview: form.preview, active: true,
          }])
        } else {
          setItems(prev => prev.map(item =>
            item.uid === form.editUid
              ? { ...item, id: result.id ?? item.id, category: form.category, name: form.name, vendor: form.vendor, type: form.type, preview: form.preview }
              : item
          ))
        }
        setForm(DEFAULT_FORM)
      }
      pushToast(result.message, result.ok)
    })
  }

  function handleReset() {
    setItems(parseToItems(defaultText))
    setForm(DEFAULT_FORM)
  }

  function handleApply() {
    if (isPending) return
    startTransition(async () => {
      const result = await applyFeatureCatalogAction(serializeItems(items))
      if (result.ok) {
        setItems(prev => prev.filter(i => i.active))
      }
      pushToast(result.message, result.ok)
    })
  }

  const byCategory = useMemo(() => {
    const map = new Map<string, FeatureItem[]>()
    for (const item of items) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [items])

  const activeCount  = items.filter(i => i.active).length
  const removedCount = items.filter(i => !i.active).length

  return (
    <>
      <div className="grid gap-8" style={{ gridTemplateColumns: '320px 1fr', alignItems: 'start' }}>

        {/* ── Left: Add / Edit form ────────────────────────────── */}
        <div>
          <div className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
            <div className="text-[15px] font-semibold text-ink mb-4">
              {form.mode === 'edit' ? 'Edit feature' : 'Add feature'}
            </div>

            <div className="space-y-3">
              <div>
                <label className={LABEL}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={`${FIELD} cursor-pointer`}>
                  {VALID_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Copilot Chat" className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>Vendor</label>
                <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="e.g. Microsoft 365" className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={`${FIELD} cursor-pointer`}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input type="checkbox" checked={form.preview} onChange={e => setForm(f => ({ ...f, preview: e.target.checked }))} className="w-4 h-4 accent-[#A100FF] cursor-pointer" />
                <span className="text-[13px] text-ink">Preview release</span>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#EEEEEE]">
              <button
                onClick={handleSaveForm}
                disabled={formInvalid || isPending}
                className="bg-accent text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors shadow-[0_1px_3px_rgba(161,0,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? 'Saving…' : form.mode === 'edit' ? 'Save changes' : 'Add feature'}
              </button>
              {form.mode === 'edit' && (
                <button onClick={handleCancelEdit} className="text-[13px] text-secondary hover:text-ink transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleApply}
              disabled={isPending}
              className="bg-white text-ink border border-[#EEEEEE] text-[14px] font-medium px-5 py-2.5 rounded-lg hover:bg-[#FAFAFA] transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.06)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? 'Applying…' : 'Sync active / remove unchecked'}
            </button>
            <button onClick={handleReset} className="text-[14px] text-secondary hover:text-accent transition-colors">
              Reset
            </button>
          </div>
        </div>

        {/* ── Right: Feature list ──────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4 h-[22px]">
            <span className="text-[13px] font-medium text-ink">
              {activeCount} feature{activeCount !== 1 ? 's' : ''} tracked
            </span>
            {removedCount > 0 && (
              <span className="text-[12px] font-medium text-[#BE185D]">
                {removedCount} will be removed — click Sync to apply
              </span>
            )}
          </div>

          <div className="space-y-3">
            {Array.from(byCategory.entries()).map(([cat, catItems]) => (
              <div key={cat} className="bg-white border border-[#EEEEEE] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[#EEEEEE] flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink">{cat}</span>
                  <span className="text-[11px] text-tertiary">
                    {catItems.filter(item => item.active).length} / {catItems.length}
                  </span>
                </div>
                <div className="divide-y divide-[#EEEEEE]">
                  {catItems.map(item => (
                    <div
                      key={item.uid}
                      className={`px-5 py-2.5 flex items-center gap-3 transition-opacity ${!item.active ? 'opacity-40' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={() => toggleActive(item.uid)}
                        className="w-4 h-4 flex-shrink-0 accent-[#A100FF] cursor-pointer"
                      />
                      <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-accent">{iconFor(item.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[13px] font-medium leading-snug truncate ${!item.active ? 'line-through text-secondary' : 'text-ink'}`}>
                            {item.name}
                          </span>
                          {item.preview && (
                            <span className="text-[9px] font-bold bg-[#DBEAFE] text-[#1D4ED8] px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide">preview</span>
                          )}
                        </div>
                        <div className="text-[11px] text-tertiary truncate">{item.vendor}</div>
                      </div>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLOR[item.type] ?? 'bg-[#F5F5F5] text-secondary'}`}>
                        {item.type}
                      </span>
                      <button
                        onClick={() => handleEdit(item.uid)}
                        aria-label="Edit"
                        className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-tertiary hover:text-accent hover:bg-accent-soft transition-colors"
                      >
                        <PencilIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <p className="text-[14px] text-tertiary py-8 text-center">
                Use the form to add your first feature.
              </p>
            )}
          </div>
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
