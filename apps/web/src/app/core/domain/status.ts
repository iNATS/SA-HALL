import type { IconName } from '../../shared/icon/icons';
import {
  BookingStatus,
  Coupon,
  DecisionState,
  PaymentState,
  StoreOrder,
  SubscriptionState,
} from './models';

export type StatusTone = 'success' | 'warning' | 'info' | 'neutral' | 'error';

/** Status is always conveyed by icon and text together, never by color alone. */
export interface StatusView {
  readonly label: string;
  readonly tone: StatusTone;
  readonly icon: IconName;
}

export const BOOKING_STATUS: Record<BookingStatus, StatusView> = {
  pending: { label: 'بانتظار التأكيد', tone: 'warning', icon: 'hourglass_top' },
  confirmed: { label: 'مؤكد', tone: 'success', icon: 'check_circle' },
  completed: { label: 'مكتمل', tone: 'neutral', icon: 'task_alt' },
  cancelled: { label: 'ملغي', tone: 'error', icon: 'cancel' },
};

export const PAYMENT_STATE: Record<PaymentState, StatusView> = {
  unpaid: { label: 'غير مدفوع', tone: 'neutral', icon: 'credit_card' },
  deposit: { label: 'عربون مدفوع', tone: 'info', icon: 'payments' },
  paid: { label: 'مدفوع بالكامل', tone: 'success', icon: 'paid' },
  refunded: { label: 'مسترد', tone: 'neutral', icon: 'undo' },
};

export const SUBSCRIPTION_STATE: Record<SubscriptionState, StatusView> = {
  active: { label: 'نشط', tone: 'success', icon: 'check_circle' },
  pending: { label: 'بانتظار الاعتماد', tone: 'warning', icon: 'hourglass_top' },
  expiring: { label: 'ينتهي قريباً', tone: 'info', icon: 'schedule' },
  suspended: { label: 'موقوف', tone: 'error', icon: 'block' },
};

export const DECISION_STATE: Record<DecisionState, StatusView> = {
  pending: { label: 'قيد المراجعة', tone: 'warning', icon: 'pending' },
  approved: { label: 'مقبول', tone: 'success', icon: 'check_circle' },
  rejected: { label: 'مرفوض', tone: 'error', icon: 'cancel' },
};

export const ORDER_STATE: Record<StoreOrder['state'], StatusView> = {
  processing: { label: 'قيد التجهيز', tone: 'warning', icon: 'inventory_2' },
  shipped: { label: 'تم الشحن', tone: 'info', icon: 'local_shipping' },
  delivered: { label: 'تم التسليم', tone: 'success', icon: 'task_alt' },
};

export function couponState(coupon: Coupon, today: string): StatusView {
  if (coupon.expiresOn < today) {
    return { label: 'منتهي', tone: 'neutral', icon: 'event_busy' };
  }
  if (coupon.used >= coupon.limit) {
    return { label: 'مستنفد', tone: 'neutral', icon: 'block' };
  }
  return coupon.paused
    ? { label: 'متوقف مؤقتاً', tone: 'warning', icon: 'pause' }
    : { label: 'نشط', tone: 'success', icon: 'check_circle' };
}
