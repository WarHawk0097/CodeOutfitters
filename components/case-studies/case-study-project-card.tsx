import { ArrowUpRight } from 'lucide-react'
import { ResponsiveProjectImage } from '@/components/case-studies/responsive-project-image'
import type { CaseStudyProject } from '@/lib/marketing/case-studies-projects'

/**
 * Project card for `/case-studies` only.
 *
 * Every class is `.cs-`-namespaced and every rule is scoped under `.cs-list`,
 * so these styles cannot reach the homepage, the shared layout or any other
 * production page. Nothing outside `/case-studies` imports this component.
 *
 * Content comes from `CASE_STUDY_PROJECTS` and is never restated here: a card
 * shows a link only when the project record carries a public URL, and shows a
 * media box only when the project record carries an approved visual.
 */

/** Cards show at most three tags; the rest stay in the data for other surfaces. */
const CARD_TAGS = 3

function ExternalProjectLink({ project }: { project: CaseStudyProject }) {
  if (!project.url || !project.externalLinkLabel) return null
  return (
    <a className="cs-link" href={project.url} target="_blank" rel="noopener noreferrer">
      {project.externalLinkLabel}
      <ArrowUpRight size={15} aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

/**
 * Never wrapped in an outer anchor — the only interactive element is the
 * external link, and only when the project has a public URL that is appropriate
 * for a public visitor. A project without an approved visual renders no media
 * container at all, rather than an empty box.
 */
export function CaseStudyProjectCard({ project }: { project: CaseStudyProject }) {
  return (
    <article className="cs-card" data-project-id={project.id}>
      {project.visual && project.imageAlt ? (
        <div className="cs-visual">
          <ResponsiveProjectImage visual={project.visual} alt={project.imageAlt} />
        </div>
      ) : null}
      <div className="cs-body">
        <span className="cs-category">{project.category}</span>
        <h3 className="cs-name">{project.name}</h3>
        <p className="cs-summary">{project.summary}</p>
        <ul className="cs-tags">
          {project.tags.slice(0, CARD_TAGS).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <div className="cs-foot">
          {project.domain ? <span className="cs-domain">{project.domain}</span> : null}
          <ExternalProjectLink project={project} />
        </div>
        {project.accessNote ? <p className="cs-note">{project.accessNote}</p> : null}
      </div>
    </article>
  )
}

/**
 * Card and image-box rules for `/case-studies`.
 *
 * Every selector is scoped under `.cs-list`, and the colours, radii and type
 * families are the approved production ones.
 */
export function CaseStudyCardStyles() {
  return (
    <style>{`
      .cs-list .cs-card{display:flex;flex-direction:column;overflow:hidden;border-radius:22px;background:linear-gradient(178deg,#fff 0%,#FBF7EE 68%,#F6F1E4 100%);border:1px solid rgba(13,58,49,.14);box-shadow:0 20px 54px rgba(18,32,27,.10),inset 0 1px 0 rgba(255,255,255,.8)}
      .cs-list .cs-visual{background:#F4EEE2;border-bottom:1px solid rgba(13,58,49,.10)}
      .cs-list .cs-picture{display:block}
      .cs-list .cs-picture img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;object-position:top center}
      .cs-list .cs-body{display:flex;flex-direction:column;gap:10px;flex:1;padding:clamp(20px,2.6vw,26px)}
      .cs-list .cs-category{font:700 10px 'Instrument Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#A39C8C}
      .cs-list .cs-name{margin:0;font:600 18px/1.25 'Space Grotesk',sans-serif;letter-spacing:-.015em;color:#0A120E}
      .cs-list .cs-summary{margin:0;font:400 14.5px/1.65 'Instrument Sans',sans-serif;color:#5B6355}
      .cs-list .cs-tags{margin:2px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:8px}
      .cs-list .cs-tags li{padding:5px 10px;border-radius:999px;background:#F4EEE2;border:1px solid #E4DDD0;font:600 10.5px 'Instrument Sans',sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#68705F}
      .cs-list .cs-foot{margin-top:auto;padding-top:14px;border-top:1px solid rgba(13,58,49,.08);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
      .cs-list .cs-domain{font:500 13px 'Instrument Sans',sans-serif;color:#68705F;word-break:break-word}
      .cs-list .cs-link{display:inline-flex;align-items:center;gap:6px;min-height:44px;font:600 13px 'Instrument Sans',sans-serif;color:#0E2A1D;text-decoration:underline;text-underline-offset:4px}
      .cs-list .cs-link:hover{color:#17A063}
      .cs-list .cs-link:focus-visible{outline:2px solid var(--brand-focus);outline-offset:3px}
      .cs-list .cs-note{margin:0;font:400 12.5px/1.55 'Instrument Sans',sans-serif;color:#68705F}
      @media(max-width:767px){
        .cs-list .cs-picture--mobile img{aspect-ratio:390/844;object-fit:cover;object-position:top center}
      }
    `}</style>
  )
}
