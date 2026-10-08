import { Booking } from './models';
import { bookingQuote, outstanding, paidRatio, paymentState, quote } from './pricing';

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'SH-1',
    hallSlug: 'lilac-royal',
    customer: 'عميل',
    phone: '0500000000',
    eventDate: '2026-11-18',
    guests: 200,
    lines: [{ label: 'حجز القاعة', amount: 18500 }],
    paid: 0,
    status: 'confirmed',
    createdAt: '2026-10-01T10:00:00+03:00',
    ...overrides,
  };
}

describe('pricing', () => {
  it('adds 15% VAT and a 30% deposit rounded to whole riyals', () => {
    expect(quote([{ label: 'قاعة', amount: 18500 }])).toEqual({
      subtotal: 18500,
      vat: 2775,
      total: 21275,
      deposit: 6383,
    });
  });

  it('sums every booking line before tax', () => {
    const result = quote([
      { label: 'قاعة', amount: 11900 },
      { label: 'تصوير', amount: 2800 },
    ]);
    expect(result.subtotal).toBe(14700);
    expect(result.total).toBe(16905);
  });

  it('derives payment state from the amount received', () => {
    expect(paymentState(booking({ paid: 0 }))).toBe('unpaid');
    expect(paymentState(booking({ paid: 6383 }))).toBe('deposit');
    expect(paymentState(booking({ paid: 21275 }))).toBe('paid');
    expect(paymentState(booking({ status: 'cancelled', paid: 6383 }))).toBe('refunded');
    expect(paymentState(booking({ status: 'cancelled', paid: 0 }))).toBe('unpaid');
  });

  it('owes nothing on cancelled bookings and never a negative balance', () => {
    expect(outstanding(booking({ paid: 6383 }))).toBe(14892);
    expect(outstanding(booking({ status: 'cancelled', paid: 0 }))).toBe(0);
    expect(outstanding(booking({ paid: 99999 }))).toBe(0);
    expect(paidRatio(booking({ paid: 99999 }))).toBe(1);
  });

  it('keeps the booking quote consistent with its lines', () => {
    expect(bookingQuote(booking()).total).toBe(21275);
  });
});
