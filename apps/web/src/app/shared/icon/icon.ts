import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  signal,
} from '@angular/core';
import type { IconName } from './icons';
import { CORE_ICON_PATHS } from './icons-core';

/**
 * Icon path data. The shell's own glyphs ship in the main bundle; the full set is
 * a separate chunk requested at startup, in parallel with the first screen.
 */
const registry = signal<Partial<Record<IconName, string>>>(CORE_ICON_PATHS);
let pending: Promise<void> | undefined;

export function loadIcons(): Promise<void> {
  pending ??= import('./icons').then(({ ICON_PATHS }) => registry.set(ICON_PATHS));
  return pending;
}

/**
 * Inline Material Symbols icon: no icon font is downloaded. The host carries the
 * `mat-icon` class so Material buttons, lists and form fields size it natively.
 */
@Component({
  selector: 'app-icon',
  template: `<svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
    <path [attr.d]="path()" />
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      width: var(--sh-icon-size, 24px);
      height: var(--sh-icon-size, 24px);
      overflow: hidden;
      fill: currentColor;
      vertical-align: middle;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  host: {
    class: 'app-icon mat-icon',
    '[class.sh-mirror]': 'mirror()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  /** Use the filled variant when one exists (active navigation destinations). */
  readonly filled = input(false, { transform: booleanAttribute });
  /** Flip directional glyphs such as arrows in right-to-left layouts. */
  readonly mirror = input(false, { transform: booleanAttribute });

  protected readonly path = computed(() => {
    const paths = registry();
    const name = this.name();
    const filled = this.filled() ? paths[`${name}-fill` as IconName] : undefined;
    return filled ?? paths[name] ?? null;
  });

  constructor() {
    void loadIcons();
  }
}
