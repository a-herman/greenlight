import { notFound } from 'next/navigation'
import { getPolicyRule } from '@/lib/db'
import RuleEditor from '../RuleEditor'

export default function PolicyRulePage({ params }: { params: { id: string } }) {
  const rule = getPolicyRule(decodeURIComponent(params.id))
  if (!rule) notFound()
  return (
    <div className="max-w-[1000px] mx-auto px-12 py-10">
      <RuleEditor rule={rule} />
    </div>
  )
}
