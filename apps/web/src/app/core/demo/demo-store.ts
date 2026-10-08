import { Injectable, computed, signal } from '@angular/core';
import {
  Booking,
  BookingLine,
  BookingStatus,
  DecisionState,
  Hall,
  HomeSection,
  PlatformRequest,
} from '../domain/models';
import { bookingQuote, outstanding } from '../domain/pricing';
import {
  DEMO_BOOKINGS,
  DEMO_CLIENT,
  DEMO_HALLS,
  DEMO_HOME_SECTIONS,
  DEMO_OWNER,
  DEMO_REQUESTS,
} from './demo-data';

export interface BookingDraft {
  readonly hallSlug: string;
  readonly customer: string;
  readonly phone: string;
  readonly eventDate: string;
  readonly guests: number;
  readonly lines: readonly BookingLine[];
}

/**
 * In-memory application state for the demo. It deliberately mirrors the shape the
 * API will expose so pages can switch to HTTP resources without template changes.
 * Nothing here is persisted or trusted: the server will own every state transition.
 */
@Injectable({ providedIn: 'root' })
export class DemoStore {
  private readonly bookingState = signal<readonly Booking[]>(DEMO_BOOKINGS);
  private readonly requestState = signal<readonly PlatformRequest[]>(DEMO_REQUESTS);
  private readonly sectionState = signal<readonly HomeSection[]>(DEMO_HOME_SECTIONS);
  private readonly hallVisibility = signal<ReadonlyMap<string, boolean>>(new Map());

  readonly bookings = this.bookingState.asReadonly();
  readonly requests = this.requestState.asReadonly();
  readonly homeSections = this.sectionState.asReadonly();

  readonly halls = computed<readonly Hall[]>(() => {
    const overrides = this.hallVisibility();
    return DEMO_HALLS.map((hall) =>
      overrides.has(hall.slug) ? { ...hall, visible: overrides.get(hall.slug)! } : hall,
    );
  });
  readonly publicHalls = computed(() => this.halls().filter((hall) => hall.visible));
  readonly ownerHalls = computed(() =>
    this.halls().filter((hall) => hall.vendorId === DEMO_OWNER.vendorId),
  );
  readonly ownerBookings = computed(() => {
    const owned = new Set(this.ownerHalls().map((hall) => hall.slug));
    return this.bookings().filter((booking) => owned.has(booking.hallSlug));
  });
  readonly clientBookings = computed(() =>
    this.bookings().filter((booking) => booking.clientId === DEMO_CLIENT.id),
  );
  readonly pendingRequests = computed(() =>
    this.requests().filter((request) => request.state === 'pending'),
  );

  hall(slug: string | null | undefined): Hall | undefined {
    return this.halls().find((hall) => hall.slug === slug);
  }

  booking(id: string | null | undefined): Booking | undefined {
    return this.bookings().find((booking) => booking.id === id);
  }

  /** Dates already held by an active booking for the hall (YYYY-MM-DD). */
  bookedDates(hallSlug: string): ReadonlySet<string> {
    return new Set(
      this.bookings()
        .filter((booking) => booking.hallSlug === hallSlug && booking.status !== 'cancelled')
        .map((booking) => booking.eventDate),
    );
  }

  createBooking(draft: BookingDraft): Booking {
    const nextNumber =
      Math.max(...this.bookings().map((booking) => Number(booking.id.slice(3)))) + 1;
    const booking: Booking = {
      ...draft,
      id: `SH-${nextNumber}`,
      clientId: DEMO_CLIENT.id,
      paid: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.bookingState.update((bookings) => [booking, ...bookings]);
    return booking;
  }

  setBookingStatus(id: string, status: BookingStatus): void {
    this.patchBooking(id, (booking) => ({ ...booking, status }));
  }

  /** Records settlement of the remaining balance (demo stand-in for a verified payment). */
  settleBalance(id: string): void {
    this.patchBooking(id, (booking) =>
      outstanding(booking) > 0 ? { ...booking, paid: bookingQuote(booking).total } : booking,
    );
  }

  decideRequest(id: string, state: DecisionState): void {
    this.requestState.update((requests) =>
      requests.map((request) => (request.id === id ? { ...request, state } : request)),
    );
  }

  setHallVisibility(slug: string, visible: boolean): void {
    this.hallVisibility.update((current) => new Map(current).set(slug, visible));
  }

  setSectionVisibility(id: string, visible: boolean): void {
    this.sectionState.update((sections) =>
      sections.map((section) => (section.id === id ? { ...section, visible } : section)),
    );
  }

  moveSection(id: string, offset: -1 | 1): void {
    this.sectionState.update((sections) => {
      const index = sections.findIndex((section) => section.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= sections.length) {
        return sections;
      }
      const next = [...sections];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  private patchBooking(id: string, change: (booking: Booking) => Booking): void {
    this.bookingState.update((bookings) =>
      bookings.map((booking) => (booking.id === id ? change(booking) : booking)),
    );
  }
}
