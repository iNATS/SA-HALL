import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { DemoStore } from '../../../core/demo/demo-store';
import { BookingStatus } from '../../../core/domain/models';
import { bookingQuote, paymentState } from '../../../core/domain/pricing';
import { BOOKING_STATUS, PAYMENT_STATE } from '../../../core/domain/status';
import { Viewport } from '../../../core/layout/viewport';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { Status } from '../../../shared/status/status';
import { openBookingDialog } from '../shared/booking-dialog';

const STATUS_FILTERS: readonly (BookingStatus | 'all')[] = [
  'all',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
];

@Component({
  selector: 'app-bookings',
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    EmptyState,
    Icon,
    Status,
    ArDatePipe,
    NumberPipe,
    SarPipe,
  ],
  templateUrl: './bookings.html',
  styleUrl: './bookings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bookings {
  private readonly store = inject(DemoStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  protected readonly compact = inject(Viewport).compact;

  readonly status = input<string>();
  readonly hall = input<string>();
  readonly q = input<string>();

  protected readonly columns = [
    'id',
    'customer',
    'hall',
    'eventDate',
    'payment',
    'status',
    'total',
  ];
  protected readonly filters = STATUS_FILTERS;
  protected readonly labels = { all: 'الكل', ...mapLabels() };
  protected readonly halls = this.store.ownerHalls;
  protected readonly query = linkedSignal(() => this.q() ?? '');
  protected readonly sort = signal<Sort>({ active: 'eventDate', direction: 'asc' });

  protected readonly activeStatus = computed(() =>
    STATUS_FILTERS.includes(this.status() as BookingStatus)
      ? (this.status() as BookingStatus)
      : 'all',
  );

  private readonly scoped = computed(() => {
    const hall = this.hall();
    const term = this.query().trim();
    return this.store
      .ownerBookings()
      .filter(
        (booking) =>
          (!hall || booking.hallSlug === hall) &&
          (!term || booking.id.includes(term.toUpperCase()) || booking.customer.includes(term)),
      );
  });

  protected readonly counts = computed(() => {
    const counts: Record<string, number> = { all: this.scoped().length };
    for (const booking of this.scoped()) {
      counts[booking.status] = (counts[booking.status] ?? 0) + 1;
    }
    return counts;
  });

  protected readonly rows = computed(() => {
    const status = this.activeStatus();
    const { active, direction } = this.sort();
    const factor = direction === 'desc' ? -1 : 1;
    return this.scoped()
      .filter((booking) => status === 'all' || booking.status === status)
      .map((booking) => ({
        booking,
        hall: this.store.hall(booking.hallSlug)?.name ?? '',
        total: bookingQuote(booking).total,
        status: BOOKING_STATUS[booking.status],
        payment: PAYMENT_STATE[paymentState(booking)],
      }))
      .sort((a, b) => {
        if (!direction) {
          return 0;
        }
        if (active === 'total') {
          return (a.total - b.total) * factor;
        }
        if (active === 'customer') {
          return a.booking.customer.localeCompare(b.booking.customer, 'ar') * factor;
        }
        return a.booking.eventDate.localeCompare(b.booking.eventDate) * factor;
      });
  });

  protected setParam(key: 'status' | 'hall' | 'q', value: string | null | undefined): void {
    void this.router.navigate([], {
      queryParams: { [key]: value && value !== 'all' ? value : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected statusChange(event: MatChipListboxChange): void {
    this.setParam('status', event.value ?? 'all');
  }

  protected open(id: string): void {
    openBookingDialog(this.dialog, { id, role: 'owner' }, this.compact());
  }
}

function mapLabels(): Record<BookingStatus, string> {
  return {
    pending: BOOKING_STATUS.pending.label,
    confirmed: BOOKING_STATUS.confirmed.label,
    completed: BOOKING_STATUS.completed.label,
    cancelled: BOOKING_STATUS.cancelled.label,
  };
}
