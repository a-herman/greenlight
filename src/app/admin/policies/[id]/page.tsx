import { notFound } from 'next/navigation'
import { getPolicyRule } from '@/lib/db'
import RuleEditor from '../RuleEditor'

export default async function PolicyRulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rule = getPolicyRule(decodeURIComponent(id))
  if (!rule) notFound()
  return (
    <div className="max-w-[1000px] mx-auto px-12 py-10">
      <RuleEditor rule={rule} />
    </div>
  )
}
