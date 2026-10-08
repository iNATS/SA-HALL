import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusView } from '../../core/domain/status';
import { Icon } from '../icon/icon';

/** Compact status pill pairing an icon with a text label on a tonal container. */
@Component({
  selector: 'app-status',
  imports: [Icon],
  template: `<app-icon [name]="value().icon" /><span>{{ value().label }}</span>`,
  styles: `
    :host {
      --sh-icon-size: 16px;
      display: inline-flex;
      min-height: 28px;
      align-items: center;
      gap: 6px;
      border-radius: var(--mat-sys-corner-small);
      padding-inline: 8px 10px;
      font: var(--mat-sys-label-large);
      font-weight: 600;
      white-space: nowrap;
    }
    :host(.tone-success) {
      background: var(--sh-success-container);
      color: var(--sh-on-success-container);
    }
    :host(.tone-warning) {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }
    :host(.tone-info) {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    :host(.tone-neutral) {
      background: var(--mat-sys-surface-container-highest);
      color: var(--mat-sys-on-surface-variant);
    }
    :host(.tone-error) {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
  `,
  host: { '[class]': '"tone-" + value().tone' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Status {
  readonly value = input.required<StatusView>();
}
