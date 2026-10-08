import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DEMO_CLIENT, DEMO_ORDERS, DEMO_TODAY } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { Favorites } from '../../../core/demo/favorites';
import { daysBetween } from '../../../core/format/format';
import { Viewport } from '../../../core/layout/viewport';
import { NumberPipe } from '../../../shared/pipes/format.pipes';

@Component({
  selector: 'app-client-area',
  imports: [MatTabsModule, RouterLink, RouterLinkActive, RouterOutlet, NumberPipe],
  template: `
    <div class="sh-container page">
      <header class="welcome">
        <span class="avatar" aria-hidden="true">{{ client.name.charAt(0) }}</span>
        <div>
          <p class="sh-muted">مرحباً بعودتك</p>
          <h1>{{ client.name }}</h1>
        </div>
        @if (nextEventDays() !== null) {
          <p class="countdown">
            <strong class="sh-num">{{ nextEventDays()! | num }}</strong>
            <span>يوماً على مناسبتك القادمة</span>
          </p>
        }
      </header>

      <nav
        mat-tab-nav-bar
        [tabPanel]="panel"
        [mat-stretch-tabs]="compact()"
        mat-align-tabs="start"
        aria-label="أقسام حسابي"
      >
        @for (tab of tabs(); track tab.path) {
          <a
            mat-tab-link
            [routerLink]="tab.path"
            routerLinkActive
            #active="routerLinkActive"
            [active]="active.isActive"
          >
            {{ tab.label }}
            @if (tab.count) {
              <span class="count sh-num">{{ tab.count | num }}</span>
            }
          </a>
        }
      </nav>
      <mat-tab-nav-panel #panel>
        <router-outlet />
      </mat-tab-nav-panel>
    </div>
  `,
  styles: `
    .page {
      padding-block: 28px 16px;
    }
    .welcome {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      margin-block-end: 20px;
    }
    .avatar {
      display: grid;
      width: 56px;
      height: 56px;
      place-items: center;
      border-radius: 50%;
      background: var(--sh-hero-ink);
      color: var(--sh-hero-accent);
      font: var(--mat-sys-headline-small);
      font-weight: 700;
    }
    h1 {
      font: var(--mat-sys-headline-medium);
      font-weight: 700;
    }
    .countdown {
      display: grid;
      margin-inline-start: auto;
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-tertiary-container);
      padding: 10px 18px;
      color: var(--mat-sys-on-tertiary-container);
      text-align: center;
    }
    .countdown strong {
      font: var(--mat-sys-headline-small);
      font-weight: 700;
    }
    .countdown span {
      font: var(--mat-sys-label-medium);
    }
    nav {
      margin-block-end: 24px;
      --mat-tab-divider-height: 0;
    }
    .count {
      display: inline-grid;
      min-width: 22px;
      height: 22px;
      place-items: center;
      margin-inline-start: 6px;
      border-radius: 11px;
      background: var(--mat-sys-primary-container);
      padding-inline: 6px;
      color: var(--mat-sys-on-primary-container);
      font: var(--mat-sys-label-small);
      font-weight: 700;
    }
    @media (max-width: 839.98px) {
      .page {
        padding-block-start: 16px;
      }
      .avatar {
        width: 48px;
        height: 48px;
      }
      h1 {
        font: var(--mat-sys-title-large);
        font-weight: 700;
      }
      nav {
        margin-inline: -16px;
      }
      nav a {
        min-width: 0;
        padding-inline: 8px;
      }
      .count {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientArea {
  private readonly store = inject(DemoStore);
  private readonly favorites = inject(Favorites);
  protected readonly compact = inject(Viewport).compact;
  protected readonly client = DEMO_CLIENT;

  protected readonly tabs = computed(() => [
    {
      path: 'bookings',
      label: 'الحجوزات',
      count: this.store.clientBookings().filter((b) => b.status !== 'cancelled').length,
    },
    {
      path: 'orders',
      label: 'الطلبات',
      count: DEMO_ORDERS.filter((order) => order.state !== 'delivered').length,
    },
    { path: 'favorites', label: 'المفضلة', count: this.favorites.count() },
    { path: 'profile', label: 'الملف', count: 0 },
  ]);

  protected readonly nextEventDays = computed(() => {
    const upcoming = this.store
      .clientBookings()
      .filter((b) => b.status === 'confirmed' && b.eventDate >= DEMO_TODAY)
      .map((b) => b.eventDate)
      .sort()[0];
    return upcoming ? daysBetween(DEMO_TODAY, upcoming) : null;
  });
}
