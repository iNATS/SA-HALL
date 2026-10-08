import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { DEMO_ORDERS } from '../../../core/demo/demo-data';
import { ORDER_STATE } from '../../../core/domain/status';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { Status } from '../../../shared/status/status';

@Component({
  selector: 'app-client-orders',
  imports: [MatButtonModule, RouterLink, EmptyState, Icon, Status, ArDatePipe, NumberPipe, SarPipe],
  template: `
    <h2 class="sh-visually-hidden">طلبات المتجر</h2>
    <ul class="list">
      @for (order of orders; track order.id) {
        <li class="order">
          <span class="icon"><app-icon name="shopping_bag" /></span>
          <div class="main">
            <app-status [value]="states[order.state]" />
            <h3>{{ order.title }}</h3>
            <p>
              الطلب <bdi class="sh-num">#{{ order.id }}</bdi> ·
              <span class="sh-num">{{ order.quantity | num }}</span> قطعة · الوصول المتوقع
              {{ order.eta | arDate: 'short' }}
            </p>
          </div>
          <strong class="sh-num">{{ order.total | sar }}</strong>
        </li>
      } @empty {
        <app-empty-state
          icon="shopping_bag"
          title="لا توجد طلبات"
          message="تظهر هنا مشتريات التجهيزات والهدايا من متجر المنصة."
        >
          <a mat-flat-button routerLink="/halls">تصفّح القاعات</a>
        </app-empty-state>
      }
    </ul>
  `,
  styles: `
    .list {
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .order {
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-lowest);
      padding: 16px;
    }
    .icon {
      display: grid;
      width: 48px;
      height: 48px;
      flex: none;
      place-items: center;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .main {
      display: grid;
      flex: 1;
      justify-items: start;
      gap: 4px;
      min-width: 0;
    }
    h3 {
      font: var(--mat-sys-title-medium);
      font-weight: 700;
    }
    p {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    strong {
      font: var(--mat-sys-title-medium);
      font-weight: 700;
    }
    @media (max-width: 599.98px) {
      .order {
        flex-wrap: wrap;
      }
      .icon {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientOrders {
  protected readonly orders = DEMO_ORDERS;
  protected readonly states = ORDER_STATE;
}
