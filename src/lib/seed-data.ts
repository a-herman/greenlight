import type { FeatureType, RiskLevel, FeatureStatus, GovernanceFunction, CheckStatus } from '@/types'

interface SeedFeature {
  id: string
  name: string
  type: FeatureType
  product: string
  version: string
  risk_level: RiskLevel
  status: FeatureStatus
  summary: string
  icon_label: string
  released_date: string
  ms_owner: string
  policy_pack: string
}

interface SeedCheck {
  id: string
  feature_id: string
  governance_function: GovernanceFunction
  title: string
  status: CheckStatus
  finding: string
  recommendation: string | null
}

interface SeedEvidence {
  id: string
  check_id: string
  source_title: string
  source_url: string
  excerpt: string
  accessed_date: string
}

export const FEATURES: SeedFeature[] = [
  {
    id: 'f1-copilot-chat',
    name: 'Microsoft 365 Copilot Chat',
    type: 'Feature',
    product: 'Microsoft 365',
    version: 'v2.0',
    risk_level: 'Medium',
    status: 'Conditional',
    summary:
      'AI-powered chat assistant embedded across Microsoft 365 apps. Enables natural language queries over tenant data, document summarisation, meeting recaps, and email drafting using the authenticated user\'s permissions.',
    icon_label: 'CC',
    released_date: '2026-03-12',
    ms_owner: 'Microsoft 365 Product Group',
    policy_pack: 'AccentureTEST AI Governance v4.1',
  },
  {
    id: 'f2-researcher-agent',
    name: 'Researcher Agent',
    type: 'Agent',
    product: 'Microsoft 365 Copilot',
    version: 'v1.2',
    risk_level: 'Medium-High',
    status: 'Conditional',
    summary:
      'Autonomous agent that performs multi-step web research via Bing, synthesises findings against internal tenant content, and produces structured reports. Accesses live web data outside the tenant boundary.',
    icon_label: 'RA',
    released_date: '2026-03-28',
    ms_owner: 'Microsoft 365 Copilot Product Group',
    policy_pack: 'AccentureTEST AI Governance v4.1',
  },
  {
    id: 'f3-analyst-agent',
    name: 'Analyst Agent',
    type: 'Agent',
    product: 'Microsoft 365 Copilot',
    version: 'v1.0',
    risk_level: 'Medium-High',
    status: 'Conditional',
    summary:
      'Autonomous agent for quantitative data analysis. Executes Python in an Azure-hosted sandbox to process spreadsheet and database content, generate visualisations, and surface insights via natural language.',
    icon_label: 'AA',
    released_date: '2026-04-02',
    ms_owner: 'Microsoft 365 Copilot Product Group',
    policy_pack: 'AccentureTEST AI Governance v4.1',
  },
  {
    id: 'f4-sales-agent',
    name: 'Sales Agent',
    type: 'Agent',
    product: 'Dynamics 365',
    version: 'v1.0',
    risk_level: 'High',
    status: 'Held',
    summary:
      'High-autonomy agent for Dynamics 365 Sales that autonomously qualifies leads, drafts outreach, schedules follow-ups, and enriches prospect records via a third-party data provider. Requires broad CRM data access.',
    icon_label: 'SA',
    released_date: '2026-04-17',
    ms_owner: 'Dynamics 365 Product Group',
    policy_pack: 'AccentureTEST AI Governance v4.1',
  },
  {
    id: 'f5-copilot-office',
    name: 'Copilot in Excel / Word / Teams',
    type: 'Feature',
    product: 'Microsoft 365',
    version: 'v3.5',
    risk_level: 'Low-Medium',
    status: 'Approved',
    summary:
      'Embedded Copilot capabilities across Excel (formula generation, data analysis), Word (drafting, rewriting), and Teams (meeting summaries, action items). Operates entirely within the tenant using user-delegated permissions.',
    icon_label: 'CP',
    released_date: '2026-02-20',
    ms_owner: 'Microsoft 365 Product Group',
    policy_pack: 'AccentureTEST AI Governance v4.1',
  },
  {
    id: 'f6-app-builder',
    name: 'Microsoft 365 App Builder',
    type: 'Tool',
    product: 'Microsoft 365 Copilot',
    version: 'v1.1',
    risk_level: 'Variable',
    status: 'Conditional',
    summary:
      'Low-code platform allowing power users to build, publish, and deploy custom Copilot agents within the M365 tenant. Risk profile depends on the agents built; the platform itself has governance gaps around agent lifecycle management.',
    icon_label: 'AB',
    released_date: '2026-04-08',
    ms_owner: 'Microsoft 365 Copilot Platform Group',
    policy_pack: 'AccentureTEST AI Governance v4.1',
  },
  {
    id: 'f7-claude-foundry',
    name: 'Anthropic Claude in Microsoft Foundry',
    type: 'Tool',
    product: 'Azure AI Foundry',
    version: 'v1.0 (Claude 3.7)',
    risk_level: 'New category',
    status: 'Held',
    summary:
      'Anthropic\'s Claude 3.7 model available via Azure AI Foundry as a third-party foundation model. Introduces a non-Microsoft LLM into the tenant AI stack. DPA alignment, sub-processor terms, and EU AI Act classification are unresolved.',
    icon_label: 'AC',
    released_date: '2026-04-21',
    ms_owner: 'Azure AI Platform Group',
    policy_pack: 'AccentureTEST AI Governance v4.1',
  },
]

