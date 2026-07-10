import { loadDCHtml } from '../load-dc-html'

export default function CaseStudiesPage() {
  const html = loadDCHtml('case-studies.html')
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <script src="/codeoutfitters/support.js" />
    </>
  )
}
