import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CITIES, DEMO_SERVICES, DEMO_TODAY } from '../../../core/demo/demo-data';
import { addDays, formatNumber } from '../../../core/format/format';
import { Icon } from '../../../shared/icon/icon';
import { GUEST_OPTIONS } from '../home/home';

export type CatalogKind = 'halls' | 'services';
export type FilterKey = 'q' | 'city' | 'date' | 'guests' | 'budget' | 'instant' | 'category';
export type FilterPatch = Partial<Record<FilterKey, string | number | null>>;

export interface CatalogFilterState {
  readonly city: string | null;
  readonly date: string | null;
  readonly guests: number | null;
  readonly budget: number | null;
  readonly instant: boolean;
  readonly category: string | null;
}

/** Maximum event-night budgets offered as quick choices (whole SAR, before VAT). */
export const BUDGET_OPTIONS = [12000, 15000, 20000, 25000] as const;
export const SERVICE_CATEGORIES = [...new Set(DEMO_SERVICES.map((service) => service.category))];

/**
 * Filter controls shared by the floating sidebar (wide screens) and the side
 * sheet (phones). Stateless: the catalog owns the state through the URL.
 */
@Component({
  selector: 'app-catalog-filters',
  imports: [MatChipsModule, MatInputModule, MatSlideToggleModule, Icon],
  templateUrl: './catalog-filters.html',
  styleUrl: './catalog-filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogFilters {
  readonly kind = input.required<CatalogKind>();
  readonly state = input.required<CatalogFilterState>();
  readonly query = input('');
  /** Fires on every keystroke so results update instantly. */
  readonly queryInput = output<string>();
  /** Committed filter changes, written to the URL by the catalog. */
  readonly changed = output<FilterPatch>();

  protected readonly cities = CITIES;
  protected readonly guestOptions = GUEST_OPTIONS;
  protected readonly budgets = BUDGET_OPTIONS;
  protected readonly categories = SERVICE_CATEGORIES;
  protected readonly minDate = addDays(DEMO_TODAY, 1);
  protected readonly formatNumber = formatNumber;

  protected chip(key: FilterKey, event: MatChipListboxChange): void {
    this.changed.emit({ [key]: event.value ?? null });
  }

  protected date(value: string): void {
    // Ignore partial or past input; the native picker enforces the minimum.
    this.changed.emit({ date: value && value >= this.minDate ? value : null });
  }
}
