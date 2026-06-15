import { getSession, deleteSession } from '@/lib/importSession'
import { commitPolicyVersion } from '@/lib/db'

export async function POST(request: Request) {
  let body: {
    sessionId: string
    versionLabel: string
    includedRuleIds: string[]
    reevaluate: boolean
    notes?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { sessionId, versionLabel, includedRuleIds, reevaluate, notes } = body

  if (!sessionId || !versionLabel || !Array.isArray(includedRuleIds)) {
    return Response.json({ error: 'Missing required fields: sessionId, versionLabel, includedRuleIds' }, { status: 400 })
  }

  const session = getSession(sessionId)
  if (!session) {
    return Response.json({ error: 'Import session expired or not found. Please re-upload the file.' }, { status: 404 })
  }

  const includedSet = new Set(includedRuleIds)

  // Rules to upsert: NEW + UPDATED + UNCHANGED that are included
  const rulesToUpsert = session.rules.filter(r => includedSet.has(r.id))

  // Rules to archive: REMOVED that are included (user chose to archive them)
  const removedRuleIds = session.diff
    .filter(d => d.action === 'REMOVED' && includedSet.has(d.rule.id))
    .map(d => d.rule.id)

  try {
    const versionId = commitPolicyVersion({
      versionLabel,
      filename: session.filename,
      notes: notes ?? (reevaluate ? 'Re-evaluation enqueued after commit.' : null),
      rulesToUpsert,
      ruleIdsToArchive: removedRuleIds,
    })

    deleteSession(sessionId)

    return Response.json({
      ok: true,
      versionId,
      committed: rulesToUpsert.length,
      archived: removedRuleIds.length,
      reevaluate,
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
