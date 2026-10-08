import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { DEMO_ADMIN, DEMO_OWNER } from '../../core/demo/demo-data';
import { DemoStore } from '../../core/demo/demo-store';
import { injectScrolled } from '../../core/layout/scrolled';
import { Viewport } from '../../core/layout/viewport';
import {
  NavItem,
  PortalNavigation,
  injectCurrentUrl,
  isNavActive,
} from '../../core/navigation/navigation';
import { BottomNav } from '../../shared/bottom-nav/bottom-nav';
import { Brand } from '../../shared/brand/brand';
import { Icon } from '../../shared/icon/icon';

interface Alert {
  readonly text: string;
  readonly link: string;
}

@Component({
  selector: 'app-management-shell',
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterOutlet,
    BottomNav,
    Brand,
    Icon,
  ],
  templateUrl: './management-shell.html',
  styleUrl: './management-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementShell {
  private readonly store = inject(DemoStore);
  protected readonly config = inject(ActivatedRoute).snapshot.data['nav'] as PortalNavigation;
  protected readonly compact = inject(Viewport).compact;
  protected readonly drawerOpen = signal(false);
  protected readonly scrolled = injectScrolled();

  private readonly url = injectCurrentUrl();
  private readonly items = this.config.groups.flatMap((group) => group.items);
  protected readonly current = computed(() =>
    this.items.find((item) => isNavActive(item, this.url())),
  );
  protected readonly title = computed(() => this.current()?.label ?? this.config.label);
  protected readonly moreActive = computed(() => {
    const current = this.current();
    return !!current && !this.config.primary.includes(current);
  });

  protected readonly identity =
    this.config.role === 'admin'
      ? { name: DEMO_ADMIN.name, detail: DEMO_ADMIN.email, initial: 'أ', label: 'مدير المنصة' }
      : {
          name: DEMO_OWNER.organization,
          detail: DEMO_OWNER.contact,
          initial: 'ل',
          label: 'مالك قاعات',
        };

  protected readonly alerts = computed<readonly Alert[]>(() =>
    this.config.role === 'admin'
      ? this.store.pendingRequests().map((request) => ({
          text: `طلب جديد: ${request.title}`,
          link: '/admin/requests',
        }))
      : this.store
          .ownerBookings()
          .filter((booking) => booking.status === 'pending')
          .map((booking) => ({
            text: `حجز ${booking.id} بانتظار تأكيدك`,
            link: '/owner/bookings',
          })),
  );

  constructor() {
    // Close the modal drawer after any navigation, as native apps do.
    effect(() => {
      this.url();
      this.drawerOpen.set(false);
    });
  }

  protected isActive(item: NavItem): boolean {
    return isNavActive(item, this.url());
  }
}
