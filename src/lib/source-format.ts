export interface SourceEntry {
  domain: string
  vendor: string
  notes: string
}

export interface SourceParseResult {
  entries: SourceEntry[]
  errors: Map<number, string>
}

function isValidDomain(domain: string): boolean {
  return (
    /^[a-zA-Z0-9][a-zA-Z0-9\-.]*\.[a-zA-Z]{2,}$/.test(domain) &&
    !domain.includes('/')
  )
}

export function parseSourcesText(text: string): SourceParseResult {
  const entries: SourceEntry[] = []
  const errors = new Map<number, string>()

  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (!raw) continue

    const parts = raw.split('|').map(p => p.trim())
    if (parts.length < 2) {
      errors.set(i, `Expected at least 2 fields (Domain | Vendor), got ${parts.length}`)
      continue
    }

    const [domain, vendor, notes = ''] = parts

    if (!isValidDomain(domain)) {
      errors.set(i, `"${domain}" is not a valid hostname — no protocol (http://) or path (/) allowed`)
      continue
    }

    if (!vendor) {
      errors.set(i, 'Vendor cannot be empty')
      continue
    }

    entries.push({ domain, vendor, notes })
  }

  return { entries, errors }
}

export const DEFAULT_SOURCES = `\
learn.microsoft.com | Microsoft | Primary product documentation
microsoft.com | Microsoft | Corporate, trust, compliance pages
techcommunity.microsoft.com | Microsoft | Official product team blogs and announcements
devblogs.microsoft.com | Microsoft | Engineering blogs and roadmap
admin.microsoft.com | Microsoft | Admin center documentation references
support.microsoft.com | Microsoft | Support and incident communications
servicetrust.microsoft.com | Microsoft | Compliance reports, audits, certifications
azure.microsoft.com | Microsoft | Azure platform documentation (relevant for Foundry, Azure OpenAI)
copilot.microsoft.com | Microsoft | Copilot consumer-facing product information
anthropic.com | Anthropic | Third-party model provider (for Claude in Foundry)
openai.com | OpenAI | Third-party model provider (default Copilot model)
x.ai | xAI | Third-party model provider (Copilot Studio US tenants)`
