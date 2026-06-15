'use server'
import { revalidatePath } from 'next/cache'
import { parseCatalogText } from '@/lib/catalog-format'
import { applyFeatureCatalog, upsertSingleFeature } from '@/lib/db'
import type { CatalogEntry } from '@/lib/catalog-format'

export async function applyFeatureCatalogAction(
  text: string,
): Promise<{ ok: boolean; message: string }> {
  const { entries, errors } = parseCatalogText(text)
  if (errors.size > 0) {
    return { ok: false, message: `${errors.size} validation error(s) — fix them before applying.` }
  }
  try {
    const result = applyFeatureCatalog(entries)
    revalidatePath('/', 'layout')
    return { ok: true, message: `Catalog updated. ${result.total} feature${result.total !== 1 ? 's' : ''} tracked.` }
  } catch (err) {
    return { ok: false, message: String(err) }
  }
}

export async function upsertFeatureAction(
  entry: CatalogEntry,
): Promise<{ ok: boolean; message: string; id: string | null }> {
  try {
    const result = upsertSingleFeature(entry)
    revalidatePath('/', 'layout')
    return { ok: true, message: `"${entry.name}" saved.`, id: result.id }
  } catch (err) {
    return { ok: false, message: String(err), id: null }
  }
}
