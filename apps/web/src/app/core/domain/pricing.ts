import { Booking, BookingLine, PaymentState } from './models';

/**
 * Display-side pricing rules. These mirror the server contract so the UI can show
 * an estimate, but the API remains the only authority for amounts that are charged
 * (see docs/TARGET_ARCHITECTURE.md, "Pricing").
 */
export const VAT_RATE = 0.15;
export const DEPOSIT_RATE = 0.3;
export const PLATFORM_FEE_RATE = 0.05;

export interface Quote {
  readonly subtotal: number;
  readonly vat: number;
  readonly total: number;
  readonly deposit: number;
}

export function quote(lines: readonly BookingLine[]): Quote {
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;
  return { subtotal, vat, total, deposit: Math.round(total * DEPOSIT_RATE) };
}

export function bookingQuote(booking: Booking): Quote {
  return quote(booking.lines);
}

export function outstanding(booking: Booking): number {
  if (booking.status === 'cancelled') {
    return 0;
  }
  return Math.max(0, bookingQuote(booking).total - booking.paid);
}

export function paymentState(booking: Booking): PaymentState {
  const { total } = bookingQuote(booking);
  if (booking.status === 'cancelled') {
    return booking.paid > 0 ? 'refunded' : 'unpaid';
  }
  if (booking.paid <= 0) {
    return 'unpaid';
  }
  return booking.paid >= total ? 'paid' : 'deposit';
}

export function paidRatio(booking: Booking): number {
  const { total } = bookingQuote(booking);
  return total === 0 ? 0 : Math.min(1, booking.paid / total);
}
