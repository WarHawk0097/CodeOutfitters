import { loadDCHtml } from '../load-dc-html'

export default function ServicesPage() {
  const html = loadDCHtml('services.html')
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <script src="/codeoutfitters/support.js" />
    </>
  )
}
