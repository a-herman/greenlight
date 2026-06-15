import { getSourcesText } from '@/lib/db'
import { DEFAULT_SOURCES } from '@/lib/source-format'
import SourceAdmin from './SourceAdmin'

export default function AdminSourcesPage() {
  const fromDb = getSourcesText()
  const initialText = fromDb || DEFAULT_SOURCES

  return (
    <div className="max-w-[1320px] mx-auto px-12 py-10">
      <div className="text-[12px] text-tertiary mb-6">
        Copilot <span className="mx-1.5">›</span> Governance <span className="mx-1.5">›</span> Sources
      </div>
      <h1 className="text-[28px] font-semibold text-ink leading-tight mb-1.5">
        Approved sources
      </h1>
      <p className="text-[15px] text-secondary mb-10">
        First-party domains the Greenlight agent is permitted to search when evaluating features against AccentureTEST policy.
      </p>
      <SourceAdmin initialText={initialText} defaultText={DEFAULT_SOURCES} />
    </div>
  )
}
