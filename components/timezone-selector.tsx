'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

interface TimezoneOption {
  iana: string
  label: string
  abbr: string
  offset: number
}

const TIMEZONES: TimezoneOption[] = [
  { iana: 'America/New_York', label: 'Eastern Time', abbr: 'ET', offset: -5 },
  { iana: 'America/Chicago', label: 'Central Time', abbr: 'CT', offset: -6 },
  { iana: 'America/Denver', label: 'Mountain Time', abbr: 'MT', offset: -7 },
  { iana: 'America/Los_Angeles', label: 'Pacific Time', abbr: 'PT', offset: -8 },
  { iana: 'America/Anchorage', label: 'Alaska Time', abbr: 'AKT', offset: -9 },
  { iana: 'Pacific/Honolulu', label: 'Hawaii Time', abbr: 'HT', offset: -10 },
  { iana: 'Europe/London', label: 'GMT / London', abbr: 'GMT', offset: 0 },
  { iana: 'Europe/Berlin', label: 'Central European Time', abbr: 'CET', offset: 1 },
  { iana: 'Europe/Paris', label: 'Central European Time', abbr: 'CET', offset: 1 },
  { iana: 'Europe/Moscow', label: 'Moscow Time', abbr: 'MSK', offset: 3 },
  { iana: 'Asia/Dubai', label: 'Gulf Standard Time', abbr: 'GST', offset: 4 },
  { iana: 'Asia/Karachi', label: 'Pakistan Standard Time', abbr: 'PKT', offset: 5 },
  { iana: 'Asia/Kolkata', label: 'India Standard Time', abbr: 'IST', offset: 5.5 },
  { iana: 'Asia/Dhaka', label: 'Bangladesh Standard Time', abbr: 'BST', offset: 6 },
  { iana: 'Asia/Bangkok', label: 'Indochina Time', abbr: 'ICT', offset: 7 },
  { iana: 'Asia/Shanghai', label: 'China Standard Time', abbr: 'CST', offset: 8 },
  { iana: 'Asia/Tokyo', label: 'Japan Standard Time', abbr: 'JST', offset: 9 },
  { iana: 'Australia/Sydney', label: 'Australian Eastern Time', abbr: 'AET', offset: 10 },
  { iana: 'Pacific/Auckland', label: 'New Zealand Time', abbr: 'NZST', offset: 12 },
]

function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && TIMEZONES.some(t => t.iana === tz)) return tz
    return 'America/New_York'
  } catch {
    return 'America/New_York'
  }
}

interface TimezoneSelectorProps {
  value: string
  onChange: (iana: string) => void
  id?: string
}

export function TimezoneSelector({ value, onChange, id }: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIdx, setHighlightIdx] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = TIMEZONES.find(t => t.iana === value) ?? TIMEZONES[0]

  const filtered = useMemo(() => {
    if (!search.trim()) return TIMEZONES
    const q = search.toLowerCase()
    return TIMEZONES.filter(t =>
      t.iana.toLowerCase().includes(q) ||
      t.label.toLowerCase().includes(q) ||
      t.abbr.toLowerCase().includes(q) ||
      t.iana.split('/')[1]?.toLowerCase().includes(q)
    )
  }, [search])

  const focusItem = useCallback((idx: number) => {
    const items = listRef.current?.querySelectorAll('[role="option"]')
    items?.[idx]?.scrollIntoView({ block: 'nearest' })
  }, [])

  useEffect(() => {
    if (open) {
      setSearch('')
      setHighlightIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setHighlightIdx(0)
    focusItem(0)
  }, [search, focusItem])

  const close = () => { setOpen(false); triggerRef.current?.focus() }

  const select = (iana: string) => { onChange(iana); close() }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault(); setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, filtered.length - 1)); focusItem(Math.min(highlightIdx + 1, filtered.length - 1)); break
      case 'ArrowUp': e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); focusItem(Math.max(highlightIdx - 1, 0)); break
      case 'Enter': e.preventDefault(); if (filtered[highlightIdx]) select(filtered[highlightIdx].iana); break
      case 'Escape': e.preventDefault(); close(); break
    }
  }

  return (
    <div className="tz-sel" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="tz-trigger"
      >
        <span>{selected.label} ({selected.abbr})</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="tz-dropdown" ref={listRef} role="listbox" aria-label="Timezone">
          <div className="tz-search">
            <Search size={14} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by city, country, or abbreviation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search timezones"
            />
          </div>
          <div className="tz-list">
            {filtered.length === 0 && <div className="tz-empty">No timezones match your search.</div>}
            {filtered.map((t, i) => (
              <button
                key={t.iana}
                type="button"
                role="option"
                aria-selected={t.iana === value}
                className={`tz-option ${t.iana === value ? 'selected' : ''} ${i === highlightIdx ? 'highlighted' : ''}`}
                onClick={() => select(t.iana)}
                onMouseEnter={() => setHighlightIdx(i)}
              >
                <span className="tz-option-label">{t.label}</span>
                <span className="tz-option-meta">{t.abbr} · UTC{t.offset >= 0 ? '+' : ''}{t.offset}</span>
                {t.iana === value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
      <style>{`
        .tz-sel{position:relative}
        .tz-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:13px 15px;border:1px solid #E5DCCB;border-radius:11px;background:#FDFBF6;font:500 15px 'Instrument Sans';color:#0A120E;cursor:pointer;text-align:left}
        .tz-trigger:focus{border-color:#17A063;box-shadow:0 0 0 4px rgba(23,160,99,.12);outline:0}
        .tz-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:50;background:#fff;border:1px solid #E5DCCB;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.15);overflow:hidden}
        .tz-search{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #E5DCCB;color:#8A857B}
        .tz-search input{flex:1;border:0;outline:0;background:transparent;font:400 14px 'Instrument Sans';color:#0A120E}
        .tz-search input::placeholder{color:#9B9088}
        .tz-list{max-height:240px;overflow-y:auto}
        .tz-empty{padding:16px;text-align:center;font:400 13px 'Instrument Sans';color:#8A857B}
        .tz-option{width:100%;display:flex;align-items:center;gap:8px;padding:10px 12px;border:0;background:transparent;cursor:pointer;text-align:left;font:400 14px 'Instrument Sans';color:#0A120E;transition:background .15s}
        .tz-option:hover,.tz-option.highlighted{background:#F5F0EB}
        .tz-option.selected{background:#E8F5F1;color:#128A54;font-weight:600}
        .tz-option-label{flex:1}
        .tz-option-meta{font-size:12px;color:#8A857B}
        .tz-option.selected .tz-option-meta{color:#128A54}
      `}</style>
    </div>
  )
}

export { detectTimezone, TIMEZONES }
export type { TimezoneOption }
