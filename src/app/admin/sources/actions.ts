'use server'
import { revalidatePath } from 'next/cache'
import { parseSourcesText } from '@/lib/source-format'
import { applySources, deleteSource } from '@/lib/db'

export async function applySourcesAction(
  text: string,
): Promise<{ ok: boolean; message: string }> {
  const { entries, errors } = parseSourcesText(text)
  if (errors.size > 0) {
    return { ok: false, message: `${errors.size} validation error(s) — fix them before applying.` }
  }
  try {
    const result = applySources(entries)
    revalidatePath('/admin/sources')
    return { ok: true, message: `Sources updated. ${result.total} domain${result.total !== 1 ? 's' : ''} approved.` }
  } catch (err) {
    return { ok: false, message: String(err) }
  }
}

export async function deleteSourceAction(domain: string): Promise<void> {
  deleteSource(domain)
  revalidatePath('/admin/sources')
}
