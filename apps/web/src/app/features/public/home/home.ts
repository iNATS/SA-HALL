import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { CITIES, DEMO_SERVICES, DEMO_TODAY } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { addDays } from '../../../core/format/format';
import { HallCard } from '../../../shared/hall-card/hall-card';
import { Icon } from '../../../shared/icon/icon';
import { SarPipe } from '../../../shared/pipes/format.pipes';

export const GUEST_OPTIONS = [
  { value: 150, label: 'حتى 150 ضيفاً' },
  { value: 300, label: 'حتى 300 ضيف' },
  { value: 500, label: 'حتى 500 ضيف' },
  { value: 700, label: 'أكثر من 500 ضيف' },
] as const;

@Component({
  selector: 'app-home',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatInputModule,
    RouterLink,
    HallCard,
    Icon,
    SarPipe,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly store = inject(DemoStore);
  private readonly router = inject(Router);

  protected readonly cities = CITIES;
  protected readonly guestOptions = GUEST_OPTIONS;
  protected readonly services = DEMO_SERVICES;
  protected readonly featured = computed(() =>
    [...this.store.publicHalls()].sort((a, b) => b.rating - a.rating).slice(0, 4),
  );
  /** Bookings open from tomorrow; same-day events cannot be prepared. */
  protected readonly minDate = addDays(DEMO_TODAY, 1);

  protected readonly search = new FormGroup({
    mode: new FormControl<'halls' | 'services'>('halls', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    date: new FormControl('', { nonNullable: true }),
    guests: new FormControl<number | null>(null),
  });

  protected submit(): void {
    const { mode, city, date, guests } = this.search.getRawValue();
    void this.router.navigate([mode === 'halls' ? '/halls' : '/services'], {
      queryParams: {
        city: city || null,
        date: date || null,
        guests: mode === 'halls' ? guests : null,
      },
    });
  }
}
