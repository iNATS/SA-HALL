import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Notifier } from '../../../core/feedback/notifier';
import { provideArabicDates } from '../../../core/material/dates';
import { DEMO_COUPONS, DEMO_TODAY } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { Coupon } from '../../../core/domain/models';
import { couponState } from '../../../core/domain/status';
import {
  addDays,
  formatNumber,
  formatSar,
  localDate,
  toIsoDate,
} from '../../../core/format/format';
import { Viewport } from '../../../core/layout/viewport';
import { PortalRole } from '../../../core/navigation/navigation';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, NumberPipe } from '../../../shared/pipes/format.pipes';
import { StatCard } from '../../../shared/stat-card/stat-card';
import { Status } from '../../../shared/status/status';

/** Percentage discounts are capped at 90%; fixed discounts at 5,000 SAR. */
function valueRange(group: AbstractControl): ValidationErrors | null {
  const kind = group.get('kind')?.value as Coupon['kind'];
  const value = Number(group.get('value')?.value);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  const valid = kind === 'percent' ? value >= 1 && value <= 90 : value >= 50 && value <= 5000;
  return valid ? null : { valueRange: true };
}

@Component({
  providers: [provideArabicDates()],
  selector: 'app-coupons',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    Icon,
    StatCard,
    Status,
    ArDatePipe,
    NumberPipe,
  ],
  templateUrl: './coupons.html',
  styleUrl: './coupons.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Coupons {
  private readonly store = inject(DemoStore);
  private readonly notifier = inject(Notifier);
  protected readonly compact = inject(Viewport).compact;

  readonly role = input<PortalRole>('owner');

  protected readonly coupons = signal<readonly Coupon[]>(DEMO_COUPONS);
  protected readonly creating = signal(false);
  protected readonly minDate = localDate(addDays(DEMO_TODAY, 1));
  protected readonly scopes = computed(() => [
    'كل القاعات',
    'الحجز الأول',
    ...(this.role() === 'admin' ? this.store.halls() : this.store.ownerHalls()).map((h) => h.name),
  ]);

  protected readonly rows = computed(() =>
    this.coupons().map((coupon) => ({
      coupon,
      state: couponState(coupon, DEMO_TODAY),
      discount: coupon.kind === 'percent' ? `${coupon.value}%` : formatSar(coupon.value),
      usage: Math.round((coupon.used / coupon.limit) * 100),
      live: coupon.expiresOn >= DEMO_TODAY && coupon.used < coupon.limit,
    })),
  );

  protected readonly stats = computed(() => {
    const rows = this.rows();
    const active = rows.filter((row) => row.state.tone === 'success').length;
    const uses = this.coupons().reduce((sum, coupon) => sum + coupon.used, 0);
    return [
      {
        label: 'كوبونات نشطة',
        value: formatNumber(active),
        hint: `من ${formatNumber(rows.length)}`,
        icon: 'sell',
      },
      {
        label: 'مرات الاستخدام',
        value: formatNumber(uses),
        hint: 'منذ الإطلاق',
        icon: 'trending_up',
      },
    ] as const;
  });

  protected readonly form = new FormGroup(
    {
      code: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^[A-Z0-9]{4,16}$/)],
      }),
      kind: new FormControl<Coupon['kind']>('percent', { nonNullable: true }),
      value: new FormControl<number | null>(null, Validators.required),
      scope: new FormControl('كل القاعات', { nonNullable: true }),
      limit: new FormControl<number | null>(100, [
        Validators.required,
        Validators.min(1),
        Validators.max(10000),
      ]),
      expiresOn: new FormControl<Date | null>(null, Validators.required),
    },
    { validators: valueRange },
  );

  protected normalizeCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.form.controls.code.setValue(value);
  }

  protected toggle(code: string): void {
    this.coupons.update((list) =>
      list.map((coupon) => (coupon.code === code ? { ...coupon, paused: !coupon.paused } : coupon)),
    );
    const paused = this.coupons().find((coupon) => coupon.code === code)?.paused;
    this.notifier.open(paused ? `أُوقف الكوبون ${code} مؤقتاً` : `أُعيد تفعيل الكوبون ${code}`);
  }

  protected create(): void {
    const code = this.form.controls.code.value;
    if (this.coupons().some((coupon) => coupon.code === code)) {
      this.form.controls.code.setErrors({ duplicate: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.coupons.update((list) => [
      {
        code,
        kind: value.kind,
        value: Number(value.value),
        scope: value.scope,
        used: 0,
        limit: Number(value.limit),
        expiresOn: toIsoDate(value.expiresOn!),
        paused: false,
      },
      ...list,
    ]);
    this.notifier.open(`أُنشئ الكوبون ${code}`);
    this.form.reset();
    this.creating.set(false);
  }
}
