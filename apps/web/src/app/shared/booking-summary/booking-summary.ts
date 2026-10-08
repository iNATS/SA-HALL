import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Booking } from '../../core/domain/models';
import { VAT_RATE, bookingQuote, outstanding, paidRatio } from '../../core/domain/pricing';
import { SarPipe } from '../pipes/format.pipes';

/** Line items, VAT, total and payment progress for one booking. */
@Component({
  selector: 'app-booking-summary',
  imports: [MatProgressBarModule, SarPipe],
  template: `
    <dl class="sh-facts">
      @for (line of booking().lines; track line.label) {
        <div>
          <dt>{{ line.label }}</dt>
          <dd>{{ line.amount | sar }}</dd>
        </div>
      }
      <div>
        <dt>ضريبة القيمة المضافة {{ vatPercent }}%</dt>
        <dd>{{ quote().vat | sar }}</dd>
      </div>
      <div class="total">
        <dt>الإجمالي</dt>
        <dd>{{ quote().total | sar }}</dd>
      </div>
    </dl>
    @if (booking().status !== 'cancelled') {
      <div class="payment">
        <div class="payment-row">
          <span
            >المدفوع <strong class="sh-num">{{ booking().paid | sar }}</strong></span
          >
          <span
            >المتبقي <strong class="sh-num">{{ remaining() | sar }}</strong></span
          >
        </div>
        <mat-progress-bar
          mode="determinate"
          [value]="progress()"
          [attr.aria-label]="'نسبة السداد ' + progress() + '%'"
        />
      </div>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 20px;
    }
    .total {
      padding-block-start: 12px;
    }
    .total dt,
    .total dd {
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-title-medium);
      font-weight: 700;
    }
    .payment {
      display: grid;
      gap: 10px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container);
      padding: 14px 16px;
    }
    .payment-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    .payment-row strong {
      color: var(--mat-sys-on-surface);
    }
    mat-progress-bar {
      --mat-progress-bar-track-height: 8px;
      --mat-progress-bar-active-indicator-height: 8px;
      --mat-progress-bar-track-shape: 999px;
      border-radius: 999px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSummary {
  readonly booking = input.required<Booking>();

  protected readonly vatPercent = VAT_RATE * 100;
  protected readonly quote = computed(() => bookingQuote(this.booking()));
  protected readonly remaining = computed(() => outstanding(this.booking()));
  protected readonly progress = computed(() => Math.round(paidRatio(this.booking()) * 100));
}
