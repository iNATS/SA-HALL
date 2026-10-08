import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { DemoStore } from '../../../core/demo/demo-store';
import { Viewport } from '../../../core/layout/viewport';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';

interface ClientRow {
  readonly name: string;
  readonly phone: string;
  readonly bookings: number;
  readonly spent: number;
  readonly lastEvent: string;
}

@Component({
  selector: 'app-clients',
  imports: [
    MatButtonModule,
    MatInputModule,
    MatTableModule,
    EmptyState,
    Icon,
    ArDatePipe,
    NumberPipe,
    SarPipe,
  ],
  template: `
    <div class="mp-page">
      <div class="mp-toolbar">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="mp-search">
          <mat-label>الاسم أو رقم الجوال</mat-label>
          <app-icon matIconPrefix name="search" />
          <input
            matInput
            type="search"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </mat-form-field>
        <p class="sh-muted">
          <span class="sh-num">{{ rows().length | num }}</span> عملاء · الإنفاق يشمل المبالغ
          المستلمة فقط
        </p>
      </div>

      <section class="mp-panel table-panel" aria-label="العملاء">
        @if (rows().length === 0) {
          <app-empty-state
            icon="group"
            title="لا يوجد عملاء مطابقون"
            message="جرّب اسماً أو رقماً آخر."
          />
        } @else if (compact()) {
          <ul class="mp-list">
            @for (row of rows(); track row.phone) {
              <li class="mp-row">
                <span class="mp-avatar" aria-hidden="true">{{ row.name.charAt(0) }}</span>
                <div class="mp-row-main">
                  <strong>{{ row.name }}</strong>
                  <small
                    ><span class="sh-num">{{ row.bookings | num }}</span> حجوزات · آخرها
                    {{ row.lastEvent | arDate: 'short' }}</small
                  >
                </div>
                <a
                  mat-icon-button
                  [href]="'tel:' + row.phone"
                  [attr.aria-label]="'اتصال بـ ' + row.name"
                >
                  <app-icon name="call" />
                </a>
              </li>
            }
          </ul>
        } @else {
          <div class="sh-table-scroll">
            <table mat-table class="mp-table" [dataSource]="rows()">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>العميل</th>
                <td mat-cell *matCellDef="let row">
                  <strong>{{ row.name }}</strong>
                </td>
              </ng-container>
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>الجوال</th>
                <td mat-cell *matCellDef="let row">
                  <a [href]="'tel:' + row.phone"
                    ><bdi dir="ltr">{{ row.phone }}</bdi></a
                  >
                </td>
              </ng-container>
              <ng-container matColumnDef="bookings">
                <th mat-header-cell *matHeaderCellDef>الحجوزات</th>
                <td mat-cell *matCellDef="let row">{{ row.bookings | num }}</td>
              </ng-container>
              <ng-container matColumnDef="spent">
                <th mat-header-cell *matHeaderCellDef>إجمالي المدفوع</th>
                <td mat-cell *matCellDef="let row">{{ row.spent | sar }}</td>
              </ng-container>
              <ng-container matColumnDef="lastEvent">
                <th mat-header-cell *matHeaderCellDef>آخر مناسبة</th>
                <td mat-cell *matCellDef="let row">{{ row.lastEvent | arDate }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: `
    .table-panel {
      padding-block: 8px;
    }
    td a {
      color: var(--mat-sys-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clients {
  private readonly store = inject(DemoStore);
  protected readonly compact = inject(Viewport).compact;
  protected readonly query = signal('');
  protected readonly columns = ['name', 'phone', 'bookings', 'spent', 'lastEvent'];

  private readonly all = computed<readonly ClientRow[]>(() => {
    const byPhone = new Map<string, ClientRow>();
    for (const booking of this.store.ownerBookings()) {
      const current = byPhone.get(booking.phone);
      const received = booking.status === 'cancelled' ? 0 : booking.paid;
      byPhone.set(booking.phone, {
        name: booking.customer,
        phone: booking.phone,
        bookings: (current?.bookings ?? 0) + 1,
        spent: (current?.spent ?? 0) + received,
        lastEvent:
          current && current.lastEvent > booking.eventDate ? current.lastEvent : booking.eventDate,
      });
    }
    return [...byPhone.values()].sort((a, b) => b.spent - a.spent);
  });

  protected readonly rows = computed(() => {
    const term = this.query().trim();
    return term
      ? this.all().filter((row) => row.name.includes(term) || row.phone.includes(term))
      : this.all();
  });
}
