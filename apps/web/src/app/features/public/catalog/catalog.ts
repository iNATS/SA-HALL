import { A11yModule } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { DEMO_SERVICES } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { Hall } from '../../../core/domain/models';
import { formatDate, formatNumber } from '../../../core/format/format';
import { Viewport } from '../../../core/layout/viewport';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { HallCard } from '../../../shared/hall-card/hall-card';
import { Icon } from '../../../shared/icon/icon';
import { NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { GUEST_OPTIONS } from '../home/home';
import {
  CatalogFilterState,
  CatalogFilters,
  CatalogKind,
  FilterKey,
  FilterPatch,
} from './catalog-filters';

type SortKey = 'rating' | 'price-asc' | 'price-desc' | 'capacity';

const SORTERS: Record<SortKey, (a: Hall, b: Hall) => number> = {
  rating: (a, b) => b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  capacity: (a, b) => b.capacityMax - a.capacityMax,
};

function positive(value: string | undefined): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

@Component({
  selector: 'app-catalog',
  imports: [
    A11yModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatInputModule,
    RouterLink,
    CatalogFilters,
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
  protected readonly compact = inject(Viewport).compact;

  // Route data and query parameters are bound to inputs (withComponentInputBinding).
  readonly kind = input<CatalogKind>('halls');
  readonly city = input<string>();
  readonly guests = input<string>();
  readonly date = input<string>();
  readonly q = input<string>();
  readonly sort = input<string>();
  readonly budget = input<string>();
  readonly instant = input<string>();
  readonly category = input<string>();

  protected readonly sortOptions: readonly { value: SortKey; label: string }[] = [
    { value: 'rating', label: 'الأعلى تقييماً' },
    { value: 'price-asc', label: 'السعر: الأقل أولاً' },
    { value: 'price-desc', label: 'السعر: الأعلى أولاً' },
    { value: 'capacity', label: 'السعة: الأكبر أولاً' },
  ];

  /** Phones: the filters live in a modal side sheet opened from the results bar. */
  protected readonly sheetOpen = signal(false);

  /** Local, instantly-filtering copy of the search text; the URL updates on commit. */
  protected readonly query = linkedSignal(() => this.q() ?? '');
  protected readonly sortKey = computed<SortKey>(() => {
    const sort = this.sort();
    return sort && sort in SORTERS ? (sort as SortKey) : 'rating';
  });

  protected readonly filters = computed<CatalogFilterState>(() => {
    const date = this.date();
    return {
      city: this.city() || null,
      date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
      guests: positive(this.guests()),
      budget: positive(this.budget()),
      instant: this.instant() === '1',
      category: this.category() || null,
    };
  });

  /** Applied filters as removable chips, so phone users always see what is active. */
  protected readonly activeFilters = computed(() => {
    const f = this.filters();
    const halls = this.kind() === 'halls';
    const chips: { key: FilterKey; label: string }[] = [];
    const term = this.query().trim();
    if (term) chips.push({ key: 'q', label: `«${term}»` });
    if (!halls && f.category) chips.push({ key: 'category', label: f.category });
    if (f.city) chips.push({ key: 'city', label: f.city });
    if (halls && f.date) chips.push({ key: 'date', label: `متاحة ${formatDate(f.date, 'short')}` });
    if (halls && f.guests) {
      const label = GUEST_OPTIONS.find((option) => option.value === f.guests)?.label;
      chips.push({ key: 'guests', label: label ?? `${formatNumber(f.guests)} ضيف` });
    }
    if (halls && f.budget)
      chips.push({ key: 'budget', label: `حتى ${formatNumber(f.budget)} ر.س` });
    if (halls && f.instant) chips.push({ key: 'instant', label: 'حجز فوري' });
    return chips;
  });

  protected readonly halls = computed(() => {
    const f = this.filters();
    const term = this.query().trim();
    return this.store
      .publicHalls()
      .filter(
        (hall) =>
          (!f.city || hall.city === f.city) &&
          (!f.guests || (f.guests > 500 ? hall.capacityMax > 500 : hall.capacityMax >= f.guests)) &&
          (!f.budget || hall.price <= f.budget) &&
          (!f.instant || hall.instantBooking) &&
          (!term || `${hall.name} ${hall.district} ${hall.city}`.includes(term)) &&
          (!f.date || !this.store.bookedDates(hall.slug).has(f.date)),
      )
      .sort(SORTERS[this.sortKey()]);
  });

  protected readonly services = computed(() => {
    const f = this.filters();
    const term = this.query().trim();
    return DEMO_SERVICES.filter(
      (service) =>
        (!f.city || service.city === f.city || service.city === 'عن بُعد') &&
        (!f.category || service.category === f.category) &&
        (!term || `${service.name} ${service.category} ${service.description}`.includes(term)),
    );
  });

  protected readonly resultCount = computed(() =>
    this.kind() === 'halls' ? this.halls().length : this.services().length,
  );

  constructor() {
    // Lock page scrolling behind the open sheet, and always release it on exit.
    const root = inject(DOCUMENT).documentElement;
    effect(() => root.classList.toggle('sh-scroll-locked', this.sheetOpen()));
    inject(DestroyRef).onDestroy(() => root.classList.remove('sh-scroll-locked'));
    // The sheet closes itself when the window grows into the sidebar layout.
    effect(() => {
      if (!this.compact()) {
        this.sheetOpen.set(false);
      }
    });
  }

  protected apply(patch: FilterPatch): void {
    if ('q' in patch) {
      this.query.set(String(patch.q ?? ''));
    }
    void this.router.navigate([], {
      queryParams: patch,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected remove(key: FilterKey): void {
    this.apply({ [key]: null });
  }

  protected clearFilters(): void {
    this.query.set('');
    const sort = this.sort();
    void this.router.navigate([], { queryParams: sort ? { sort } : {}, replaceUrl: true });
  }

  protected setSort(value: string): void {
    void this.router.navigate([], {
      queryParams: { sort: value === 'rating' ? null : value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
