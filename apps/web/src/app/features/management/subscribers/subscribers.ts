import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { Notifier } from '../../../core/feedback/notifier';
import { DEMO_SUBSCRIBERS } from '../../../core/demo/demo-data';
import { Subscriber, SubscriptionState } from '../../../core/domain/models';
import { SUBSCRIPTION_STATE } from '../../../core/domain/status';
import { formatNumber } from '../../../core/format/format';
import { Viewport } from '../../../core/layout/viewport';
import { confirmAction } from '../../../shared/confirm-dialog/confirm-dialog';
import { ArDatePipe, NumberPipe } from '../../../shared/pipes/format.pipes';
import { StatCard } from '../../../shared/stat-card/stat-card';
import { Status } from '../../../shared/status/status';

@Component({
  selector: 'app-subscribers',
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatChipsModule,
    MatTableModule,
    StatCard,
    Status,
    ArDatePipe,
    NumberPipe,
  ],
  template: `
    <div class="mp-page">
      <section class="mp-stats" aria-label="ملخص الاشتراكات">
        @for (stat of stats(); track stat.label) {
          <app-stat-card
            [label]="stat.label"
            [value]="stat.value"
            [hint]="stat.hint"
            [icon]="stat.icon"
          />
        }
      </section>

      <mat-chip-listbox
        class="sh-chip-scroll"
        aria-label="حالة الاشتراك"
        [value]="filter()"
        (change)="filter.set($event.value ?? 'all')"
      >
        <mat-chip-option value="all">الكل</mat-chip-option>
        @for (state of stateKeys; track state) {
          <mat-chip-option [value]="state">{{ states[state].label }}</mat-chip-option>
        }
      </mat-chip-listbox>

      <section class="mp-panel table-panel" aria-label="المشتركون">
        @if (compact()) {
          <ul class="mp-list">
            @for (row of rows(); track row.id) {
              <li class="mp-row">
                <span class="mp-avatar" aria-hidden="true">{{ row.name.charAt(0) }}</span>
                <div class="mp-row-main">
                  <strong>{{ row.name }}</strong>
                  <small>{{ row.kind }} · الباقة {{ row.plan }} · {{ row.city }}</small>
                  <app-status [value]="row.view" />
                </div>
                <ng-container *ngTemplateOutlet="action; context: { $implicit: row }" />
              </li>
            }
          </ul>
        } @else {
          <div class="sh-table-scroll">
            <table mat-table class="mp-table" [dataSource]="rows()">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>المشترك</th>
                <td mat-cell *matCellDef="let row">
                  <span class="mp-cell-stack"
                    ><strong>{{ row.name }}</strong
                    ><small>{{ row.city }}</small></span
                  >
                </td>
              </ng-container>
              <ng-container matColumnDef="kind">
                <th mat-header-cell *matHeaderCellDef>النشاط</th>
                <td mat-cell *matCellDef="let row">{{ row.kind }}</td>
              </ng-container>
              <ng-container matColumnDef="plan">
                <th mat-header-cell *matHeaderCellDef>الباقة</th>
                <td mat-cell *matCellDef="let row">{{ row.plan }}</td>
              </ng-container>
              <ng-container matColumnDef="assets">
                <th mat-header-cell *matHeaderCellDef>الأصول</th>
                <td mat-cell *matCellDef="let row">{{ row.assets | num }}</td>
              </ng-container>
              <ng-container matColumnDef="state">
                <th mat-header-cell *matHeaderCellDef>الحالة</th>
                <td mat-cell *matCellDef="let row"><app-status [value]="row.view" /></td>
              </ng-container>
              <ng-container matColumnDef="renewsOn">
                <th mat-header-cell *matHeaderCellDef>التجديد</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.renewsOn ? (row.renewsOn | arDate) : '—' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef>
                  <span class="sh-visually-hidden">الإجراء</span>
                </th>
                <td mat-cell *matCellDef="let row">
                  <ng-container *ngTemplateOutlet="action; context: { $implicit: row }" />
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        }
      </section>
    </div>

    <ng-template #action let-row>
      @if (row.state === 'suspended') {
        <button mat-button type="button" (click)="setState(row, 'active')">إعادة التفعيل</button>
      } @else if (row.state === 'pending') {
        <button mat-button type="button" (click)="setState(row, 'active')">اعتماد</button>
      } @else {
        <button mat-button type="button" class="danger" (click)="setState(row, 'suspended')">
          إيقاف
        </button>
      }
    </ng-template>
  `,
  styles: `
    .table-panel {
      padding-block: 8px;
    }
    .mp-row-main app-status {
      justify-self: start;
      margin-block-start: 4px;
    }
    .danger {
      --mat-button-text-label-text-color: var(--mat-sys-error);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subscribers {
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);
  protected readonly compact = inject(Viewport).compact;

  protected readonly states = SUBSCRIPTION_STATE;
  protected readonly stateKeys = Object.keys(SUBSCRIPTION_STATE) as SubscriptionState[];
  protected readonly columns = ['name', 'kind', 'plan', 'assets', 'state', 'renewsOn', 'action'];
  protected readonly filter = signal<SubscriptionState | 'all'>('all');
  private readonly subscribers = signal<readonly Subscriber[]>(DEMO_SUBSCRIBERS);

  protected readonly rows = computed(() =>
    this.subscribers()
      .filter((s) => this.filter() === 'all' || s.state === this.filter())
      .map((s) => ({ ...s, view: SUBSCRIPTION_STATE[s.state] })),
  );
  protected readonly stats = computed(() => {
    const list = this.subscribers();
    const count = (state: SubscriptionState) => list.filter((s) => s.state === state).length;
    return [
      {
        label: 'نشطون',
        value: formatNumber(count('active')),
        hint: `من ${formatNumber(list.length)}`,
        icon: 'badge',
      },
      {
        label: 'بانتظار الاعتماد',
        value: formatNumber(count('pending')),
        hint: 'حسابات جديدة',
        icon: 'hourglass_top',
      },
      {
        label: 'تنتهي قريباً',
        value: formatNumber(count('expiring')),
        hint: 'خلال 30 يوماً',
        icon: 'schedule',
      },
      {
        label: 'موقوفون',
        value: formatNumber(count('suspended')),
        hint: 'لا يظهرون للعملاء',
        icon: 'block',
      },
    ] as const;
  });

  protected setState(subscriber: Subscriber, state: SubscriptionState): void {
    const suspend = state === 'suspended';
    confirmAction(this.dialog, {
      title: suspend ? `إيقاف «${subscriber.name}»؟` : `تفعيل «${subscriber.name}»؟`,
      message: suspend
        ? 'ستُخفى أصول المشترك من المنصة وتتوقف الحجوزات الجديدة، مع بقاء الحجوزات القائمة.'
        : 'سيظهر المشترك وأصوله في المنصة فوراً.',
      confirmLabel: suspend ? 'إيقاف' : 'تفعيل',
      destructive: suspend,
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.subscribers.update((list) =>
          list.map((s) => (s.id === subscriber.id ? { ...s, state } : s)),
        );
        this.notifier.open(suspend ? 'تم إيقاف المشترك' : 'تم تفعيل المشترك');
      }
    });
  }
}
