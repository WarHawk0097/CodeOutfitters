const tools = [
  { name: 'n8n', logoUrl: 'https://cdn.simpleicons.org/n8n/EA4B71', bg: '#FFF0F3' },
  { name: 'Make', logoUrl: 'https://cdn.simpleicons.org/make/6C45E0', bg: '#F3F0FF' },
  { name: 'Zapier', logoUrl: 'https://cdn.simpleicons.org/zapier/FF4A00', bg: '#FFF4F0' },
  { name: 'WhatsApp', logoUrl: 'https://cdn.simpleicons.org/whatsapp/25D366', bg: '#F0FFF4' },
  { name: 'Anthropic', logoUrl: 'https://cdn.simpleicons.org/anthropic/D97706', bg: '#FFFBF0' },
  { name: 'Notion', logoUrl: 'https://cdn.simpleicons.org/notion/000000', bg: '#F8F8F8' },
  { name: 'Airtable', logoUrl: 'https://cdn.simpleicons.org/airtable/18BFFF', bg: '#F0FBFF' },
  { name: 'Google Sheets', logoUrl: 'https://cdn.simpleicons.org/googlesheets/34A853', bg: '#F0FFF4' },
]

const doubled = [...tools, ...tools]
const reversedDoubled = [...doubled].reverse()

function ToolCard({ tool }: { tool: typeof tools[0] }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[rgba(42,107,90,0.1)] whitespace-nowrap hover:border-[rgba(42,107,90,0.25)] hover:shadow-md transition-all duration-200"
      style={{ background: tool.bg }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
        <img src={tool.logoUrl} alt={tool.name} width={16} height={16} className="w-4 h-4 object-contain" />
      </div>
      <span className="font-semibold text-sm text-[#1C1612]">{tool.name}</span>
    </div>
  )
}

export function ToolsStrip() {
  return (
    <div data-aos="fade-up" className="py-8 bg-white border-y border-[rgba(42,107,90,0.1)] relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />

      <div className="flex items-center mb-4 justify-center">
        <p className="section-label text-center">Powered by industry-leading AI infrastructure</p>
      </div>

      <div className="overflow-hidden w-full">
        <div className="marquee-left gap-6">
          {doubled.map((tool, i) => (
            <ToolCard key={`left-${i}`} tool={tool} />
          ))}
        </div>
      </div>

      <div className="overflow-hidden w-full mt-4">
        <div className="marquee-right gap-6">
          {reversedDoubled.map((tool, i) => (
            <ToolCard key={`right-${i}`} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  )
}
