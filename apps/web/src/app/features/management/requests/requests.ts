import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Notifier } from '../../../core/feedback/notifier';
import { DemoStore } from '../../../core/demo/demo-store';
import { DecisionState, PlatformRequest, RequestKind } from '../../../core/domain/models';
import { DECISION_STATE } from '../../../core/domain/status';
import { confirmAction } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import type { IconName } from '../../../shared/icon/icons';
import { ArDateTimePipe, NumberPipe } from '../../../shared/pipes/format.pipes';
import { Status } from '../../../shared/status/status';

const KINDS: readonly { kind: RequestKind; label: string; icon: IconName }[] = [
  { kind: 'registration', label: 'طلبات التسجيل', icon: 'badge' },
  { kind: 'new-hall', label: 'إضافة قاعة', icon: 'domain' },
  { kind: 'upgrade', label: 'ترقية الباقة', icon: 'workspace_premium' },
];

@Component({
  selector: 'app-requests',
  imports: [MatButtonModule, MatTabsModule, EmptyState, Icon, Status, ArDateTimePipe, NumberPipe],
  template: `
    <div class="mp-page">
      <nav mat-tab-nav-bar [tabPanel]="panel" mat-align-tabs="start" aria-label="أنواع الطلبات">
        @for (tab of tabs(); track tab.kind) {
          <button
            mat-tab-link
            type="button"
            [active]="kind() === tab.kind"
            (click)="kind.set(tab.kind)"
          >
            {{ tab.label }}
            <span class="count sh-num">{{ tab.pending | num }}</span>
          </button>
        }
      </nav>
      <mat-tab-nav-panel #panel>
        <ul class="requests">
          @for (request of visible(); track request.id) {
            <li class="request" [class.decided]="request.state !== 'pending'">
              <div class="head">
                <span class="mp-avatar" aria-hidden="true"><app-icon [name]="icon()" /></span>
                <div class="title">
                  <h2>{{ request.title }}</h2>
                  <p>
                    {{ request.applicant }} · {{ request.city }} ·
                    {{ request.submittedAt | arDateTime }}
                  </p>
                </div>
                <app-status [value]="states[request.state]" />
              </div>
              <dl class="details">
                @for (detail of request.details; track detail.label) {
                  <div>
                    <dt>{{ detail.label }}</dt>
                    <dd>{{ detail.value }}</dd>
                  </div>
                }
              </dl>
              @if (request.state === 'pending') {
                <div class="actions">
                  <button
                    mat-button
                    type="button"
                    class="danger"
                    (click)="decide(request, 'rejected')"
                  >
                    رفض
                  </button>
                  <button mat-flat-button type="button" (click)="decide(request, 'approved')">
                    <app-icon name="check" />قبول
                  </button>
                </div>
              }
            </li>
          } @empty {
            <app-empty-state
              icon="task_alt"
              title="لا توجد طلبات"
              message="لا توجد طلبات من هذا النوع حالياً."
            />
          }
        </ul>
      </mat-tab-nav-panel>
    </div>
  `,
  styles: `
    nav {
      border-block-end: 1px solid var(--mat-sys-outline-variant);
    }
    .count {
      display: inline-grid;
      min-width: 22px;
      height: 22px;
      place-items: center;
      margin-inline-start: 6px;
      border-radius: 11px;
      background: var(--mat-sys-tertiary-container);
      padding-inline: 6px;
      color: var(--mat-sys-on-tertiary-container);
      font: var(--mat-sys-label-small);
      font-weight: 700;
    }
    .requests {
      display: grid;
      gap: 12px;
      margin: 16px 0 0;
      padding: 0;
      list-style: none;
    }
    .request {
      display: grid;
      gap: 14px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-lowest);
      padding: 18px;
    }
    .request.decided {
      background: var(--mat-sys-surface-container-low);
    }
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }
    .title {
      flex: 1;
      min-width: 200px;
    }
    h2 {
      font: var(--mat-sys-title-medium);
      font-weight: 700;
    }
    .title p {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    .details {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 32px;
    }
    .details dt {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }
    .details dd {
      font-weight: 600;
    }
    .actions {
      display: flex;
      justify-content: end;
      gap: 8px;
    }
    .danger {
      --mat-button-text-label-text-color: var(--mat-sys-error);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Requests {
  private readonly store = inject(DemoStore);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  protected readonly states = DECISION_STATE;
  protected readonly kind = signal<RequestKind>('registration');
  protected readonly icon = computed(() => KINDS.find((k) => k.kind === this.kind())!.icon);
  protected readonly tabs = computed(() =>
    KINDS.map((tab) => ({
      ...tab,
      pending: this.store.requests().filter((r) => r.kind === tab.kind && r.state === 'pending')
        .length,
    })),
  );
  /** Pending requests first, decided ones after for reference. */
  protected readonly visible = computed(() =>
    this.store
      .requests()
      .filter((request) => request.kind === this.kind())
      .sort((a, b) => Number(a.state !== 'pending') - Number(b.state !== 'pending')),
  );

  protected decide(request: PlatformRequest, state: DecisionState): void {
    const approve = state === 'approved';
    confirmAction(this.dialog, {
      title: approve ? `قبول «${request.title}»؟` : `رفض «${request.title}»؟`,
      message: approve
        ? 'سيُفعَّل الطلب فوراً ويُبلَّغ مقدمه بالبريد والرسائل.'
        : 'سيُبلَّغ مقدم الطلب بالرفض ويمكنه إعادة التقديم بعد استكمال المتطلبات.',
      confirmLabel: approve ? 'قبول الطلب' : 'رفض الطلب',
      destructive: !approve,
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.store.decideRequest(request.id, state);
        this.notifier.open(approve ? 'تم قبول الطلب' : 'تم رفض الطلب');
      }
    });
  }
}
