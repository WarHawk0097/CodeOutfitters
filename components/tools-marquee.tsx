'use client'

import { useState } from 'react'

export const tools = ['WhatsApp','Anthropic','Notion','Airtable','Google Sheets','n8n','Make','Zapier']
const slug = (name:string) => name.toLowerCase().replace(/\s+/g,'-')

export function Chip({name}:{name:string}) { return <span className="hp-tool-chip"><b><img src={`/assets/integrations/${slug(name)}.svg`} alt="" width={22} height={22}/></b>{name}</span> }
export function Row({items,reverse,paused}:{items:string[];reverse?:boolean;paused:boolean}) { return <div className={`hp-tool-row ${reverse?'is-reverse':''}`} style={{animationPlayState:paused?'paused':'running'}}><div data-marquee-sequence="original">{items.map(x=><Chip key={x} name={x}/>)}</div><div data-marquee-sequence="duplicate" aria-hidden="true">{items.map(x=><Chip key={`d-${x}`} name={x}/>)}</div></div> }

export function IconMarquee(){
 const [paused,setPaused]=useState(false)
 return <>
  <div className="hp-tool-viewport" data-marquee="homepage" onPointerEnter={()=>setPaused(true)} onPointerLeave={()=>setPaused(false)}>
   <Row items={tools} paused={paused}/><Row items={[...tools].reverse()} reverse paused={paused}/>
  </div>
  <style>{`
   .hp-tool-viewport{position:relative;display:flex;flex-direction:column;gap:11px;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
   .hp-tool-row{display:flex;width:max-content;animation:hpToolsL 60s linear infinite;will-change:transform}.hp-tool-row.is-reverse{animation-name:hpToolsR;animation-duration:70s}.hp-tool-row>div{display:flex;gap:12px;padding-right:12px;flex-shrink:0}.hp-tool-chip{display:inline-flex;align-items:center;gap:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:6px 17px 6px 7px;white-space:nowrap;font:600 13.5px 'Instrument Sans',sans-serif;color:#F5F0E8;transition:.3s cubic-bezier(.16,1,.3,1)}.hp-tool-chip b{width:34px;height:34px;border-radius:9px;background:#F5F0E8;display:flex;align-items:center;justify-content:center}.hp-tool-chip img{display:block;object-fit:contain}.hp-tool-chip:hover{transform:translateY(-3px);background:rgba(43,212,131,.12);border-color:rgba(43,212,131,.32)}
   @keyframes hpToolsL{to{transform:translateX(-50%)}}@keyframes hpToolsR{from{transform:translateX(-50%)}to{transform:translateX(0)}}html[data-motion='reduced'] .hp-tool-row{animation:none}html[data-motion='reduced'] .hp-tool-row>div[data-marquee-sequence=duplicate]{display:none}@media(prefers-reduced-motion:reduce){html:not([data-motion='full']) .hp-tool-row{animation:none}html:not([data-motion='full']) .hp-tool-row>div[data-marquee-sequence=duplicate]{display:none}}@media(max-width:640px){.hp-tool-viewport{mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent)}}
  `}</style>
 </>
}

export function ToolsMarquee(){
 return <section className="hp-tools">
  <h2>Powered by industry-leading AI infrastructure</h2>
  <IconMarquee/>
  <style>{`
   .hp-tools{background:#0E241A;padding:24px 0 28px;overflow:hidden}.hp-tools h2{margin:0 0 18px;text-align:center;font:600 12px 'Instrument Sans',sans-serif;letter-spacing:.18em;color:rgba(245,240,232,.52);text-transform:uppercase}
   @media(max-width:640px){.hp-tools h2{padding:0 22px;line-height:1.45}}
  `}</style>
 </section>
}
