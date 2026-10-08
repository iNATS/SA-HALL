import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { CITIES, DEMO_SERVICES } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { Hall } from '../../../core/domain/models';
import { formatDate } from '../../../core/format/format';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { HallCard } from '../../../shared/hall-card/hall-card';
import { Icon } from '../../../shared/icon/icon';
import { NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { GUEST_OPTIONS } from '../home/home';

type SortKey = 'rating' | 'price-asc' | 'price-desc' | 'capacity';

const SORTERS: Record<SortKey, (a: Hall, b: Hall) => number> = {
  rating: (a, b) => b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  capacity: (a, b) => b.capacityMax - a.capacityMax,
};

@Component({
  selector: 'app-catalog',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatInputModule,
    RouterLink,
    EmptyState,
    HallCard,
    Icon,
    NumberPipe,
    SarPipe,
  ],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalog {
  private readonly store = inject(DemoStore);
  private readonly router = inject(Router);

  // Route data and query parameters are bound to inputs (withComponentInputBinding).
  readonly kind = input<'halls' | 'services'>('halls');
  readonly city = input<string>();
  readonly guests = input<string>();
  readonly date = input<string>();
  readonly q = input<string>();
  readonly sort = input<string>();

  protected readonly cities = CITIES;
  protected readonly guestOptions = GUEST_OPTIONS;
  protected readonly sortOptions: readonly { value: SortKey; label: string }[] = [
    { value: 'rating', label: 'الأعلى تقييماً' },
    { value: 'price-asc', label: 'السعر: الأقل أولاً' },
    { value: 'price-desc', label: 'السعر: الأعلى أولاً' },
    { value: 'capacity', label: 'السعة: الأكبر أولاً' },
  ];

  /** Local, instantly-filtering copy of the search text; the URL updates on commit. */
  protected readonly query = linkedSignal(() => this.q() ?? '');
  protected readonly guestLimit = computed(() => {
    const value = Number(this.guests());
    return Number.isFinite(value) && value > 0 ? value : null;
  });
  protected readonly sortKey = computed<SortKey>(() =>
    this.sort() && this.sort()! in SORTERS ? (this.sort() as SortKey) : 'rating',
  );
  protected readonly validDate = computed(() =>
    /^\d{4}-\d{2}-\d{2}$/.test(this.date() ?? '') ? this.date()! : null,
  );
  protected readonly dateLabel = computed(() => {
    const date = this.validDate();
    return date ? formatDate(date) : null;
  });

  protected readonly halls = computed(() => {
    const term = this.query().trim();
    const city = this.city();
    const guests = this.guestLimit();
    const date = this.validDate();
    return this.store
      .publicHalls()
      .filter(
        (hall) =>
          (!city || hall.city === city) &&
          (!guests || (guests > 500 ? hall.capacityMax > 500 : hall.capacityMax >= guests)) &&
          (!term || `${hall.name} ${hall.district} ${hall.city}`.includes(term)) &&
          (!date || !this.store.bookedDates(hall.slug).has(date)),
      )
      .sort(SORTERS[this.sortKey()]);
  });

  protected readonly services = computed(() => {
    const term = this.query().trim();
    const city = this.city();
    return DEMO_SERVICES.filter(
      (service) =>
        (!city || service.city === city || service.city === 'عن بُعد') &&
        (!term || `${service.name} ${service.category} ${service.description}`.includes(term)),
    );
  });

  protected readonly resultCount = computed(() =>
    this.kind() === 'halls' ? this.halls().length : this.services().length,
  );
  protected readonly hasFilters = computed(
    () => !!(this.city() || this.guestLimit() || this.validDate() || this.query().trim()),
  );

  protected setFilter(key: 'city' | 'guests' | 'sort' | 'q', value: unknown): void {
    void this.router.navigate([], {
      queryParams: { [key]: value === '' || value === undefined ? null : value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected chipChange(key: 'city' | 'guests', event: MatChipListboxChange): void {
    this.setFilter(key, event.value ?? null);
  }

  protected clearFilters(): void {
    this.query.set('');
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }
}
