import { TestBed } from '@angular/core/testing';
import { PLATFORM_FEE_RATE, bookingQuote, paymentState } from '../domain/pricing';
import { DEMO_BOOKINGS, DEMO_CLIENT, DEMO_LEDGER, DEMO_OWNER } from './demo-data';
import { DemoStore } from './demo-store';

describe('DemoStore', () => {
  let store: DemoStore;

  beforeEach(() => {
    store = TestBed.inject(DemoStore);
  });

  it('scopes bookings to the owner halls and the signed-in client', () => {
    const ownerHalls = new Set(store.ownerHalls().map((hall) => hall.slug));
    expect(store.ownerBookings().every((b) => ownerHalls.has(b.hallSlug))).toBe(true);
    expect(store.clientBookings().every((b) => b.clientId === DEMO_CLIENT.id)).toBe(true);
    expect(store.ownerHalls().every((hall) => hall.vendorId === DEMO_OWNER.vendorId)).toBe(true);
  });

  it('frees the date of cancelled bookings', () => {
    expect(store.bookedDates('aroma-palace').has('2026-10-30')).toBe(false);
    expect(store.bookedDates('lilac-royal').has('2026-11-18')).toBe(true);
  });

  it('creates pending, unpaid bookings with the next reference for the client', () => {
    const created = store.createBooking({
      hallSlug: 'noura-hall',
      customer: 'ضيف',
      phone: '0500000000',
      eventDate: '2026-12-20',
      guests: 150,
      lines: [{ label: 'حجز القاعة', amount: 11900 }],
    });
    expect(created.id).toBe('SH-24096');
    expect(created.status).toBe('pending');
    expect(created.paid).toBe(0);
    expect(store.clientBookings()[0].id).toBe(created.id);
    expect(store.bookedDates('noura-hall').has('2026-12-20')).toBe(true);
  });

  it('settles only the remaining balance', () => {
    store.settleBalance('SH-24081');
    const settled = store.booking('SH-24081')!;
    expect(settled.paid).toBe(bookingQuote(settled).total);
    expect(paymentState(settled)).toBe('paid');
  });
});

describe('demo data', () => {
  it('records deposits of exactly 30% of the VAT-inclusive total', () => {
    for (const booking of DEMO_BOOKINGS.filter((b) => paymentState(b) === 'deposit')) {
      expect(booking.paid).toBe(bookingQuote(booking).deposit);
    }
  });

  it('reconciles each ledger fee with 5% of its collection', () => {
    const collections = DEMO_LEDGER.filter((entry) => entry.kind === 'collection');
    const fees = DEMO_LEDGER.filter((entry) => entry.kind === 'fee');
    for (const fee of fees) {
      const reference = fee.description.split('· ')[1];
      const collection = collections.find((entry) => entry.description.endsWith(reference));
      expect(collection).toBeDefined();
      expect(-fee.amount).toBe(Math.round(collection!.amount * PLATFORM_FEE_RATE));
    }
  });

  it('never overlaps two active bookings on the same hall and date', () => {
    const active = DEMO_BOOKINGS.filter((b) => b.status !== 'cancelled');
    const keys = active.map((b) => `${b.hallSlug}:${b.eventDate}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