export const POLICY_CHECKS: SeedCheck[] = [
  // ─── F1: M365 Copilot Chat ───────────────────────────────────────────────

  // InfoSec
  {
    id: 'f1-is-1', feature_id: 'f1-copilot-chat', governance_function: 'InfoSec',
    title: 'Data residency within M365 tenant boundary',
    status: 'Pass',
    finding: 'Copilot Chat processes all prompts and generates responses within the AccentureTEST M365 tenant boundary. No data is routed to external endpoints outside the compliance perimeter.',
    recommendation: null,
  },
  {
    id: 'f1-is-2', feature_id: 'f1-copilot-chat', governance_function: 'InfoSec',
    title: 'Encryption at rest and in transit',
    status: 'Pass',
    finding: 'All interaction data is encrypted using AES-256 at rest and TLS 1.2+ in transit, consistent with M365 enterprise encryption standards and AccentureTEST policy INFOSEC-003.',
    recommendation: null,
  },
  {
    id: 'f1-is-3', feature_id: 'f1-copilot-chat', governance_function: 'InfoSec',
    title: 'Prompt and response log retention is configurable',
    status: 'Conditional',
    finding: 'Interaction logs default to a 30-day retention window. AccentureTEST policy SEC-009 requires a minimum 90-day retention for AI interaction audit trails to support security incident investigation.',
    recommendation: 'Configure extended log retention via Microsoft Purview Audit. Approve conditionally, validate configuration before rollout.',
  },
  {
    id: 'f1-is-4', feature_id: 'f1-copilot-chat', governance_function: 'InfoSec',
    title: 'Model sub-processor routing documented',
    status: 'Conditional',
    finding: 'Microsoft discloses Azure OpenAI Service as the underlying model provider. Specific model versions and per-geography routing paths are not listed in the DPA sub-processor annex, limiting supply-chain visibility.',
    recommendation: 'Accept current disclosure level. Monitor Microsoft DPA quarterly updates for granular routing documentation.',
  },
  {
    id: 'f1-is-5', feature_id: 'f1-copilot-chat', governance_function: 'InfoSec',
    title: 'Tenant data access scope is bounded',
    status: 'Conditional',
    finding: 'Copilot Chat inherits the authenticated user\'s permissions across SharePoint, Exchange, Teams, and OneDrive. No mechanism exists to exclude specific data domains or sensitivity labels from Copilot grounding.',
    recommendation: 'Implement Microsoft Purview sensitivity label exclusions to prevent Copilot from accessing content labelled HIGHLY CONFIDENTIAL or above until scoping controls are available.',
  },

  // Legal
  {
    id: 'f1-lg-1', feature_id: 'f1-copilot-chat', governance_function: 'Legal',
    title: 'GDPR data subject rights supported',
    status: 'Pass',
    finding: 'Microsoft confirms GDPR data subject access, deletion, and portability requests are fulfilled through standard M365 compliance tooling. AccentureTEST\'s DSR procedures apply without modification.',
    recommendation: null,
  },
  {
    id: 'f1-lg-2', feature_id: 'f1-copilot-chat', governance_function: 'Legal',
    title: 'Customer data excluded from model training',
    status: 'Pass',
    finding: 'Microsoft\'s Product Terms and DPA explicitly confirm that tenant prompts, responses, and grounded data are not used to train or improve foundation models. Commitment is contractually binding.',
    recommendation: null,
  },
  {
    id: 'f1-lg-3', feature_id: 'f1-copilot-chat', governance_function: 'Legal',
    title: 'EU AI Act transparency requirements met',
    status: 'Conditional',
    finding: 'The EU AI Act Article 52 requires AI systems interacting with natural persons to disclose their AI nature. Copilot Chat UI indicators exist but enforcement of disclosure in third-party integrations is not mandated by Microsoft.',
    recommendation: 'Ensure all internal Copilot integrations surface AI disclosure messaging. Document compliance posture for EUAIA supervisory review.',
  },
  {
    id: 'f1-lg-4', feature_id: 'f1-copilot-chat', governance_function: 'Legal',
    title: 'End-user informed consent mechanism',
    status: 'Conditional',
    finding: 'Copilot enablement is controlled by tenant admins via policy toggle with no per-user consent flow. AccentureTEST policy LEG-022 requires user acknowledgement before first use for tools with broad data access.',
    recommendation: 'Deploy first-use acknowledgement via Microsoft Viva Connections or a custom welcome experience. Target completion before GA rollout.',
  },
  {
    id: 'f1-lg-5', feature_id: 'f1-copilot-chat', governance_function: 'Legal',
    title: 'Data retention policy alignment',
    status: 'Pass',
    finding: 'Copilot Chat follows tenant-wide retention policies configured in Microsoft Purview. No override is imposed by the feature. Retention schedules align with AccentureTEST\'s information governance policy.',
    recommendation: null,
  },

  // IT
  {
    id: 'f1-it-1', feature_id: 'f1-copilot-chat', governance_function: 'IT',
    title: 'Entra ID authentication and SSO enforced',
    status: 'Pass',
    finding: 'Copilot Chat authenticates exclusively via Entra ID. SSO, MFA, and Conditional Access policies apply without exception. No service accounts or API key authentication paths exist.',
    recommendation: null,
  },
  {
    id: 'f1-it-2', feature_id: 'f1-copilot-chat', governance_function: 'IT',
    title: 'Conditional Access policy compatibility',
    status: 'Pass',
    finding: 'Feature respects all Conditional Access policies including device compliance, location restrictions, and session controls. Tested against AccentureTEST CA baseline policies without conflict.',
    recommendation: null,
  },
  {
    id: 'f1-it-3', feature_id: 'f1-copilot-chat', governance_function: 'IT',
    title: 'Microsoft Purview DLP signals honoured',
    status: 'Conditional',
    finding: 'Purview DLP policies are partially enforced — labels on files are respected but real-time DLP classification of user-typed prompts is not yet supported. Sensitive data typed directly into chat may not be intercepted.',
    recommendation: 'Enable Copilot interaction data capture in Purview Communication Compliance to cover the prompt inspection gap during preview.',
  },
  {
    id: 'f1-it-4', feature_id: 'f1-copilot-chat', governance_function: 'IT',
    title: 'Admin deployment controls available',
    status: 'Pass',
    finding: 'Tenant admins can enable or disable Copilot Chat per user group via Microsoft 365 admin centre. Licence-based scoping allows phased rollout. No elevated permissions required for configuration.',
    recommendation: null,
  },

  // ─── F2: Researcher Agent ─────────────────────────────────────────────────

  // InfoSec
  {
    id: 'f2-is-1', feature_id: 'f2-researcher-agent', governance_function: 'InfoSec',
    title: 'Web search query data handling',
    status: 'Conditional',
    finding: 'Research queries are transmitted to Bing Search as a named Microsoft sub-processor. Query content may include user-composed search strings derived from internal tenant context, creating a potential data leakage vector.',
    recommendation: 'Establish a Sensitive Topics Exclusion list in Copilot admin settings to prevent Researcher from constructing queries containing client names, matter IDs, or regulated data categories.',
  },
  {
    id: 'f2-is-2', feature_id: 'f2-researcher-agent', governance_function: 'InfoSec',
    title: 'Research output stored within tenant boundary',
    status: 'Pass',
    finding: 'Synthesised research outputs are stored in the user\'s OneDrive or SharePoint within the AccentureTEST tenant. No output is persisted by Microsoft outside the compliance boundary.',
    recommendation: null,
  },
  {
    id: 'f2-is-3', feature_id: 'f2-researcher-agent', governance_function: 'InfoSec',
    title: 'Bing sub-processor listed in agent DPA annex',
    status: 'Conditional',
    finding: 'Bing is named as a sub-processor in the general Microsoft Online Services DPA, but is not itemised in the agent-specific sub-processor annex for Researcher Agent v1.2. Granular routing and data handling terms are absent.',
    recommendation: 'Request Microsoft account team provide agent-specific sub-processor addendum. Accept general DPA coverage on an interim basis.',
  },
  {
    id: 'f2-is-4', feature_id: 'f2-researcher-agent', governance_function: 'InfoSec',
    title: 'Malicious content filtering on retrieved sources',
    status: 'Pass',
    finding: 'Researcher Agent applies Microsoft Safety system content filters to all retrieved web content before synthesis. Prompt injection attempts from adversarial web pages are detected and blocked.',
    recommendation: null,
  },
  {
    id: 'f2-is-5', feature_id: 'f2-researcher-agent', governance_function: 'InfoSec',
    title: 'Tenant data not embedded in outbound Bing queries',
    status: 'Conditional',
    finding: 'The agent constructs Bing queries using contextual signals from the user\'s M365 environment. Microsoft has not published a formal data isolation guarantee preventing tenant-specific content appearing verbatim in search queries.',
    recommendation: 'Monitor Microsoft\'s Researcher Agent privacy documentation for formal isolation guarantee. Restrict to non-sensitive research tasks until confirmed.',
  },

  // Legal
  {
    id: 'f2-lg-1', feature_id: 'f2-researcher-agent', governance_function: 'Legal',
    title: 'GDPR data subject rights supported',
    status: 'Pass',
    finding: 'GDPR rights apply through existing M365 compliance tooling. Research outputs stored in OneDrive are subject to standard DSR procedures. No additional configuration required.',
    recommendation: null,
  },
  {
    id: 'f2-lg-2', feature_id: 'f2-researcher-agent', governance_function: 'Legal',
    title: 'Customer data excluded from model training',
    status: 'Pass',
    finding: 'Microsoft Product Terms confirm tenant data — including research prompts, retrieved content, and synthesised outputs — is not used to train or improve the underlying foundation model.',
    recommendation: null,
  },
  {
    id: 'f2-lg-3', feature_id: 'f2-researcher-agent', governance_function: 'Legal',
    title: 'Copyright liability for web-scraped content',
    status: 'Conditional',
    finding: 'Researcher Agent retrieves and synthesises third-party web content. Microsoft\'s Copyright Commitment covers AI-generated content but does not indemnify AccentureTEST against claims arising from verbatim reproduction of unlicensed third-party material.',
    recommendation: 'Implement internal guidance requiring users to verify attribution before distributing Researcher outputs externally. Engage Legal for client-facing use cases.',
  },
  {
    id: 'f2-lg-4', feature_id: 'f2-researcher-agent', governance_function: 'Legal',
    title: 'Bing integration EU/UK regional certification',
    status: 'Conditional',
    finding: 'Bing Search integration relies on Azure infrastructure, but specific confirmation that Researcher Agent\'s Bing queries are processed exclusively within the EU/UK data boundary is not published for this version.',
    recommendation: 'Verify regional data handling with Microsoft account team before enabling Researcher Agent for users subject to EU/UK data residency requirements.',
  },
  {
    id: 'f2-lg-5', feature_id: 'f2-researcher-agent', governance_function: 'Legal',
    title: 'AI-generated content disclosure in outputs',
    status: 'Conditional',
    finding: 'Research reports do not automatically include an AI-generated content disclosure header. AccentureTEST\'s client deliverable policy requires AI attribution on all client-facing documents.',
    recommendation: 'Require teams to apply the "AI-Assisted" document template when distributing Researcher outputs to clients. Add to standard operating procedures.',
  },

  // IT
  {
    id: 'f2-it-1', feature_id: 'f2-researcher-agent', governance_function: 'IT',
    title: 'Entra ID authentication enforced',
    status: 'Pass',
    finding: 'Researcher Agent authenticates via Entra ID with the same session token as the M365 tenant. No additional credential store or API key is required.',
    recommendation: null,
  },
  {
    id: 'f2-it-2', feature_id: 'f2-researcher-agent', governance_function: 'IT',
    title: 'Web search scope controls available',
    status: 'Conditional',
    finding: 'No domain-level allowlist or blocklist is available to restrict the web sources Researcher Agent queries. Admins cannot prevent the agent from retrieving content from specific domains or categories.',
    recommendation: 'Engage Microsoft account team on Researcher Agent web search scoping roadmap. Document limitation in risk acceptance register.',
  },
  {
    id: 'f2-it-3', feature_id: 'f2-researcher-agent', governance_function: 'IT',
    title: 'DLP policy coverage for agent interactions',
    status: 'Conditional',
    finding: 'Microsoft Purview DLP does not currently intercept prompts or retrieved content within Researcher Agent sessions. The DLP gap means sensitive data patterns in user queries may not trigger configured policies.',
    recommendation: 'Enable Communication Compliance policies to capture Researcher Agent interactions. Escalate DLP gap to Microsoft support as a known limitation.',
  },
  {
    id: 'f2-it-4', feature_id: 'f2-researcher-agent', governance_function: 'IT',
    title: 'Bing egress endpoint documented for firewall',
    status: 'Needs Info',
    finding: 'The specific Bing Search API endpoints used by Researcher Agent are not separately documented from general Bing service endpoints. AccentureTEST network security requires explicit endpoint approval for outbound connections.',
    recommendation: 'Request Researcher Agent network requirements documentation from Microsoft. Hold production enablement until firewall rules are confirmed.',
  },

  // ─── F3: Analyst Agent ────────────────────────────────────────────────────

  // InfoSec
  {
    id: 'f3-is-1', feature_id: 'f3-analyst-agent', governance_function: 'InfoSec',
    title: 'Data processing within tenant boundary',
    status: 'Pass',
    finding: 'All data ingested by Analyst Agent — spreadsheets, database exports, SharePoint lists — is processed within the AccentureTEST M365 tenant. No data is transmitted to external compute outside the compliance boundary.',
    recommendation: null,
  },
  {
    id: 'f3-is-2', feature_id: 'f3-analyst-agent', governance_function: 'InfoSec',
    title: 'Code execution sandbox attestation published',
    status: 'Conditional',
    finding: 'Analyst Agent executes Python code in an Azure-managed sandbox. Microsoft confirms sandbox isolation but has not published a formal security attestation document or penetration test summary for the execution environment.',
    recommendation: 'Request Azure sandbox security attestation from Microsoft account team. Accept on interim basis with quarterly review.',
  },
  {
    id: 'f3-is-3', feature_id: 'f3-analyst-agent', governance_function: 'InfoSec',
    title: 'Encryption at rest and in transit',
    status: 'Pass',
    finding: 'Data processed in the analysis sandbox is encrypted using Azure platform encryption (AES-256 at rest, TLS 1.2+ in transit). Encryption standards meet AccentureTEST policy INFOSEC-003.',
    recommendation: null,
  },
  {
    id: 'f3-is-4', feature_id: 'f3-analyst-agent', governance_function: 'InfoSec',
    title: 'Analysis session audit trail available',
    status: 'Conditional',
    finding: 'Agent session logs (inputs, generated code, outputs) are available in Microsoft Purview Audit but are retained for only 30 days by default. AccentureTEST policy SEC-009 requires 90-day retention for analytical workloads involving financial data.',
    recommendation: 'Extend audit log retention to 90 days via Microsoft Purview Audit (Premium). Validate before enabling for financial services engagements.',
  },
  {
    id: 'f3-is-5', feature_id: 'f3-analyst-agent', governance_function: 'InfoSec',
    title: 'LLM access limited to execution context',
    status: 'Conditional',
    finding: 'Analyst Agent passes full dataset content to the LLM context window for code generation. For large datasets, this could expose more data than necessary to the model layer. No field-level redaction mechanism is available.',
    recommendation: 'Enforce data minimisation guidance: pre-process datasets to remove unnecessary columns/PII before providing to Analyst Agent.',
  },

  // Legal
  {
    id: 'f3-lg-1', feature_id: 'f3-analyst-agent', governance_function: 'Legal',
    title: 'GDPR data subject rights supported',
    status: 'Pass',
    finding: 'Analysis outputs stored in tenant are subject to standard GDPR DSR tooling via Microsoft Purview. AccentureTEST\'s existing DSR procedures cover Analyst Agent outputs without modification.',
    recommendation: null,
  },
  {
    id: 'f3-lg-2', feature_id: 'f3-analyst-agent', governance_function: 'Legal',
    title: 'Customer data excluded from model training',
    status: 'Pass',
    finding: 'Microsoft Product Terms confirm that datasets processed by Analyst Agent — including any PII or client data — are not used to train or improve the underlying LLM. Contractually binding commitment in the DPA.',
    recommendation: null,
  },
  {
    id: 'f3-lg-3', feature_id: 'f3-analyst-agent', governance_function: 'Legal',
    title: 'Financial data handling for regulated client engagements',
    status: 'Conditional',
    finding: 'AccentureTEST processes financial data on behalf of clients under FCA, SEC, and MAS regulated mandates. Analyst Agent\'s code execution environment has not been reviewed against the data handling requirements of these regulatory frameworks.',
    recommendation: 'Restrict Analyst Agent from processing client financial data until a regulatory mapping is completed. Engage Legal and Compliance for scoped approval by engagement type.',
  },
  {
    id: 'f3-lg-4', feature_id: 'f3-analyst-agent', governance_function: 'Legal',
    title: 'EU AI Act high-risk classification review',
    status: 'Conditional',
    finding: 'Automated quantitative data analysis that informs business decisions may fall within the EU AI Act\'s high-risk AI system classification (Annex III). Microsoft has not published a formal EUAIA conformity assessment for Analyst Agent.',
    recommendation: 'Commission an internal AI risk assessment before deploying Analyst Agent for any use case involving consequential decision-making for individuals.',
  },

  // IT
  {
    id: 'f3-it-1', feature_id: 'f3-analyst-agent', governance_function: 'IT',
    title: 'Entra ID authentication enforced',
    status: 'Pass',
    finding: 'Analyst Agent authenticates via Entra ID using standard delegated permissions. No service principal or elevated access is required. MFA and Conditional Access policies apply.',
    recommendation: null,
  },
  {
    id: 'f3-it-2', feature_id: 'f3-analyst-agent', governance_function: 'IT',
    title: 'Conditional Access compatibility',
    status: 'Pass',
    finding: 'Feature is compatible with AccentureTEST Conditional Access baseline. Tested with device compliance, sign-in risk, and location policies. No conflicts identified.',
    recommendation: null,
  },
  {
    id: 'f3-it-3', feature_id: 'f3-analyst-agent', governance_function: 'IT',
    title: 'Code execution environment admin controls',
    status: 'Conditional',
    finding: 'No admin toggle exists to restrict which Python libraries are available in the execution sandbox, nor to limit the volume of data that can be loaded into a single session. Resource quotas are not configurable.',
    recommendation: 'Engage Microsoft for sandbox governance roadmap. Implement compensating controls through internal acceptable-use policy for Analyst Agent.',
  },
  {
    id: 'f3-it-4', feature_id: 'f3-analyst-agent', governance_function: 'IT',
    title: 'DLP integration for analysis inputs',
    status: 'Conditional',
    finding: 'Files uploaded to Analyst Agent sessions are not scanned by Purview DLP at the point of upload. Sensitive data patterns (e.g., credit card numbers, NHS IDs) may be processed without triggering DLP alerts.',
    recommendation: 'Enable Purview sensitivity label auto-labelling on SharePoint libraries used as Analyst Agent data sources. Conduct a DLP gap analysis for high-sensitivity data categories.',
  },
  {
    id: 'f3-it-5', feature_id: 'f3-analyst-agent', governance_function: 'IT',
    title: 'Admin deployment scope controls',
    status: 'Pass',
    finding: 'Analyst Agent can be enabled per user group via the Microsoft 365 admin centre. Licence-based scoping supports phased rollout. Admin access requires no elevated privileges.',
    recommendation: null,
  },

  // ─── F4: Sales Agent ──────────────────────────────────────────────────────

  // InfoSec
  {
    id: 'f4-is-1', feature_id: 'f4-sales-agent', governance_function: 'InfoSec',
    title: 'CRM data access scoped to user territory',
    status: 'Fail',
    finding: 'Sales Agent accesses all Dynamics 365 Sales records within the tenant by default, regardless of the authenticated user\'s assigned sales territory or security role. This violates AccentureTEST policy INFOSEC-011 (least-privilege data access).',
    recommendation: 'Block deployment until Microsoft provides territory-scoped data access controls. Raise as a blocking issue with Dynamics 365 Product Group.',
  },
  {
    id: 'f4-is-2', feature_id: 'f4-sales-agent', governance_function: 'InfoSec',
    title: 'Third-party model sub-processor disclosed',
    status: 'Needs Info',
    finding: 'Microsoft documentation for Sales Agent v1.0 does not disclose the LLM provider or processing endpoint for lead qualification and outreach drafting functions. The sub-processor list references generic Azure OpenAI but does not confirm routing for this specific agent.',
    recommendation: 'Request agent-specific sub-processor disclosure from Microsoft. Do not proceed until confirmed.',
  },
  {
    id: 'f4-is-3', feature_id: 'f4-sales-agent', governance_function: 'InfoSec',
    title: 'Encryption at rest and in transit',
    status: 'Pass',
    finding: 'Data transiting between Dynamics 365 and the Sales Agent compute layer uses TLS 1.2+. CRM data at rest is encrypted under Azure platform encryption. Consistent with AccentureTEST policy INFOSEC-003.',
    recommendation: null,
  },
  {
    id: 'f4-is-4', feature_id: 'f4-sales-agent', governance_function: 'InfoSec',
    title: 'Prompt injection protection for CRM inputs',
    status: 'Conditional',
    finding: 'Sales Agent processes CRM record content (lead notes, email threads) as part of its context. No documented defence against adversarially crafted CRM entries designed to manipulate agent behaviour.',
    recommendation: 'Request Microsoft\'s prompt injection mitigation documentation for Sales Agent. Apply content sanitisation controls on CRM input fields used by the agent.',
  },
  {
    id: 'f4-is-5', feature_id: 'f4-sales-agent', governance_function: 'InfoSec',
    title: 'External data sharing via lead enrichment service',
    status: 'Fail',
    finding: 'Sales Agent sends prospect name, company, and job title to a third-party lead enrichment provider to augment CRM records. This third party is not listed in Microsoft\'s sub-processor documentation and has not been reviewed by AccentureTEST InfoSec.',
    recommendation: 'Disable lead enrichment feature until the third-party provider completes AccentureTEST\'s vendor security assessment. Treat as a blocking control failure.',
  },

  // Legal
  {
    id: 'f4-lg-1', feature_id: 'f4-sales-agent', governance_function: 'Legal',
    title: 'Lawful basis for AI processing of prospect data',
    status: 'Fail',
    finding: 'Sales Agent processes prospect personal data (name, email, company, role) in an automated AI pipeline. No documented lawful basis under GDPR Article 6 exists for this specific processing activity. AccentureTEST\'s current ROPA does not cover AI-driven prospect enrichment.',
    recommendation: 'Halt deployment until Legal documents an appropriate lawful basis and updates the ROPA. Likely requires Legitimate Interests Assessment given the nature of processing.',
  },
  {
    id: 'f4-lg-2', feature_id: 'f4-sales-agent', governance_function: 'Legal',
    title: 'Training data exclusion for fine-tuning',
    status: 'Conditional',
    finding: 'Microsoft\'s standard training exclusion commitment covers the base foundation model. Sales Agent v1.0 documentation is ambiguous about whether customer CRM data could be used for domain-specific fine-tuning of the sales qualification model.',
    recommendation: 'Obtain written confirmation from Microsoft that CRM data is excluded from any fine-tuning process before deployment.',
  },
  {
    id: 'f4-lg-3', feature_id: 'f4-sales-agent', governance_function: 'Legal',
    title: 'Cross-border transfer for lead enrichment',
    status: 'Needs Info',
    finding: 'The third-party lead enrichment service used by Sales Agent has not disclosed its data processing jurisdiction. If processing occurs outside the EEA, AccentureTEST requires SCCs or equivalent transfer mechanisms to be in place.',
    recommendation: 'Do not enable lead enrichment until jurisdiction is confirmed and appropriate transfer safeguards are documented.',
  },
  {
    id: 'f4-lg-4', feature_id: 'f4-sales-agent', governance_function: 'Legal',
    title: 'Data retention aligned to CRM policy',
    status: 'Conditional',
    finding: 'Agent-generated outreach drafts and lead qualification summaries are retained in Dynamics 365 indefinitely unless manually deleted. AccentureTEST CRM retention policy requires AI-generated records to follow the same 7-year retention schedule as human-authored records, with clear deletion workflows.',
    recommendation: 'Configure Dynamics 365 retention labels to apply to agent-generated records before deployment.',
  },
  {
    id: 'f4-lg-5', feature_id: 'f4-sales-agent', governance_function: 'Legal',
    title: 'EU AI Act compliance for automated decision-making',
    status: 'Conditional',
    finding: 'Automated lead qualification may constitute profiling with significant effects under GDPR Article 22 and high-risk AI under the EU AI Act if decisions meaningfully affect individuals\' business opportunities. Classification is unresolved.',
    recommendation: 'Commission EU AI Act risk classification and GDPR Article 22 assessment before enabling autonomous lead qualification for EU-based prospects.',
  },

  // IT
  {
    id: 'f4-it-1', feature_id: 'f4-sales-agent', governance_function: 'IT',
    title: 'Entra ID authentication enforced',
    status: 'Pass',
    finding: 'Sales Agent authenticates to Dynamics 365 via Entra ID. Standard Conditional Access and MFA policies apply to the user session. No bypass paths identified.',
    recommendation: null,
  },
  {
    id: 'f4-it-2', feature_id: 'f4-sales-agent', governance_function: 'IT',
    title: 'Initial setup requires Global Admin delegation',
    status: 'Fail',
    finding: 'Sales Agent v1.0 installation requires temporary Global Administrator role assignment to configure the agent\'s Dynamics 365 service principal. This violates AccentureTEST policy IT-ARCH-007 (no standing Global Admin for feature deployments).',
    recommendation: 'Block deployment. Request Microsoft to provide a scoped installation principal with least-privilege permissions. Engage D365 Product Group.',
  },
  {
    id: 'f4-it-3', feature_id: 'f4-sales-agent', governance_function: 'IT',
    title: 'Network egress endpoints for enrichment service',
    status: 'Needs Info',
    finding: 'The lead enrichment service endpoints are not documented in Sales Agent v1.0 technical documentation. AccentureTEST requires explicit firewall approval for all outbound SaaS connections.',
    recommendation: 'Request network requirements documentation before any test deployment.',
  },
  {
    id: 'f4-it-4', feature_id: 'f4-sales-agent', governance_function: 'IT',
    title: 'Admin controls for autonomous action scope',
    status: 'Conditional',
    finding: 'Admins can disable lead enrichment and outreach drafting independently, but cannot restrict the agent to read-only CRM access. The agent can write to CRM records (update lead status, add notes) without a pre-approval workflow.',
    recommendation: 'Enforce write-action approval controls via Power Automate flow before deployment. Do not allow autonomous CRM writes in production until approval gate is implemented.',
  },
  {
    id: 'f4-it-5', feature_id: 'f4-sales-agent', governance_function: 'IT',
    title: 'DLP coverage for outreach email content',
    status: 'Conditional',
    finding: 'Agent-drafted outreach emails pass through Exchange Online, where Purview DLP policies apply at send time. However, draft content stored in Dynamics 365 before sending is not inspected by DLP.',
    recommendation: 'Configure Dynamics 365 field-level DLP or manual review gate before outreach drafts are sent.',
  },

  // ─── F5: Copilot in Excel / Word / Teams ─────────────────────────────────

  // InfoSec
  {
    id: 'f5-is-1', feature_id: 'f5-copilot-office', governance_function: 'InfoSec',
    title: 'Data residency within M365 tenant boundary',
    status: 'Pass',
    finding: 'All document content and prompt data is processed within the AccentureTEST M365 tenant. EU data residency commitment is satisfied for EU-region users. No data leaves the compliance boundary.',
    recommendation: null,
  },
  {
    id: 'f5-is-2', feature_id: 'f5-copilot-office', governance_function: 'InfoSec',
    title: 'Encryption at rest and in transit',
    status: 'Pass',
    finding: 'AES-256 encryption at rest and TLS 1.2+ in transit confirmed across Excel, Word, and Teams Copilot features. Meets AccentureTEST policy INFOSEC-003.',
    recommendation: null,
  },
  {
    id: 'f5-is-3', feature_id: 'f5-copilot-office', governance_function: 'InfoSec',
    title: 'Interaction logging retention configurable',
    status: 'Pass',
    finding: 'Copilot interaction logs are configurable via Microsoft Purview Audit with retention up to 180 days under Audit (Premium). AccentureTEST has configured 90-day retention in alignment with SEC-009.',
    recommendation: null,
  },
  {
    id: 'f5-is-4', feature_id: 'f5-copilot-office', governance_function: 'InfoSec',
    title: 'Model sub-processor documented in DPA',
    status: 'Pass',
    finding: 'Azure OpenAI Service is listed as a sub-processor in the Microsoft Online Services DPA. Processing jurisdiction, encryption standards, and data handling terms are fully documented and reviewed.',
    recommendation: null,
  },

  // Legal
  {
    id: 'f5-lg-1', feature_id: 'f5-copilot-office', governance_function: 'Legal',
    title: 'GDPR data subject rights supported',
    status: 'Pass',
    finding: 'GDPR DSR procedures apply through standard M365 compliance tooling. No additional configuration required for Excel, Word, or Teams Copilot features.',
    recommendation: null,
  },
  {
    id: 'f5-lg-2', feature_id: 'f5-copilot-office', governance_function: 'Legal',
    title: 'Customer data excluded from model training',
    status: 'Pass',
    finding: 'Microsoft Product Terms and DPA contractually exclude all tenant content processed by Excel, Word, and Teams Copilot from model training and improvement.',
    recommendation: null,
  },
  {
    id: 'f5-lg-3', feature_id: 'f5-copilot-office', governance_function: 'Legal',
    title: 'EU AI Act transparency requirements',
    status: 'Pass',
    finding: 'AI-generated content in Word is marked with an AI attribution indicator. Teams meeting summaries include Copilot-generated labels. Disclosure mechanisms meet EU AI Act Article 52 requirements.',
    recommendation: null,
  },
  {
    id: 'f5-lg-4', feature_id: 'f5-copilot-office', governance_function: 'Legal',
    title: 'End-user acknowledgement and consent',
    status: 'Pass',
    finding: 'AccentureTEST deployed a first-use acknowledgement banner via Viva Connections informing users of Copilot capabilities and data use before activation. Policy LEG-022 satisfied.',
    recommendation: null,
  },

  // IT
  {
    id: 'f5-it-1', feature_id: 'f5-copilot-office', governance_function: 'IT',
    title: 'Entra ID authentication and SSO',
    status: 'Pass',
    finding: 'All three features authenticate via Entra ID. SSO, MFA, and Conditional Access policies enforced uniformly. No additional credential store required.',
    recommendation: null,
  },
  {
    id: 'f5-it-2', feature_id: 'f5-copilot-office', governance_function: 'IT',
    title: 'Conditional Access compatibility',
    status: 'Pass',
    finding: 'Features tested against AccentureTEST CA baseline (device compliance, sign-in risk, MFA). No policy conflicts identified. Compliant mode access enforced on unmanaged devices.',
    recommendation: null,
  },
  {
    id: 'f5-it-3', feature_id: 'f5-copilot-office', governance_function: 'IT',
    title: 'Microsoft Purview DLP integration',
    status: 'Pass',
    finding: 'Purview DLP sensitivity label policies are respected by Excel, Word, and Teams Copilot. Files labelled HIGHLY CONFIDENTIAL are excluded from Copilot grounding. DLP event logging confirmed for Copilot interactions.',
    recommendation: null,
  },
  {
    id: 'f5-it-4', feature_id: 'f5-copilot-office', governance_function: 'IT',
    title: 'Admin deployment scope and licence controls',
    status: 'Pass',
    finding: 'Features deployed via M365 admin centre using licence-based group assignment. Phased rollout completed without elevated permissions. Admin controls verified end-to-end.',
    recommendation: null,
  },

  // ─── F6: M365 App Builder ─────────────────────────────────────────────────

  // InfoSec
  {
    id: 'f6-is-1', feature_id: 'f6-app-builder', governance_function: 'InfoSec',
    title: 'Custom agents inherit tenant data access without scoping',
    status: 'Conditional',
    finding: 'Agents built on App Builder inherit the publishing user\'s M365 permissions by default. No platform-level enforcement of least-privilege data access for custom agents. An agent published by a Global Admin could access the full tenant.',
    recommendation: 'Require all custom agents to use a dedicated service account with scoped permissions. Enforce via AccentureTEST App Builder governance policy before any agent publication.',
  },
  {
    id: 'f6-is-2', feature_id: 'f6-app-builder', governance_function: 'InfoSec',
    title: 'Code execution environment for custom agents',
    status: 'Conditional',
    finding: 'Custom agents built with code actions run in an Azure-managed sandbox, but the security isolation attestation for builder-created agents has not been separately reviewed from the first-party agent sandbox.',
    recommendation: 'Treat all custom agents with code actions as requiring InfoSec architecture review before publication to the organisational agent catalogue.',
  },
  {
    id: 'f6-is-3', feature_id: 'f6-app-builder', governance_function: 'InfoSec',
    title: 'Third-party connector security review',
    status: 'Conditional',
    finding: 'App Builder supports connecting custom agents to third-party APIs and services via Power Platform connectors. Third-party connectors are not reviewed by Microsoft before they can be used by agent builders.',
    recommendation: 'Restrict connector use to the AccentureTEST-approved connector list. Block custom or non-certified connectors via Power Platform DLP policy.',
  },
  {
    id: 'f6-is-4', feature_id: 'f6-app-builder', governance_function: 'InfoSec',
    title: 'Encryption at rest and in transit',
    status: 'Pass',
    finding: 'The App Builder platform and all published agent data use Azure platform encryption (AES-256 at rest, TLS 1.2+ in transit). Encryption standards consistent with AccentureTEST policy INFOSEC-003.',
    recommendation: null,
  },
  {
    id: 'f6-is-5', feature_id: 'f6-app-builder', governance_function: 'InfoSec',
    title: 'Agent publication requires admin approval',
    status: 'Conditional',
    finding: 'Any licensed user can build and publish an agent to the organisational catalogue without admin approval. This creates a risk of unreviewed agents with broad permissions becoming available across AccentureTEST.',
    recommendation: 'Enable Admin approval for agent publication via M365 admin centre App Builder settings. Make approval mandatory before enabling the platform broadly.',
  },

  // Legal
  {
    id: 'f6-lg-1', feature_id: 'f6-app-builder', governance_function: 'Legal',
    title: 'GDPR compliance responsibility for custom agents',
    status: 'Conditional',
    finding: 'AccentureTEST is the data controller for any personal data processed by custom-built agents. Microsoft\'s DPA covers the platform but not the compliance of individual agent logic. AccentureTEST must conduct DPIAs for any agent processing personal data at scale.',
    recommendation: 'Publish an internal DPIA template for App Builder agents. Require DPIA completion before agents are promoted to the organisational catalogue.',
  },
  {
    id: 'f6-lg-2', feature_id: 'f6-app-builder', governance_function: 'Legal',
    title: 'Customer data excluded from model training',
    status: 'Pass',
    finding: 'Microsoft\'s training exclusion commitment applies to the platform LLM. Data processed by custom agents is subject to the same tenant-data-not-used-for-training commitment as first-party Copilot features.',
    recommendation: null,
  },
  {
    id: 'f6-lg-3', feature_id: 'f6-app-builder', governance_function: 'Legal',
    title: 'IP ownership of agent definitions and system prompts',
    status: 'Conditional',
    finding: 'Microsoft\'s Terms of Service grant AccentureTEST ownership of agent configurations and system prompts created within the platform. However, terms are ambiguous regarding agent configurations that incorporate Microsoft-provided templates.',
    recommendation: 'Review agent IP ownership terms with Legal before building proprietary IP into app builder agents. Flag for contract review with Microsoft account team.',
  },
  {
    id: 'f6-lg-4', feature_id: 'f6-app-builder', governance_function: 'Legal',
    title: 'Regulatory compliance for industry-specific agents',
    status: 'Needs Info',
    finding: 'AccentureTEST engagements span financial services, healthcare, and public sector. Agents built for these verticals may require additional regulatory approval (FCA, HIPAA, GDPR special categories). The App Builder platform has no built-in vertical compliance guardrails.',
    recommendation: 'Require vertical-specific compliance review for any agent built for regulated industry use cases. Establish a review checklist before App Builder is enabled for regulated engagement teams.',
  },

  // IT
  {
    id: 'f6-it-1', feature_id: 'f6-app-builder', governance_function: 'IT',
    title: 'Entra ID authentication for published agents',
    status: 'Pass',
    finding: 'All agents published via App Builder authenticate end users via Entra ID. No anonymous access or alternative authentication paths are supported by the platform.',
    recommendation: null,
  },
  {
    id: 'f6-it-2', feature_id: 'f6-app-builder', governance_function: 'IT',
    title: 'Centralised registry of published agents',
    status: 'Conditional',
    finding: 'No native admin console provides a comprehensive view of all published agents across the tenant, their data connections, and active user counts. IT cannot identify all agents in production.',
    recommendation: 'Build an agent inventory using Microsoft Graph API agent queries. Establish quarterly review of published agents as part of IT governance cadence.',
  },
  {
    id: 'f6-it-3', feature_id: 'f6-app-builder', governance_function: 'IT',
    title: 'External API dependency security review',
    status: 'Conditional',
    finding: 'Agents can connect to external APIs without IT review of the dependency\'s security posture, SLA, or data handling practices. An outage or compromise of an external API could impact tenant data or agent availability.',
    recommendation: 'Enforce connector allowlisting via Power Platform DLP before App Builder goes live. All external API dependencies must pass AccentureTEST vendor security assessment.',
  },
  {
    id: 'f6-it-4', feature_id: 'f6-app-builder', governance_function: 'IT',
    title: 'DLP policies applied to agent interactions',
    status: 'Pass',
    finding: 'Power Platform DLP policies apply to App Builder agents and restrict which connectors can be used. Existing DLP connector classification rules provide a baseline control layer.',
    recommendation: null,
  },
  {
    id: 'f6-it-5', feature_id: 'f6-app-builder', governance_function: 'IT',
    title: 'Agent lifecycle management and deprecation workflow',
    status: 'Conditional',
    finding: 'No formal deprecation or retirement workflow exists for published agents. Agents connecting to decommissioned data sources or using outdated system prompts can remain active indefinitely.',
    recommendation: 'Implement an agent review cycle (quarterly) and a deprecation workflow requiring admin approval to deactivate agents. Include in App Builder governance policy.',
  },

  // ─── F7: Anthropic Claude in MS Foundry ───────────────────────────────────

  // InfoSec
  {
    id: 'f7-is-1', feature_id: 'f7-claude-foundry', governance_function: 'InfoSec',
    title: 'Data processing jurisdiction and residency',
    status: 'Conditional',
    finding: 'Claude 3.7 models are served via Azure AI Foundry infrastructure within Azure regions. However, Anthropic\'s sub-processing terms do not specify whether model inference occurs exclusively within the Azure compute boundary or involves Anthropic-operated infrastructure.',
    recommendation: 'Obtain written confirmation from Microsoft/Anthropic that inference for Foundry-deployed Claude models occurs exclusively within Azure-managed infrastructure. Hold production use until confirmed.',
  },
  {
    id: 'f7-is-2', feature_id: 'f7-claude-foundry', governance_function: 'InfoSec',
    title: 'Anthropic DPA aligned to AccentureTEST processor terms',
    status: 'Fail',
    finding: 'Anthropic\'s Data Processing Agreement does not meet AccentureTEST\'s standard data processor requirements in several areas: audit rights (Anthropic limits to questionnaire-based audits only), sub-processor notification period (14 days vs. AccentureTEST\'s required 30 days), and breach notification SLA (72 hours vs. required 48 hours).',
    recommendation: 'Escalate DPA gaps to Legal and Procurement. Do not use Claude in Foundry for any processing of AccentureTEST or client data until a compliant DPA is executed.',
  },
  {
    id: 'f7-is-3', feature_id: 'f7-claude-foundry', governance_function: 'InfoSec',
    title: 'Encryption at rest and in transit',
    status: 'Pass',
    finding: 'Azure AI Foundry enforces Azure platform encryption (AES-256 at rest, TLS 1.2+ in transit) for all model inference requests. Encryption standards meet AccentureTEST policy INFOSEC-003 at the infrastructure layer.',
    recommendation: null,
  },
  {
    id: 'f7-is-4', feature_id: 'f7-claude-foundry', governance_function: 'InfoSec',
    title: 'Anthropic prompt retention for safety monitoring',
    status: 'Needs Info',
    finding: 'Anthropic\'s enterprise terms indicate prompts are not used for training but do not clearly specify whether prompts are retained for safety monitoring, trust and safety reviews, or abuse detection, and if so, for how long.',
    recommendation: 'Require written clarification from Anthropic on prompt retention practices before production deployment.',
  },
  {
    id: 'f7-is-5', feature_id: 'f7-claude-foundry', governance_function: 'InfoSec',
    title: 'Vulnerability disclosure and security patching process',
    status: 'Needs Info',
    finding: 'Anthropic\'s enterprise security documentation does not include a published vulnerability disclosure policy, CVE tracking process, or SLA for security patches to production model deployments. Enterprise customers have no mechanism to receive timely security bulletins.',
    recommendation: 'Request Anthropic\'s enterprise security policy documentation. Assess against AccentureTEST\'s third-party vendor security requirements before approval.',
  },

  // Legal
  {
    id: 'f7-lg-1', feature_id: 'f7-claude-foundry', governance_function: 'Legal',
    title: 'GDPR data processor agreement compliant',
    status: 'Fail',
    finding: 'Anthropic\'s EU Data Processing Addendum does not satisfy AccentureTEST\'s contractual requirements. Key gaps: audit rights limited to questionnaires, sub-processor list not available for contractual review, and breach notification timelines do not meet AccentureTEST\'s client contractual obligations.',
    recommendation: 'Do not process any personal data via Claude in Foundry until a compliant GDPR DPA is signed. Escalate to Legal and Procurement immediately.',
  },
  {
    id: 'f7-lg-2', feature_id: 'f7-claude-foundry', governance_function: 'Legal',
    title: 'Customer data excluded from model training',
    status: 'Conditional',
    finding: 'Anthropic\'s enterprise terms include a training opt-out, but the commitment is framed as a customer opt-out rather than an unconditional exclusion. Confirmation of opt-out activation for the AccentureTEST Foundry deployment has not been obtained.',
    recommendation: 'Obtain written confirmation that training opt-out is active for the AccentureTEST Foundry workspace before any data is submitted to the model.',
  },
  {
    id: 'f7-lg-3', feature_id: 'f7-claude-foundry', governance_function: 'Legal',
    title: 'EU AI Act classification for Claude 3.7',
    status: 'Needs Info',
    finding: 'Anthropic has not published a formal EU AI Act general-purpose AI (GPAI) model conformity documentation for Claude 3.7. Obligations under Title II of the EU AI Act apply to GPAI model providers. AccentureTEST\'s obligation as a deployer is contingent on provider compliance.',
    recommendation: 'Monitor Anthropic\'s EU AI Act compliance disclosures. Do not deploy for high-risk use cases until GPAI documentation is published.',
  },
  {
    id: 'f7-lg-4', feature_id: 'f7-claude-foundry', governance_function: 'Legal',
    title: 'Cross-border data transfers (EU↔US)',
    status: 'Conditional',
    finding: 'Anthropic is a US-based company. EU Standard Contractual Clauses are included in the DPA, but their applicability depends on whether inference processing occurs on EU-region Azure infrastructure or involves Anthropic-operated US infrastructure. Jurisdiction is unconfirmed.',
    recommendation: 'Resolve processing jurisdiction (see InfoSec check IS-1) before relying on SCCs. Engage Legal for adequacy mechanism assessment.',
  },
  {
    id: 'f7-lg-5', feature_id: 'f7-claude-foundry', governance_function: 'Legal',
    title: 'Liability and indemnification cap',
    status: 'Fail',
    finding: 'Anthropic\'s enterprise terms cap total liability at 12 months of fees paid. AccentureTEST\'s standard vendor contract requires a minimum liability cap of £10M for AI processing services given client indemnification obligations. The current Anthropic cap falls materially short.',
    recommendation: 'Engage Procurement to negotiate enhanced liability terms as a condition of approval. Do not deploy for client engagements until resolved.',
  },

  // IT
  {
    id: 'f7-it-1', feature_id: 'f7-claude-foundry', governance_function: 'IT',
    title: 'Entra ID authentication via Azure AI Foundry',
    status: 'Pass',
    finding: 'Claude models accessed via Azure AI Foundry use Entra ID authentication through the Foundry workspace. Standard Conditional Access and RBAC controls apply at the Azure resource level.',
    recommendation: null,
  },
  {
    id: 'f7-it-2', feature_id: 'f7-claude-foundry', governance_function: 'IT',
    title: 'API key rotation policy configurable',
    status: 'Conditional',
    finding: 'Azure AI Foundry manages API keys for Claude model access at the workspace level. However, key rotation policy is not configurable — rotation is manual and there is no automated expiry or rotation enforcement.',
    recommendation: 'Implement manual API key rotation on a 90-day schedule via Foundry workspace administration. Document in AccentureTEST\'s secrets management runbook.',
  },
  {
    id: 'f7-it-3', feature_id: 'f7-claude-foundry', governance_function: 'IT',
    title: 'Model version update notification and pinning',
    status: 'Conditional',
    finding: 'Claude model versions in Foundry can be updated by Anthropic/Microsoft without advance admin notification. Model behaviour changes between versions could introduce unexpected outputs in production applications.',
    recommendation: 'Pin model versions at the Foundry deployment level and require an internal change approval process before version upgrades.',
  },
  {
    id: 'f7-it-4', feature_id: 'f7-claude-foundry', governance_function: 'IT',
    title: 'Network isolation and egress controls',
    status: 'Conditional',
    finding: 'Model inference requests are routed from the AccentureTEST tenant through Azure AI Foundry to Claude model endpoints. These endpoints are outside the AccentureTEST M365 tenant boundary. Network egress to Foundry endpoints requires explicit firewall approval.',
    recommendation: 'Document Foundry model endpoint IP ranges and submit for network security firewall approval. Enable Private Endpoint for Foundry workspace where supported.',
  },
]

