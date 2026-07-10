import { loadDCHtml } from './load-dc-html'

export default function HomePage() {
  const html = loadDCHtml('homepage.html')
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <script src="/codeoutfitters/support.js" />
    </>
  )
}
