import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';

/** Explains why a view is empty and offers the next useful action (projected). */
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  template: `
    <span class="icon"><app-icon [name]="icon()" /></span>
    <h2>{{ title() }}</h2>
    <p>{{ message() }}</p>
    <ng-content />
  `,
  styles: `
    :host {
      --sh-icon-size: 32px;
      display: grid;
      justify-items: center;
      gap: 8px;
      border: 1px dashed var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      padding: 40px 24px;
      text-align: center;
    }
    .icon {
      display: grid;
      width: 64px;
      height: 64px;
      place-items: center;
      margin-block-end: 8px;
      border-radius: 50%;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    h2 {
      font: var(--mat-sys-title-large);
      font-weight: 700;
    }
    p {
      max-width: 42ch;
      margin-block-end: 8px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly icon = input<IconName>('info');
  readonly title = input.required<string>();
  readonly message = input.required<string>();
}
