export interface BookingFormData {
  name: string
  email: string
  company?: string
  phone?: string
  message?: string
  preferredDate: string
  preferredTime: string
  timezone: string
}

export interface SlotRecord {
  id: string
  date: string
  time: string
  is_booked: boolean
}

export interface ActionResult<T> {
  data: T | null
  error: string | null
}
