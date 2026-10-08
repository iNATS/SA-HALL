import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { BOOKING_EXTRAS, DEMO_TODAY } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { Favorites } from '../../../core/demo/favorites';
import { galleryFor, photoSrc, photoSrcset } from '../../../core/domain/photos';
import { DEPOSIT_RATE, quote } from '../../../core/domain/pricing';
import { addDays, localDate, toIsoDate } from '../../../core/format/format';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import type { IconName } from '../../../shared/icon/icons';
import { ArDatePipe, NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';

const AMENITIES: readonly { icon: IconName; label: string }[] = [
  { icon: 'door_front', label: 'مدخلان مستقلان للرجال والنساء' },
  { icon: 'local_parking', label: 'مواقف تتسع لـ 180 سيارة' },
  { icon: 'checkroom', label: 'جناح عروس مجهز بالكامل' },
  { icon: 'speaker', label: 'نظام صوت وإضاءة مدمج' },
  { icon: 'local_cafe', label: 'ركن ضيافة وقهوة' },
  { icon: 'restaurant', label: 'مطبخ تجهيز معتمد' },
  { icon: 'accessible', label: 'دخول مهيأ للكراسي المتحركة' },
  { icon: 'verified_user', label: 'فريق أمن وتنظيم' },
];

@Component({
  selector: 'app-venue-detail',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatInputModule,
    RouterLink,
    EmptyState,
    Icon,
    ArDatePipe,
    NumberPipe,
    SarPipe,
  ],
  templateUrl: './venue-detail.html',
  styleUrl: './venue-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueDetail {
  private readonly store = inject(DemoStore);
  private readonly favorites = inject(Favorites);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  readonly slug = input.required<string>();

  protected readonly hall = computed(() => this.store.hall(this.slug()));
  protected readonly gallery = computed(() => {
    const hall = this.hall();
    return hall
      ? galleryFor(hall.photo).map((photo) => ({
          src: photoSrc(photo),
          srcset: photoSrcset(photo),
        }))
      : [];
  });
  protected readonly saved = computed(() => this.favorites.all().has(this.slug()));
  protected readonly amenities = AMENITIES;
  protected readonly extras = BOOKING_EXTRAS;
  protected readonly depositPercent = DEPOSIT_RATE * 100;
  protected readonly estimate = computed(() =>
    quote([{ label: 'حجز القاعة', amount: this.hall()?.price ?? 0 }]),
  );

  private readonly booked = computed(() => this.store.bookedDates(this.slug()));
  protected readonly minDate = addDays(DEMO_TODAY, 1);
  /** Availability errors appear as soon as a date is picked, not only after blur. */
  protected readonly showOnDirty = {
    isErrorState: (control: AbstractControl | null) =>
      !!control?.invalid && (control.dirty || control.touched),
  };

  /** The next open event nights (Wednesday–Saturday), from real availability. */
  protected readonly nextOpenDates = computed(() => {
    const open: string[] = [];
    const cursor = localDate(this.minDate);
    while (open.length < 4) {
      const iso = toIsoDate(cursor);
      if (!this.booked().has(iso) && cursor.getDay() >= 3) {
        open.push(iso);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return open;
  });

  protected readonly form = new FormGroup({
    date: new FormControl('', {
      nonNullable: true,
      validators: (control: AbstractControl<string>): ValidationErrors | null => {
        const value = control.value;
        if (!value) {
          return null;
        }
        if (value < this.minDate) {
          return { past: true };
        }
        return this.booked().has(value) ? { booked: true } : null;
      },
    }),
    guests: new FormControl<number | null>(null, [Validators.min(20)]),
  });

  protected pickDate(iso: string): void {
    this.form.controls.date.setValue(iso);
    this.form.controls.date.markAsTouched();
  }

  protected async toggleFavorite(): Promise<void> {
    const added = this.favorites.toggle(this.slug());
    (await this.notifier()).open(added ? 'أُضيفت القاعة إلى المفضلة' : 'أُزيلت القاعة من المفضلة');
  }

  protected async share(): Promise<void> {
    const hall = this.hall();
    if (!hall) {
      return;
    }
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: hall.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      (await this.notifier()).open('تم نسخ رابط القاعة');
    } catch {
      // The person dismissed the share sheet; nothing to report.
    }
  }

  /** Feedback code loads on first use so the hall page stays light. */
  private async notifier() {
    const { Notifier } = await import('../../../core/feedback/notifier');
    return this.injector.get(Notifier);
  }

  protected startBooking(): void {
    const hall = this.hall();
    if (!hall || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { date, guests } = this.form.getRawValue();
    void this.router.navigate(['/booking', hall.slug], {
      queryParams: {
        date: date || null,
        guests: guests ? Math.min(guests, hall.capacityMax) : null,
      },
    });
  }
}
