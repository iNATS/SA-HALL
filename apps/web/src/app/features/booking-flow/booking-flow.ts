import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DEMO_HALLS } from '../../core/demo/demo-data';
import { PublicHeader } from '../../shared/public-header/public-header';

@Component({
  selector: 'app-booking-flow',
  imports: [MatButtonModule, RouterLink, PublicHeader],
  templateUrl: './booking-flow.html',
  styleUrl: './booking-flow.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingFlow {
  private readonly route = inject(ActivatedRoute);
  readonly hall =
    DEMO_HALLS.find((item) => item.slug === this.route.snapshot.paramMap.get('slug')) ??
    DEMO_HALLS[0];
  readonly step = signal(1);
  readonly completed = signal(false);
  readonly selectedPackage = signal<'basic' | 'complete'>('basic');
  readonly extras = signal<string[]>(['تصوير المناسبة']);
  readonly extrasTotal = computed(() =>
    this.extras().reduce(
      (total, item) =>
        total + (item === 'تصوير المناسبة' ? 2800 : item === 'تنسيق الزهور' ? 3500 : 1900),
      0,
    ),
  );
  readonly subtotal = computed(
    () => this.hall.price + this.extrasTotal() + (this.selectedPackage() === 'complete' ? 4200 : 0),
  );
  readonly vat = computed(() => Math.round(this.subtotal() * 0.15));
  readonly total = computed(() => this.subtotal() + this.vat());

  next(): void {
    this.step.update((value) => Math.min(4, value + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  previous(): void {
    this.step.update((value) => Math.max(1, value - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  choosePackage(value: 'basic' | 'complete'): void {
    this.selectedPackage.set(value);
  }
  toggleExtra(name: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.extras.update((items) =>
      checked ? [...items, name] : items.filter((item) => item !== name),
    );
  }
  confirm(): void {
    this.completed.set(true);
  }
}
