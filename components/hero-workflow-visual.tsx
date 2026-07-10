'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/animations/gsap-setup'

const tw = 900, th = 540

const lx = 18, lw = 210, cx = 246, cw = 408, rx = 672, rw = 210
const ph = 380, py = 50, pPad = 14, headerH = 32
const itemH = 100, itemGap = 14

function iy(i: number) { return py + headerH + 10 + i * (itemH + itemGap) }

const intake = [
  { id: 'msg', label: 'Client Inquiry', source: 'via WhatsApp', time: '2m' },
  { id: 'book', label: 'Booking Request', source: 'via Web Form', time: '5m' },
  { id: 'lead', label: 'New Lead', source: 'via Landing Page', time: '12m' },
]

const output = [
  { id: 'reply', label: 'Auto-Reply Sent', time: '1.2s' },
  { id: 'meeting', label: 'Meeting Confirmed', time: '3.1s' },
  { id: 'qualified', label: 'Lead Qualified', time: '8.4s' },
]

const metrics = [
  { label: 'Tasks Processed Today', value: '128', color: '#C8A96E' },
  { label: 'Hours Saved/Week', value: '42', color: '#3D8B71' },
  { label: 'Avg Response Time', value: '2.1s', color: '#2A6B5A' },
  { label: 'System Uptime', value: '99.97%', color: '#C8A96E' },
]

const wps = [
  { x: lx + lw / 2, y: iy(0) + itemH / 2 },
  { x: cx + cw / 2, y: iy(0) + 12 },
  { x: cx + cw / 2, y: iy(0) + 12 + 130 },
  { x: rx + rw / 2, y: iy(0) + itemH / 2 },
]

