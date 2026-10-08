import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { provideArabicDates } from '../../../core/material/dates';
import {
  BOOKING_EXTRAS,
  COMPLETE_PACKAGE_AMOUNT,
  DEMO_CLIENT,
  DEMO_TODAY,
} from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { Booking, BookingLine } from '../../../core/domain/models';
import { photoSrc } from '../../../core/domain/photos';
import { DEPOSIT_RATE, quote } from '../../../core/domain/pricing';
import { addDays, formatDate, localDate, toIsoDate } from '../../../core/format/format';
import { Viewport } from '../../../core/layout/viewport';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';

type ExtraId = (typeof BOOKING_EXTRAS)[number]['id'];

const STEPS = ['الموعد والباقة', 'الخدمات', 'بيانات التواصل', 'المراجعة والدفع'] as const;

/** Saudi mobile numbers: 05 followed by eight digits. */
const SAUDI_MOBILE = /^05\d{8}$/;

@Component({
  providers: [provideArabicDates()],
  selector: 'app-booking-flow',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    MatToolbarModule,
    RouterLink,
    EmptyState,
    Icon,
    ArDatePipe,
    NumberPipe,
    SarPipe,
  ],
  templateUrl: './booking-flow.html',
  styleUrl: './booking-flow.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingFlow implements OnInit {
  private readonly store = inject(DemoStore);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly compact = inject(Viewport).compact;

  readonly slug = input.required<string>();
  /** Optional prefill from the hall page (query parameters). */
  readonly date = input<string>();
  readonly guests = input<string>();

  protected readonly steps = STEPS;
  protected readonly extras = BOOKING_EXTRAS;
  protected readonly completeAmount = COMPLETE_PACKAGE_AMOUNT;
  protected readonly depositPercent = DEPOSIT_RATE * 100;
  protected readonly step = signal(0);
  protected readonly created = signal<Booking | null>(null);
  protected readonly hall = computed(() => this.store.hall(this.slug()));
  protected readonly photo = computed(() => {
    const hall = this.hall();
    return hall ? photoSrc(hall.photo, 480) : '';
  });

  protected readonly minDate = localDate(addDays(DEMO_TODAY, 1));
  protected readonly dateFilter = (date: Date | null): boolean =>
    !!date && !this.store.bookedDates(this.slug()).has(toIsoDate(date));

  protected readonly form = new FormGroup({
    schedule: new FormGroup({
      date: new FormControl<Date | null>(null, Validators.required),
      guests: new FormControl<number | null>(null, [Validators.required, Validators.min(20)]),
      pkg: new FormControl<'hall' | 'complete'>('hall', { nonNullable: true }),
    }),
    extras: new FormGroup({
      photo: new FormControl(false, { nonNullable: true }),
      flowers: new FormControl(false, { nonNullable: true }),
      sound: new FormControl(false, { nonNullable: true }),
    }),
    contact: new FormGroup({
      name: new FormControl(DEMO_CLIENT.name, {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(80)],
      }),
      phone: new FormControl(DEMO_CLIENT.phone, {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(SAUDI_MOBILE)],
      }),
      email: new FormControl(DEMO_CLIENT.email, {
        nonNullable: true,
        validators: [Validators.email, Validators.maxLength(120)],
      }),
      channel: new FormControl<'sms' | 'email' | 'call'>('sms', { nonNullable: true }),
      notes: new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) }),
    }),
    review: new FormGroup({
      payment: new FormControl<'deposit' | 'full'>('deposit', { nonNullable: true }),
      terms: new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }),
    }),
  });

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly lines = computed<readonly BookingLine[]>(() => {
    const hall = this.hall();
    const value = this.value();
    if (!hall) {
      return [];
    }
    const complete = value.schedule?.pkg === 'complete';
    const lines: BookingLine[] = [
      complete
        ? { label: 'الباقة المتكاملة', amount: hall.price + COMPLETE_PACKAGE_AMOUNT }
        : { label: 'حجز القاعة', amount: hall.price },
    ];
    for (const extra of BOOKING_EXTRAS) {
      if (value.extras?.[extra.id as ExtraId]) {
        lines.push({ label: extra.label, amount: extra.amount });
      }
    }
    return lines;
  });
  protected readonly quote = computed(() => quote(this.lines()));
  protected readonly dueNow = computed(() =>
    this.value().review?.payment === 'full' ? this.quote().total : this.quote().deposit,
  );
  protected readonly dateLabel = computed(() => {
    const date = this.value().schedule?.date;
    return date ? formatDate(toIsoDate(date)) : 'لم يُحدد بعد';
  });
  protected readonly progress = computed(() => ((this.step() + 1) / STEPS.length) * 100);

  ngOnInit(): void {
    const hall = this.hall();
    if (!hall) {
      return;
    }
    const schedule = this.form.controls.schedule.controls;
    schedule.guests.addValidators(Validators.max(hall.capacityMax));
    const date = this.date();
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !this.store.bookedDates(hall.slug).has(date)) {
      const candidate = localDate(date);
      if (candidate >= this.minDate) {
        schedule.date.setValue(candidate);
      }
    }
    const guests = Number(this.guests());
    if (Number.isInteger(guests) && guests > 0) {
      schedule.guests.setValue(guests);
    }
  }

  protected next(): void {
    const group = this.currentGroup();
    if (group.invalid) {
      group.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    if (this.step() === STEPS.length - 1) {
      this.confirm();
      return;
    }
    this.step.update((value) => value + 1);
    this.scrollTop();
  }

  protected previous(): void {
    if (this.step() === 0) {
      void this.router.navigate(['/halls', this.slug()]);
      return;
    }
    this.step.update((value) => value - 1);
    this.scrollTop();
  }

  private confirm(): void {
    const hall = this.hall();
    const { schedule, contact } = this.form.getRawValue();
    if (!hall || !schedule.date || !schedule.guests) {
      return;
    }
    const booking = this.store.createBooking({
      hallSlug: hall.slug,
      customer: contact.name.trim(),
      phone: contact.phone,
      eventDate: toIsoDate(schedule.date),
      guests: schedule.guests,
      lines: this.lines(),
    });
    this.created.set(booking);
    this.scrollTop();
  }

  private currentGroup() {
    const groups = this.form.controls;
    return [groups.schedule, groups.extras, groups.contact, groups.review][this.step()];
  }

  /** Moves focus to the first invalid control so keyboard and screen-reader users land on it. */
  private focusFirstInvalid(): void {
    queueMicrotask(() => {
      const invalid = this.host.nativeElement.querySelector<HTMLElement>(
        '.step-panel [formcontrolname].ng-invalid',
      );
      const target = invalid?.matches('input, textarea, select, [tabindex]')
        ? invalid
        : invalid?.querySelector<HTMLElement>('input, textarea, [tabindex]');
      target?.focus();
    });
  }

  private scrollTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
