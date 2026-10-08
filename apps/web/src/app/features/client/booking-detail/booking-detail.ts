import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { Notifier } from '../../../core/feedback/notifier';
import { DemoStore } from '../../../core/demo/demo-store';
import { Booking } from '../../../core/domain/models';
import { photoSrc, photoSrcset } from '../../../core/domain/photos';
import { outstanding, paymentState } from '../../../core/domain/pricing';
import { BOOKING_STATUS, PAYMENT_STATE } from '../../../core/domain/status';
import { formatDate, formatDateTime, formatSar } from '../../../core/format/format';
import { BookingSummary } from '../../../shared/booking-summary/booking-summary';
import { confirmAction } from '../../../shared/confirm-dialog/confirm-dialog';
import { DetailBar } from '../../../shared/detail-bar/detail-bar';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { Status } from '../../../shared/status/status';

type StepState = 'done' | 'current' | 'upcoming' | 'stopped';

interface TimelineStep {
  readonly title: string;
  readonly detail: string;
  readonly state: StepState;
}

/** Derives the customer-facing journey from booking and payment state. */
function timeline(booking: Booking): readonly TimelineStep[] {
  const payment = paymentState(booking);
  const confirmed = booking.status === 'confirmed' || booking.status === 'completed';
  const steps: TimelineStep[] = [
    { title: 'تم إرسال الطلب', detail: formatDateTime(booking.createdAt), state: 'done' },
  ];
  if (booking.status === 'cancelled') {
    steps.push({
      title: 'أُلغي الحجز',
      detail: payment === 'refunded' ? 'أُعيد المبلغ المدفوع' : 'لم تُخصم أي مبالغ',
      state: 'stopped',
    });
    return steps;
  }
  steps.push(
    {
      title: 'تأكيد القاعة',
      detail: confirmed ? 'أكدت القاعة توفر الموعد' : 'بانتظار مراجعة القاعة خلال 24 ساعة',
      state: confirmed ? 'done' : 'current',
    },
    {
      title: 'دفع العربون',
      detail: booking.paid > 0 ? `تم استلام ${formatSar(booking.paid)}` : 'يُفعّل بعد تأكيد القاعة',
      state: booking.paid > 0 ? 'done' : confirmed ? 'current' : 'upcoming',
    },
    {
      title: 'سداد كامل المبلغ',
      detail: payment === 'paid' ? 'تم السداد بالكامل' : 'قبل المناسبة بـ 14 يوماً',
      state: payment === 'paid' ? 'done' : payment === 'deposit' ? 'current' : 'upcoming',
    },
    {
      title: 'يوم المناسبة',
      detail: formatDate(booking.eventDate),
      state: booking.status === 'completed' ? 'done' : 'upcoming',
    },
  );
  return steps;
}

@Component({
  selector: 'app-booking-detail',
  imports: [
    MatButtonModule,
    RouterLink,
    BookingSummary,
    DetailBar,
    EmptyState,
    Icon,
    Status,
    ArDatePipe,
    NumberPipe,
    SarPipe,
  ],
  templateUrl: './booking-detail.html',
  styleUrl: './booking-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDetail {
  private readonly store = inject(DemoStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  readonly id = input.required<string>();

  /** Only the signed-in client's bookings are viewable here. */
  protected readonly booking = computed(() =>
    this.store.clientBookings().find((booking) => booking.id === this.id()),
  );
  protected readonly hall = computed(() => this.store.hall(this.booking()?.hallSlug));
  protected readonly photo = computed(() => {
    const hall = this.hall();
    return hall ? { src: photoSrc(hall.photo), srcset: photoSrcset(hall.photo) } : null;
  });
  protected readonly status = computed(() => {
    const booking = this.booking();
    return booking ? BOOKING_STATUS[booking.status] : null;
  });
  protected readonly payment = computed(() => {
    const booking = this.booking();
    return booking ? PAYMENT_STATE[paymentState(booking)] : null;
  });
  protected readonly remaining = computed(() => {
    const booking = this.booking();
    return booking ? outstanding(booking) : 0;
  });
  protected readonly steps = computed(() => {
    const booking = this.booking();
    return booking ? timeline(booking) : [];
  });

  protected payRemaining(booking: Booking): void {
    confirmAction(this.dialog, {
      title: 'سداد المبلغ المتبقي',
      message: `سيتم تسجيل دفعة تجريبية بقيمة ${formatSar(this.remaining())}. لن يُنفَّذ أي خصم فعلي.`,
      confirmLabel: 'تأكيد الدفع',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.store.settleBalance(booking.id);
        this.notifier.open('تم تسجيل السداد الكامل للحجز');
      }
    });
  }

  protected cancel(booking: Booking): void {
    confirmAction(this.dialog, {
      title: 'إلغاء طلب الحجز؟',
      message: 'سيُلغى الطلب ويُتاح التاريخ لعملاء آخرين. لا يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'إلغاء الطلب',
      destructive: true,
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.store.setBookingStatus(booking.id, 'cancelled');
        this.notifier.open(`أُلغي الطلب ${booking.id}`);
      }
    });
  }
}
