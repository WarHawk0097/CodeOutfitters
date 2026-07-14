'use client'

import { ChangeEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Scale } from 'lucide-react'

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

export function ROICalculator() {
  const [team, setTeam] = useState(5)
  const [hours, setHours] = useState(10)
  const [rate, setRate] = useState(25)
  const [pulse, setPulse] = useState(0)
  const week = team * hours * rate
  const update = (setter: (n: number) => void) => (e: ChangeEvent<HTMLInputElement>) => { setter(+e.target.value); setPulse((x) => x + 1) }
  const controls = [
    { no:'01', label:'Team members doing repetitive tasks', value:team, shown:`${team} ${team === 1 ? 'person' : 'people'}`, min:1,max:50,step:1, help:['1 – 50 people','Sales · ops · admin'], set:update(setTeam)},
    { no:'02', label:'Hours wasted per person per week', value:hours, shown:`${hours} hrs/week`, min:1,max:40,step:1, help:['Data entry · replies · reports'], set:update(setHours)},
    { no:'03', label:'Average hourly rate', value:rate, shown:`$${rate}/hr`, min:10,max:150,step:5, help:['Fully-loaded cost','USD'], set:update(setRate)},
  ]
  return (
    <section className="hp-calc-section">
      <div className="hp-section-inner">
        <header className="hp-section-head hp-dark-head">
          <div className="hp-kicker"><i />03 · The math<i /></div>
          <h2>How much is manual work <span>costing you?</span></h2>
          <p>Move the sliders to see your exact savings</p>
        </header>
        <div className="hp-calculator">
          <div className="hp-calc-header"><span className="hp-calc-name"><b><Scale size={16}/></b>Savings calculator</span><strong>{team} {team===1?'person':'people'} × {hours} hrs × ${rate}/hr</strong><span className="hp-live"><i/>Live estimate</span></div>
          <div className="hp-calc-input">
            {controls.map(c => <div className="hp-calc-block" key={c.no}><small>{c.no}</small><div><label>{c.label}</label><output>{c.shown}</output></div><input aria-label={c.label} type="range" min={c.min} max={c.max} step={c.step} value={c.value} onChange={c.set} style={{'--fill':`${((c.value-c.min)/(c.max-c.min))*100}%`} as React.CSSProperties}/><p>{c.help.map(x=><span key={x}>{x}</span>)}</p></div>)}
            <div className="hp-calc-note">✦ Based on typical US small-business labor costs.</div>
          </div>
          <div className="hp-calc-result">
            <span className="hp-cost-label">Cost of manual work</span>
            <div key={pulse} className="hp-cost-panel"><strong>{money(week*48)}</strong><p>draining out of your business every year</p><div><span><b>{money(week)}</b><small>Per week</small></span><span><b>{money(week*4)}</b><small>Per month</small></span></div></div>
            <div className="hp-recover"><b>CO</b><span><small>With CodeOutfitters</small>Recover <strong>{money(week*4)}/mo</strong> — usually within weeks.</span></div>
            <Link href="/contact">Get My Custom Quote <ArrowRight size={14}/></Link>
          </div>
        </div>
      </div>
      <style>{`
        .hp-calc-section{position:relative;background:radial-gradient(800px 500px at 50% -10%,rgba(23,160,99,.16),transparent 62%),#0E241A;overflow:hidden}
        .hp-dark-head{margin-bottom:36px}.hp-dark-head .hp-kicker{color:#D9B36A}.hp-dark-head .hp-kicker i{background:rgba(217,179,106,.6)}.hp-dark-head h2{color:#F5F0E8}.hp-dark-head h2 span{color:#2BD483}.hp-dark-head p{color:rgba(245,240,232,.6);font-size:17px}
        .hp-calculator{max-width:1020px;margin:0 auto;width:100%;border-radius:26px;overflow:hidden;box-shadow:0 40px 92px rgba(0,0,0,.42);border:1px solid rgba(255,253,246,.14);display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr)}
        .hp-calc-header{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:linear-gradient(90deg,#10301F,#0C2417);border-bottom:1px solid rgba(255,255,255,.08);padding:16px clamp(20px,3vw,32px)}
        .hp-calc-name{display:flex;align-items:center;gap:10px;font:700 11px 'Instrument Sans',sans-serif;letter-spacing:.14em;color:rgba(245,240,232,.7);text-transform:uppercase}.hp-calc-name b{width:32px;height:32px;border-radius:10px;background:rgba(43,212,131,.14);display:flex;align-items:center;justify-content:center;color:#8FE3C0}.hp-calc-header>strong{font:700 15px 'Space Grotesk',sans-serif;color:#2BD483;white-space:nowrap}.hp-live{display:flex;align-items:center;gap:6px;font:600 10.5px 'Instrument Sans',sans-serif;color:#2BD483;background:rgba(43,212,131,.12);border-radius:999px;padding:4px 10px;white-space:nowrap}.hp-live i{width:6px;height:6px;border-radius:50%;background:#2BD483}
        .hp-calc-input{background:#FDFBF6;padding:clamp(24px,3vw,34px);display:flex;flex-direction:column;gap:20px;min-width:0}.hp-calc-block{display:flex;flex-direction:column;gap:9px}.hp-calc-block>small{font:700 11px ui-monospace,monospace;color:#B8B09E;letter-spacing:.1em}.hp-calc-block>div{display:flex;align-items:center;justify-content:space-between;gap:10px}.hp-calc-block label{font:500 15px 'Instrument Sans',sans-serif;color:#26312A}.hp-calc-block output{font:700 14px 'Space Grotesk',sans-serif;color:#0E2A1D;background:#EAF6EF;border:1px solid rgba(18,138,84,.25);border-radius:999px;padding:4px 12px;white-space:nowrap}
        .hp-calc-block input{-webkit-appearance:none;appearance:none;width:100%;height:22px;cursor:pointer;background:linear-gradient(90deg,#17A063 var(--fill),#EDE6D8 var(--fill));border-radius:999px;outline-offset:4px}.hp-calc-block input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#17A063;border:3px solid #fff;box-shadow:0 2px 8px rgba(23,160,99,.4)}.hp-calc-block>p{display:flex;gap:6px;flex-wrap:wrap;margin:0}.hp-calc-block>p span{font:600 10px 'Instrument Sans',sans-serif;color:#8A857B;background:#F1EADC;border:1px solid rgba(13,58,49,.08);border-radius:999px;padding:3px 9px}.hp-calc-note{margin-top:auto;padding-top:6px;font:400 12.5px 'Instrument Sans',sans-serif;color:#8A857B}
        .hp-calc-result{position:relative;background:linear-gradient(165deg,#0E2A1D,#08160F);padding:clamp(24px,3vw,34px);display:flex;flex-direction:column;gap:15px;overflow:hidden}.hp-calc-result:before{content:'';position:absolute;top:-70px;right:-60px;width:230px;height:230px;border-radius:50%;background:radial-gradient(circle,rgba(43,212,131,.2),transparent 70%);filter:blur(34px)}.hp-cost-label{position:relative;font:700 10.5px 'Instrument Sans',sans-serif;letter-spacing:.14em;color:rgba(245,240,232,.5);text-transform:uppercase}.hp-cost-panel{position:relative;animation:hpPulse .5s cubic-bezier(.16,1,.3,1)}.hp-cost-panel>strong{font:700 clamp(44px,6.5vw,62px)/1 'Space Grotesk',sans-serif;color:#2BD483;letter-spacing:-.025em}.hp-cost-panel>p{margin:3px 0 0;font:500 13px 'Instrument Sans',sans-serif;color:rgba(245,240,232,.55)}.hp-cost-panel>div{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.hp-cost-panel>div>span{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 16px}.hp-cost-panel b{display:block;font:700 22px 'Space Grotesk',sans-serif;color:#F5F0E8}.hp-cost-panel small{font:600 9.5px 'Instrument Sans',sans-serif;letter-spacing:.1em;color:rgba(245,240,232,.5);text-transform:uppercase}
        .hp-recover{position:relative;background:linear-gradient(120deg,rgba(217,179,106,.18),rgba(217,179,106,.05));border:1px solid rgba(217,179,106,.32);border-radius:14px;padding:15px 17px;display:flex;align-items:center;gap:13px}.hp-recover>b{flex-shrink:0;width:38px;height:38px;border-radius:11px;background:rgba(217,179,106,.16);display:flex;align-items:center;justify-content:center;color:#D9B36A;font:700 11px 'Space Grotesk'}.hp-recover>span{font:500 14.5px 'Instrument Sans',sans-serif;color:#F5F0E8}.hp-recover small{display:block;font:700 10px 'Instrument Sans',sans-serif;letter-spacing:.1em;color:#D9B36A;text-transform:uppercase}.hp-recover strong{font:700 17px 'Space Grotesk',sans-serif;color:#2BD483}.hp-calc-result>a{position:relative;font:600 15.5px 'Instrument Sans',sans-serif;color:#0A120E;background:#2BD483;border-radius:12px;padding:15px;box-shadow:0 14px 34px rgba(43,212,131,.28);display:flex;align-items:center;justify-content:center;gap:9px;text-decoration:none}
        @keyframes hpPulse{50%{transform:scale(1.025)}}@media(max-width:760px){.hp-calculator{grid-template-columns:1fr}.hp-calc-header>strong{order:3;width:100%}.hp-calc-block>div{align-items:flex-start}.hp-calc-block label{max-width:62%}}
      `}</style>
    </section>
  )
}
