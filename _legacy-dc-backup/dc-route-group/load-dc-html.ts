import fs from 'fs'
import path from 'path'

export function loadDCHtml(filename: string): string {
  const filePath = path.join(process.cwd(), 'public', 'codeoutfitters', filename)
  const content = fs.readFileSync(filePath, 'utf-8')

  const bodyMatch = content.match(/<body>([\s\S]*?)<\/body>/)
  if (!bodyMatch) throw new Error(`Could not find <body> in ${filename}`)

  let html = bodyMatch[1]

  html = html.replace(/src="(?:\.\/)?assets\//g, 'src="/codeoutfitters/assets/')
  html = html.replace(/href="(?:\.\/)?assets\//g, 'href="/codeoutfitters/assets/')

  return html
}
