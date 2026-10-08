import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Notifier } from '../../../core/feedback/notifier';
import {
  BOOKING_EXTRAS,
  COMPLETE_PACKAGE_AMOUNT,
  DEMO_SERVICES,
  DEMO_SUBSCRIBERS,
  DEMO_TODAY,
} from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { Hall } from '../../../core/domain/models';
import { photoSrc } from '../../../core/domain/photos';
import { Viewport } from '../../../core/layout/viewport';
import { PortalRole } from '../../../core/navigation/navigation';
import { Icon } from '../../../shared/icon/icon';
import { NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';

interface AddOn {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly amount: number;
}

@Component({
  selector: 'app-assets',
  imports: [
    MatButtonModule,
    MatSlideToggleModule,
    MatTableModule,
    RouterLink,
    Icon,
    NumberPipe,
    SarPipe,
  ],
  templateUrl: './assets.html',
  styleUrl: './assets.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Assets {
  private readonly store = inject(DemoStore);
  private readonly notifier = inject(Notifier);
  protected readonly compact = inject(Viewport).compact;

  readonly role = input<PortalRole>('owner');
  readonly kind = input<'halls' | 'services'>('halls');

  protected readonly halls = computed(() =>
    this.role() === 'admin' ? this.store.halls() : this.store.ownerHalls(),
  );
  protected readonly services = DEMO_SERVICES;
  protected readonly serviceColumns = ['name', 'category', 'city', 'price', 'rating'];

  /** Add-ons a hall owner sells with their halls (they appear in checkout). */
  protected readonly addOns: readonly AddOn[] = [
    {
      id: 'complete',
      label: 'الباقة المتكاملة',
      detail: 'تجهيز المنصة وضيافة الاستقبال',
      amount: COMPLETE_PACKAGE_AMOUNT,
    },
    ...BOOKING_EXTRAS,
  ];
  protected readonly disabledAddOns = signal<ReadonlySet<string>>(new Set());

  protected vendorName(hall: Hall): string {
    return DEMO_SUBSCRIBERS.find((vendor) => vendor.id === hall.vendorId)?.name ?? '';
  }

  protected photo(hall: Hall): string {
    return photoSrc(hall.photo, 480);
  }

  protected upcomingCount(hall: Hall): number {
    return this.store
      .bookings()
      .filter(
        (booking) =>
          booking.hallSlug === hall.slug &&
          booking.status !== 'cancelled' &&
          booking.eventDate >= DEMO_TODAY,
      ).length;
  }

  protected setVisibility(hall: Hall, event: MatSlideToggleChange): void {
    this.store.setHallVisibility(hall.slug, event.checked);
    this.notifier.open(
      event.checked ? `«${hall.name}» ظاهرة الآن للعملاء` : `أُخفيت «${hall.name}» من نتائج البحث`,
    );
  }

  protected setAddOn(addOn: AddOn, event: MatSlideToggleChange): void {
    this.disabledAddOns.update((current) => {
      const next = new Set(current);
      if (event.checked) {
        next.delete(addOn.id);
      } else {
        next.add(addOn.id);
      }
      return next;
    });
    this.notifier.open(event.checked ? `فُعّلت «${addOn.label}»` : `أُوقفت «${addOn.label}»`);
  }
}
