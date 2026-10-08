import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import {
  NavItem,
  PUBLIC_NAV,
  injectCurrentUrl,
  isNavActive,
} from '../../core/navigation/navigation';
import { BottomNav } from '../../shared/bottom-nav/bottom-nav';
import { Brand } from '../../shared/brand/brand';
import { Icon } from '../../shared/icon/icon';
import { injectRouteChrome } from '../route-chrome';

@Component({
  selector: 'app-public-shell',
  imports: [MatButtonModule, MatToolbarModule, RouterLink, RouterOutlet, BottomNav, Brand, Icon],
  templateUrl: './public-shell.html',
  styleUrl: './public-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicShell {
  protected readonly nav = PUBLIC_NAV;
  protected readonly desktopNav = PUBLIC_NAV.slice(0, 4);
  protected readonly year = 2026;

  private readonly url = injectCurrentUrl();
  private readonly chrome = injectRouteChrome();
  protected readonly detail = computed(() => this.chrome() === 'detail');

  protected isActive(item: NavItem): boolean {
    return isNavActive(item, this.url());
  }
}
