'use client'

const categories = [
  {
    label: 'Messaging', status: 'Connected',
    tools: [
      { name: 'WhatsApp', logoUrl: 'https://cdn.simpleicons.org/whatsapp/25D366', bg: '#F0FFF4' },
      { name: 'Email', logoUrl: 'https://cdn.simpleicons.org/gmail/EA4335', bg: '#FFF4F4' },
      { name: 'SMS', logoUrl: 'https://cdn.simpleicons.org/twilio/F22F46', bg: '#FFF4F5' },
    ],
  },
  {
    label: 'CRM & Data', status: 'Synced',
    tools: [
      { name: 'HubSpot', logoUrl: 'https://cdn.simpleicons.org/hubspot/FF7A59', bg: '#FFF8F0' },
      { name: 'Airtable', logoUrl: 'https://cdn.simpleicons.org/airtable/18BFFF', bg: '#F0FBFF' },
      { name: 'Sheets', logoUrl: 'https://cdn.simpleicons.org/googlesheets/34A853', bg: '#F0FFF4' },
    ],
  },
  {
    label: 'Automation', status: 'Active',
    tools: [
      { name: 'n8n', logoUrl: 'https://cdn.simpleicons.org/n8n/EA4B71', bg: '#FFF0F3' },
      { name: 'Make', logoUrl: 'https://cdn.simpleicons.org/make/6C45E0', bg: '#F3F0FF' },
      { name: 'Zapier', logoUrl: 'https://cdn.simpleicons.org/zapier/FF4A00', bg: '#FFF4F0' },
    ],
  },
  {
    label: 'AI Models', status: 'Online',
    tools: [
      { name: 'Anthropic', logoUrl: 'https://cdn.simpleicons.org/anthropic/D97706', bg: '#FFFBF0' },
      { name: 'OpenAI', logoUrl: 'https://cdn.simpleicons.org/openai/412991', bg: '#F5F0FF' },
      { name: 'Notion AI', logoUrl: 'https://cdn.simpleicons.org/notion/000000', bg: '#F8F8F8' },
    ],
  },
]

function ToolCard({ tool }: { tool: typeof categories[0]['tools'][0] }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[rgba(42,107,90,0.1)] whitespace-nowrap hover:border-[rgba(42,107,90,0.25)] hover:shadow-lg transition-all duration-200 w-full"
      style={{ background: tool.bg }}
    >
      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0">
        <img src={tool.logoUrl} alt={tool.name} width={16} height={16} className="w-4 h-4 object-contain" />
      </div>
      <span className="font-semibold text-sm text-[#1C1612]">{tool.name}</span>
    </div>
  )
}

export function ToolsStrip() {
  return (
    <section className="py-14 bg-white border-y border-[rgba(42,107,90,0.08)] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2A6B5A] animate-pulse" />
          <span className="section-label">Connected Stack</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#2A6B5A] animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {categories.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center gap-2 mb-4 justify-center sm:justify-start">
                <span className="w-2 h-2 rounded-full bg-[#3D8B71]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9B9088]">
                  {cat.label}
                </p>
                <span className="text-[9px] text-[rgba(61,139,113,0.5)] font-mono">{cat.status}</span>
              </div>
              <div className="flex flex-col gap-3 items-center sm:items-start">
                {cat.tools.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#9B9088] mt-8 max-w-2xl mx-auto">
          Every automation is built on the best platform for the job — your existing tools included. We integrate with your stack, not replace it.
        </p>
      </div>
    </section>
  )
}
