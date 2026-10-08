import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DEMO_HALLS, DEMO_SERVICES } from '../../core/demo/demo-data';
import { PublicHeader } from '../../shared/public-header/public-header';

@Component({
  selector: 'app-catalog',
  imports: [MatButtonModule, RouterLink, PublicHeader],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Catalog {
  private readonly route = inject(ActivatedRoute);
  readonly kind = this.route.snapshot.data['kind'] as 'halls' | 'services';
  readonly query = signal('');
  readonly city = signal('all');
  readonly title = this.kind === 'halls' ? 'قاعات تناسب كل لحظة' : 'خدمات تكمل تفاصيل مناسبتك';
  readonly subtitle =
    this.kind === 'halls'
      ? 'قارن القاعات حسب المدينة والسعة والميزانية.'
      : 'اختر مقدمي الخدمات الموثوقين وأضفهم إلى حجزك.';
  readonly halls = computed(() => DEMO_HALLS.filter((item) => this.matches(item.name, item.city)));
  readonly services = computed(() =>
    DEMO_SERVICES.filter((item) => this.matches(`${item.name} ${item.category}`, item.city)),
  );

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
  updateCity(event: Event): void {
    this.city.set((event.target as HTMLSelectElement).value);
  }
  clearFilters(): void {
    this.query.set('');
    this.city.set('all');
  }
  private matches(text: string, city: string): boolean {
    return text.includes(this.query().trim()) && (this.city() === 'all' || city === this.city());
  }
}
