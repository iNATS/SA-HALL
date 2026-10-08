import type { IconName } from '../../shared/icon/icons';

/** Responsive photo set generated under `public/images/<name>-<width>.webp`. */
export type PhotoName = 'stage' | 'table' | 'lounge' | 'arches' | 'chandelier' | 'florals';

export interface Hall {
  readonly slug: string;
  readonly name: string;
  readonly vendorId: string;
  readonly city: string;
  readonly district: string;
  readonly capacityMin: number;
  readonly capacityMax: number;
  /** Base price per event night in whole SAR. */
  readonly price: number;
  readonly rating: number;
  readonly reviews: number;
  readonly tag: string;
  readonly photo: PhotoName;
  readonly instantBooking: boolean;
  readonly visible: boolean;
}

export type ServiceUnit = 'event' | 'guest';

export interface ServiceOffer {
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly city: string;
  readonly price: number;
  readonly unit: ServiceUnit;
  readonly rating: number;
  readonly description: string;
  readonly icon: IconName;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentState = 'unpaid' | 'deposit' | 'paid' | 'refunded';

export interface BookingLine {
  readonly label: string;
  readonly amount: number;
}

export interface Booking {
  readonly id: string;
  readonly hallSlug: string;
  /** Account that placed the booking; guests may book on someone else's behalf. */
  readonly clientId?: string;
  readonly customer: string;
  readonly phone: string;
  /** ISO calendar date (YYYY-MM-DD) in the venue's local timezone. */
  readonly eventDate: string;
  readonly guests: number;
  readonly lines: readonly BookingLine[];
  /** Amount received so far in whole SAR, VAT inclusive. */
  readonly paid: number;
  readonly status: BookingStatus;
  readonly createdAt: string;
}

export type RequestKind = 'registration' | 'new-hall' | 'upgrade';
export type DecisionState = 'pending' | 'approved' | 'rejected';

export interface PlatformRequest {
  readonly id: string;
  readonly kind: RequestKind;
  readonly title: string;
  readonly applicant: string;
  readonly city: string;
  readonly submittedAt: string;
  readonly details: readonly { readonly label: string; readonly value: string }[];
  readonly state: DecisionState;
}

export type SubscriptionState = 'active' | 'pending' | 'expiring' | 'suspended';

export interface Subscriber {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly kind: string;
  readonly plan: string;
  readonly assets: number;
  readonly state: SubscriptionState;
  readonly renewsOn: string | null;
}

export interface Coupon {
  readonly code: string;
  readonly kind: 'percent' | 'fixed';
  readonly value: number;
  readonly scope: string;
  readonly used: number;
  readonly limit: number;
  readonly expiresOn: string;
  readonly paused: boolean;
}

export interface LedgerEntry {
  readonly reference: string;
  readonly description: string;
  readonly date: string;
  readonly kind: 'collection' | 'fee' | 'payout' | 'refund';
  /** Signed amount in whole SAR; negative values leave the vendor balance. */
  readonly amount: number;
}

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly price: number;
  readonly unit: string;
  readonly stock: number;
  readonly icon: IconName;
}

export interface StoreOrder {
  readonly id: string;
  readonly title: string;
  readonly quantity: number;
  readonly total: number;
  readonly state: 'processing' | 'shipped' | 'delivered';
  readonly eta: string;
}

export interface HomeSection {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly visible: boolean;
}
