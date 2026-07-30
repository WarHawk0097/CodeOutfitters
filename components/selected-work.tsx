'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  FEATURED_PROJECT,
  SELECTED_WORK_IMAGE_HEIGHT,
  SELECTED_WORK_IMAGE_WIDTH,
  SUPPORTING_PROJECTS,
  type SelectedWorkProject,
} from '@/lib/marketing/selected-work'

export const SELECTED_WORK_EYEBROW = 'Selected work'
export const SELECTED_WORK_HEADING = 'Bespoke platforms built for real operations.'
export const SELECTED_WORK_BODY =
  'A selection of web applications designed and engineered around specialist workflows, customer experiences and day-to-day business operations.'

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

function ProjectVisual({ project, featured }: { project: SelectedWorkProject; featured: boolean }) {
  return (
    <div className="sw-visual">
      <Image
        src={project.image}
        alt={project.imageAlt}
        width={SELECTED_WORK_IMAGE_WIDTH}
        height={SELECTED_WORK_IMAGE_HEIGHT}
        sizes={featured ? '(max-width:900px) 92vw, 560px' : '(max-width:820px) 92vw, 420px'}
        priority={false}
      />
    </div>
  )
}

/**
 * One portfolio card. Never wrapped in an outer anchor — the only interactive
 * element is the external link, and only when the project has a public URL that
 * is appropriate for a public visitor.
 */
export function ProjectCard({ project, featured = false, headingLevel = 'h3' }: { project: SelectedWorkProject; featured?: boolean; headingLevel?: 'h3' | 'h4' }) {
  const Heading = headingLevel
  return (
    <article className={`sw-card${featured ? ' is-featured' : ''}`} data-project-id={project.id}>
      <ProjectVisual project={project} featured={featured} />
      <div className="sw-body">
        <span className="sw-category">{project.category}</span>
        <Heading className="sw-name">{project.name}</Heading>
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

/** Homepage selected-work section: featured project plus the supporting four. */
export function SelectedWork() {
  return (
    <section className="sw-section" id="selected-work">
      <div className="sw-inner">
        <header>
          <div className="sw-eyebrow"><i />{SELECTED_WORK_EYEBROW}<i /></div>
          <h2>{SELECTED_WORK_HEADING}</h2>
          <p>{SELECTED_WORK_BODY}</p>
        </header>

        <ProjectCard project={FEATURED_PROJECT} featured />

        <div className="sw-grid">
          {SUPPORTING_PROJECTS.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        <Link className="sw-cta" href="/case-studies">
          View all selected work <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
      <SelectedWorkStyles />
    </section>
  )
}

/**
 * Shared card styling. Exported so `/case-studies` renders identical cards
 * without duplicating the rules.
 */
export function SelectedWorkStyles() {
  return (
    <style>{`
      .sw-section{background:#F7F2EA;border-top:1px solid #EDE6D8}
      .sw-inner{max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,92px) clamp(20px,3vw,32px);display:flex;flex-direction:column;gap:clamp(26px,3.4vw,38px)}
      .sw-section header{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
      .sw-eyebrow{display:flex;align-items:center;gap:14px;font:700 12px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:#0E7A4E;text-transform:uppercase}
      .sw-eyebrow i{width:38px;height:2px;background:#D9B36A}
      .sw-section header h2{margin:0;max-width:780px;font:600 clamp(30px,4vw,48px)/1.13 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.02em;text-wrap:balance}
      .sw-section header p{margin:0;max-width:620px;font:400 17px/1.65 'Instrument Sans',sans-serif;color:#5B6355}
      .sw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
      .sw-card{display:flex;flex-direction:column;overflow:hidden;background:linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4);border:1px solid rgba(13,58,49,.14);border-radius:22px;box-shadow:0 20px 54px rgba(18,32,27,.10),inset 0 1px 0 rgba(255,255,255,.8)}
      .sw-card.is-featured{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);align-items:stretch}
      .sw-visual{position:relative;background:#0E241A;border-bottom:1px solid rgba(13,58,49,.12)}
      .sw-card.is-featured .sw-visual{border-bottom:0;border-right:1px solid rgba(13,58,49,.12)}
      .sw-visual img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;object-position:top center}
      .sw-body{display:flex;flex-direction:column;gap:11px;padding:clamp(20px,2.4vw,28px)}
      .sw-category{font:700 11px 'Instrument Sans',sans-serif;letter-spacing:.14em;color:#0E7A4E;text-transform:uppercase}
      .sw-name{margin:0;font:600 clamp(20px,2.2vw,24px)/1.22 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.01em}
      .sw-card.is-featured .sw-name{font-size:clamp(24px,2.8vw,32px)}
      .sw-summary{margin:0;font:400 15px/1.62 'Instrument Sans',sans-serif;color:#5B6355}
      .sw-tags{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:8px}
      .sw-tags li{font:600 12px 'Instrument Sans',sans-serif;color:#0E7A4E;background:#EAF6EF;border:1px solid rgba(18,138,84,.18);border-radius:999px;padding:5px 12px}
      .sw-foot{margin-top:auto;padding-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;border-top:1px solid rgba(13,58,49,.1)}
      .sw-domain{font:500 13px ui-monospace,monospace;color:#5B6355;overflow-wrap:anywhere;min-width:0}
      .sw-link{display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:10px 2px;font:600 14px 'Instrument Sans',sans-serif;color:#0E2A1D;text-decoration:none;border-bottom:2px solid #D9B36A}
      .sw-link:hover{color:#0E7A4E;border-bottom-color:#17A063}
      .sw-link:focus-visible{outline:2px solid var(--brand-focus);outline-offset:3px;border-radius:4px}
      .sw-note{margin:0;font:500 13px/1.55 'Instrument Sans',sans-serif;color:#5B6355}
      .sw-cta{align-self:center;display:inline-flex;align-items:center;gap:9px;min-height:44px;padding:14px 26px;font:600 15px 'Instrument Sans',sans-serif;color:#F7F2EA;background:#0E2A1D;border-radius:11px;text-decoration:none}
      .sw-cta:hover{background:#17A063;color:#F7F2EA}
      .sw-cta:focus-visible{outline:2px solid var(--brand-focus);outline-offset:3px}
      @media(max-width:900px){.sw-card.is-featured{grid-template-columns:1fr}.sw-card.is-featured .sw-visual{border-right:0;border-bottom:1px solid rgba(13,58,49,.12)}}
      @media(max-width:820px){.sw-grid{grid-template-columns:1fr}}
    `}</style>
  )
}
