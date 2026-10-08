import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NumberPipe } from '../pipes/format.pipes';

export interface TrendPoint {
  readonly label: string;
  readonly value: number;
}

/**
 * Minimal column chart built from list semantics, so every value is readable by
 * assistive technology without a separate data table and costs no chart library.
 */
@Component({
  selector: 'app-trend-chart',
  imports: [NumberPipe],
  template: `
    <ol [attr.aria-label]="label()">
      @for (point of points(); track point.label; let last = $last) {
        <li [class.current]="last">
          <span class="value sh-num">{{ point.value | num }}</span>
          <span class="track" aria-hidden="true">
            <span class="bar" [style.block-size.%]="(point.value / max()) * 100"></span>
          </span>
          <span class="label">{{ point.label }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    ol {
      display: grid;
      height: 220px;
      grid-auto-columns: minmax(0, 1fr);
      grid-auto-flow: column;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      grid-template-rows: auto 1fr auto;
      justify-items: center;
      gap: 8px;
      min-width: 0;
    }
    .value {
      font: var(--mat-sys-label-large);
      font-weight: 700;
    }
    .track {
      display: flex;
      width: min(100%, 40px);
      align-items: end;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-surface-container-high);
    }
    .bar {
      width: 100%;
      min-block-size: 4px;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-primary-fixed-dim);
    }
    .current .bar {
      background: var(--mat-sys-primary);
    }
    .label {
      overflow: hidden;
      max-width: 100%;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendChart {
  readonly points = input.required<readonly TrendPoint[]>();
  readonly label = input.required<string>();

  protected readonly max = computed(() => Math.max(1, ...this.points().map((p) => p.value)));
}