export function HeroWorkflowVisual({ comfort }: { comfort: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pulseRef = useRef<SVGCircleElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!dotRef.current || !pulseRef.current || comfort) return
    const dot = dotRef.current, pulse = pulseRef.current
    const tl = gsap.timeline({ repeat: -1, ease: 'none' })
    for (let i = 0; i < wps.length - 1; i++) {
      const a = wps[i], b = wps[i + 1]
      const dx = b.x - a.x, dy = b.y - a.y
      tl.to({ val: 0 }, {
        val: 1, duration: 1.4,
        onUpdate: function () {
          const t = (this.targets()[0] as { val: number }).val
          const x = a.x + dx * t, y = a.y + dy * t
          dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y))
          pulse.setAttribute('cx', String(x)); pulse.setAttribute('cy', String(y))
        },
      })
    }
    tl.to({}, { duration: 1 })
    return () => { tl.kill() }
  }, [comfort])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || comfort) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.6 } })
      tl.fromTo('[data-asm="bar"]', { opacity: 0, y: -12 }, { opacity: 1, y: 0 })
      tl.fromTo('[data-asm="zones"]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.3')
      tl.fromTo('[data-asm="intake"]', { opacity: 0, x: -16 }, { opacity: 1, x: 0, stagger: 0.1, duration: 0.5 }, '-=0.4')
      tl.fromTo('[data-asm="center"]', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.7 }, '-=0.5')
      tl.fromTo('[data-asm="output"]', { opacity: 0, x: 16 }, { opacity: 1, x: 0, stagger: 0.1, duration: 0.5 }, '-=0.5')
      tl.fromTo('[data-asm="metrics"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
    }, svg)
    return () => ctx.revert()
  }, [comfort])

  return (
    <svg ref={svgRef} viewBox={`0 0 ${tw} ${th}`} className="w-full h-full" style={{ filter: 'drop-shadow(0 16px 56px rgba(0,0,0,0.6))' }} aria-hidden="true">
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A3D30" /><stop offset="50%" stopColor="#1C2A20" /><stop offset="100%" stopColor="#1C1612" />
        </linearGradient>
        <linearGradient id="engine-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(42,107,90,0.2)" /><stop offset="100%" stopColor="rgba(42,107,90,0.06)" />
        </linearGradient>
        <linearGradient id="gold-bar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C8A96E" /><stop offset="100%" stopColor="#C8A96E44" />
        </linearGradient>
        <filter id="glow-bright"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="inner-depth">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
          <feOffset dx="0" dy="1" result="offsetBlur" />
          <feFlood floodColor="rgba(0,0,0,0.4)" result="color" />
          <feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
          <feComposite in="shadow" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      <rect x="0" y="0" width={tw} height={th} rx={16} fill="url(#bg-grad)" />
      <rect x="0" y="0" width={tw} height={th} rx={16} fill="none" stroke="rgba(42,107,90,0.2)" strokeWidth={1} />

      <g data-asm="bar" opacity={0}>
        <rect x="0" y="0" width={tw} height={38} rx={16} fill="rgba(42,107,90,0.18)" />
        <rect x="0" y="19" width={tw} height={19} fill="rgba(42,107,90,0.18)" />
        <circle cx={20} cy={19} r={5} fill="#2A6B5A"><animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" /></circle>
        <text x={34} y={24} fill="rgba(250,250,247,0.6)" fontSize={11} fontFamily="var(--font-body), sans-serif" fontWeight={700} letterSpacing="0.1em">COMMAND CENTER</text>
        {[
          { label: 'API', status: 'Connected' },
          { label: 'QUEUE', status: '12 Active' },
          { label: 'BOT', status: 'Online' },
        ].map((badge, i) => (
          <g key={badge.label}>
            <circle cx={290 + i * 108} cy={19} r={3.5} fill="#3D8B71"><animate attributeName="opacity" values="1;0.4;1" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" /></circle>
            <text x={298 + i * 108} y={23} fill="rgba(250,250,247,0.25)" fontSize={8} fontFamily="var(--font-mono), monospace" letterSpacing="0.06em">{badge.label}</text>
            <text x={298 + i * 108} y={16} fill="rgba(250,250,247,0.5)" fontSize={8} fontFamily="var(--font-body), sans-serif">{badge.status}</text>
          </g>
        ))}
        <text x={tw - 16} y={24} textAnchor="end" fill="rgba(250,250,247,0.2)" fontSize={9} fontFamily="var(--font-mono), monospace">v2.4.1</text>
      </g>

      <g data-asm="zones" opacity={0}>
        <rect x={lx} y={py} width={lw} height={ph} rx={10} fill="rgba(28,22,18,0.45)" stroke="rgba(250,250,247,0.04)" strokeWidth={1} filter="url(#inner-depth)" />
        <rect x={cx} y={py} width={cw} height={ph} rx={10} fill="url(#engine-bg)" stroke="rgba(42,107,90,0.15)" strokeWidth={1} filter="url(#inner-depth)" />
        <rect x={rx} y={py} width={rw} height={ph} rx={10} fill="rgba(42,107,90,0.06)" stroke="rgba(42,107,90,0.08)" strokeWidth={1} filter="url(#inner-depth)" />
        {[
          { x: lx, w: lw, label: 'INTAKE QUEUE', count: '3' },
          { x: cx, w: cw, label: 'AUTOMATION CORE', count: 'Live' },
          { x: rx, w: rw, label: 'COMPLETED', count: '12' },
        ].map((z) => (
          <g key={z.label}>
            <rect x={z.x} y={py} width={z.w} height={headerH} rx={10} fill="rgba(0,0,0,0.35)" />
            <rect x={z.x} y={py + 10} width={z.w} height={headerH - 10} fill="rgba(0,0,0,0.35)" />
            <text x={z.x + pPad} y={py + 20} fill="rgba(250,250,247,0.35)" fontSize={9} fontFamily="var(--font-body), sans-serif" fontWeight={700} letterSpacing="0.14em">{z.label}</text>
            <rect x={z.x + z.w - pPad - 24} y={py + 8} width={24} height={16} rx={4} fill="rgba(42,107,90,0.3)" />
            <text x={z.x + z.w - pPad - 12} y={py + 20} textAnchor="middle" fill="rgba(250,250,247,0.5)" fontSize={8} fontFamily="var(--font-mono), monospace">{z.count}</text>
          </g>
        ))}
      </g>

      {[0, 1, 2].map((i) => {
        const sx = lx + lw, sy = iy(i) + itemH / 2
        const ex = cx, ey = iy(i) + 12 + (i === 0 ? 16 : i === 1 ? 56 : 90)
        return (
          <path key={`i-c-${i}`} d={`M${sx},${sy} C${sx + 20},${sy} ${ex - 10},${ey} ${ex},${ey}`}
            fill="none" stroke="rgba(250,250,247,0.08)" strokeWidth={1.5} strokeDasharray="3 4" />
        )
      })}
      {[0, 1, 2].map((i) => {
        const sx = cx + cw, sy = iy(i) + 12 + (i === 0 ? 16 : i === 1 ? 56 : 90)
        const ex = rx, ey = iy(i) + itemH / 2
        return (
          <path key={`c-o-${i}`} d={`M${sx},${sy} C${sx + 10},${sy} ${ex - 20},${ey} ${ex},${ey}`}
            fill="none" stroke="rgba(42,107,90,0.15)" strokeWidth={1.5} strokeDasharray="3 4" />
        )
      })}

      {intake.map((el, i) => {
        const x = lx + pPad, y = iy(i), w = lw - pPad * 2
        return (
          <g key={el.id} data-asm="intake" opacity={0}>
            <rect x={x} y={y} width={w} height={itemH} rx={8} fill="rgba(28,22,18,0.6)" stroke="rgba(250,250,247,0.06)" strokeWidth={1} />
            <circle cx={x + 14} cy={y + 24} r={4} fill="#C8A96E" opacity={0.45}>
              <animate attributeName="opacity" values="0.15;0.7;0.15" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </circle>
            <text x={x + 26} y={y + 28} fill="rgba(250,250,247,0.9)" fontSize={12} fontFamily="var(--font-body), sans-serif" fontWeight={600}>{el.label}</text>
            <text x={x + 14} y={y + 52} fill="rgba(250,250,247,0.25)" fontSize={9} fontFamily="var(--font-body), sans-serif">{el.source}</text>
            <rect x={x + 14} y={y + 66} width={48} height={18} rx={4} fill="rgba(200,169,110,0.12)" />
            <text x={x + 38} y={y + 79} textAnchor="middle" fill="#C8A96E" fontSize={8} fontFamily="var(--font-mono), monospace" opacity={0.6}>{el.time} ago</text>
          </g>
        )
      })}

      <g data-asm="center" opacity={0}>
        <rect x={cx + pPad} y={iy(0)} width={cw - pPad * 2} height={118} rx={10} fill="rgba(42,107,90,0.18)" stroke="rgba(42,107,90,0.45)" strokeWidth={1.5} />
        <rect x={cx + pPad} y={iy(0)} width={cw - pPad * 2} height={3} rx={1.5} fill="url(#gold-bar)" />
        <text x={cx + pPad + 14} y={iy(0) + 26} fill="rgba(250,250,247,0.95)" fontSize={13} fontFamily="var(--font-body), sans-serif" fontWeight={700}>AI Router</text>
        <text x={cx + pPad + 14} y={iy(0) + 44} fill="rgba(250,250,247,0.35)" fontSize={9} fontFamily="var(--font-body), sans-serif">Intent Classification &amp; Routing</text>
        <rect x={cx + pPad + 14} y={iy(0) + 60} width={cw - pPad * 2 - 28} height={8} rx={4} fill="rgba(42,107,90,0.3)">
          <animate attributeName="width" values="0;380" dur="3s" repeatCount="indefinite" />
        </rect>
        <text x={cx + pPad + 14} y={iy(0) + 86} fill="rgba(250,250,247,0.25)" fontSize={8} fontFamily="var(--font-mono), monospace">Processing 3 tasks...</text>
        <g>
          {[0, 1, 2, 3].map((j) => (
            <circle key={j} cx={cx + pPad + 14 + j * 20} cy={iy(0) + 104} r={3} fill="#C8A96E" opacity={0.2}>
              <animate attributeName="opacity" values="0.15;0.8;0.15" dur="1.8s" begin={`${j * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      </g>

      {[
        { id: 'wf', label: 'Workflow Engine', tag: '80% complete', x: cx + pPad },
        { id: 'crm', label: 'CRM Sync', tag: '1,240 synced', x: cx + pPad + (cw - pPad * 2 - 12) / 2 + 12 },
      ].map((el) => {
        const bw = (cw - pPad * 2 - 12) / 2, ey = iy(0) + 118 + 14
        return (
          <g key={el.id} data-asm="center" opacity={0}>
            <rect x={el.x} y={ey} width={bw} height={94} rx={10} fill="rgba(42,107,90,0.1)" stroke="rgba(42,107,90,0.25)" strokeWidth={1.2} />
            <rect x={el.x} y={ey} width={bw} height={2.5} rx={1.25} fill="#C8A96E" opacity={0.3} />
            <text x={el.x + bw / 2} y={ey + 26} textAnchor="middle" fill="rgba(250,250,247,0.85)" fontSize={11} fontFamily="var(--font-body), sans-serif" fontWeight={600}>{el.label}</text>
            <text x={el.x + bw / 2} y={ey + 44} textAnchor="middle" fill="rgba(250,250,247,0.3)" fontSize={8} fontFamily="var(--font-body), sans-serif">{el.tag}</text>
            {el.id === 'wf' && (
              <rect x={el.x + 14} y={ey + 60} width={bw - 28} height={6} rx={3} fill="rgba(42,107,90,0.3)">
                <animate attributeName="width" values="0;120" dur="2.5s" repeatCount="indefinite" />
              </rect>
            )}
            {el.id === 'crm' && (
              <g>
                {[0, 1, 2, 3].map((j) => (
                  <circle key={j} cx={el.x + 14 + j * 16 + bw / 2 - 24} cy={ey + 66} r={3} fill="#2A6B5A">
                    <animate attributeName="opacity" values="0.15;1;0.15" dur="1.8s" begin={`${j * 0.25}s`} repeatCount="indefinite" />
                  </circle>
                ))}
              </g>
            )}
          </g>
        )
      })}

      {output.map((el, i) => {
        const x = rx + pPad, y = iy(i), w = rw - pPad * 2
        return (
          <g key={el.id} data-asm="output" opacity={0}>
            <rect x={x} y={y} width={w} height={itemH} rx={8} fill="rgba(42,107,90,0.1)" stroke="rgba(42,107,90,0.18)" strokeWidth={1} />
            <circle cx={x + 14} cy={y + 24} r={4} fill="#2A6B5A" opacity={0.6}>
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <text x={x + 26} y={y + 28} fill="rgba(250,250,247,0.9)" fontSize={11} fontFamily="var(--font-body), sans-serif" fontWeight={600}>{el.label}</text>
            <rect x={x + 14} y={y + 48} width={56} height={18} rx={4} fill="rgba(42,107,90,0.2)" />
            <text x={x + 42} y={y + 61} textAnchor="middle" fill="rgba(250,250,247,0.4)" fontSize={8} fontFamily="var(--font-mono), monospace">{el.time}</text>
            <rect x={x + 14} y={y + 74} width={w - 28} height={2} rx={1} fill="rgba(42,107,90,0.15)" />
            <text x={x + w / 2} y={y + 92} textAnchor="middle" fill="rgba(42,107,90,0.5)" fontSize={7} fontFamily="var(--font-body), sans-serif" letterSpacing="0.08em">COMPLETE</text>
          </g>
        )
      })}

      <g data-asm="metrics" opacity={0}>
        <rect x={lx} y={py + ph + 12} width={tw - lx * 2} height={48} rx={8} fill="rgba(42,107,90,0.14)" stroke="rgba(42,107,90,0.12)" strokeWidth={1} />
        {metrics.map((m, i) => {
          const mx = lx + 24 + i * ((tw - lx * 2 - 48) / 4)
          return (
            <g key={m.label}>
              <text x={mx} y={py + ph + 32} fill="rgba(250,250,247,0.25)" fontSize={8} fontFamily="var(--font-body), sans-serif" letterSpacing="0.06em">{m.label}</text>
              <text x={mx} y={py + ph + 50} fill={m.color} fontSize={18} fontFamily="var(--font-mono), monospace" fontWeight={700}>{m.value}</text>
              {i < 3 && <line x1={mx + ((tw - lx * 2 - 48) / 4) - 12} y1={py + ph + 18} x2={mx + ((tw - lx * 2 - 48) / 4) - 12} y2={py + ph + 50} stroke="rgba(250,250,247,0.04)" strokeWidth={1} />}
            </g>
          )
        })}
      </g>

      <circle ref={pulseRef} cx={wps[0].x} cy={wps[0].y} r={12} fill="#C8A96E" opacity={0.1} filter="url(#glow-bright)" />
      <circle ref={dotRef} cx={wps[0].x} cy={wps[0].y} r={3.5} fill="#C8A96E" style={{ filter: 'drop-shadow(0 0 8px rgba(200,169,110,0.6))' }} />
    </svg>
  )
}
