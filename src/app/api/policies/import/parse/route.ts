import { randomUUID } from 'crypto'
import { parseXlsxBuffer, suggestNextVersion } from '@/lib/policyParser'
import { getCurrentRules, getLatestPolicyVersion, getPolicyRuleCount } from '@/lib/db'
import { storeSession } from '@/lib/importSession'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.name.endsWith('.xlsx')) {
    return Response.json({ error: 'Only .xlsx files are accepted' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: `File too large (${(file.size / 1048576).toFixed(1)} MB). Maximum is 10 MB.` }, { status: 413 })
  }

  if (file.size === 0) {
    return Response.json({ error: 'File is empty' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Load current DB state for diffing
  const currentRules = getCurrentRules()

  // Compute downstream counts (policy_checks referencing each rule by title)
  const downstreamCounts: Record<string, number> = {}
  // (Stage 3 will populate this; for now left empty — rules have no checks yet)

  let parsed
  try {
    parsed = parseXlsxBuffer(buffer, file.name, currentRules, downstreamCounts)
  } catch (err) {
    return Response.json({ error: `Parse failed: ${String(err)}` }, { status: 422 })
  }

  // Check for blocking errors
  const errors = parsed.validation.filter(v => v.level === 'error')
  if (errors.length > 0 && parsed.rules.length === 0) {
    return Response.json({ error: errors[0].message, validation: parsed.validation }, { status: 422 })
  }

  // Suggest next version
  const latest = getLatestPolicyVersion()
  parsed.nextVersion = suggestNextVersion(latest?.version_label ?? null)

  // Store session
  const sessionId = randomUUID()
  storeSession(sessionId, parsed)

  // Build summary for client
  const summary = {
    total: parsed.rules.length,
    new: parsed.diff.filter(d => d.action === 'NEW').length,
    updated: parsed.diff.filter(d => d.action === 'UPDATED').length,
    removed: parsed.diff.filter(d => d.action === 'REMOVED').length,
    unchanged: parsed.diff.filter(d => d.action === 'UNCHANGED').length,
  }

  const currentStats = {
    ruleCount: getPolicyRuleCount(),
    latestVersion: latest?.version_label ?? null,
  }

  return Response.json({
    sessionId,
    filename: file.name,
    parsedAt: new Date().toISOString(),
    sheets: parsed.sheets,
    summary,
    validation: parsed.validation,
    diff: parsed.diff,
    nextVersion: parsed.nextVersion,
    currentStats,
  })
}
