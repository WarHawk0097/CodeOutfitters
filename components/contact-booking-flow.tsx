'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isPast,
  isToday,
  addMonths,
  getDay,
  isSameDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2, CalendarClock } from 'lucide-react'
import { detectTimezone } from './timezone-selector'

/* ─── Approved constants ─────────────────────────────────────────────── */

type Step = 'project_details' | 'choosing_slot' | 'reviewing_booking' | 'request_prepared'

interface ProjectDetails {
  fullName: string
  workEmail: string
  businessName: string
  automationCategory: string
  workflowDescription: string
}

const AUTOMATION_CATEGORIES = [
  { value: 'whatsapp', label: 'WhatsApp lead automation' },
  { value: 'email', label: 'Email workflows' },
  { value: 'support', label: 'Support chat / AI chatbot' },
  { value: 'booking', label: 'Booking & scheduling' },
  { value: 'invoice', label: 'Invoice / order automation' },
  { value: 'custom', label: 'Something custom' },
  { value: 'unsure', label: 'Not sure yet' },
]

const CATEGORY_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp lead automation',
  email: 'Email workflows',
  support: 'Support chat / AI chatbot',
  booking: 'Booking & scheduling',
  invoice: 'Invoice / order automation',
  custom: 'Something custom',
  unsure: 'Not sure yet',
}

/* Deterministic sample data — NO Math.random(). Approved: fixed 30-min starts
   in business tz, indices 3 & 6 shown as booked. Fully-booked dates: day % 9 === 4. */
const BUSINESS_TZ = 'America/New_York'
const SAMPLE_STARTS: [number, number][] = [
  [9, 0], [9, 30], [10, 0], [10, 30], [11, 0], [13, 0], [13, 30], [14, 0],
]
const TAKEN_IDX = [3, 6]

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/* ─── Timezone combobox data (approved list) ─────────────────────────── */

interface TzOption {
  v: string
  name: string
  short: string
  city: string
  country: string
}

const TZ_LIST: TzOption[] = [
  { v: 'America/New_York', name: 'Eastern Time', short: 'ET', city: 'New York', country: 'United States' },
  { v: 'America/Chicago', name: 'Central Time', short: 'CT', city: 'Chicago', country: 'United States' },
  { v: 'America/Denver', name: 'Mountain Time', short: 'MT', city: 'Denver', country: 'United States' },
  { v: 'America/Phoenix', name: 'Mountain Time (no DST)', short: 'MST', city: 'Phoenix', country: 'United States' },
  { v: 'America/Los_Angeles', name: 'Pacific Time', short: 'PT', city: 'Los Angeles', country: 'United States' },
  { v: 'America/Anchorage', name: 'Alaska Time', short: 'AKT', city: 'Anchorage', country: 'United States' },
  { v: 'Pacific/Honolulu', name: 'Hawaii Time', short: 'HST', city: 'Honolulu', country: 'United States' },
  { v: 'America/Toronto', name: 'Eastern Time', short: 'ET', city: 'Toronto', country: 'Canada' },
  { v: 'America/Vancouver', name: 'Pacific Time', short: 'PT', city: 'Vancouver', country: 'Canada' },
  { v: 'America/Mexico_City', name: 'Central Time', short: 'CT', city: 'Mexico City', country: 'Mexico' },
  { v: 'America/Sao_Paulo', name: 'Brasília Time', short: 'BRT', city: 'São Paulo', country: 'Brazil' },
  { v: 'Europe/London', name: 'UK Time', short: 'GMT/BST', city: 'London', country: 'United Kingdom' },
  { v: 'Europe/Dublin', name: 'Ireland Time', short: 'IST', city: 'Dublin', country: 'Ireland' },
  { v: 'Europe/Paris', name: 'Central European Time', short: 'CET', city: 'Paris', country: 'France' },
  { v: 'Europe/Berlin', name: 'Central European Time', short: 'CET', city: 'Berlin', country: 'Germany' },
  { v: 'Europe/Madrid', name: 'Central European Time', short: 'CET', city: 'Madrid', country: 'Spain' },
  { v: 'Europe/Amsterdam', name: 'Central European Time', short: 'CET', city: 'Amsterdam', country: 'Netherlands' },
  { v: 'Europe/Athens', name: 'Eastern European Time', short: 'EET', city: 'Athens', country: 'Greece' },
  { v: 'Europe/Istanbul', name: 'Turkey Time', short: 'TRT', city: 'Istanbul', country: 'Türkiye' },
  { v: 'Europe/Moscow', name: 'Moscow Time', short: 'MSK', city: 'Moscow', country: 'Russia' },
  { v: 'Africa/Lagos', name: 'West Africa Time', short: 'WAT', city: 'Lagos', country: 'Nigeria' },
  { v: 'Africa/Johannesburg', name: 'South Africa Time', short: 'SAST', city: 'Johannesburg', country: 'South Africa' },
  { v: 'Africa/Cairo', name: 'Eastern European Time', short: 'EET', city: 'Cairo', country: 'Egypt' },
  { v: 'Asia/Dubai', name: 'Gulf Standard Time', short: 'GST', city: 'Dubai', country: 'United Arab Emirates' },
  { v: 'Asia/Karachi', name: 'Pakistan Standard Time', short: 'PKT', city: 'Karachi', country: 'Pakistan' },
  { v: 'Asia/Kolkata', name: 'India Standard Time', short: 'IST', city: 'Mumbai', country: 'India' },
  { v: 'Asia/Dhaka', name: 'Bangladesh Time', short: 'BST', city: 'Dhaka', country: 'Bangladesh' },
  { v: 'Asia/Bangkok', name: 'Indochina Time', short: 'ICT', city: 'Bangkok', country: 'Thailand' },
  { v: 'Asia/Singapore', name: 'Singapore Time', short: 'SGT', city: 'Singapore', country: 'Singapore' },
  { v: 'Asia/Hong_Kong', name: 'Hong Kong Time', short: 'HKT', city: 'Hong Kong', country: 'Hong Kong' },
  { v: 'Asia/Shanghai', name: 'China Standard Time', short: 'CST', city: 'Shanghai', country: 'China' },
  { v: 'Asia/Tokyo', name: 'Japan Standard Time', short: 'JST', city: 'Tokyo', country: 'Japan' },
  { v: 'Asia/Seoul', name: 'Korea Standard Time', short: 'KST', city: 'Seoul', country: 'South Korea' },
  { v: 'Asia/Jakarta', name: 'Western Indonesia Time', short: 'WIB', city: 'Jakarta', country: 'Indonesia' },
  { v: 'Australia/Sydney', name: 'Australian Eastern Time', short: 'AET', city: 'Sydney', country: 'Australia' },
  { v: 'Australia/Perth', name: 'Australian Western Time', short: 'AWT', city: 'Perth', country: 'Australia' },
  { v: 'Pacific/Auckland', name: 'New Zealand Time', short: 'NZT', city: 'Auckland', country: 'New Zealand' },
]

