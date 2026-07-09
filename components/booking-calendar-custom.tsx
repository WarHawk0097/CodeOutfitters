'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { ChevronLeft, ChevronRight, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { getAvailableSlots, createBooking } from '@/lib/booking-actions'
import type { SlotRecord, BookingFormData } from '@/lib/booking-types'

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
]

type Step = 1 | 2 | 3

function isPastDay(day: Date): boolean {
  return isPast(day) && !isToday(day)
}

function isWeekend(day: Date): boolean {
  const d = getDay(day)
  return d === 0 || d === 6
}

export function BookingCalendarCustom() {
  const [step, setStep] = useState<Step>(1)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '', email: '', company: '', phone: '', message: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Booking A (2026-06-16): the calendar now reads the availability table
  // through the `getAvailableSlots` RPC instead of trusting a hard-coded
  // 14-slot-per-weekday list. The RPC is the safe read path after the
  // Security 3 RLS migration is applied (anon cannot SELECT the table
  // directly). See lib/booking-actions.ts and
  // supabase/migrations/20260616_booking_a_get_available_slots.sql.
  const [slots, setSlots] = useState<SlotRecord[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  const today = new Date()
  const isMonthLocked =
    currentMonth.getFullYear() === today.getFullYear() &&
    currentMonth.getMonth() === today.getMonth()

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })
  const startPadding = getDay(startOfMonth(currentMonth))

  // Booking A: fetch available slots for the displayed month whenever the
  // user navigates to a new month. The RPC returns only unbooked slots
  // (filtered server-side) ordered by date then time. Failures surface as
  // a banner; the calendar still renders, but every day is disabled.
  useEffect(() => {
    let cancelled = false
    const month = String(currentMonth.getMonth() + 1)
    const year = String(currentMonth.getFullYear())

    setSlotsLoading(true)
    setSlotsError(null)

    getAvailableSlots(month, year)
      .then((result) => {
        if (cancelled) return
        if (result.error) {
          setSlotsError(result.error)
          setSlots([])
        } else {
          setSlotsError(null)
          setSlots(result.data ?? [])
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setSlotsError(err instanceof Error ? err.message : 'Failed to load available slots')
        setSlots([])
      })
      .finally(() => {
        if (cancelled) return
        setSlotsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentMonth])

  // Booking A: build a lookup of available dates and available times per
  // date from the slots response. A date with zero entries is fully
  // booked; a date with at least one entry is open.
  const availableDates = useMemo(() => {
    const datesWithSlots = new Set<string>()
    const timesByDate = new Map<string, string[]>()
    for (const slot of slots) {
      datesWithSlots.add(slot.date)
      const list = timesByDate.get(slot.date) ?? []
      list.push(slot.time)
      timesByDate.set(slot.date, list)
    }
    for (const [, list] of timesByDate) {
      list.sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b))
    }
    return { datesWithSlots, timesByDate }
  }, [slots])

  function isDateSelectable(day: Date): boolean {
    if (isPastDay(day) || isWeekend(day)) return false
    const ds = format(day, 'yyyy-MM-dd')
    return availableDates.datesWithSlots.has(ds)
  }

  const handlePrevMonth = () => {
    if (isMonthLocked) return
    setCurrentMonth((m) => subMonths(m, 1))
  }
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1))

  const handleDateSelect = (day: Date) => {
    if (!isDateSelectable(day)) return
    setSelectedDate(day)
    setSelectedTime(null)
    setStep(2)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep(3)
  }

  const handleBack = () => {
    if (step === 3) {
      setStep(2)
    } else if (step === 2) {
      setSelectedTime(null)
      setStep(1)
    }
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypot) { setSubmitted(true); return }

    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = 'Name is required'
    else if (formData.name.length > 100) errs.name = 'Max 100 characters'
    if (!formData.email.trim()) errs.email = 'Email is required'
    else if (formData.email.length > 100) errs.email = 'Max 100 characters'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'Invalid email address'
    if (formData.company.length > 100) errs.company = 'Max 100 characters'
    if (formData.phone.length > 20) errs.phone = 'Max 20 characters'
    if (formData.message.length > 500) errs.message = 'Max 500 characters'

    setFormErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setSubmitError(null)

    // Booking B (2026-06-16): the form now calls `createBooking` from
    // `lib/booking-actions.ts`, which posts to the Booking Worker at
    // `${NEXT_PUBLIC_BOOKING_WORKER_URL}/`. The Worker holds the
    // `service_role` key server-side and calls
    // `supabase.rpc('reserve_slot', ...)` against
    // `public.reserve_slot(p_date date, p_time text, p_booking jsonb)
    // returns uuid`. The Worker is the only path that writes to
    // `bookings` and `available_slots.is_booked` after Security 3 RLS
    // is in place. The browser never calls `reserve_slot` directly;
    // anon is never granted EXECUTE on `reserve_slot`.
    //
    // The previous flow (Booking A) posted to the n8n forms Worker at
    // `${NEXT_PUBLIC_FORMS_WORKER_URL}/`. The form no longer posts to
    // that Worker; the Booking Worker optionally forwards to the n8n
    // booking webhook (server-side, with the per-form secret) so the
    // operator still gets a notification. If the n8n env vars are not
    // bound to the Booking Worker, the notification step is skipped
    // and the booking still succeeds.
    const bookingPayload: BookingFormData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      company: formData.company.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      message: formData.message.trim() || undefined,
      preferredDate: format(selectedDate!, 'yyyy-MM-dd'),
      preferredTime: selectedTime ?? '',
      timezone:
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : 'America/New_York',
    }

    const result = await createBooking(bookingPayload)
    if (result.error) {
      setSubmitError(result.error)
      setSubmitting(false)
      return
    }
    setSubmitted(true)
    setSubmitting(false)
  }

  const inputClass = (error: boolean) =>
    `w-full bg-[#FAFAF7] border rounded-lg px-4 py-3 min-h-[48px] text-sm text-[#1C1612] placeholder-[#9B9088] outline-none transition-all duration-200 focus:border-[#2A6B5A] focus:ring-2 focus:ring-[#2A6B5A]/15 focus:bg-white ${
      error ? 'border-red-400' : 'border-transparent'
    }`

  // Booking A: compute the times to render in step 2 for the currently
  // selected date. If the RPC has not returned a time for a date, that
  // time is hidden (it's either booked or not seeded). If the RPC has
  // not returned any slots for the selected date at all, render a
  // friendly empty state instead of an empty grid.
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const availableTimesForSelectedDate = selectedDateKey
    ? (availableDates.timesByDate.get(selectedDateKey) ?? [])
    : []

  return (
    <section className="py-12 bg-[#FAFAF7]">
      <div className="max-w-2xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step === s
                    ? 'bg-[#2A6B5A] text-white'
                    : step > s
                    ? 'bg-[#E8F5F1] text-[#2A6B5A]'
                    : 'bg-[#E5E7EB] text-[#9B9088]'
                }`}
              >
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  step === s ? 'text-[#2A6B5A]' : 'text-[#9B9088]'
                }`}
              >
                {s === 1 ? 'Date' : s === 2 ? 'Time' : 'Details'}
              </span>
              {s < 3 && (
                <div
                  className={`w-8 h-px sm:w-12 ${
                    step > s ? 'bg-[#2A6B5A]' : 'bg-[#E5E7EB]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[rgba(42,107,90,0.12)] shadow-[0_4px_24px_rgba(42,107,90,0.06)] p-6 sm:p-8">

          {/* Step 1 — Date picker */}
          {step === 1 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePrevMonth}
                  disabled={isMonthLocked}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#F5F0EB] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5 text-[#1C1612]" />
                </button>
                <h3 className="font-heading text-xl font-bold text-[#1C1612]">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button
                  onClick={handleNextMonth}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#F5F0EB] transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5 text-[#1C1612]" />
                </button>
              </div>

              {slotsError && (
                <p className="text-sm text-red-500 mb-4" role="alert">
                  Could not load availability. Please try again later.
                </p>
              )}
              {slotsLoading && !slotsError && (
                <p className="text-sm text-[#6B6155] mb-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading availability...
                </p>
              )}

              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-semibold text-[#6B6155] uppercase tracking-wide py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {daysInMonth.map((day) => {
                  const ds = format(day, 'yyyy-MM-dd')
                  const available = isDateSelectable(day)
                  const todayFlag = isToday(day)
                  const isSelected = selectedDate
                    ? format(selectedDate, 'yyyy-MM-dd') === ds
                    : false

                  return (
                    <button
                      key={ds}
                      disabled={!available}
                      onClick={() => handleDateSelect(day)}
                      className={`relative aspect-square rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center min-h-[44px] ${
                        isSelected
                          ? 'bg-[#2A6B5A] text-white shadow-md'
                          : todayFlag && available
                          ? 'bg-[#E8F5F1] text-[#2A6B5A] font-bold border border-[#2A6B5A]'
                          : !available
                          ? 'text-[#D1D5DB] cursor-not-allowed'
                          : 'text-[#1C1612] hover:bg-[#F5F0EB] hover:border hover:border-[#2A6B5A] cursor-pointer'
                      }`}
                    >
                      {format(day, 'd')}
                      {todayFlag && !isSelected && available && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2A6B5A]" />
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Step 2 — Time picker */}
          {step === 2 && selectedDate && (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-[#6B6155] hover:text-[#2A6B5A] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to dates
              </button>

              <p className="text-sm text-[#6B6155] mb-1">Selected date</p>
              <p className="font-heading text-xl font-bold text-[#1C1612] mb-6">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>

              {availableTimesForSelectedDate.length === 0 ? (
                <p className="text-sm text-[#6B6155]">
                  No remaining times for this date. Please pick another date.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableTimesForSelectedDate.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] ${
                        selectedTime === time
                          ? 'bg-[#2A6B5A] text-white shadow-md'
                          : 'bg-[#FAFAF7] border border-[rgba(42,107,90,0.2)] text-[#1C1612] hover:bg-[#E8F5F1] hover:border-[#2A6B5A] cursor-pointer'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 3 — Details form */}
          {step === 3 && selectedDate && selectedTime && (
            submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#E8F5F1] flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-[#2A6B5A]" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#1C1612] mb-3">
                  Booking Confirmed!
                </h3>
                <p className="text-[#6B6155] leading-relaxed">
                  Your booking request has been received. We&apos;ll follow up with the details.
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-[#6B6155] hover:text-[#2A6B5A] transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to time
                </button>

                <div className="bg-[#E8F5F1] rounded-xl p-4 mb-6">
                  <p className="text-xs text-[#2A6B5A] font-medium uppercase tracking-wide mb-1">
                    Your booking
                  </p>
                  <p className="text-[#1C1612] font-semibold">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')} — {selectedTime}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                  <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      name="website"
                      type="text"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="booking-name"
                      className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="booking-name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Jane Smith"
                      maxLength={100}
                      className={inputClass(!!formErrors.name)}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="booking-email"
                      className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="booking-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="jane@company.com"
                      maxLength={100}
                      className={inputClass(!!formErrors.email)}
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="booking-company"
                      className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2"
                    >
                      Company
                    </label>
                    <input
                      id="booking-company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleFormChange}
                      placeholder="Acme Inc."
                      maxLength={100}
                      className={inputClass(!!formErrors.company)}
                    />
                    {formErrors.company && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.company}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="booking-phone"
                      className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2"
                    >
                      Phone
                    </label>
                    <input
                      id="booking-phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="+1 (555) 123-4567"
                      maxLength={20}
                      className={inputClass(!!formErrors.phone)}
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="booking-message"
                      className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2"
                    >
                      What would you like to discuss?
                    </label>
                    <textarea
                      id="booking-message"
                      name="message"
                      value={formData.message}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="Tell us about the automation challenges you're facing..."
                      maxLength={500}
                      className={`${inputClass(!!formErrors.message)} resize-none`}
                    />
                    {formData.message.length > 0 && (
                      <p className="text-xs text-[#9B9088] text-right mt-1">
                        {formData.message.length}/500
                      </p>
                    )}
                    {formErrors.message && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.message}</p>
                    )}
                  </div>

                  {submitError && (
                    <p className="text-red-500 text-sm text-center">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full min-h-[52px] text-base py-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Booking...</span>
                      </>
                    ) : (
                      <span>Confirm Booking</span>
                    )}
                  </button>

                  <p className="text-xs text-[#9B9088] text-center">
                    No spam, ever. We&apos;ll send you a calendar invite.
                  </p>
                </form>
              </>
            )
          )}
        </div>
      </div>
    </section>
  )
}
