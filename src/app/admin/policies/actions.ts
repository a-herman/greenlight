'use server'
import { revalidatePath } from 'next/cache'
import { upsertSinglePolicyRule, archiveSinglePolicyRule } from '@/lib/db'
import type { CanonicalRule } from '@/lib/policyParser/types'

export async function savePolicyRuleAction(
  rule: CanonicalRule,
): Promise<{ ok: boolean; message: string }> {
  if (!rule.id.trim() || !rule.title.trim()) {
    return { ok: false, message: 'ID and title are required.' }
  }
  try {
    upsertSinglePolicyRule(rule)
    revalidatePath('/admin/policies', 'layout')
    return { ok: true, message: `Rule "${rule.id}" saved.` }
  } catch (err) {
    return { ok: false, message: String(err) }
  }
}

export async function archivePolicyRuleAction(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    archiveSinglePolicyRule(id)
    revalidatePath('/admin/policies', 'layout')
    return { ok: true, message: `Rule "${id}" removed.` }
  } catch (err) {
    return { ok: false, message: String(err) }
  }
}
