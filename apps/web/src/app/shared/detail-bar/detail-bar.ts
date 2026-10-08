import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { injectScrolled } from '../../core/layout/scrolled';
import { Icon } from '../icon/icon';

/**
 * Small top app bar for pushed screens on compact windows: back navigation,
 * a title and optional trailing actions (projected).
 */
@Component({
  selector: 'app-detail-bar',
  imports: [MatButtonModule, MatToolbarModule, RouterLink, Icon],
  template: `
    <mat-toolbar>
      <a mat-icon-button [routerLink]="back()" [attr.aria-label]="backLabel()">
        <app-icon name="arrow_back" mirror />
      </a>
      <span class="title">{{ title() }}</span>
      <ng-content />
    </mat-toolbar>
  `,
  styles: `
    :host {
      position: sticky;
      z-index: 30;
      inset-block-start: 0;
      display: block;
    }
    mat-toolbar {
      gap: 4px;
      height: var(--sh-top-bar);
      padding-inline: 4px 8px;
      --mat-toolbar-container-background-color: var(--mat-sys-surface);
      transition: background-color var(--sh-duration) var(--sh-ease);
    }
    :host(.scrolled) mat-toolbar {
      --mat-toolbar-container-background-color: var(--mat-sys-surface-container);
    }
    .title {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font: var(--mat-sys-title-large);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
  host: { '[class.scrolled]': 'scrolled()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailBar {
  protected readonly scrolled = injectScrolled();
  readonly title = input.required<string>();
  readonly back = input.required<string | readonly unknown[]>();
  readonly backLabel = input('رجوع');
}
