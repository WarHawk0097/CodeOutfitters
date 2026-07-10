import { loadDCHtml } from '../load-dc-html'

export default function ContactPage() {
  const html = loadDCHtml('contact.html')
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <script src="/codeoutfitters/support.js" />
    </>
  )
}
