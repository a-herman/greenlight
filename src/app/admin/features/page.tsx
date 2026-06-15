import { getFeatureCatalogText } from '@/lib/db'
import { DEFAULT_CATALOG } from '@/lib/catalog-format'
import FeatureAdmin from './FeatureAdmin'

export default function AdminFeaturesPage() {
  const fromDb = getFeatureCatalogText()
  const initialText = fromDb || DEFAULT_CATALOG

  return (
    <div className="max-w-[1320px] mx-auto px-12 py-10">
      <div className="text-[12px] text-tertiary mb-6">
        Copilot <span className="mx-1.5">›</span> Governance <span className="mx-1.5">›</span> Features
      </div>
      <h1 className="text-[28px] font-semibold text-ink leading-tight mb-1.5">
        Features under governance
      </h1>
      <p className="text-[15px] text-secondary mb-10">
        Manage the catalog of Microsoft Copilot features and agents tracked by Greenlight.
      </p>
      <FeatureAdmin initialText={initialText} defaultText={DEFAULT_CATALOG} />
    </div>
  )
}
