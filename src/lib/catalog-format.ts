export const VALID_CATEGORIES = [
  'Microsoft 365 Copilot',
  'First-party preinstalled agents',
  'First-party optional agents',
  'Copilot Studio',
  'Dynamics 365 agents',
  'Security Copilot',
  'Power Platform Copilot',
  'Azure AI Foundry',
  'Frontier preview',
] as const

export type CatalogCategory = (typeof VALID_CATEGORIES)[number]
export type CatalogEntryType = 'Feature' | 'Agent' | 'Tool' | 'Model'

export interface CatalogEntry {
  id: string | null
  category: CatalogCategory
  name: string
  vendor: string
  type: CatalogEntryType
  preview: boolean
}

export interface ParseResult {
  entries: CatalogEntry[]
  errors: Map<number, string>
}

export function parseCatalogText(text: string): ParseResult {
  const entries: CatalogEntry[] = []
  const errors = new Map<number, string>()

  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (!raw) continue

    let rest = raw
    let id: string | null = null

    const idMatch = raw.match(/^\[([^\]]+)\]\s*(.*)/)
    if (idMatch) {
      id = idMatch[1].trim()
      rest = idMatch[2].trim()
    }

    const parts = rest.split('|').map(p => p.trim())
    if (parts.length < 4) {
      errors.set(i, `Expected at least 4 fields (Category | Name | Vendor | Type), got ${parts.length}`)
      continue
    }

    const [categoryRaw, name, vendor, typeRaw, previewRaw = ''] = parts

    if (!(VALID_CATEGORIES as readonly string[]).includes(categoryRaw)) {
      errors.set(i, `Unknown category "${categoryRaw}"`)
      continue
    }

    if (!(['Feature', 'Agent', 'Tool', 'Model'] as const).includes(typeRaw as CatalogEntryType)) {
      errors.set(i, `Unknown type "${typeRaw}" — must be Feature, Agent, Tool, or Model`)
      continue
    }

    if (!name) {
      errors.set(i, 'Name cannot be empty')
      continue
    }

    entries.push({
      id,
      category: categoryRaw as CatalogCategory,
      name,
      vendor,
      type: typeRaw as CatalogEntryType,
      preview: previewRaw.toLowerCase() === 'preview',
    })
  }

  return { entries, errors }
}

export function slugifyId(name: string): string {
  return (
    'f-' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 30)
  )
}

export const DEFAULT_CATALOG = `\
[f1-copilot-chat] Microsoft 365 Copilot | Copilot Chat | Microsoft 365 | Feature |
[f5-copilot-office] Microsoft 365 Copilot | Copilot in Excel / Word / Teams | Microsoft 365 | Feature |
[f-copilot-outlook] Microsoft 365 Copilot | Copilot in Outlook | Microsoft 365 | Feature |
[f-copilot-pp] Microsoft 365 Copilot | Copilot in PowerPoint | Microsoft 365 | Feature |
[f2-researcher-agent] First-party preinstalled agents | Researcher | Microsoft 365 Copilot | Agent |
[f3-analyst-agent] First-party preinstalled agents | Analyst | Microsoft 365 Copilot | Agent |
[f-designer] First-party optional agents | Copilot Designer | Microsoft 365 Copilot | Feature |
[f-sharepoint-agent] First-party optional agents | SharePoint Agent | Microsoft 365 Copilot | Agent |
[f6-app-builder] Copilot Studio | M365 App Builder | Microsoft 365 Copilot | Tool |
[f-copilot-studio] Copilot Studio | Copilot Studio | Microsoft Power Platform | Tool |
[f4-sales-agent] Dynamics 365 agents | Sales Agent | Dynamics 365 | Agent |
[f-service-agent] Dynamics 365 agents | Customer Service Agent | Dynamics 365 | Agent |
[f-security-copilot] Security Copilot | Microsoft Security Copilot | Microsoft Security | Feature |
[f-sentinel-agent] Security Copilot | Sentinel Triage Agent | Microsoft Security | Agent | preview
[f-power-automate] Power Platform Copilot | Copilot in Power Automate | Microsoft Power Platform | Feature |
[f-power-apps] Power Platform Copilot | Copilot in Power Apps | Microsoft Power Platform | Feature |
[f-azure-openai] Azure AI Foundry | Azure OpenAI GPT-4o | Azure AI | Model |
[f7-claude-foundry] Azure AI Foundry | Anthropic Claude in Microsoft Foundry | Azure AI Foundry | Tool |
[f-phi-4] Azure AI Foundry | Microsoft Phi-4 | Azure AI | Model | preview
[f-computer-use] Frontier preview | Researcher with Computer Use | Microsoft 365 Copilot Frontier | Agent | preview`
