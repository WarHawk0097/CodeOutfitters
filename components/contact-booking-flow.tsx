'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isPast,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { TimezoneSelector, detectTimezone } from './timezone-selector'

type Step = 'project_details' | 'choosing_slot' | 'reviewing_booking' | 'submitting' | 'request_prepared' | 'failed'

interface ProjectDetails {
  fullName: string
  workEmail: string
  businessName: string
  automationCategory: string
  workflowDescription: string
}

interface ContactBookingFlowState {
  currentStep: Step
  projectDetails: ProjectDetails
  selectedDate: Date | null
  selectedSlot: string | null
  timezone: string
  phone: string
  consent: boolean
  availabilityStatus: 'idle' | 'loading' | 'available' | 'unavailable' | 'error'
  submissionStatus: 'idle' | 'submitting' | 'success' | 'error'
  submitError: string | null
  slots: Array<{ id: string; date: string; time: string; is_booked: boolean }>
  currentMonth: Date
  slotError: string | null
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

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
]

function isPastDay(day: Date): boolean {
  return isPast(day) && !isToday(day)
}

function isWeekend(day: Date): boolean {
  const d = getDay(day)
  return d === 0 || d === 6
}

function formatSlotEnd(time: string): string {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return time
  let [, min, , period] = match
  let hour = parseInt(match[1])
  if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12
  if (period.toUpperCase() === 'AM' && hour === 12) hour = 0
  let endMin = parseInt(min) + 30
  let endHour = hour
  if (endMin >= 60) { endMin -= 60; endHour += 1 }
  if (endHour >= 24) endHour -= 24
  const endPeriod = endHour >= 12 ? 'PM' : 'AM'
  const displayHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour
  return `${displayHour}:${String(endMin).padStart(2, '0')} ${endPeriod}`
}

interface ContactBookingFlowProps {
  motionMode?: 'full' | 'reduced'
}

