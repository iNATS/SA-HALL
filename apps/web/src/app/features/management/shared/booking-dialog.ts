import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Notifier } from '../../../core/feedback/notifier';
import { DEMO_TODAY } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { BookingStatus } from '../../../core/domain/models';
import { outstanding, paymentState } from '../../../core/domain/pricing';
import { BOOKING_STATUS, PAYMENT_STATE } from '../../../core/domain/status';
import { formatSar } from '../../../core/format/format';
import { PortalRole } from '../../../core/navigation/navigation';
import { BookingSummary } from '../../../shared/booking-summary/booking-summary';
import { confirmAction } from '../../../shared/confirm-dialog/confirm-dialog';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, ArDateTimePipe, NumberPipe } from '../../../shared/pipes/format.pipes';
import { Status } from '../../../shared/status/status';

export interface BookingDialogData {
  readonly id: string;
  readonly role: PortalRole;
}

@Component({
  selector: 'app-booking-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    BookingSummary,
    Icon,
    Status,
    ArDatePipe,
    ArDateTimePipe,
    NumberPipe,
  ],
  template: `
    @if (booking(); as booking) {
      <div class="head">
        <button mat-icon-button type="button" mat-dialog-close aria-label="إغلاق">
          <app-icon name="close" />
        </button>
        <h2 mat-dialog-title>
          الحجز <bdi class="sh-num">{{ booking.id }}</bdi>
        </h2>
      </div>
      <mat-dialog-content>
        <div class="chips">
          <app-status [value]="statuses[booking.status]" />
          <app-status [value]="payment()!" />
        </div>
        <dl class="sh-facts details">
          <div>
            <dt>القاعة</dt>
            <dd>{{ hall()?.name }}</dd>
          </div>
          <div>
            <dt>العميل</dt>
            <dd>{{ booking.customer }}</dd>
          </div>
          <div>
            <dt>الجوال</dt>
            <dd>
              <a [href]="'tel:' + booking.phone"
                ><bdi dir="ltr">{{ booking.phone }}</bdi></a
              >
            </dd>
          </div>
          <div>
            <dt>تاريخ المناسبة</dt>
            <dd>{{ booking.eventDate | arDate: 'weekday' }}</dd>
          </div>
          <div>
            <dt>الضيوف</dt>
            <dd>{{ booking.guests | num }}</dd>
          </div>
          <div>
            <dt>تاريخ الطلب</dt>
            <dd>{{ booking.createdAt | arDateTime }}</dd>
          </div>
        </dl>
        <app-booking-summary [booking]="booking" />
        @if (data.role === 'admin') {
          <p class="note">
            <app-icon name="info" />تعديل الحجز من صلاحيات القاعة؛ تُسجَّل التدخلات الإدارية في سجل
            التدقيق عبر الخادم.
          </p>
        }
      </mat-dialog-content>
      @if (data.role === 'owner') {
        <mat-dialog-actions>
          @if (booking.status === 'pending') {
            <button mat-button type="button" class="danger" (click)="decline()">رفض الطلب</button>
            <button mat-flat-button type="button" (click)="setStatus('confirmed')">
              <app-icon name="check" />تأكيد الحجز
            </button>
          } @else if (booking.status === 'confirmed') {
            <button mat-button type="button" class="danger" (click)="decline()">إلغاء الحجز</button>
            @if (remaining() > 0) {
              <button mat-flat-button type="button" (click)="settle()">تسجيل سداد المتبقي</button>
            } @else if (booking.eventDate < today) {
              <button mat-flat-button type="button" (click)="setStatus('completed')">
                تعليم كمكتمل
              </button>
            }
          }
        </mat-dialog-actions>
      }
    }
  `,
  styles: `
    .head {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 12px 0;
    }
    .head h2 {
      padding: 0;
    }
    .head h2::before {
      display: none;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-block-end: 20px;
    }
    .details {
      margin-block-end: 24px;
    }
    .details a {
      color: var(--mat-sys-primary);
    }
    .note {
      --sh-icon-size: 18px;
      display: flex;
      align-items: start;
      gap: 8px;
      margin-block-start: 20px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    mat-dialog-actions {
      gap: 8px;
      padding: 12px 24px 20px;
    }
    .danger {
      --mat-button-text-label-text-color: var(--mat-sys-error);
      margin-inline-end: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDialog {
  protected readonly data = inject<BookingDialogData>(MAT_DIALOG_DATA);
  private readonly store = inject(DemoStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);
  private readonly ref = inject(MatDialogRef<BookingDialog>);

  protected readonly statuses = BOOKING_STATUS;
  protected readonly today = DEMO_TODAY;
  protected readonly booking = computed(() => this.store.booking(this.data.id));
  protected readonly hall = computed(() => this.store.hall(this.booking()?.hallSlug));
  protected readonly payment = computed(() => {
    const booking = this.booking();
    return booking ? PAYMENT_STATE[paymentState(booking)] : null;
  });
  protected readonly remaining = computed(() => {
    const booking = this.booking();
    return booking ? outstanding(booking) : 0;
  });

  protected setStatus(status: BookingStatus): void {
    this.store.setBookingStatus(this.data.id, status);
    this.notifier.open(
      status === 'confirmed'
        ? `تم تأكيد الحجز ${this.data.id} وإشعار العميل`
        : `تم تحديث الحجز ${this.data.id}`,
    );
  }

  protected settle(): void {
    confirmAction(this.dialog, {
      title: 'تسجيل سداد المتبقي',
      message: `تأكيد استلام ${formatSar(this.remaining())} من العميل خارج المنصة.`,
      confirmLabel: 'تسجيل السداد',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.store.settleBalance(this.data.id);
        this.notifier.open('تم تسجيل السداد الكامل');
      }
    });
  }

  protected decline(): void {
    const pending = this.booking()?.status === 'pending';
    confirmAction(this.dialog, {
      title: pending ? 'رفض طلب الحجز؟' : 'إلغاء الحجز؟',
      message: pending
        ? 'سيُبلَّغ العميل بالرفض ويُتاح التاريخ لطلبات أخرى.'
        : 'سيُلغى الحجز ويُعالج أي استرداد وفق سياسة الإلغاء. لا يمكن التراجع.',
      confirmLabel: pending ? 'رفض الطلب' : 'إلغاء الحجز',
      destructive: true,
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.store.setBookingStatus(this.data.id, 'cancelled');
        this.notifier.open(`تم إلغاء الحجز ${this.data.id}`);
        this.ref.close();
      }
    });
  }
}

/** Opens the booking details full-screen on compact windows and as a dialog otherwise. */
export function openBookingDialog(
  dialog: MatDialog,
  data: BookingDialogData,
  compact: boolean,
): void {
  dialog.open(BookingDialog, {
    data,
    autoFocus: 'dialog',
    ...(compact
      ? {
          width: '100vw',
          maxWidth: '100vw',
          height: '100dvh',
          panelClass: 'sh-fullscreen-dialog',
        }
      : { width: '560px', maxWidth: 'calc(100vw - 48px)' }),
  });
}
