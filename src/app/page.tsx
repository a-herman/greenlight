import { Suspense } from 'react'
import { getFeatures, getCheckStats } from '@/lib/db'
import QueueDashboard from '@/components/dashboard/QueueDashboard'

export default function QueuePage() {
  const features   = getFeatures()
  const checkStats = getCheckStats()
  const kpi = {
    total:       features.length,
    approved:    features.filter(f => f.status === 'Approved').length,
    conditional: features.filter(f => f.status === 'Conditional').length,
    held:        features.filter(f => f.status === 'Held').length,
    in_review:   features.filter(f => f.status === 'In Review').length,
  }

  return (
    <Suspense>
      <QueueDashboard features={features} kpi={kpi} checkStats={checkStats} />
    </Suspense>
  )
}