export function ContactBookingFlow({ motionMode = 'full' }: ContactBookingFlowProps) {
  const [state, setState] = useState<ContactBookingFlowState>({
    currentStep: 'project_details',
    projectDetails: { fullName: '', workEmail: '', businessName: '', automationCategory: '', workflowDescription: '' },
    selectedDate: null,
    selectedSlot: null,
    timezone: detectTimezone(),
    phone: '',
    consent: false,
    availabilityStatus: 'idle',
    submissionStatus: 'idle',
    submitError: null,
    slots: [],
    currentMonth: new Date(),
    slotError: null,
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [honeypot, setHoneypot] = useState('')
  const step2Ref = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const updateState = useCallback((patch: Partial<ContactBookingFlowState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const updateProjectDetails = useCallback((patch: Partial<ProjectDetails>) => {
    setState(prev => ({
      ...prev,
      projectDetails: { ...prev.projectDetails, ...patch },
    }))
  }, [])

  const today = new Date()
  const isMonthLocked =
    state.currentMonth.getFullYear() === today.getFullYear() &&
    state.currentMonth.getMonth() === today.getMonth()

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(state.currentMonth),
    end: endOfMonth(state.currentMonth),
  })
  const startPadding = getDay(startOfMonth(state.currentMonth))

  const fetchSlots = useCallback(async (month: Date) => {
    updateState({ availabilityStatus: 'loading', slotError: null })
    try {
      const { getAvailableSlots } = await import('@/lib/booking-actions')
      const m = String(month.getMonth() + 1)
      const y = String(month.getFullYear())
      const result = await getAvailableSlots(m, y)
      if (result.error) {
        updateState({ availabilityStatus: 'error', slotError: result.error, slots: [] })
      } else {
        updateState({ availabilityStatus: 'available', slots: result.data ?? [], slotError: null })
      }
    } catch (err) {
      updateState({
        availabilityStatus: 'error',
        slotError: err instanceof Error ? err.message : 'Failed to load availability',
        slots: [],
      })
    }
  }, [updateState])

  useEffect(() => {
    if (state.currentStep === 'choosing_slot' || state.currentStep === 'reviewing_booking') {
      fetchSlots(state.currentMonth)
    }
  }, [state.currentMonth, state.currentStep, fetchSlots])

  const availableDates = useMemo(() => {
    const datesWithSlots = new Set<string>()
    const timesByDate = new Map<string, string[]>()
    for (const slot of state.slots) {
      datesWithSlots.add(slot.date)
      const list = timesByDate.get(slot.date) ?? []
      list.push(slot.time)
      timesByDate.set(slot.date, list)
    }
    for (const [, list] of timesByDate) {
      list.sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b))
    }
    return { datesWithSlots, timesByDate }
  }, [state.slots])

  function isDateSelectable(day: Date): boolean {
    if (isPastDay(day) || isWeekend(day)) return false
    const ds = format(day, 'yyyy-MM-dd')
    return availableDates.datesWithSlots.has(ds)
  }

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {}
    const d = state.projectDetails
    if (!d.fullName.trim()) errs.fullName = 'Full name is required'
    if (!d.workEmail.trim()) errs.workEmail = 'Work email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.workEmail)) errs.workEmail = 'Invalid email address'
    if (!d.businessName.trim()) errs.businessName = 'Business name is required'
    if (!d.automationCategory) errs.automationCategory = 'Please select what you want to automate'
    if (!d.workflowDescription.trim()) errs.workflowDescription = 'Please tell us about your workflow'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep1()) return
    updateState({ currentStep: 'choosing_slot' })
    setTimeout(() => {
      headingRef.current?.focus()
      headingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleDateSelect = (day: Date) => {
    if (!isDateSelectable(day)) return
    updateState({ selectedDate: day, selectedSlot: null })
  }

  const handleSlotSelect = (time: string) => {
    updateState({ selectedSlot: time, currentStep: 'reviewing_booking' })
  }

  const handleEditDetails = () => {
    updateState({ currentStep: 'project_details' })
    setTimeout(() => {
      headingRef.current?.focus()
      headingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleSubmitBooking = async () => {
    if (honeypot) {
      updateState({ currentStep: 'request_prepared' })
      return
    }
    if (!state.consent) {
      setFormErrors({ consent: 'Consent is required' })
      return
    }
    setFormErrors({})
    updateState({ currentStep: 'submitting', submissionStatus: 'submitting', submitError: null })

    try {
      const { createBooking } = await import('@/lib/booking-actions')
      const payload = {
        name: state.projectDetails.fullName.trim(),
        email: state.projectDetails.workEmail.trim(),
        company: state.projectDetails.businessName.trim() || undefined,
        phone: state.phone.trim() || undefined,
        message: state.projectDetails.workflowDescription.trim() || undefined,
        preferredDate: state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : '',
        preferredTime: state.selectedSlot ?? '',
        timezone: state.timezone,
      }
      const result = await createBooking(payload)
      if (result.error) {
        updateState({ currentStep: 'failed', submissionStatus: 'error', submitError: result.error })
      } else {
        updateState({ currentStep: 'request_prepared', submissionStatus: 'success' })
      }
    } catch {
      updateState({
        currentStep: 'failed',
        submissionStatus: 'error',
        submitError: 'An unexpected error occurred. Please try again.',
      })
    }
  }

  const handlePrevMonth = () => {
    if (isMonthLocked) return
    setState(prev => ({ ...prev, currentMonth: subMonths(prev.currentMonth, 1) }))
  }

  const handleNextMonth = () => {
    setState(prev => ({ ...prev, currentMonth: addMonths(prev.currentMonth, 1) }))
  }

  const selectedDateKey = state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') : null
  const availableTimesForDate = selectedDateKey
    ? (availableDates.timesByDate.get(selectedDateKey) ?? [])
    : []

  const inputClass = (field: string) =>
    `w-full bg-[#FAFAF7] border rounded-lg px-4 py-3 min-h-[48px] text-sm text-[#1C1612] placeholder-[#9B9088] outline-none transition-all duration-200 focus:border-[#2A6B5A] focus:ring-2 focus:ring-[#2A6B5A]/15 focus:bg-white ${
      formErrors[field] ? 'border-red-400' : 'border-[#E5DCCB]'
    }`

  const categoryLabel = AUTOMATION_CATEGORIES.find(c => c.value === state.projectDetails.automationCategory)?.label ?? ''
  const selectedSlotEnd = state.selectedSlot ? formatSlotEnd(state.selectedSlot) : ''

  return (
    <div className="cbf">
      <div className="cbf-inner">
        {/* Step indicator */}
        <div className="cbf-steps" aria-label="Booking progress">
          <div className={`cbf-step-indicator ${state.currentStep === 'project_details' ? 'active' : 'done'}`}>
            <div className="cbf-step-num">{state.currentStep === 'project_details' ? '1' : '✓'}</div>
            <span>Project Details</span>
          </div>
          <div className={`cbf-step-line ${state.currentStep !== 'project_details' ? 'active' : ''}`} />
          <div className={`cbf-step-indicator ${state.currentStep === 'choosing_slot' || state.currentStep === 'reviewing_booking' ? 'active' : state.currentStep === 'submitting' || state.currentStep === 'request_prepared' ? 'done' : ''}`}>
            <div className="cbf-step-num">{state.currentStep === 'choosing_slot' || state.currentStep === 'reviewing_booking' ? '2' : '✓'}</div>
            <span>Book a Time</span>
          </div>
        </div>

        {/* STEP 1 — Project Details */}
        {state.currentStep === 'project_details' && (
          <div className="cbf-card">
            <div className="cbf-card-header">
              <span className="cbf-step-label">STEP 1 OF 2 · TELL US ABOUT YOUR WORKFLOW</span>
            </div>
            <form onSubmit={handleStep1Submit} className="cbf-form" noValidate>
              <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
                <input tabIndex={-1} autoComplete="off" name="website" type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
              </div>

              <label className="cbf-label">
                Full name
                <input name="fullName" value={state.projectDetails.fullName} onChange={e => updateProjectDetails({ fullName: e.target.value })} className={inputClass('fullName')} placeholder="Jordan Miller" />
                {formErrors.fullName && <span className="cbf-error">{formErrors.fullName}</span>}
              </label>

              <label className="cbf-label">
                Work email
                <input name="workEmail" type="email" value={state.projectDetails.workEmail} onChange={e => updateProjectDetails({ workEmail: e.target.value })} className={inputClass('workEmail')} placeholder="jordan@yourbusiness.com" />
                {formErrors.workEmail && <span className="cbf-error">{formErrors.workEmail}</span>}
              </label>

              <label className="cbf-label">
                Business name
                <input name="businessName" value={state.projectDetails.businessName} onChange={e => updateProjectDetails({ businessName: e.target.value })} className={inputClass('businessName')} placeholder="Miller Realty Group" />
                {formErrors.businessName && <span className="cbf-error">{formErrors.businessName}</span>}
              </label>

              <label className="cbf-label">
                What are you looking to automate?
                <select name="automationCategory" value={state.projectDetails.automationCategory} onChange={e => updateProjectDetails({ automationCategory: e.target.value })} className={inputClass('automationCategory')}>
                  <option value="">Select one…</option>
                  {AUTOMATION_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {formErrors.automationCategory && <span className="cbf-error">{formErrors.automationCategory}</span>}
              </label>

              <label className="cbf-label">
                Tell us about your workflow
                <textarea name="workflowDescription" rows={4} value={state.projectDetails.workflowDescription} onChange={e => updateProjectDetails({ workflowDescription: e.target.value })} className={inputClass('workflowDescription')} placeholder="What's eating the most time in your day-to-day?" />
                {formErrors.workflowDescription && <span className="cbf-error">{formErrors.workflowDescription}</span>}
              </label>

              <button type="submit" className="cbf-cta">
                Continue to booking
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <small className="cbf-small">No spam, ever. We only use this to schedule your call.</small>
            </form>
          </div>
        )}

        {/* STEP 2 — Booking */}
        {(state.currentStep === 'choosing_slot' || state.currentStep === 'reviewing_booking' || state.currentStep === 'submitting' || state.currentStep === 'request_prepared' || state.currentStep === 'failed') && (
          <div className="cbf-card" ref={step2Ref}>
            <div className="cbf-card-header">
              <span className="cbf-step-label">STEP 2 OF 2 · CHOOSE A 30-MINUTE TIME</span>
              <h2 ref={headingRef} className="cbf-heading" tabIndex={-1}>Book a 30-minute discovery call.</h2>
            </div>

            {state.currentStep === 'request_prepared' ? (
              <div className="cbf-success">
                <div className="cbf-success-icon"><CheckCircle size={32} /></div>
                <h3>BOOKING REQUEST PREPARED</h3>
                <p>LIVE SCHEDULING IS NOT YET CONNECTED</p>
                <p className="cbf-success-detail">We&apos;ll review your request and reach out within one business day to confirm your 30-minute discovery call.</p>
                <div className="cbf-success-summary">
                  <strong>{state.projectDetails.fullName}</strong><br />
                  {state.selectedDate && format(state.selectedDate, 'EEEE, MMMM d, yyyy')}<br />
                  {state.selectedSlot} – {selectedSlotEnd}<br />
                  {state.timezone}
                </div>
                <button className="cbf-cta" onClick={() => {
                  setState({
                    currentStep: 'project_details',
                    projectDetails: { fullName: '', workEmail: '', businessName: '', automationCategory: '', workflowDescription: '' },
                    selectedDate: null,
                    selectedSlot: null,
                    timezone: detectTimezone(),
                    phone: '',
                    consent: false,
                    availabilityStatus: 'idle',
                    submissionStatus: 'idle',
                    submitError: null,
                    slots: [],
                    currentMonth: new Date(),
                    slotError: null,
                  })
                }}>Book another call</button>
              </div>
            ) : state.currentStep === 'failed' ? (
              <div className="cbf-error-state">
                <div className="cbf-error-icon">!</div>
                <h3>Something went wrong</h3>
                <p>{state.submitError || 'Failed to submit booking. Please try again.'}</p>
                <button className="cbf-cta" onClick={() => updateState({ currentStep: 'reviewing_booking' })}>Try again</button>
                <button className="cbf-link" onClick={() => window.location.href = 'mailto:hello@codeoutfitters.ai'}>Email us instead</button>
              </div>
            ) : (
              <div className="cbf-booking-layout">
                <div className="cbf-calendar-section">
                  {/* Sample availability notice */}
                  <div className="cbf-sample-notice">
                    <i>ℹ</i>
                    <span>SAMPLE AVAILABILITY — NOT LIVE</span>
                  </div>

                  {/* Calendar */}
                  <div className="cbf-calendar">
                    <div className="cbf-calendar-header">
                      <button onClick={handlePrevMonth} disabled={isMonthLocked} className="cbf-cal-nav" aria-label="Previous month">
                        <ChevronLeft size={20} />
                      </button>
                      <h3 className="cbf-cal-month">{format(state.currentMonth, 'MMMM yyyy')}</h3>
                      <button onClick={handleNextMonth} className="cbf-cal-nav" aria-label="Next month">
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    {state.slotError && <p className="cbf-cal-error" role="alert">{state.slotError}</p>}
                    {state.availabilityStatus === 'loading' && !state.slotError && (
                      <p className="cbf-cal-loading"><Loader2 size={14} className="spin" /> Loading availability...</p>
                    )}

                    <div className="cbf-cal-grid">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="cbf-cal-day-header">{d}</div>
                      ))}
                    </div>
                    <div className="cbf-cal-grid">
                      {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
                      {daysInMonth.map(day => {
                        const ds = format(day, 'yyyy-MM-dd')
                        const available = isDateSelectable(day)
                        const todayFlag = isToday(day)
                        const isSelected = state.selectedDate ? format(state.selectedDate, 'yyyy-MM-dd') === ds : false

                        return (
                          <button
                            key={ds}
                            disabled={!available}
                            onClick={() => handleDateSelect(day)}
                            className={`cbf-cal-day ${isSelected ? 'selected' : ''} ${todayFlag && available ? 'today' : ''} ${!available ? 'disabled' : ''}`}
                            aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${!available ? ' - unavailable' : ''}`}
                            aria-pressed={isSelected}
                          >
                            {format(day, 'd')}
                            {todayFlag && !isSelected && available && <span className="cbf-cal-today-dot" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="cbf-tz">
                    <label className="cbf-label" htmlFor="cbf-timezone">Timezone</label>
                    <TimezoneSelector
                      id="cbf-timezone"
                      value={state.timezone}
                      onChange={tz => updateState({ timezone: tz })}
                    />
                  </div>

                  {/* Slots */}
                  {state.selectedDate && (
                    <div className="cbf-slots">
                      <p className="cbf-slots-label">Available 30-minute slots for {format(state.selectedDate, 'EEEE, MMM d')}</p>
                      {availableTimesForDate.length === 0 ? (
                        <p className="cbf-slots-empty">No remaining times for this date. Please pick another date.</p>
                      ) : (
                        <div className="cbf-slots-grid">
                          {availableTimesForDate.map((time, i) => (
                            <button
                              key={time}
                              onClick={() => handleSlotSelect(time)}
                              className={`cbf-slot ${state.selectedSlot === time ? 'selected' : ''}`}
                              style={{ animationDelay: `${i * 40}ms` }}
                            >
                              {time} – {formatSlotEnd(time)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Review panel — only visible when reviewing */}
                {state.currentStep === 'reviewing_booking' && state.selectedDate && state.selectedSlot && (
                  <div className="cbf-review">
                    <h3 className="cbf-review-title">Your booking summary</h3>
                    <div className="cbf-review-grid">
                      <div className="cbf-review-row">
                        <span className="cbf-review-key">Full name</span>
                        <span className="cbf-review-val">{state.projectDetails.fullName}</span>
                      </div>
                      <div className="cbf-review-row">
                        <span className="cbf-review-key">Work email</span>
                        <span className="cbf-review-val">{state.projectDetails.workEmail}</span>
                      </div>
                      <div className="cbf-review-row">
                        <span className="cbf-review-key">Business name</span>
                        <span className="cbf-review-val">{state.projectDetails.businessName}</span>
                      </div>
                      <div className="cbf-review-row">
                        <span className="cbf-review-key">Automation type</span>
                        <span className="cbf-review-val">{categoryLabel}</span>
                      </div>
                      <div className="cbf-review-row">
                        <span className="cbf-review-key">Workflow</span>
                        <span className="cbf-review-val cbf-review-truncate">{state.projectDetails.workflowDescription}</span>
                      </div>
                      <div className="cbf-review-divider" />
                      <div className="cbf-review-row">
                        <span className="cbf-review-key">Date</span>
                        <span className="cbf-review-val">{format(state.selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                      </div>
                      <div className="cbf-review-row">
                        <span className="cbf-review-key">Time</span>
                        <span className="cbf-review-val">{state.selectedSlot} – {selectedSlotEnd}</span>
                      </div>
                      <div className="cbf-review-row">
                        <span className="cbf-review-key">Duration</span>
                        <span className="cbf-review-val">30 minutes</span>
                      </div>
                      <div className="cbf-review-row">
                        <span className="cbf-review-key">Timezone</span>
                        <span className="cbf-review-val">{state.timezone}</span>
                      </div>
                    </div>

                    <button className="cbf-edit-btn" onClick={handleEditDetails}>Edit details</button>

                    <label className="cbf-label">
                      Phone (optional)
                      <input type="tel" value={state.phone} onChange={e => updateState({ phone: e.target.value })} className="cbf-input" placeholder="+1 (555) 123-4567" />
                    </label>

                    <label className="cbf-checkbox">
                      <input type="checkbox" checked={state.consent} onChange={e => updateState({ consent: e.target.checked })} />
                      <span>I agree to the processing of my data for scheduling purposes.</span>
                    </label>
                    {formErrors.consent && <span className="cbf-error">{formErrors.consent}</span>}

                    <button
                      className="cbf-cta"
                      onClick={handleSubmitBooking}
                      disabled={state.submissionStatus === 'submitting'}
                    >
                      {state.submissionStatus === 'submitting' ? (
                        <><Loader2 size={16} className="spin" /> Submitting...</>
                      ) : (
                        'Request this time'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .cbf{width:100%}
        .cbf-inner{max-width:900px;margin:0 auto}
        .cbf-steps{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:28px}
        .cbf-step-indicator{display:flex;align-items:center;gap:8px;font:600 13px 'Instrument Sans';color:#8A857B}
        .cbf-step-indicator.active{color:#128A54}
        .cbf-step-indicator.done{color:#128A54}
        .cbf-step-num{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:12px;font-weight:700;background:#E5E7EB;color:#8A857B}
        .cbf-step-indicator.active .cbf-step-num{background:#2A6B5A;color:#fff}
        .cbf-step-indicator.done .cbf-step-num{background:#E8F5F1;color:#2A6B5A}
        .cbf-step-line{width:32px;height:1px;background:#E5E7EB}
        .cbf-step-line.active{background:#2A6B5A}
        .cbf-card{background:#fff;border:1px solid rgba(42,107,90,0.12);border-radius:22px;box-shadow:0 4px 24px rgba(42,107,90,0.06);padding:clamp(24px,3vw,34px)}
        .cbf-card-header{margin-bottom:24px}
        .cbf-step-label{display:block;font:700 10.5px 'Instrument Sans';letter-spacing:.14em;color:#128A54;text-transform:uppercase;margin-bottom:8px}
        .cbf-heading{margin:0;font:600 22px 'Space Grotesk';color:#0A120E}
        .cbf-form{display:flex;flex-direction:column;gap:16px}
        .cbf-label{display:block;font:600 12.5px 'Instrument Sans';color:#26312A}
        .cbf-label input,.cbf-label select,.cbf-label textarea{display:block;margin-top:7px}
        .cbf-input{width:100%;padding:13px 15px;border:1px solid #E5DCCB;border-radius:11px;background:#FDFBF6;font:500 15px 'Instrument Sans';color:#0A120E;outline:0}
        .cbf-input:focus{border-color:#17A063;box-shadow:0 0 0 4px rgba(23,160,99,.12)}
        .cbf-error{display:block;margin-top:4px;font:400 12px 'Instrument Sans';color:#DC2626}
        .cbf-cta{display:flex;align-items:center;justify-content:center;gap:9px;padding:15px;border:0;border-radius:12px;background:#2BD483;box-shadow:0 14px 34px rgba(43,212,131,.28);font:600 15.5px 'Instrument Sans';color:#0A120E;cursor:pointer;transition:transform .15s,box-shadow .15s}
        .cbf-cta:hover{transform:translateY(-1px);box-shadow:0 18px 40px rgba(43,212,131,.32)}
        .cbf-cta:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .cbf-small{font:400 12.5px/1.5 'Instrument Sans';color:#8A857B;text-align:center}
        .cbf-link{background:none;border:0;font:600 14px 'Instrument Sans';color:#128A54;cursor:pointer;text-decoration:underline}
        .cbf-booking-layout{display:grid;grid-template-columns:1fr;gap:32px}
        @media(min-width:768px){.cbf-booking-layout{grid-template-columns:1fr 320px}}
        .cbf-sample-notice{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:#FFF8E7;border:1px solid #E8D5A0;font:600 11px 'Instrument Sans';letter-spacing:.08em;color:#92700C;text-transform:uppercase;margin-bottom:20px}
        .cbf-sample-notice i{width:18px;height:18px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#92700C;color:#fff;font-size:11px;font-style:normal}
        .cbf-calendar{margin-bottom:20px}
        .cbf-calendar-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
        .cbf-cal-nav{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:0;border-radius:10px;background:transparent;cursor:pointer;transition:background .15s}
        .cbf-cal-nav:hover{background:#F5F0EB}
        .cbf-cal-nav:disabled{opacity:.3;cursor:not-allowed}
        .cbf-cal-month{margin:0;font:700 18px 'Space Grotesk';color:#0A120E}
        .cbf-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
        .cbf-cal-day-header{text-align:center;font:600 11px 'Instrument Sans';color:#6B6155;text-transform:uppercase;letter-spacing:.08em;padding:8px 0}
        .cbf-cal-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border:0;border-radius:10px;font:500 14px 'Instrument Sans';color:#0A120E;background:transparent;cursor:pointer;transition:all .15s;position:relative}
        .cbf-cal-day:hover:not(.disabled){background:#F5F0EB;border:1px solid #2A6B5A}
        .cbf-cal-day.selected{background:#2A6B5A;color:#fff;box-shadow:0 2px 8px rgba(42,107,90,0.3)}
        .cbf-cal-day.today{background:#E8F5F1;color:#2A6B5A;font-weight:700;border:1px solid #2A6B5A}
        .cbf-cal-day.disabled{color:#D1D5DB;cursor:not-allowed}
        .cbf-cal-today-dot{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#2A6B5A}
        .cbf-cal-error{font:400 13px 'Instrument Sans';color:#DC2626;margin-bottom:12px}
        .cbf-cal-loading{display:flex;align-items:center;gap:6px;font:400 13px 'Instrument Sans';color:#6B6155;margin-bottom:12px}
        .spin{animation:cbfSpin 1s linear infinite}
        @keyframes cbfSpin{to{transform:rotate(360deg)}}
        .cbf-tz{margin-bottom:20px}
        .cbf-slots{margin-top:8px}
        .cbf-slots-label{font:600 13px 'Instrument Sans';color:#26312A;margin-bottom:12px}
        .cbf-slots-empty{font:400 13px 'Instrument Sans';color:#6B6155}
        .cbf-slots-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
        @media(min-width:640px){.cbf-slots-grid{grid-template-columns:repeat(3,1fr)}}
        .cbf-slot{padding:12px 16px;border:1px solid rgba(42,107,90,0.2);border-radius:10px;background:#FAFAF7;font:500 13px 'Instrument Sans';color:#0A120E;cursor:pointer;transition:all .15s;min-height:44px}
        .cbf-slot:hover{background:#E8F5F1;border-color:#2A6B5A}
        .cbf-slot.selected{background:#2A6B5A;color:#fff;border-color:#2A6B5A}
        .cbf-review{padding:24px;background:#F8FAF9;border:1px solid rgba(42,107,90,0.12);border-radius:16px}
        .cbf-review-title{margin:0 0 16px;font:700 14px 'Instrument Sans';color:#0A120E;text-transform:uppercase;letter-spacing:.08em}
        .cbf-review-grid{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
        .cbf-review-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
        .cbf-review-key{font:500 12px 'Instrument Sans';color:#6B6155;flex-shrink:0}
        .cbf-review-val{font:500 13px 'Instrument Sans';color:#0A120E;text-align:right}
        .cbf-review-truncate{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cbf-review-divider{height:1px;background:#E5DCCB;margin:4px 0}
        .cbf-edit-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid #E5DCCB;border-radius:8px;background:#fff;font:600 12px 'Instrument Sans';color:#128A54;cursor:pointer;transition:background .15s;margin-bottom:16px}
        .cbf-edit-btn:hover{background:#F5F0EB}
        .cbf-checkbox{display:flex;align-items:flex-start;gap:10px;cursor:pointer;font:400 13px/1.5 'Instrument Sans';color:#5B6355}
        .cbf-checkbox input{width:18px;height:18px;margin-top:2px;accent-color:#2A6B5A;flex-shrink:0}
        .cbf-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:32px 16px}
        .cbf-success-icon{width:64px;height:64px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#E8F5F1;color:#2A6B5A;margin-bottom:20px}
        .cbf-success h3{margin:0 0 8px;font:700 18px 'Space Grotesk';color:#0A120E;text-transform:uppercase;letter-spacing:.06em}
        .cbf-success p{margin:0;font:400 14px 'Instrument Sans';color:#6B6155}
        .cbf-success-detail{margin-top:12px !important;max-width:380px}
        .cbf-success-summary{margin-top:20px;padding:16px;background:#F8FAF9;border:1px solid rgba(42,107,90,0.12);border-radius:12px;font:500 13px 'Instrument Sans';color:#0A120E;line-height:1.6}
        .cbf-error-state{display:flex;flex-direction:column;align-items:center;text-align:center;padding:32px 16px}
        .cbf-error-icon{width:56px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#FEE2E2;color:#DC2626;font:700 24px 'Space Grotesk';margin-bottom:16px}
        .cbf-error-state h3{margin:0 0 8px;font:600 18px 'Space Grotesk';color:#0A120E}
        .cbf-error-state p{margin:0 0 20px;font:400 14px 'Instrument Sans';color:#6B6155;max-width:360px}
        @media(max-width:640px){.cbf-slots-grid{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  )
}
