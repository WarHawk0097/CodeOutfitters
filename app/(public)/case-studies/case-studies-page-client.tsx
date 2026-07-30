'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CaseStudyCardStyles, CaseStudyProjectCard } from '@/components/case-studies/case-study-project-card'
import { SelectedWorkStyles } from '@/components/selected-work'
import { SELECTED_WORK } from '@/lib/marketing/selected-work'

/**
 * The public portfolio page. Projects and applications — not outcome case
 * studies: no results, revenue, timelines, team sizes, technology stacks or
 * testimonials, and nothing about a project its owner has not approved for
 * publication. Cards read the shared `SELECTED_WORK` data, so link and access
 * rules cannot diverge from the homepage; only the images differ, because this
 * page — and only this page — shows the art-directed visuals.
 */
export function CaseStudiesPageClient() {
  return (
    <div className="cs-page">
      <section className="cs-hero">
        <span className="cs-hero-eyebrow"><i />Selected work</span>
        <h1>Bespoke web applications, <span>built for real operations.</span></h1>
        <p>
          A selection of platforms, portals and internal applications designed and built by CodeOutfitters
          around specialist workflows, customer experiences and day-to-day operations.
        </p>
      </section>

      <section className="cs-list-section">
        <h2>Projects and applications</h2>
        <div className="cs-list">
          {SELECTED_WORK.map((project) => (
            <CaseStudyProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section className="cs-cta">
        <div>
          <h2>Have an operation that needs its own application?</h2>
          <p>Tell us how the work runs today. We will tell you honestly what is worth building first.</p>
        </div>
        <Link href="/contact">Discuss your application <ArrowRight size={15} aria-hidden="true" /></Link>
      </section>

      <SelectedWorkStyles />
      <CaseStudyCardStyles />
      <style>{`
        .cs-page{background:#F7F2EA;color:#0A120E;overflow-x:hidden}
        .cs-page *{box-sizing:border-box;min-width:0}
        .cs-hero{background:radial-gradient(900px 520px at 76% -18%,rgba(23,160,99,.20),transparent 62%),#0A120E;display:flex;flex-direction:column;align-items:center;gap:22px;text-align:center;padding:clamp(56px,8vw,88px) clamp(20px,3vw,32px) clamp(44px,6vw,64px)}
        .cs-hero-eyebrow{display:inline-flex;align-items:center;gap:9px;background:rgba(217,179,106,.10);border:1px solid rgba(217,179,106,.4);border-radius:999px;padding:8px 16px;font:700 11.5px 'Instrument Sans',sans-serif;letter-spacing:.14em;color:#D9B36A;text-transform:uppercase}
        .cs-hero-eyebrow i{width:7px;height:7px;border-radius:50%;background:#D9B36A}
        .cs-hero h1{margin:0;max-width:820px;font:600 clamp(32px,4.4vw,54px)/1.1 'Space Grotesk',sans-serif;color:#F5F0E8;letter-spacing:-.025em;text-wrap:balance}
        .cs-hero h1 span{color:#2BD483}
        .cs-hero p{margin:0;max-width:600px;font:400 17px/1.65 'Instrument Sans',sans-serif;color:rgba(245,240,232,.66)}
        .cs-list-section{max-width:1180px;margin:0 auto;padding:clamp(48px,6vw,80px) clamp(20px,3vw,32px);display:flex;flex-direction:column;gap:26px}
        .cs-list-section>h2{margin:0;font:600 clamp(22px,2.6vw,30px)/1.2 'Space Grotesk',sans-serif;letter-spacing:-.015em}
        .cs-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}
        .cs-cta{max-width:1180px;margin:0 auto;padding:0 clamp(20px,3vw,32px) clamp(56px,8vw,92px);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:22px}
        .cs-cta>div{display:flex;flex-direction:column;gap:9px;max-width:640px}
        .cs-cta h2{margin:0;font:600 clamp(22px,2.6vw,30px)/1.2 'Space Grotesk',sans-serif;letter-spacing:-.015em}
        .cs-cta p{margin:0;font:400 16px/1.6 'Instrument Sans',sans-serif;color:#5B6355}
        .cs-cta a{display:inline-flex;align-items:center;gap:9px;min-height:44px;padding:15px 26px;font:600 15px 'Instrument Sans',sans-serif;color:#F7F2EA;background:#0E2A1D;border-radius:11px;text-decoration:none;white-space:nowrap}
        .cs-cta a:hover{background:#17A063}
        .cs-cta a:focus-visible{outline:2px solid var(--brand-focus);outline-offset:3px}
        @media(max-width:820px){.cs-list{grid-template-columns:1fr}}
        @media(max-width:560px){.cs-cta a{width:100%;justify-content:center}}
      `}</style>
    </div>
  )
}
