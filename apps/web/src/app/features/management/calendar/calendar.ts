import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { DEMO_TODAY } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { Booking } from '../../../core/domain/models';
import { BOOKING_STATUS } from '../../../core/domain/status';
import { formatDate, toIsoDate } from '../../../core/format/format';
import { Viewport } from '../../../core/layout/viewport';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, NumberPipe } from '../../../shared/pipes/format.pipes';
import { Status } from '../../../shared/status/status';
import { openBookingDialog } from '../shared/booking-dialog';

interface DayCell {
  readonly iso: string;
  readonly day: number;
  readonly inMonth: boolean;
  readonly events: readonly Booking[];
}

/** Saudi working week starts on Sunday. */
const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

@Component({
  selector: 'app-calendar',
  imports: [MatButtonModule, MatChipsModule, EmptyState, Icon, Status, ArDatePipe, NumberPipe],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar {
  private readonly store = inject(DemoStore);
  private readonly dialog = inject(MatDialog);
  private readonly compact = inject(Viewport).compact;

  protected readonly weekdays = WEEKDAYS;
  protected readonly today = DEMO_TODAY;
  protected readonly statuses = BOOKING_STATUS;
  protected readonly halls = this.store.ownerHalls;
  protected readonly hallFilter = signal('');
  protected readonly month = signal(firstOfMonth(DEMO_TODAY));
  protected readonly selected = signal(DEMO_TODAY);

  private readonly events = computed(() =>
    this.store
      .ownerBookings()
      .filter(
        (booking) =>
          booking.status !== 'cancelled' &&
          (!this.hallFilter() || booking.hallSlug === this.hallFilter()),
      ),
  );
  private readonly byDate = computed(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of this.events()) {
      map.set(booking.eventDate, [...(map.get(booking.eventDate) ?? []), booking]);
    }
    return map;
  });

  protected readonly monthLabel = computed(() => formatDate(toIsoDate(this.month()), 'month'));
  protected readonly cells = computed<readonly DayCell[]>(() => {
    const first = this.month();
    const lead = first.getDay();
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const total = Math.ceil((lead + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const date = new Date(first.getFullYear(), first.getMonth(), index - lead + 1);
      const iso = toIsoDate(date);
      return {
        iso,
        day: date.getDate(),
        inMonth: date.getMonth() === first.getMonth(),
        events: this.byDate().get(iso) ?? [],
      };
    });
  });
  protected readonly selectedEvents = computed(() =>
    (this.byDate().get(this.selected()) ?? []).map((booking) => this.view(booking)),
  );
  protected readonly monthCount = computed(() =>
    this.cells()
      .filter((cell) => cell.inMonth)
      .reduce((n, cell) => n + cell.events.length, 0),
  );

  protected shiftMonth(offset: number): void {
    const current = this.month();
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    this.month.set(next);
    this.selected.set(toIsoDate(next));
  }

  protected goToday(): void {
    this.month.set(firstOfMonth(DEMO_TODAY));
    this.selected.set(DEMO_TODAY);
  }

  protected hallName(slug: string): string {
    return this.store.hall(slug)?.name ?? '';
  }

  protected dayLabel(cell: DayCell): string {
    const count = cell.events.length;
    const events = count === 0 ? 'لا مناسبات' : count === 1 ? 'مناسبة واحدة' : `${count} مناسبات`;
    return `${formatDate(cell.iso)}، ${events}`;
  }

  protected open(id: string): void {
    openBookingDialog(this.dialog, { id, role: 'owner' }, this.compact());
  }

  private view(booking: Booking) {
    return {
      booking,
      hall: this.hallName(booking.hallSlug),
      status: BOOKING_STATUS[booking.status],
    };
  }
}

function firstOfMonth(iso: string): Date {
  const [year, month] = iso.split('-').map(Number);
  return new Date(year, month - 1, 1);
}
