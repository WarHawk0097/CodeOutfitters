// CalendarProvider — work/PROVIDER-ADAPTER-PLAN.md row 2
// Shape: createEvent, getAvailability. Mock strategy: fixture-based static availability.
import type { ProviderStatus } from "./types";

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
}

export interface AvailabilitySlot {
  startsAt: string;
  endsAt: string;
}

export interface CalendarProvider {
  status: ProviderStatus;
  createEvent(title: string, startsAt: string): Promise<CalendarEvent>;
  getAvailability(rangeStart: string, rangeEnd: string): Promise<AvailabilitySlot[]>;
}

export class MockCalendarProvider implements CalendarProvider {
  status: ProviderStatus = "NOT_CONFIGURED";

  async createEvent(title: string, startsAt: string): Promise<CalendarEvent> {
    return { id: "calendar-mock-event-001", title, startsAt };
  }

  async getAvailability(_rangeStart: string, _rangeEnd: string): Promise<AvailabilitySlot[]> {
    return [
      { startsAt: "2026-01-05T09:00:00.000Z", endsAt: "2026-01-05T09:30:00.000Z" },
      { startsAt: "2026-01-05T10:00:00.000Z", endsAt: "2026-01-05T10:30:00.000Z" },
    ];
  }
}