/* ─── Timezone helpers (approved) ────────────────────────────────────── */

function tzOffset(date: Date, tz: string): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    const p: Record<string, string> = {}
    dtf.formatToParts(date).forEach(x => { p[x.type] = x.value })
    const h = p.hour === '24' ? 0 : +p.hour
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, h, +p.minute, +p.second)
    return Math.round((asUTC - date.getTime()) / 60000)
  } catch { return 0 }
}

function zonedToUtc(y: number, m: number, d: number, hh: number, mm: number, tz: string): Date {
  const guess = Date.UTC(y, m, d, hh, mm)
  const off = tzOffset(new Date(guess), tz)
  return new Date(guess - off * 60000)
}

function fmtTime(inst: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(inst)
  } catch { return '' }
}

function offsetLabel(tz: string): string {
  const off = tzOffset(new Date(), tz)
  const sign = off >= 0 ? '+' : '-'
  const a = Math.abs(off)
  return 'UTC' + sign + String(Math.floor(a / 60)).padStart(2, '0') + ':' + String(a % 60).padStart(2, '0')
}

function validTz(tz: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}

/* ─── Component ──────────────────────────────────────────────────────── */

interface ContactBookingFlowProps {
  motionMode?: 'full' | 'reduced'
}

export function ContactBookingFlow(_props: ContactBookingFlowProps) {
  const [step, setStep] = useState<Step>('project_details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [business, setBusiness] = useState('')
  const [interest, setInterest] = useState('')
  const [message, setMessage] = useState('')

  const [s1ErrName, setS1ErrName] = useState(false)
  const [s1ErrEmail, setS1ErrEmail] = useState(false)
  const [s1ErrBusiness, setS1ErrBusiness] = useState(false)
  const [s1ErrInterest, setS1ErrInterest] = useState(false)
  const [s1ErrMessage, setS1ErrMessage] = useState(false)

  const [monthOffset, setMonthOffset] = useState(0)
  const [navParity, setNavParity] = useState(0)
  const [gridDir, setGridDir] = useState('12px')

  const [selDate, setSelDate] = useState<string | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [fullyBookedSel, setFullyBookedSel] = useState(false)
  const [selSlot, setSelSlot] = useState<string | null>(null)

  const [tz, setTz] = useState(() => detectTimezone())
  const [detectedTz, setDetectedTz] = useState<string | null>(null)

  const [bPhone, setBPhone] = useState('')
  const [bConsent, setBConsent] = useState(false)
  const [bErrConsent, setBErrConsent] = useState(false)

  const [tzOpen, setTzOpen] = useState(false)
  const [tzQuery, setTzQuery] = useState('')
  const [tzActive, setTzActive] = useState(0)

  const [mounted, setMounted] = useState(false)
  const [slotLoadTimer, setSlotLoadTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const step2Ref = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const tzRootRef = useRef<HTMLDivElement>(null)
  const tzTriggerRef = useRef<HTMLButtonElement>(null)
  const tzSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  /* Detect timezone on mount */
  useEffect(() => {
    try {
      const z = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (z && validTz(z)) { setDetectedTz(z); setTz(z) }
    } catch { /* ignore */ }
  }, [])

  /* Close tz dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tzOpen && tzRootRef.current && !tzRootRef.current.contains(e.target as Node)) {
        setTzOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tzOpen])

  /* Cleanup slot load timer */
  useEffect(() => {
    return () => { if (slotLoadTimer) clearTimeout(slotLoadTimer) }
  }, [slotLoadTimer])

  /* Reduced motion check */
  const isReduced = useCallback(() => {
    try { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false } catch { return false }
  }, [])

  /* Scroll + focus helper (approved pattern) */
  const scrollFocus = useCallback((anchorId: string, focusId: string) => {
    setTimeout(() => {
      const a = document.getElementById(anchorId)
      if (a) {
        const top = a.getBoundingClientRect().top + window.pageYOffset - 90
        window.scrollTo({ top, behavior: isReduced() ? 'auto' : 'smooth' })
      }
      const f = document.getElementById(focusId)
      if (f) { try { f.focus({ preventScroll: true }) } catch { f.focus() } }
    }, 40)
  }, [isReduced])

  /* ─── Calendar view computation ─────────────────────────────────────── */

  const base = useMemo(() => new Date(), [])
  const view = useMemo(() => new Date(base.getFullYear(), base.getMonth() + monthOffset, 1), [base, monthOffset])
  const vy = view.getFullYear()
  const vm = view.getMonth()
  const daysInMonth = useMemo(() => eachDayOfInterval({ start: startOfMonth(view), end: endOfMonth(view) }), [view])
  const firstDow = new Date(vy, vm, 1).getDay()
  const todayKey = `${base.getFullYear()}-${base.getMonth()}-${base.getDate()}`

  /* Deterministic availability — matches approved: past/weekend = unavailable,
     day % 9 === 4 = fully booked, else available */
  const dayAvail = useCallback((d: Date): 'available' | 'fullybooked' | 'unavailable' => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dow = d.getDay()
    if (d < today || dow === 0 || dow === 6) return 'unavailable'
    if (d.getDate() % 9 === 4) return 'fullybooked'
    return 'available'
  }, [])

  const fmtDate = (dt: Date) => dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  /* Calendar cells */
  const cells = useMemo(() => {
    const result: Array<{
      day: string; disabled: boolean; aria: string; current: "date" | false
      style: React.CSSProperties; dotStyle: React.CSSProperties; onClick: () => void
    }> = []

    for (let b = 0; b < firstDow; b++) {
      result.push({ day: '', disabled: true, aria: '', current: false, style: { visibility: 'hidden' }, dotStyle: { display: 'none' }, onClick: () => {} })
    }

    for (let day = 1; day <= daysInMonth.length; day++) {
      const d = new Date(vy, vm, day)
      const key = `${vy}-${vm}-${day}`
      const avail = dayAvail(d)
      const isToday_ = key === todayKey
      const isSel = selDate === key
      const clickable = avail === 'available' || avail === 'fullybooked'

      let bg = '#fff', color = '#0A120E', border = '#E5DCCB'
      if (avail === 'unavailable') { bg = '#F2ECE0'; color = '#B8B0A0'; border = 'transparent' }
      if (isToday_) { bg = '#EAF6EF'; border = '#9AD9BC' }
      if (isSel) { bg = '#128A54'; color = '#fff'; border = '#128A54' }

      let dot = 'transparent', dotBorder = 'none'
      if (avail === 'available') dot = isSel ? '#fff' : '#2BD483'
      else if (avail === 'fullybooked') { dot = 'transparent'; dotBorder = '1.5px solid ' + (isSel ? '#fff' : '#C9A24A') }

      const label = fmtDate(d)
      const statusWord = avail === 'available' ? 'available' : avail === 'fullybooked' ? 'fully booked' : 'unavailable'

      result.push({
        day: String(day),
        disabled: !clickable,
        aria: `${label}, ${statusWord}${isSel ? ', selected' : ''}`,
        current: isToday_ ? 'date' : false,
        style: {
          position: 'relative', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${border}`, borderRadius: '11px', background: bg, color,
          font: "600 14px 'Instrument Sans',sans-serif", cursor: clickable ? 'pointer' : 'default', padding: 0,
        },
        dotStyle: {
          position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)',
          width: '6px', height: '6px', borderRadius: '999px', background: dot, border: dotBorder, boxSizing: 'border-box',
        },
        onClick: () => {
          if (!clickable) return
          if (avail === 'fullybooked') {
            setSelDate(key); setSelSlot(null); setStep('choosing_slot'); setSlotsLoading(false); setFullyBookedSel(true)
          } else {
            setSelDate(key); setSelSlot(null); setStep('choosing_slot'); setFullyBookedSel(false); setSlotsLoading(true)
            if (slotLoadTimer) clearTimeout(slotLoadTimer)
            setSlotLoadTimer(setTimeout(() => setSlotsLoading(false), 520))
          }
        },
      })
    }
    return result
  }, [firstDow, daysInMonth, vy, vm, todayKey, selDate, dayAvail, slotLoadTimer])

  /* Selected date display */
  const selParts = selDate ? selDate.split('-').map(Number) : null
  const selDateObj = selParts ? new Date(selParts[0], selParts[1], selParts[2]) : null
  const selDateLabel = selDateObj ? fmtDate(selDateObj) : ''

  /* ─── Timezone combobox (approved searchable) ───────────────────────── */

  const tzBase = useMemo(() => {
    const list = [...TZ_LIST]
    if (detectedTz && !list.some(o => o.v === detectedTz)) {
      const city = detectedTz.split('/').pop()?.replace(/_/g, ' ') ?? detectedTz
      list.unshift({ v: detectedTz, name: city + ' Time', short: '', city, country: '' })
    }
    return list
  }, [detectedTz])

  const tzFiltered = useMemo(() => {
    const q = tzQuery.trim().toLowerCase()
    if (!q) return tzBase
    return tzBase.filter(o =>
      (o.name + ' ' + o.short + ' ' + o.city + ' ' + o.country + ' ' + o.v).toLowerCase().includes(q)
    )
  }, [tzBase, tzQuery])

  const tzActiveClamped = Math.max(0, Math.min(tzActive, tzFiltered.length - 1))
  const curTz = tzBase.find(o => o.v === tz) || tzBase[0] || { name: tz, short: '', city: '' }
  const tzLabelFull = curTz.short ? curTz.name + ' (' + curTz.short + ')' : curTz.name

  /* ─── Slots (deterministic, recalc into selected tz) ────────────────── */

  const slots = useMemo(() => {
    if (!selParts) return []
    return SAMPLE_STARTS.map((st, i) => {
      const startInst = zonedToUtc(selParts[0], selParts[1], selParts[2], st[0], st[1], BUSINESS_TZ)
      const endInst = new Date(startInst.getTime() + 30 * 60000)
      const id = `slot_${startInst.toISOString()}`
      const taken = TAKEN_IDX.includes(i)
      const isSel = selSlot === id
      const timeLabel = fmtTime(startInst, tz) + ' – ' + fmtTime(endInst, tz)

      let bg = '#FDFBF6', border = '#E5DCCB', color = '#0A120E', sub = '30 min', subColor = '#8A857B', textDecoration = 'none'
      if (taken) { bg = '#F2ECE0'; border = 'transparent'; color = '#B0A896'; sub = 'Booked'; subColor = '#B0A896'; textDecoration = 'line-through' }
      if (isSel) { bg = '#EAF6EF'; border = '#17A063'; color = '#0A452B'; sub = 'Selected'; subColor = '#128A54' }

      return {
        id, time: timeLabel, sub, selected: isSel, disabled: taken,
        style: {
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px',
          padding: '11px 14px', borderRadius: '11px', border: `1px solid ${border}`, background: bg, color,
          cursor: taken ? 'not-allowed' : 'pointer', textAlign: 'left',
          boxShadow: isSel ? 'inset 0 0 0 1px #17A063' : 'none', textDecoration,
          animation: 'bkSlotIn .32s ease both', animationDelay: `${i * 40}ms`,
        } as React.CSSProperties,
        subStyle: { font: "500 11.5px 'Instrument Sans',sans-serif", color: subColor } as React.CSSProperties,
        aria: `${timeLabel}, 30 minutes, ${taken ? 'unavailable' : isSel ? 'selected' : 'available'}`,
        onClick: taken ? () => {} : () => { setSelSlot(id); setStep('reviewing_booking') },
      }
    })
  }, [selParts, tz, selSlot])

  /* Selected slot summary */
  const selSlotTime = useMemo(() => {
    if (!selSlot) return ''
    const startInst = new Date(selSlot.replace('slot_', ''))
    const endInst = new Date(startInst.getTime() + 30 * 60000)
    return fmtTime(startInst, tz) + ' – ' + fmtTime(endInst, tz)
  }, [selSlot, tz])

  /* ─── Step 1 validation ─────────────────────────────────────────────── */

  const step1Errors = useCallback(() => ({
    eN: !name.trim(),
    eE: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email),
    eB: !business.trim(),
    eI: !interest,
    eM: !message.trim(),
  }), [name, email, business, interest, message])

  /* ─── Handlers ──────────────────────────────────────────────────────── */

  const continueToBooking = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const er = step1Errors()
    if (er.eN || er.eE || er.eB || er.eI || er.eM) {
      setS1ErrName(er.eN); setS1ErrEmail(er.eE); setS1ErrBusiness(er.eB); setS1ErrInterest(er.eI); setS1ErrMessage(er.eM)
      const first = er.eN ? 's1-name' : er.eE ? 's1-email' : er.eB ? 's1-business' : er.eI ? 's1-interest' : 's1-message'
      setTimeout(() => { document.getElementById(first)?.focus() }, 30)
      return
    }
    setS1ErrName(false); setS1ErrEmail(false); setS1ErrBusiness(false); setS1ErrInterest(false); setS1ErrMessage(false)
    setStep('choosing_slot')
    scrollFocus('contact-booking', 'booking-step2-heading')
  }, [step1Errors, scrollFocus])

  const confirm = useCallback(() => {
    const er = step1Errors()
    if (er.eN || er.eE || er.eB || er.eI || er.eM) {
      setS1ErrName(er.eN); setS1ErrEmail(er.eE); setS1ErrBusiness(er.eB); setS1ErrInterest(er.eI); setS1ErrMessage(er.eM)
      setStep('project_details')
      scrollFocus('contact-step1', 's1-name')
      return
    }
    if (!bConsent) { setBErrConsent(true); return }
    setBErrConsent(false)
    setStep('request_prepared')
  }, [step1Errors, bConsent, scrollFocus])

  const bkPrevMonth = useCallback(() => {
    if (monthOffset <= 0) return
    setMonthOffset(monthOffset - 1)
    setNavParity(navParity ? 0 : 1)
    setGridDir('-12px')
    setSelDate(null); setSelSlot(null); setFullyBookedSel(false); setStep('choosing_slot')
  }, [monthOffset, navParity])

  const bkNextMonth = useCallback(() => {
    if (monthOffset >= 3) return
    setMonthOffset(monthOffset + 1)
    setNavParity(navParity ? 0 : 1)
    setGridDir('12px')
    setSelDate(null); setSelSlot(null); setFullyBookedSel(false); setStep('choosing_slot')
  }, [monthOffset, navParity])

  const bkEditDetails = useCallback(() => {
    setStep('project_details')
    scrollFocus('contact-step1', 's1-name')
  }, [scrollFocus])

  const bkReset = useCallback(() => {
    setSelDate(null); setSelSlot(null); setStep('choosing_slot'); setFullyBookedSel(false)
  }, [])

  const bkBack = useCallback(() => {
    setSelSlot(null); setStep('choosing_slot')
  }, [])

  const tzToggle = useCallback(() => {
    if (tzOpen) { setTzOpen(false) }
    else {
      setTzOpen(true); setTzQuery(''); setTzActive(0)
      setTimeout(() => { tzSearchRef.current?.focus() }, 20)
    }
  }, [tzOpen])

  const tzTriggerKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!tzOpen) { setTzOpen(true); setTzQuery(''); setTzActive(0); setTimeout(() => tzSearchRef.current?.focus(), 20) }
    }
  }, [tzOpen])

  const tzSearchKey = useCallback((e: React.KeyboardEvent) => {
    const n = tzFiltered.length
    if (e.key === 'ArrowDown') { e.preventDefault(); setTzActive(Math.min(tzActiveClamped + 1, n - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setTzActive(Math.max(tzActiveClamped - 1, 0)) }
    else if (e.key === 'Home') { e.preventDefault(); setTzActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setTzActive(n - 1) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (tzFiltered[tzActiveClamped]) {
        setTz(tzFiltered[tzActiveClamped].v); setTzOpen(false)
        setTimeout(() => tzTriggerRef.current?.focus(), 10)
      }
    }
    else if (e.key === 'Escape') {
      e.preventDefault(); setTzOpen(false)
      setTimeout(() => tzTriggerRef.current?.focus(), 10)
    }
  }, [tzFiltered, tzActiveClamped])

  const tzSelect = useCallback((v: string) => {
    setTz(v); setTzOpen(false)
    setTimeout(() => tzTriggerRef.current?.focus(), 10)
  }, [])

  const trunc = (t: string, n: number) => t.length > n ? t.slice(0, n).trim() + '…' : t

  /* ─── Derived state ─────────────────────────────────────────────────── */

  const step2Active = step !== 'project_details'
  const step2Inactive = !step2Active
  const bkNoDate = !selDate && step !== 'request_prepared'
  const bkLoading = slotsLoading
  const bkFullyBooked = fullyBookedSel && step !== 'request_prepared'
  const bkShowSlots = !!selDate && !slotsLoading && !fullyBookedSel && step !== 'request_prepared'
  const bkShowReview = !!selSlot && step !== 'request_prepared'
  const bkRequestPrepared = step === 'request_prepared'
  const bkMonthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const rvName = name.trim() || '—'
  const rvEmail = email.trim() || '—'
  const rvBusiness = business.trim() || '—'
  const rvCategory = CATEGORY_LABELS[interest] || '—'
  const rvWorkflow = message.trim() ? trunc(message.trim(), 120) : '—'

  const portalTarget = mounted ? document.getElementById('contact-booking-portal') : null

  /* ─── Render ────────────────────────────────────────────────────────── */

  const inputClass = (field: string) =>
    `w-full bg-[#FDFBF6] border rounded-[11px] px-[15px] py-[13px] text-[15px] text-[#0A120E] placeholder-[#9B9088] outline-none transition-all duration-200 focus:border-[#17A063] focus:shadow-[0_0_0_4px_rgba(23,160,99,.12)] font-['Instrument_Sans',sans-serif] ${
      (field === 'fullName' && s1ErrName) || (field === 'workEmail' && s1ErrEmail) || (field === 'businessName' && s1ErrBusiness) || (field === 'automationCategory' && s1ErrInterest) || (field === 'workflowDescription' && s1ErrMessage)
        ? 'border-[#C0392B] shadow-[0_0_0_3px_rgba(192,57,43,.12)]'
        : 'border-[#E5DCCB]'
    }`

  const honeypotInput = (
    <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
      <input tabIndex={-1} autoComplete="off" name="website" type="text" />
    </div>
  )

  /* ─── Step 1 card (inside hero) ─────────────────────────────────────── */

  const step1Content = (
    <div id="contact-step1" style={{
      position: 'relative',
      background: 'linear-gradient(178deg,#fff,#FBF7EE 68%,#F6F1E4)',
      border: '1px solid rgba(13,58,49,.14)',
      borderRadius: '22px',
      padding: 'clamp(26px,3vw,34px)',
      boxShadow: '0 34px 82px rgba(0,0,0,.4)',
      minWidth: 0,
    }}>
      <form onSubmit={continueToBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {honeypotInput}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ display: 'block', font: "700 10.5px 'Instrument Sans',sans-serif", letterSpacing: '.13em', color: '#128A54', textTransform: 'uppercase' as const }}>
            Step 1 of 2 · Tell us about your workflow
          </span>
          <span style={{ font: "700 10px 'Instrument Sans',sans-serif", letterSpacing: '.06em', color: '#8A857B', background: '#F1EADD', borderRadius: '999px', padding: '4px 9px' }}>
            1 / 2
          </span>
        </div>

        <div>
          <label style={{ display: 'block', font: "600 12.5px 'Instrument Sans',sans-serif", color: '#26312A', marginBottom: '7px' }} htmlFor="s1-name">Full name</label>
          <input id="s1-name" name="fullName" value={name} onChange={e => setName(e.target.value)} placeholder="Jordan Miller"
            className={inputClass('fullName')}
            aria-invalid={s1ErrName} aria-describedby="s1-name-err" />
          {s1ErrName && <span id="s1-name-err" style={{ display: 'block', marginTop: '6px', font: "500 12px 'Instrument Sans',sans-serif", color: '#C0392B' }}>Please enter your name.</span>}
        </div>

        <div>
          <label style={{ display: 'block', font: "600 12.5px 'Instrument Sans',sans-serif", color: '#26312A', marginBottom: '7px' }} htmlFor="s1-email">Work email</label>
          <input id="s1-email" name="workEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jordan@yourbusiness.com"
            className={inputClass('workEmail')}
            aria-invalid={s1ErrEmail} aria-describedby="s1-email-err" />
          {s1ErrEmail && <span id="s1-email-err" style={{ display: 'block', marginTop: '6px', font: "500 12px 'Instrument Sans',sans-serif", color: '#C0392B' }}>Enter a valid work email.</span>}
        </div>

        <div>
          <label style={{ display: 'block', font: "600 12.5px 'Instrument Sans',sans-serif", color: '#26312A', marginBottom: '7px' }} htmlFor="s1-business">Business name</label>
          <input id="s1-business" name="businessName" value={business} onChange={e => setBusiness(e.target.value)} placeholder="Miller Realty Group"
            className={inputClass('businessName')}
            aria-invalid={s1ErrBusiness} aria-describedby="s1-business-err" />
          {s1ErrBusiness && <span id="s1-business-err" style={{ display: 'block', marginTop: '6px', font: "500 12px 'Instrument Sans',sans-serif", color: '#C0392B' }}>Please enter your business name.</span>}
        </div>

        <div>
          <label style={{ display: 'block', font: "600 12.5px 'Instrument Sans',sans-serif", color: '#26312A', marginBottom: '7px' }} htmlFor="s1-interest">What are you looking to automate?</label>
          <select id="s1-interest" name="automationCategory" value={interest} onChange={e => setInterest(e.target.value)}
            className={inputClass('automationCategory')}
            aria-invalid={s1ErrInterest} aria-describedby="s1-interest-err">
            <option value="">Select one…</option>
            {AUTOMATION_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {s1ErrInterest && <span id="s1-interest-err" style={{ display: 'block', marginTop: '6px', font: "500 12px 'Instrument Sans',sans-serif", color: '#C0392B' }}>Pick a category so we can prep.</span>}
        </div>

        <div>
          <label style={{ display: 'block', font: "600 12.5px 'Instrument Sans',sans-serif", color: '#26312A', marginBottom: '7px' }} htmlFor="s1-message">Tell us about your workflow</label>
          <textarea id="s1-message" name="workflowDescription" rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="What's eating the most time in your day-to-day?"
            className={inputClass('workflowDescription')}
            aria-invalid={s1ErrMessage} aria-describedby="s1-message-err" />
          {s1ErrMessage && <span id="s1-message-err" style={{ display: 'block', marginTop: '6px', font: "500 12px 'Instrument Sans',sans-serif", color: '#C0392B' }}>Tell us a little about the workflow.</span>}
        </div>

        <button type="submit" className="cta-sweep" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
          font: "600 15.5px 'Instrument Sans',sans-serif", color: '#0A120E',
          background: '#2BD483', border: 'none', borderRadius: '12px', padding: '15px',
          cursor: 'pointer', whiteSpace: 'nowrap',
          boxShadow: '0 14px 34px rgba(43,212,131,.28)',
          transition: 'transform .15s ease, box-shadow .15s ease',
        }}>
          Continue to booking
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <p style={{ margin: 0, font: "400 12.5px/1.5 'Instrument Sans',sans-serif", color: '#8A857B', textAlign: 'center' }}>
          Next: pick a 30-minute time. Nothing is scheduled or sent until you request a slot.
        </p>
      </form>
    </div>
  )

  /* ─── Step 2 content (portal'd outside hero) ────────────────────────── */

  const step2Content = (
    <div id="contact-booking" ref={step2Ref} data-screen-label="Booking" style={{ background: '#F7F2EA' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(20px,3vw,40px) clamp(20px,3vw,32px) clamp(48px,7vw,80px)' }}>

        {/* INACTIVE STATE */}
        {step2Inactive && (
          <div aria-hidden="true" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
            padding: '22px 20px', border: '1px dashed #DCD3C0', borderRadius: '16px', opacity: '.55',
          }}>
            <span style={{
              flexShrink: 0, width: '30px', height: '30px', borderRadius: '999px',
              border: '1.5px solid #B9AF98', color: '#9A937F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: "700 13px 'Space Grotesk',sans-serif",
            }}>2</span>
            <span style={{ font: "600 14px 'Instrument Sans',sans-serif", color: '#8A857B', letterSpacing: '.02em' }}>
              Step 2 · Choose a 30-minute time — unlocks after Step 1
            </span>
          </div>
        )}

        {/* ACTIVE STATE */}
        {step2Active && (
          <>
            {/* Step 2 heading block */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
              textAlign: 'center', marginBottom: 'clamp(26px,4vw,38px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ width: '38px', height: '2px', background: '#D9B36A' }} />
                <span style={{ font: "700 12px 'Instrument Sans',sans-serif", letterSpacing: '.16em', color: '#128A54', textTransform: 'uppercase' as const }}>
                  Step 2 of 2 · Choose a 30-minute time
                </span>
                <span style={{ width: '38px', height: '2px', background: '#D9B36A' }} />
              </div>
              <h2 id="booking-step2-heading" ref={headingRef} tabIndex={-1} style={{
                margin: 0, outline: 'none',
                font: "600 clamp(26px,3.2vw,38px)/1.14 'Space Grotesk',sans-serif",
                color: '#0A120E', letterSpacing: '-.02em', textWrap: 'balance',
              }}>
                Book a 30-minute discovery call.
              </h2>
              <p style={{ margin: 0, font: "400 16.5px/1.6 'Instrument Sans',sans-serif", color: '#5B6355', maxWidth: '480px' }}>
                Pick a date and an open 30-minute slot. You'll see the exact time in your own timezone, then review your details before you request it.
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                font: "600 11px 'Instrument Sans',sans-serif", letterSpacing: '.04em',
                color: '#8A6D2F', background: 'rgba(217,179,106,.16)',
                border: '1px solid rgba(217,179,106,.5)', borderRadius: '999px',
                padding: '6px 14px', textTransform: 'uppercase' as const,
              }}>
                Design preview sample availability — not live calendar data
              </span>
            </div>

            {/* Booking card */}
            <div style={{
              animation: 'bkCalRise .64s cubic-bezier(.16,1,.3,1) both',
              background: '#fff', border: '1px solid rgba(13,58,49,.14)',
              borderRadius: '22px', padding: 'clamp(20px,2.6vw,30px)',
              boxShadow: '0 30px 72px rgba(0,0,0,.10)',
            }}>
              <div className="bk-grid">
                {/* LEFT · CALENDAR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <button type="button" className="bk-nav" onClick={bkPrevMonth} disabled={monthOffset <= 0} aria-label="Previous month">‹</button>
                    <span role="heading" aria-live="polite" style={{ font: "600 17px 'Space Grotesk',sans-serif", color: '#0A120E' }}>{bkMonthLabel}</span>
                    <button type="button" className="bk-nav" onClick={bkNextMonth} disabled={monthOffset >= 3} aria-label="Next month">›</button>
                  </div>

                  {/* Weekday headers */}
                  <div className="bk-daygrid" aria-hidden="true">
                    {WEEKDAY_LABELS.map(w => (
                      <span key={w} style={{ textAlign: 'center', font: "700 11px 'Instrument Sans',sans-serif", letterSpacing: '.04em', color: '#9A937F', padding: '2px 0' }}>{w}</span>
                    ))}
                  </div>

                  {/* Day grid */}
                  <div className="bk-daygrid" role="grid" aria-label="Choose a date"
                    style={{ animation: `${navParity ? 'bkMonthB' : 'bkMonthA'} .4s cubic-bezier(.16,1,.3,1) both`, ['--gd' as string]: gridDir }}>
                    {cells.map((c, i) => (
                      <button key={i} type="button" className="bk-day" style={c.style} onClick={c.onClick} disabled={c.disabled}
                        aria-label={c.aria} aria-current={(c.current || undefined) as "date" | undefined}>
                        {c.day}
                        <span style={c.dotStyle} />
                      </button>
                    ))}
                  </div>

                  {/* Availability legend */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', paddingTop: '4px', font: "500 12px 'Instrument Sans',sans-serif", color: '#77705F' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '999px', background: '#2BD483' }} />Available
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '999px', border: '1.5px solid #C9A24A', boxSizing: 'border-box' as const }} />Fully booked
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#D8D0BF' }} />Unavailable
                    </span>
                  </div>
                </div>

                {/* RIGHT · PANEL */}
                <div className="bk-panel" style={{
                  display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0,
                  borderLeft: '1px solid #EDE6D8', paddingLeft: 'clamp(20px,2.6vw,34px)',
                }}>
                  {/* TIMEZONE SELECTOR (searchable combobox) */}
                  <div ref={tzRootRef} style={{ position: 'relative' }}>
                    <label id="tz-label" style={{ display: 'block', font: "600 12.5px 'Instrument Sans',sans-serif", color: '#26312A', marginBottom: '7px' }}>Timezone</label>
                    <button type="button" ref={tzTriggerRef} className="tz-trigger" role="combobox"
                      aria-haspopup="listbox" aria-expanded={tzOpen} aria-controls="tz-listbox" aria-labelledby="tz-label"
                      onClick={tzToggle} onKeyDown={tzTriggerKey}>
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                        <span style={{ font: "600 14.5px 'Instrument Sans',sans-serif", color: '#0A120E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{tzLabelFull}</span>
                        <span style={{ font: "400 12px 'Instrument Sans',sans-serif", color: '#8A857B' }}>{(curTz.city ? curTz.city + ' · ' : '') + offsetLabel(tz)}</span>
                      </span>
                      <span style={{ font: "700 14px sans-serif", color: '#8A857B', transform: tzOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease', flexShrink: 0 }}>⌄</span>
                    </button>
                    {tzOpen && (
                      <div className="tz-pop" role="dialog" aria-label="Choose timezone">
                        <div style={{ padding: '10px 10px 8px' }}>
                          <input ref={tzSearchRef} className="tz-search" type="text" role="searchbox"
                            aria-controls="tz-listbox" aria-label="Search timezones by city, country, or zone"
                            placeholder="Search city, country, or zone…" value={tzQuery}
                            onChange={e => { setTzQuery(e.target.value); setTzActive(0) }}
                            onKeyDown={tzSearchKey} />
                        </div>
                        <ul id="tz-listbox" role="listbox" aria-labelledby="tz-label"
                          aria-activedescendant={tzFiltered.length ? `tzopt-${tzActiveClamped}` : ''}
                          style={{ listStyle: 'none', margin: 0, padding: '4px', maxHeight: '236px', overflowY: 'auto' }}>
                          {tzFiltered.map((o, i) => {
                            const sel = o.v === tz
                            const act = i === tzActiveClamped
                            const isDet = o.v === detectedTz
                            return (
                              <li key={o.v} id={`tzopt-${i}`} role="option" aria-selected={sel}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                                  padding: '9px 11px', borderRadius: '9px', cursor: 'pointer',
                                  background: act ? '#EAF6EF' : sel ? '#F3FBF6' : 'transparent',
                                  marginTop: i > 0 ? '2px' : undefined,
                                }}
                                onMouseDown={e => { e.preventDefault(); tzSelect(o.v) }}
                                onMouseEnter={() => setTzActive(i)}>
                                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                  <span style={{ font: "600 13.5px 'Instrument Sans',sans-serif", color: '#0A120E' }}>
                                    {o.name}
                                    {isDet && <span style={{ marginLeft: '8px', font: "700 9.5px 'Instrument Sans',sans-serif", letterSpacing: '.05em', textTransform: 'uppercase' as const, color: '#0E7A4E', background: '#EAF6EF', borderRadius: '999px', padding: '2px 7px', verticalAlign: 'middle' }}>Detected</span>}
                                  </span>
                                  <span style={{ font: "400 12px 'Instrument Sans',sans-serif", color: '#8A857B' }}>{(o.city ? o.city + ' · ' : '') + offsetLabel(o.v)}</span>
                                </span>
                                <span style={sel ? { color: '#128A54', font: "700 13px sans-serif", flexShrink: 0 } : { visibility: 'hidden', flexShrink: 0 }}>✓</span>
                              </li>
                            )
                          })}
                          {tzFiltered.length === 0 && (
                            <li role="option" aria-disabled="true" style={{ listStyle: 'none', padding: '14px', font: "500 13px 'Instrument Sans',sans-serif", color: '#8A857B' }}>
                              No timezone matches your search.
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* NO DATE STATE */}
                  {bkNoDate && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '10px', textAlign: 'center', flex: 1, minHeight: '220px',
                      border: '1px dashed #E0D8C7', borderRadius: '16px', padding: '28px',
                    }}>
                      <span style={{
                        width: '44px', height: '44px', borderRadius: '12px', background: '#EAF6EF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#128A54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3v18M3 12h18" />
                        </svg>
                      </span>
                      <p style={{ margin: 0, font: "500 15px/1.55 'Instrument Sans',sans-serif", color: '#5B6355', maxWidth: '240px' }}>
                        Select a date to see available 30-minute slots.
                      </p>
                    </div>
                  )}

                  {/* LOADING STATE */}
                  {bkLoading && (
                    <div aria-live="polite" aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ font: "600 13px 'Instrument Sans',sans-serif", color: '#8A857B' }}>Loading available times…</span>
                      <div className="bk-slotgrid">
                        {[0, 1, 2, 3, 4, 5].map(k => (
                          <div key={k} style={{ height: '56px', borderRadius: '11px', background: '#EFE9DC', animation: 'bkSkel 1.2s ease-in-out infinite' }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FULLY BOOKED STATE */}
                  {bkFullyBooked && (
                    <div role="status" style={{
                      animation: 'bkPanelIn .32s ease both',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '10px', textAlign: 'center', flex: 1, minHeight: '200px',
                      border: '1px solid #EBD9B4', background: '#FBF4E4', borderRadius: '16px', padding: '28px',
                    }}>
                      <span style={{
                        width: '44px', height: '44px', borderRadius: '999px', border: '2px solid #C9A24A',
                        color: '#9A7A2E', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        font: "700 20px 'Space Grotesk',sans-serif",
                      }}>◌</span>
                      <p style={{ margin: 0, font: "600 15px/1.5 'Instrument Sans',sans-serif", color: '#7A5F22' }}>{selDateLabel} is fully booked.</p>
                      <p style={{ margin: 0, font: "400 13.5px/1.5 'Instrument Sans',sans-serif", color: '#8A6D2F' }}>Pick another day from the calendar.</p>
                    </div>
                  )}

                  {/* SLOTS */}
                  {bkShowSlots && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span aria-live="polite" style={{ font: "600 13.5px 'Instrument Sans',sans-serif", color: '#26312A' }}>
                        Available times · {selDateLabel}
                      </span>
                      <div className="bk-slotgrid" role="listbox" aria-label="Available 30-minute time slots">
                        {slots.map(s => (
                          <button key={s.id} type="button" className="bk-slot" role="option" aria-selected={s.selected}
                            style={s.style} onClick={s.onClick} disabled={s.disabled} aria-label={s.aria}>
                            <span style={{ font: "600 13.5px 'Instrument Sans',sans-serif" }}>{s.time}</span>
                            <span style={s.subStyle}>{s.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* REVIEW PANEL */}
                  {bkShowReview && selDateObj && (
                    <div style={{ animation: 'bkPanelIn .48s cubic-bezier(.16,1,.3,1) both', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Green summary card */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        background: '#EAF6EF', border: '1px solid rgba(23,160,99,.3)',
                        borderRadius: '14px', padding: '14px 16px',
                      }}>
                        <span style={{
                          flexShrink: 0, width: '40px', height: '40px', borderRadius: '10px',
                          background: '#128A54', color: '#fff',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          font: "700 10px 'Instrument Sans',sans-serif", lineHeight: 1.1,
                        }}>
                          <span style={{ font: "700 15px 'Space Grotesk',sans-serif" }}>{selDateObj.getDate()}</span>
                          {selDateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ font: "600 14.5px 'Instrument Sans',sans-serif", color: '#0A452B' }}>{selSlotTime} · 30 min</span>
                          <span style={{ font: "400 12.5px 'Instrument Sans',sans-serif", color: '#3E6B52' }}>{selDateLabel} · {tzLabelFull}</span>
                        </div>
                      </div>

                      {/* Details card */}
                      <div style={{ border: '1px solid #EDE6D8', borderRadius: '14px', background: '#FCFAF4', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #EDE6D8' }}>
                          <span id="bk-review-heading" tabIndex={-1} style={{ font: "700 11px 'Instrument Sans',sans-serif", letterSpacing: '.12em', color: '#128A54', textTransform: 'uppercase' as const, outline: 'none' }}>Your details</span>
                          <button type="button" onClick={bkEditDetails} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            font: "600 12.5px 'Instrument Sans',sans-serif", color: '#0E7A4E',
                            background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: '8px',
                          }}>Edit details</button>
                        </div>
                        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '9px 16px', padding: '14px 16px' }}>
                          <dt style={{ font: "600 12px 'Instrument Sans',sans-serif", color: '#8A857B' }}>Name</dt>
                          <dd style={{ margin: 0, font: "500 13.5px 'Instrument Sans',sans-serif", color: '#26312A', wordBreak: 'break-word' }}>{rvName}</dd>
                          <dt style={{ font: "600 12px 'Instrument Sans',sans-serif", color: '#8A857B' }}>Email</dt>
                          <dd style={{ margin: 0, font: "500 13.5px 'Instrument Sans',sans-serif", color: '#26312A', wordBreak: 'break-word' }}>{rvEmail}</dd>
                          <dt style={{ font: "600 12px 'Instrument Sans',sans-serif", color: '#8A857B' }}>Business</dt>
                          <dd style={{ margin: 0, font: "500 13.5px 'Instrument Sans',sans-serif", color: '#26312A', wordBreak: 'break-word' }}>{rvBusiness}</dd>
                          <dt style={{ font: "600 12px 'Instrument Sans',sans-serif", color: '#8A857B' }}>Focus</dt>
                          <dd style={{ margin: 0, font: "500 13.5px 'Instrument Sans',sans-serif", color: '#26312A', wordBreak: 'break-word' }}>{rvCategory}</dd>
                          <dt style={{ font: "600 12px 'Instrument Sans',sans-serif", color: '#8A857B' }}>Workflow</dt>
                          <dd style={{ margin: 0, font: "500 13.5px 'Instrument Sans',sans-serif", color: '#26312A', wordBreak: 'break-word' }}>{rvWorkflow}</dd>
                        </dl>
                      </div>

                      {/* Phone */}
                      <div>
                        <label style={{ display: 'block', font: "600 12.5px 'Instrument Sans',sans-serif", color: '#26312A', marginBottom: '7px' }} htmlFor="bk-phone">
                          Phone <span style={{ color: '#A79F8F', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input id="bk-phone" className="field-input" type="tel" placeholder="(555) 012-3456" value={bPhone} onChange={e => setBPhone(e.target.value)} />
                      </div>

                      {/* Consent */}
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={bConsent} onChange={e => { setBConsent(e.target.checked); if (bErrConsent) setBErrConsent(false) }}
                          style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#17A063', flexShrink: 0 }} />
                        <span style={{ font: "400 13px/1.5 'Instrument Sans',sans-serif", color: '#5B6355' }}>
                          I agree to be contacted about this call. We only use these details to arrange the discovery call.
                        </span>
                      </label>
                      {bErrConsent && <span style={{ animation: 'bkValIn .24s ease both', display: 'block', marginTop: '-6px', font: "500 12px 'Instrument Sans',sans-serif", color: '#C0392B' }}>Please acknowledge to continue.</span>}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={bkBack} style={{
                          font: "600 14px 'Instrument Sans',sans-serif", color: '#0E2A1D',
                          background: '#F4EEE2', border: 'none', borderRadius: '11px', padding: '13px 18px', cursor: 'pointer',
                        }}>Change time</button>
                        <button type="button" className="cta-sweep" onClick={confirm} style={{
                          flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                          font: "600 15px 'Instrument Sans',sans-serif", color: '#0A120E',
                          background: '#2BD483', border: 'none', borderRadius: '12px', padding: '14px', cursor: 'pointer',
                          boxShadow: '0 14px 34px rgba(43,212,131,.28)',
                          transition: 'transform .15s ease, box-shadow .15s ease',
                        }}>
                          Review this time
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </button>
                      </div>

                      <p style={{ margin: 0, font: "400 11.5px/1.5 'Instrument Sans',sans-serif", color: '#9A927F', textAlign: 'center' }}>
                        No time is held until we confirm your call by email.
                      </p>
                    </div>
                  )}

                  {/* REQUEST PREPARED (honest, not confirmed) */}
                  {bkRequestPrepared && (
                    <div role="status" aria-live="polite" style={{
                      animation: 'bkPanelIn .5s cubic-bezier(.16,1,.3,1) both',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                      gap: '13px', flex: 1, justifyContent: 'center', minHeight: '260px',
                      border: '1px solid rgba(23,160,99,.3)',
                      background: 'linear-gradient(180deg,#F3FBF6,#EAF6EF)',
                      borderRadius: '18px', padding: '32px 24px',
                    }}>
                      <span style={{
                        width: '54px', height: '54px', borderRadius: '999px', background: '#E8EDEA', color: '#0E2A1D',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CalendarClock size={24} />
                      </span>
                      <span style={{
                        font: "700 10px 'Instrument Sans',sans-serif", letterSpacing: '.09em',
                        color: '#8A6D2F', background: 'rgba(217,179,106,.18)',
                        border: '1px solid rgba(217,179,106,.5)', borderRadius: '999px',
                        padding: '5px 12px', textTransform: 'uppercase' as const,
                      }}>
                        Online booking not connected
                      </span>
                      <h3 style={{ margin: 0, font: "600 21px 'Space Grotesk',sans-serif", color: '#0A120E' }}>Time selected</h3>
                      <div style={{ font: "600 15px 'Instrument Sans',sans-serif", color: '#0A452B' }}>
                        {selDateLabel}<br />{selSlotTime} · 30 min · {tzLabelFull}
                      </div>
                      <p style={{ margin: 0, font: "400 13.5px/1.6 'Instrument Sans',sans-serif", color: '#5B6355', maxWidth: '340px' }}>
                        Online booking is not connected yet. Contact us to confirm this time.
                      </p>
                      <button type="button" onClick={bkReset} style={{
                        marginTop: '2px', font: "600 14px 'Instrument Sans',sans-serif", color: '#0E2A1D',
                        background: '#F4EEE2', border: 'none', borderRadius: '11px', padding: '12px 20px', cursor: 'pointer',
                      }}>Choose another time</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {step1Content}
      {portalTarget && createPortal(step2Content, portalTarget)}

      <style>{`
        @keyframes bkCalRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes bkMonthA{from{opacity:0;transform:translateX(var(--gd,12px))}to{opacity:1;transform:translateX(0)}}
        @keyframes bkMonthB{from{opacity:0;transform:translateX(var(--gd,12px))}to{opacity:1;transform:translateX(0)}}
        @keyframes bkSlotIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes bkSkel{0%,100%{opacity:.42}50%{opacity:.82}}
        @keyframes bkValIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
        @keyframes bkPanelIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes tzPop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}

        .cta-sweep{position:relative;overflow:hidden}
        .cta-sweep::before{content:'';position:absolute;top:0;bottom:0;left:-60%;width:40%;background:linear-gradient(110deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-18deg);transition:left .65s cubic-bezier(.16,1,.3,1)}
        .cta-sweep:hover::before{left:120%}

        .bk-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(20px,2.6vw,34px);align-items:start}
        @media(max-width:860px){.bk-grid{grid-template-columns:1fr}.bk-panel{border-left:none !important;border-top:1px solid #EDE6D8;padding-left:0 !important;padding-top:24px !important}}
        .bk-daygrid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
        .bk-slotgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        @media(max-width:420px){.bk-slotgrid{grid-template-columns:1fr}}
        .bk-day{transition:border-color .2s ease,box-shadow .2s ease,transform .14s ease}
        .bk-day:not(:disabled):hover{border-color:#17A063;box-shadow:0 0 0 3px rgba(23,160,99,.12)}
        .bk-day:not(:disabled):active{transform:scale(.94)}
        .bk-nav{width:38px;height:38px;border-radius:10px;border:1px solid #E5DCCB;background:#FDFBF6;color:#0A120E;font:600 18px 'Instrument Sans',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color .2s ease,background .2s ease}
        .bk-nav:not(:disabled):hover{border-color:#17A063;background:#EAF6EF}
        .bk-nav:disabled{opacity:.4;cursor:not-allowed}
        .bk-slot{transition:border-color .2s ease,box-shadow .2s ease,transform .14s ease}
        .bk-slot:not(:disabled):hover{border-color:#17A063;box-shadow:0 0 0 2px rgba(23,160,99,.1)}
        .bk-slot:not(:disabled):active{transform:scale(.98)}
        .tz-trigger{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#FDFBF6;border:1px solid #E5DCCB;border-radius:11px;padding:9px 14px;cursor:pointer;text-align:left;transition:border-color .2s ease,box-shadow .2s ease}
        .tz-trigger:hover{border-color:#17A063}
        .tz-trigger:focus-visible{outline:none;border-color:#17A063;box-shadow:0 0 0 4px rgba(23,160,99,.12)}
        .tz-pop{position:absolute;z-index:60;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid rgba(13,58,49,.16);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.18);overflow:hidden;animation:tzPop .18s cubic-bezier(.16,1,.3,1) both}
        .tz-search{width:100%;box-sizing:border-box;font:500 14px 'Instrument Sans',sans-serif;color:#0A120E;background:#F7F2EA;border:1px solid #E5DCCB;border-radius:9px;padding:10px 12px;outline:none}
        .tz-search:focus{border-color:#17A063;box-shadow:0 0 0 3px rgba(23,160,99,.12)}
        .field-input{width:100%;box-sizing:border-box;font:500 15px 'Instrument Sans',sans-serif;color:#0A120E;background:#FDFBF6;border:1px solid #E5DCCB;border-radius:11px;padding:13px 15px;outline:none;transition:border-color .2s ease,box-shadow .2s ease}
        .field-input:focus{border-color:#17A063;box-shadow:0 0 0 4px rgba(23,160,99,.12)}
      `}</style>
    </>
  )
}
