'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { PRIMARY_SERVICES, SUPPORTING_SERVICE } from '@/lib/marketing/services'

export const CAPABILITIES_EYEBROW = 'What we build'
export const CAPABILITIES_HEADING = 'Four ways we build software around an operation.'

/**
 * Homepage capability section. Renders `PRIMARY_SERVICES` in order, so the
 * hierarchy here can never drift from `/services`.
 */
export function Capabilities() {
  const ref = useScrollReveal<HTMLElement>(0.08)

  return (
    <section id="services" ref={ref} className="hp-cap">
      <div className="hp-cap-inner">
        <header>
          <div className="hp-cap-eyebrow"><i />{CAPABILITIES_EYEBROW}<i /></div>
          <h2>{CAPABILITIES_HEADING}</h2>
          <p>
            Every engagement starts with the workflow, not the template. These are the four shapes that work
            usually takes.
          </p>
        </header>

        <div className="hp-cap-grid">
          {PRIMARY_SERVICES.map((service) => (
            <article key={service.id} className={`hp-cap-card is-${service.tone}`} data-reveal data-service-id={service.id}>
              <div className="hp-cap-head">
                <i><img src={service.icon} alt="" width={22} height={22} /></i>
                <span>{service.num}</span>
              </div>
              <h3>{service.name}</h3>
              <p>{service.summary}</p>
              <ul>
                {service.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href={`/services#${service.id}`}>
                How this works <ArrowRight size={13} />
              </Link>
            </article>
          ))}
        </div>

        <aside className="hp-cap-support" data-reveal>
          <div>
            <strong>Also available</strong>
            <h3>{SUPPORTING_SERVICE.name}</h3>
            <p>{SUPPORTING_SERVICE.summary}</p>
          </div>
          <Link href="/contact">Discuss application <ArrowRight size={14} /></Link>
        </aside>
      </div>

      <style>{`
        .hp-cap{background-color:#F7F2EA;background-image:radial-gradient(rgba(14,42,29,.06) 1px,transparent 1.5px);background-size:26px 26px}
        .hp-cap-inner{max-width:1180px;margin:0 auto;padding:clamp(56px,8vw,92px) clamp(20px,3vw,32px);display:flex;flex-direction:column;gap:clamp(30px,4vw,44px)}
        .hp-cap header{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
        .hp-cap-eyebrow{display:flex;align-items:center;gap:14px;font:700 12px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:#0E7A4E;text-transform:uppercase}
        .hp-cap-eyebrow i{width:38px;height:2px;background:#D9B36A}
        .hp-cap h2{margin:0;max-width:760px;font:600 clamp(30px,4vw,48px)/1.13 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.02em;text-wrap:balance}
        .hp-cap header p{margin:0;max-width:560px;font:400 17px/1.65 'Instrument Sans',sans-serif;color:#5B6355}
        .hp-cap-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
        .hp-cap-card{display:flex;flex-direction:column;gap:13px;padding:clamp(24px,2.6vw,32px);background:linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4);border:1px solid rgba(13,58,49,.14);border-radius:22px;box-shadow:0 20px 54px rgba(18,32,27,.10),inset 0 1px 0 rgba(255,255,255,.8);transition:transform .5s cubic-bezier(.16,1,.3,1),border-color .5s}
        .hp-cap-card:hover{transform:translateY(-5px);border-color:rgba(23,160,99,.34)}
        .hp-cap-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .hp-cap-head i{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 10px 24px rgba(18,32,27,.12),inset 0 1px 0 rgba(255,255,255,.7)}
        .hp-cap-card.is-green .hp-cap-head i{background:linear-gradient(160deg,#EAF6EF,#DCF0E5)}
        .hp-cap-card.is-gold .hp-cap-head i{background:linear-gradient(160deg,#F8EFDD,#F0E2C4)}
        .hp-cap-head span{font:700 12px ui-monospace,monospace;letter-spacing:.12em;color:#6F6857}
        .hp-cap-card h3{margin:0;font:600 21px/1.22 'Space Grotesk',sans-serif;color:#0A120E;letter-spacing:-.01em}
        .hp-cap-card>p{margin:0;font:400 15px/1.62 'Instrument Sans',sans-serif;color:#5B6355}
        .hp-cap-card ul{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:8px}
        .hp-cap-card li{font:600 12px 'Instrument Sans',sans-serif;color:#0E7A4E;background:#EAF6EF;border:1px solid rgba(18,138,84,.18);border-radius:999px;padding:5px 12px}
        .hp-cap-card>a{margin-top:auto;padding-top:14px;display:inline-flex;align-items:center;gap:8px;align-self:flex-start;font:600 14px 'Instrument Sans',sans-serif;color:#0E2A1D;text-decoration:none}
        .hp-cap-card>a>svg{transition:transform .3s}
        .hp-cap-card>a:hover>svg{transform:translateX(3px)}
        .hp-cap-card>a:focus-visible{outline:2px solid var(--brand-focus);outline-offset:3px;border-radius:6px}
        .hp-cap-support{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:22px;padding:clamp(22px,2.6vw,30px);background:linear-gradient(160deg,#10301F,#0A1C12);border:1px solid rgba(255,253,246,.14);border-radius:22px}
        .hp-cap-support>div{display:flex;flex-direction:column;gap:9px;max-width:660px;min-width:0}
        .hp-cap-support strong{font:700 11px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:#D9B36A;text-transform:uppercase}
        .hp-cap-support h3{margin:0;font:600 clamp(19px,2.2vw,24px)/1.25 'Space Grotesk',sans-serif;color:#F5F0E8}
        .hp-cap-support p{margin:0;font:400 15px/1.6 'Instrument Sans',sans-serif;color:rgba(245,240,232,.68)}
        .hp-cap-support>a{display:inline-flex;align-items:center;gap:9px;flex-shrink:0;font:600 15px 'Instrument Sans',sans-serif;color:#0A120E;background:#2BD483;border-radius:11px;padding:14px 22px;text-decoration:none;white-space:nowrap}
        .hp-cap-support>a:hover{background:#7BE8B4}
        .hp-cap-support>a:focus-visible{outline:2px solid #F5F0E8;outline-offset:3px}
        @media(max-width:820px){.hp-cap-grid{grid-template-columns:1fr}}
        @media(max-width:560px){.hp-cap-support{flex-direction:column;align-items:flex-start}.hp-cap-support>a{width:100%;justify-content:center}}
      `}</style>
    </section>
  )
}
