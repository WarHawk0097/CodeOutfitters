'use client'

import { ArrowUpRight } from 'lucide-react'
import { ResponsiveProjectImage } from '@/components/case-studies/responsive-project-image'
import { caseStudyVisual } from '@/lib/marketing/case-study-visuals'
import type { SelectedWorkProject } from '@/lib/marketing/selected-work'

/**
 * Portfolio card for `/case-studies` only.
 *
 * Content comes from the shared canonical source — name, category, summary,
 * tags, domain, link posture and access note are read from the project record
 * and never restated here. The only thing this card changes is the image: it
 * renders the art-directed visual instead of the single shared one.
 *
 * It reuses the approved `.sw-*` classes so the cards look identical to the
 * homepage cards; only the image box differs, and only at phone widths.
 */

/** Cards show at most three tags; the rest stay in the shared data for other surfaces. */
const CARD_TAGS = 3

function ExternalProjectLink({ project }: { project: SelectedWorkProject }) {
  if (!project.url || !project.externalLinkLabel) return null
  return (
    <a className="sw-link" href={project.url} target="_blank" rel="noopener noreferrer">
      {project.externalLinkLabel}
      <ArrowUpRight size={15} aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

/**
 * Never wrapped in an outer anchor — the only interactive element is the
 * external link, and only when the project has a public URL that is appropriate
 * for a public visitor.
 */
export function CaseStudyProjectCard({ project }: { project: SelectedWorkProject }) {
  const visual = caseStudyVisual(project.id)
  return (
    <article className="sw-card" data-project-id={project.id}>
      <div className="sw-visual">
        {visual ? <ResponsiveProjectImage visual={visual} alt={project.imageAlt} featured={false} /> : null}
      </div>
      <div className="sw-body">
        <span className="sw-category">{project.category}</span>
        <h3 className="sw-name">{project.name}</h3>
        <p className="sw-summary">{project.summary}</p>
        <ul className="sw-tags">
          {project.tags.slice(0, CARD_TAGS).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <div className="sw-foot">
          {project.domain ? <span className="sw-domain">{project.domain}</span> : null}
          <ExternalProjectLink project={project} />
        </div>
        {project.accessNote ? <p className="sw-note">{project.accessNote}</p> : null}
      </div>
    </article>
  )
}

/**
 * Image-box rules for the art-directed cards.
 *
 * Every selector is scoped under `.cs-list`, so these rules cannot reach the
 * homepage even though the shared card styles are loaded on both pages.
 */
export function CaseStudyCardStyles() {
  return (
    <style>{`
      .cs-list .cs-picture{display:block}
      .cs-list .cs-picture img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;object-position:top center}
      @media(max-width:767px){
        .cs-list .cs-picture--mobile img{aspect-ratio:390/844;object-fit:cover;object-position:top center}
      }
    `}</style>
  )
}
