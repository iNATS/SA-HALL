import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/** Brand lockup: a gold arch on royal violet plus the Arabic wordmark. */
@Component({
  selector: 'app-brand',
  template: `
    <svg class="mark" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <rect width="512" height="512" rx="120" fill="#3D0090" />
      <path
        d="M152 404V252c0-58 46-104 104-136 58 32 104 78 104 136v152"
        fill="none"
        stroke="#EAC256"
        stroke-width="28"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M208 404V276c0-30 21-55 48-72 27 17 48 42 48 72v128z" fill="#EAC256" />
      <path d="M112 404h288" stroke="#EAC256" stroke-width="28" stroke-linecap="round" />
    </svg>
    @if (!markOnly()) {
      <span class="words">
        <span class="name">صالة</span>
        @if (caption()) {
          <span class="caption">{{ caption() }}</span>
        }
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: inherit;
    }
    .mark {
      width: var(--sh-brand-size, 40px);
      height: var(--sh-brand-size, 40px);
      flex: none;
    }
    .words {
      display: grid;
      line-height: 1.15;
    }
    .name {
      font-family: var(--mat-sys-display-large-font);
      font-size: 1.5rem;
      font-weight: 700;
    }
    .caption {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Brand {
  readonly caption = input<string>();
  readonly markOnly = input(false, { transform: booleanAttribute });
}
