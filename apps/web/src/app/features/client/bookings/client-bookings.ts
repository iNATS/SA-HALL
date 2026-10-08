import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { DemoStore } from '../../../core/demo/demo-store';
import { photoSrc } from '../../../core/domain/photos';
import { bookingQuote, outstanding, paidRatio, paymentState } from '../../../core/domain/pricing';
import { BOOKING_STATUS, PAYMENT_STATE } from '../../../core/domain/status';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { Status } from '../../../shared/status/status';

@Component({
  selector: 'app-client-bookings',
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    RouterLink,
    EmptyState,
    Icon,
    Status,
    ArDatePipe,
    NumberPipe,
    SarPipe,
  ],
  template: `
    <h2 class="sh-visually-hidden">حجوزاتي</h2>
    <ul class="list">
      @for (item of items(); track item.booking.id) {
        <li>
          <a class="booking" [routerLink]="['/client/bookings', item.booking.id]">
            <img
              [src]="item.photo"
              width="480"
              height="320"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div class="main">
              <div class="chips">
                <app-status [value]="item.status" />
                <app-status [value]="item.payment" />
              </div>
              <h3>{{ item.hall }}</h3>
              <p class="meta">
                <app-icon name="event" />{{ item.booking.eventDate | arDate: 'weekday' }} ·
                <span class="sh-num">{{ item.booking.guests | num }}</span> ضيف
              </p>
              @if (item.booking.status !== 'cancelled') {
                <div class="progress">
                  <mat-progress-bar
                    mode="determinate"
                    [value]="item.progress"
                    [attr.aria-label]="'نسبة السداد ' + item.progress + '%'"
                  />
                  <span class="sh-num">
                    @if (item.remaining > 0) {
                      المتبقي {{ item.remaining | sar }}
                    } @else {
                      مسدد بالكامل
                    }
                  </span>
                </div>
              }
            </div>
            <div class="side">
              <strong class="sh-num">{{ item.total | sar }}</strong>
              <app-icon name="chevron_left" />
            </div>
          </a>
        </li>
      } @empty {
        <app-empty-state
          icon="confirmation_number"
          title="لا توجد حجوزات بعد"
          message="ابدأ بتصفح القاعات واختر الموعد المناسب لمناسبتك."
        >
          <a mat-flat-button routerLink="/halls">تصفّح القاعات</a>
        </app-empty-state>
      }
    </ul>
  `,
  styles: `
    .list {
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .booking {
      display: grid;
      align-items: center;
      gap: 16px;
      grid-template-columns: 160px minmax(0, 1fr) auto;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-lowest);
      padding: 12px;
      color: inherit;
      text-decoration: none;
      transition: border-color var(--sh-duration) var(--sh-ease);
    }
    .booking:hover {
      border-color: var(--mat-sys-outline);
    }
    img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: var(--mat-sys-corner-medium);
    }
    .main {
      display: grid;
      gap: 6px;
      min-width: 0;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    h3 {
      font: var(--mat-sys-title-large);
      font-weight: 700;
    }
    .meta {
      --sh-icon-size: 18px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    .progress {
      display: grid;
      gap: 4px;
      max-width: 360px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    .side {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-inline-end: 8px;
    }
    .side strong {
      font: var(--mat-sys-title-medium);
      font-weight: 700;
    }
    .side app-icon {
      color: var(--mat-sys-on-surface-variant);
    }
    @media (max-width: 699.98px) {
      .booking {
        grid-template-columns: 88px minmax(0, 1fr);
        align-items: start;
      }
      img {
        height: 88px;
      }
      .side {
        grid-column: 1 / -1;
        justify-content: space-between;
        border-block-start: 1px solid var(--mat-sys-outline-variant);
        padding: 10px 4px 0;
      }
      h3 {
        font: var(--mat-sys-title-medium);
        font-weight: 700;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientBookings {
  private readonly store = inject(DemoStore);

  protected readonly items = computed(() =>
    [...this.store.clientBookings()]
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
      .map((booking) => {
        const hall = this.store.hall(booking.hallSlug);
        return {
          booking,
          hall: hall?.name ?? 'قاعة غير متاحة',
          photo: hall ? photoSrc(hall.photo, 480) : '',
          status: BOOKING_STATUS[booking.status],
          payment: PAYMENT_STATE[paymentState(booking)],
          total: bookingQuote(booking).total,
          remaining: outstanding(booking),
          progress: Math.round(paidRatio(booking) * 100),
        };
      }),
  );
}
