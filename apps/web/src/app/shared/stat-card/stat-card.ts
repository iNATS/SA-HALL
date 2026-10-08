import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';

/** Key metric tile: flat tonal surface, icon, value and an explanatory hint. */
@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  template: `
    <span class="icon"><app-icon [name]="icon()" /></span>
    <span class="label">{{ label() }}</span>
    <strong class="value sh-num">{{ value() }}</strong>
    @if (hint()) {
      <span class="hint">{{ hint() }}</span>
    }
  `,
  styles: `
    :host {
      display: grid;
      align-content: start;
      gap: 4px;
      min-width: 0;
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-low);
      padding: 16px;
    }
    :host(.featured) {
      background: var(--sh-hero-ink);
      color: var(--sh-on-hero);
    }
    :host(.featured) .label,
    :host(.featured) .hint {
      color: var(--sh-on-hero-variant);
    }
    :host(.featured) .icon {
      background: rgb(255 255 255 / 12%);
      color: var(--sh-hero-accent);
    }
    .icon {
      display: grid;
      width: 40px;
      height: 40px;
      place-items: center;
      margin-block-end: 8px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .label {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
    }
    .value {
      overflow-wrap: anywhere;
      font: var(--mat-sys-headline-small);
      font-family: inherit;
      font-weight: 700;
    }
    .hint {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  `,
  host: { '[class.featured]': 'featured()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input.required<IconName>();
  readonly hint = input<string>();
  readonly featured = input(false);
}
