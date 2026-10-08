import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItem, injectCurrentUrl, isNavActive } from '../../core/navigation/navigation';
import { Icon } from '../icon/icon';

/** Material 3 navigation bar for compact windows (Angular Material has no equivalent). */
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, Icon],
  template: `
    <nav [attr.aria-label]="label()">
      @for (item of items(); track item.path) {
        @let active = isActive(item);
        <a
          class="destination"
          [routerLink]="item.path"
          [class.active]="active"
          [attr.aria-current]="active ? 'page' : null"
        >
          <span class="indicator"><app-icon [name]="item.icon" [filled]="active" /></span>
          <span class="label">{{ item.label }}</span>
        </a>
      }
      @if (moreLabel(); as more) {
        <button
          class="destination"
          type="button"
          aria-haspopup="dialog"
          [class.active]="moreActive()"
          (click)="moreRequested.emit()"
        >
          <span class="indicator"><app-icon name="apps" [filled]="moreActive()" /></span>
          <span class="label">{{ more }}</span>
        </button>
      }
    </nav>
  `,
  styles: `
    :host {
      position: fixed;
      z-index: 40;
      inset-inline: 0;
      inset-block-end: 0;
      display: block;
      border-block-start: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container);
      padding-block-end: var(--sh-safe-bottom);
    }
    nav {
      display: grid;
      height: var(--sh-bottom-bar);
      grid-auto-columns: minmax(0, 1fr);
      grid-auto-flow: column;
      max-width: 640px;
      margin-inline: auto;
    }
    .destination {
      display: grid;
      align-content: center;
      justify-items: center;
      gap: 4px;
      min-width: 0;
      border: 0;
      background: none;
      padding: 12px 0 16px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
      text-decoration: none;
      cursor: pointer;
    }
    .indicator {
      position: relative;
      display: grid;
      width: 64px;
      height: 32px;
      place-items: center;
      overflow: hidden;
      border-radius: var(--mat-sys-corner-full);
      transition: background-color var(--sh-duration) var(--sh-ease);
    }
    .indicator::before {
      position: absolute;
      inset: 0;
      background: currentColor;
      content: '';
      opacity: 0;
      transition: opacity 120ms linear;
    }
    .destination:hover .indicator::before {
      opacity: var(--mat-sys-hover-state-layer-opacity);
    }
    .destination:active .indicator::before {
      opacity: var(--mat-sys-pressed-state-layer-opacity);
    }
    .destination:focus-visible {
      outline: none;
    }
    .destination:focus-visible .indicator {
      outline: 3px solid var(--mat-sys-primary);
      outline-offset: 2px;
    }
    .label {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .active {
      color: var(--mat-sys-on-surface);
      font-weight: 700;
    }
    .active .indicator {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    @media (min-width: 840px) {
      :host {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
  readonly items = input.required<readonly NavItem[]>();
  readonly label = input('التنقل الرئيسي');
  readonly moreLabel = input<string>();
  readonly moreActive = input(false);
  readonly moreRequested = output<void>();

  private readonly url = injectCurrentUrl();

  protected isActive(item: NavItem): boolean {
    return isNavActive(item, this.url());
  }
}