export const EVIDENCE: SeedEvidence[] = [
  // F1-IS-1
  { id: 'ev-f1-is-1-a', check_id: 'f1-is-1', source_title: 'Microsoft 365 Copilot — Privacy and Security', source_url: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-privacy', excerpt: 'Microsoft 365 Copilot operates within the Microsoft 365 trust boundary. It uses the same data residency, data protection, and privacy commitments that apply to your existing Microsoft 365 services.', accessed_date: '2026-04-15' },
  { id: 'ev-f1-is-1-b', check_id: 'f1-is-1', source_title: 'Microsoft 365 Data Residency Overview', source_url: 'https://learn.microsoft.com/en-us/microsoft-365/enterprise/o365-data-locations', excerpt: 'Customers can review the geographic location of their tenant data at rest through the data location page in the Microsoft 365 admin center.', accessed_date: '2026-04-15' },

  // F1-IS-2
  { id: 'ev-f1-is-2-a', check_id: 'f1-is-2', source_title: 'Encryption in Microsoft 365', source_url: 'https://learn.microsoft.com/en-us/microsoft-365/compliance/encryption', excerpt: 'Microsoft 365 uses service-side encryption with AES-256 for data at rest. Data in transit is protected by TLS 1.2 or higher between Microsoft datacenters and between clients and Microsoft 365 services.', accessed_date: '2026-04-15' },

  // F1-IS-3
  { id: 'ev-f1-is-3-a', check_id: 'f1-is-3', source_title: 'Microsoft Purview Audit — Microsoft 365 Copilot interactions', source_url: 'https://learn.microsoft.com/en-us/purview/audit-log-activities', excerpt: 'Microsoft Purview Audit logs Copilot activity events including prompt and response data. Retention periods are configurable via Audit Premium from 90 days to 10 years.', accessed_date: '2026-04-16' },

  // F1-IS-4
  { id: 'ev-f1-is-4-a', check_id: 'f1-is-4', source_title: 'Microsoft Products and Services Data Protection Addendum (DPA)', source_url: 'https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA', excerpt: 'The DPA sub-processor list identifies Azure OpenAI Service as a sub-processor for AI workloads. Specific routing paths and model versions are subject to change and are not enumerated at the feature level.', accessed_date: '2026-04-16' },

  // F1-IS-5
  { id: 'ev-f1-is-5-a', check_id: 'f1-is-5', source_title: 'Manage Microsoft 365 Copilot with sensitivity labels', source_url: 'https://learn.microsoft.com/en-us/purview/sensitivity-labels-copilot', excerpt: 'Sensitivity labels can be used to restrict Microsoft 365 Copilot from accessing and summarising labeled items. Labels must be configured in Microsoft Purview Information Protection.', accessed_date: '2026-04-17' },

  // F1-LG-1
  { id: 'ev-f1-lg-1-a', check_id: 'f1-lg-1', source_title: 'GDPR Data Subject Requests for Microsoft 365', source_url: 'https://learn.microsoft.com/en-us/compliance/regulatory/gdpr-data-subject-requests', excerpt: 'Microsoft provides tools to help you respond to data subject requests under GDPR. These tools are available in Microsoft Purview compliance portal and support access, deletion, and export of personal data.', accessed_date: '2026-04-15' },

  // F1-LG-2
  { id: 'ev-f1-lg-2-a', check_id: 'f1-lg-2', source_title: 'Microsoft 365 Copilot — Privacy and Security', source_url: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-privacy', excerpt: 'Microsoft does not use your tenant data, including prompts and responses, to train or improve foundation AI models without your consent. This commitment is reflected in the Microsoft Products and Services Data Protection Addendum.', accessed_date: '2026-04-15' },

  // F1-LG-3
  { id: 'ev-f1-lg-3-a', check_id: 'f1-lg-3', source_title: 'EU AI Act — Microsoft Responsible AI overview', source_url: 'https://learn.microsoft.com/en-us/azure/ai-services/responsible-use-of-ai-overview', excerpt: 'Microsoft provides guidance on transparency requirements under the EU AI Act for AI systems that interact with natural persons. Disclosure mechanisms are documented per product.', accessed_date: '2026-04-16' },

  // F1-LG-4
  { id: 'ev-f1-lg-4-a', check_id: 'f1-lg-4', source_title: 'Microsoft 365 Copilot admin controls', source_url: 'https://learn.microsoft.com/en-us/microsoft-365/admin/copilot/microsoft-365-copilot-page', excerpt: 'Copilot is enabled for users through admin-assigned licenses and policies. The admin centre provides controls for enabling or disabling Copilot by user group.', accessed_date: '2026-04-16' },

  // F1-IT-3
  { id: 'ev-f1-it-3-a', check_id: 'f1-it-3', source_title: 'Microsoft Purview Communication Compliance — Copilot interactions', source_url: 'https://learn.microsoft.com/en-us/purview/communication-compliance-policies', excerpt: 'Communication Compliance policies can be configured to capture Microsoft 365 Copilot interactions for review. This extends DLP-like oversight to AI-generated content and user prompts.', accessed_date: '2026-04-17' },

  // F2-IS-1
  { id: 'ev-f2-is-1-a', check_id: 'f2-is-1', source_title: 'Microsoft 365 Copilot — Researcher agent overview', source_url: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-privacy', excerpt: 'The Researcher agent uses Bing to retrieve web content. Search queries are processed by Bing as a Microsoft sub-processor. Query data is subject to the Microsoft Online Services DPA.', accessed_date: '2026-04-18' },

  // F2-IS-3
  { id: 'ev-f2-is-3-a', check_id: 'f2-is-3', source_title: 'Microsoft Online Services Sub-processor List', source_url: 'https://www.microsoft.com/en-us/download/details.aspx?id=103408', excerpt: 'Microsoft publishes a list of sub-processors engaged for the delivery of Online Services. The list is updated periodically and customers are notified of material changes.', accessed_date: '2026-04-18' },

  // F2-IT-4
  { id: 'ev-f2-it-4-a', check_id: 'f2-it-4', source_title: 'Microsoft 365 network connectivity principles', source_url: 'https://learn.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-network-connectivity-principles', excerpt: 'Microsoft publishes network endpoint documentation for Microsoft 365 services. Service-specific endpoint lists are available and updated monthly.', accessed_date: '2026-04-19' },

  // F3-IS-2
  { id: 'ev-f3-is-2-a', check_id: 'f3-is-2', source_title: 'Azure OpenAI data privacy and security', source_url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/data-privacy', excerpt: 'Azure AI services process data within Azure compute infrastructure. The execution environment uses Azure\'s standard security controls including network isolation and data encryption.', accessed_date: '2026-04-18' },

  // F3-LG-3
  { id: 'ev-f3-lg-3-a', check_id: 'f3-lg-3', source_title: 'Microsoft compliance offerings — Financial services', source_url: 'https://learn.microsoft.com/en-us/compliance/regulatory/offering-home', excerpt: 'Microsoft provides compliance documentation for regulated industries including financial services (FCA, SEC, MAS). Compliance applicability varies by product and service configuration.', accessed_date: '2026-04-19' },

  // F4-IS-1
  { id: 'ev-f4-is-1-a', check_id: 'f4-is-1', source_title: 'Dynamics 365 Sales — Security model overview', source_url: 'https://learn.microsoft.com/en-us/dynamics365/sales/security-roles-privileges', excerpt: 'Dynamics 365 uses a role-based security model to control data access. Security roles define which records a user can access and what operations they can perform.', accessed_date: '2026-04-19' },

  // F4-IS-5
  { id: 'ev-f4-is-5-a', check_id: 'f4-is-5', source_title: 'Microsoft Online Services Sub-processor List', source_url: 'https://www.microsoft.com/en-us/download/details.aspx?id=103408', excerpt: 'Microsoft publishes and maintains a list of sub-processors. Third-party enrichment services used by Dynamics 365 agents are subject to review against this published list.', accessed_date: '2026-04-20' },

  // F4-LG-1
  { id: 'ev-f4-lg-1-a', check_id: 'f4-lg-1', source_title: 'GDPR — Lawful basis for processing personal data', source_url: 'https://learn.microsoft.com/en-us/compliance/regulatory/gdpr-data-subject-requests', excerpt: 'Under GDPR, processing of personal data requires a documented lawful basis under Article 6. Automated processing activities must be reflected in the organisation\'s Record of Processing Activities (ROPA).', accessed_date: '2026-04-20' },

  // F4-IT-2
  { id: 'ev-f4-it-2-a', check_id: 'f4-it-2', source_title: 'Dynamics 365 — Administrator permissions and roles', source_url: 'https://learn.microsoft.com/en-us/dynamics365/get-started/admin', excerpt: 'Dynamics 365 administrative operations typically require the System Administrator role within Dynamics 365, which is separate from Azure AD Global Administrator. However, initial service principal configuration may require elevated Azure AD permissions.', accessed_date: '2026-04-20' },

  // F5-IS-1
  { id: 'ev-f5-is-1-a', check_id: 'f5-is-1', source_title: 'Microsoft 365 Copilot — Privacy and Security', source_url: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-privacy', excerpt: 'Copilot in Excel, Word, and Teams is included within the Microsoft 365 Copilot service boundary. Data residency, retention, and security commitments are consistent with existing Microsoft 365 service terms.', accessed_date: '2026-04-14' },
  { id: 'ev-f5-is-1-b', check_id: 'f5-is-1', source_title: 'Microsoft Trust Center — Privacy', source_url: 'https://www.microsoft.com/en-us/trust-center/privacy', excerpt: 'Microsoft commits to processing customer data only in accordance with the customer\'s instructions and applicable law. Data residency options are available for Microsoft 365 customers.', accessed_date: '2026-04-14' },

  // F5-LG-3
  { id: 'ev-f5-lg-3-a', check_id: 'f5-lg-3', source_title: 'EU AI Act — Transparency obligations for AI systems', source_url: 'https://learn.microsoft.com/en-us/azure/ai-services/responsible-use-of-ai-overview', excerpt: 'Microsoft has implemented AI attribution and disclosure mechanisms in Microsoft 365 Copilot products to satisfy transparency requirements. AI-generated content is labelled in supported applications.', accessed_date: '2026-04-14' },

  // F6-IS-3
  { id: 'ev-f6-is-3-a', check_id: 'f6-is-3', source_title: 'Power Platform DLP policies — Connector classification', source_url: 'https://learn.microsoft.com/en-us/power-platform/admin/dlp-connector-classification', excerpt: 'Power Platform Data Loss Prevention policies allow administrators to classify connectors as Business, Non-Business, or Blocked. Custom connector policies can be used to restrict which services agents may connect to.', accessed_date: '2026-04-20' },

  // F6-LG-4
  { id: 'ev-f6-lg-4-a', check_id: 'f6-lg-4', source_title: 'Microsoft Compliance — Financial services and healthcare offerings', source_url: 'https://learn.microsoft.com/en-us/compliance/regulatory/offering-home', excerpt: 'Microsoft maintains compliance documentation for regulated industry verticals. Customers building custom applications on Microsoft platforms are responsible for compliance with applicable vertical regulations.', accessed_date: '2026-04-21' },

  // F7-IS-2
  { id: 'ev-f7-is-2-a', check_id: 'f7-is-2', source_title: 'Anthropic Privacy Policy', source_url: 'https://www.anthropic.com/legal/privacy', excerpt: 'Anthropic\'s privacy policy and commercial terms describe data handling for enterprise API customers. Enterprise customers should review the data processing addendum for sub-processor and audit right terms.', accessed_date: '2026-04-22' },
  { id: 'ev-f7-is-2-b', check_id: 'f7-is-2', source_title: 'Azure AI Foundry — Data privacy and security', source_url: 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/data-privacy', excerpt: 'Azure AI Foundry describes data handling for third-party models available through the platform. Infrastructure-level encryption and isolation are provided by Azure; application-level data processing terms are governed by the model provider.', accessed_date: '2026-04-22' },

  // F7-IS-4
  { id: 'ev-f7-is-4-a', check_id: 'f7-is-4', source_title: 'Anthropic Commercial Terms of Service', source_url: 'https://www.anthropic.com/legal/commercial-terms', excerpt: 'Anthropic\'s commercial terms state that prompts submitted via the API are not used to train models by default. Enterprise customers may have additional commitments via the enterprise data processing addendum.', accessed_date: '2026-04-22' },

  // F7-LG-1
  { id: 'ev-f7-lg-1-a', check_id: 'f7-lg-1', source_title: 'Anthropic Privacy Policy', source_url: 'https://www.anthropic.com/legal/privacy', excerpt: 'Anthropic processes personal data in accordance with applicable data protection laws. Enterprise customers should review Anthropic\'s data processing addendum for GDPR-specific commitments including audit rights and sub-processor terms.', accessed_date: '2026-04-22' },

  // F7-LG-3
  { id: 'ev-f7-lg-3-a', check_id: 'f7-lg-3', source_title: 'EU AI Act — General Purpose AI models', source_url: 'https://learn.microsoft.com/en-us/azure/ai-services/responsible-use-of-ai-overview', excerpt: 'The EU AI Act imposes transparency and documentation obligations on providers of general-purpose AI models. Deployers of GPAI models have obligations contingent on the model provider\'s compliance documentation.', accessed_date: '2026-04-22' },
  { id: 'ev-f7-lg-3-b', check_id: 'f7-lg-3', source_title: 'Anthropic model card — Claude 3.7', source_url: 'https://www.anthropic.com/model-card', excerpt: 'Anthropic publishes model cards describing Claude model capabilities, limitations, and evaluation results. EU AI Act GPAI documentation requirements include transparency reports not yet published for Claude 3.7.', accessed_date: '2026-04-22' },

  // F7-IT-3
  { id: 'ev-f7-it-3-a', check_id: 'f7-it-3', source_title: 'Azure AI Foundry — Model deployment and versioning', source_url: 'https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/model-lifecycle-retirement', excerpt: 'Azure AI Foundry supports model version pinning for deployed models. Administrators can specify which model version is used and control when upgrades occur through deployment configuration.', accessed_date: '2026-04-22' },
]
