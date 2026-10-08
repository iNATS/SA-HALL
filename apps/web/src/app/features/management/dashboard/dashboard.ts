import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { Notifier } from '../../../core/feedback/notifier';
import { DEMO_OWNER, DEMO_SUBSCRIBERS, DEMO_TODAY, DEMO_TREND } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { Booking, DecisionState } from '../../../core/domain/models';
import {
  PLATFORM_FEE_RATE,
  bookingQuote,
  outstanding,
  paymentState,
} from '../../../core/domain/pricing';
import { BOOKING_STATUS, PAYMENT_STATE } from '../../../core/domain/status';
import { formatNumber, formatSar } from '../../../core/format/format';
import { Viewport } from '../../../core/layout/viewport';
import { PortalRole } from '../../../core/navigation/navigation';
import { confirmAction } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, ArDateTimePipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { StatCard } from '../../../shared/stat-card/stat-card';
import { Status } from '../../../shared/status/status';
import { TrendChart } from '../../../shared/trend-chart/trend-chart';
import { openBookingDialog } from '../shared/booking-dialog';

@Component({
  selector: 'app-dashboard',
  imports: [
    MatButtonModule,
    RouterLink,
    EmptyState,
    Icon,
    StatCard,
    Status,
    TrendChart,
    ArDatePipe,
    ArDateTimePipe,
    SarPipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly store = inject(DemoStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);
  private readonly compact = inject(Viewport).compact;

  readonly role = input<PortalRole>('owner');

  protected readonly statuses = BOOKING_STATUS;
  protected readonly organization = DEMO_OWNER.organization;

  private readonly scope = computed(() =>
    this.role() === 'admin' ? this.store.bookings() : this.store.ownerBookings(),
  );
  private readonly active = computed(() => this.scope().filter((b) => b.status !== 'cancelled'));

  protected readonly trend = computed(() =>
    DEMO_TREND.map((point) => ({
      label: point.month,
      value: this.role() === 'admin' ? point.platform : point.owner,
    })),
  );

  protected readonly stats = computed(() => {
    const active = this.active();
    const collected = active.reduce((sum, b) => sum + b.paid, 0);
    const receivable = active.reduce((sum, b) => sum + outstanding(b), 0);
    const upcoming = active.filter((b) => b.eventDate >= DEMO_TODAY);
    if (this.role() === 'admin') {
      const gmv = active.reduce((sum, b) => sum + bookingQuote(b).total, 0);
      return [
        {
          label: 'قيمة الحجوزات',
          value: formatSar(gmv),
          hint: `${formatNumber(active.length)} حجزاً نشطاً`,
          icon: 'trending_up',
          featured: true,
        },
        {
          label: 'عمولة المنصة المستحقة',
          value: formatSar(Math.round(collected * PLATFORM_FEE_RATE)),
          hint: `${PLATFORM_FEE_RATE * 100}% من المحصّل`,
          icon: 'account_balance_wallet',
        },
        {
          label: 'المشتركون النشطون',
          value: formatNumber(DEMO_SUBSCRIBERS.filter((s) => s.state === 'active').length),
          hint: `من ${formatNumber(DEMO_SUBSCRIBERS.length)} حسابات`,
          icon: 'badge',
        },
        {
          label: 'طلبات بانتظار القرار',
          value: formatNumber(this.store.pendingRequests().length),
          hint: 'تسجيل وقاعات وترقيات',
          icon: 'inbox',
        },
      ] as const;
    }
    return [
      {
        label: 'المحصّل',
        value: formatSar(collected),
        hint: 'شامل الضريبة',
        icon: 'payments',
        featured: true,
      },
      {
        label: 'مستحقات قادمة',
        value: formatSar(receivable),
        hint: 'أرصدة الحجوزات المؤكدة',
        icon: 'account_balance_wallet',
      },
      {
        label: 'مناسبات قادمة',
        value: formatNumber(upcoming.length),
        hint: `في ${formatNumber(this.store.ownerHalls().length)} قاعات`,
        icon: 'event_available',
      },
      {
        label: 'بانتظار تأكيدك',
        value: formatNumber(active.filter((b) => b.status === 'pending').length),
        hint: 'طلبات حجز جديدة',
        icon: 'hourglass_top',
      },
    ] as const;
  });

  protected readonly pending = computed(() =>
    this.scope()
      .filter((b) => b.status === 'pending')
      .map((b) => this.view(b)),
  );
  protected readonly upcoming = computed(() =>
    this.active()
      .filter((b) => b.status === 'confirmed' && b.eventDate >= DEMO_TODAY)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
      .slice(0, 5)
      .map((b) => this.view(b)),
  );
  protected readonly requests = computed(() => this.store.pendingRequests().slice(0, 4));

  protected open(id: string): void {
    openBookingDialog(this.dialog, { id, role: this.role() }, this.compact());
  }

  protected confirmBooking(id: string): void {
    this.store.setBookingStatus(id, 'confirmed');
    this.notifier.open(`تم تأكيد الحجز ${id} وإشعار العميل`);
  }

  protected decide(id: string, title: string, state: DecisionState): void {
    const approve = state === 'approved';
    confirmAction(this.dialog, {
      title: approve ? 'قبول الطلب؟' : 'رفض الطلب؟',
      message: approve
        ? `سيُفعَّل «${title}» ويُبلَّغ مقدم الطلب.`
        : `سيُرفض «${title}» ويُبلَّغ مقدم الطلب بالسبب.`,
      confirmLabel: approve ? 'قبول' : 'رفض',
      destructive: !approve,
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.store.decideRequest(id, state);
        this.notifier.open(approve ? 'تم قبول الطلب' : 'تم رفض الطلب');
      }
    });
  }

  private view(booking: Booking) {
    return {
      booking,
      hall: this.store.hall(booking.hallSlug)?.name ?? '',
      total: bookingQuote(booking).total,
      payment: PAYMENT_STATE[paymentState(booking)],
    };
  }
}
