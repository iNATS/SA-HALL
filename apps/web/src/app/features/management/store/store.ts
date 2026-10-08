import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Notifier } from '../../../core/feedback/notifier';
import { DEMO_PRODUCTS } from '../../../core/demo/demo-data';
import { Product } from '../../../core/domain/models';
import { StatusView } from '../../../core/domain/status';
import { formatSar } from '../../../core/format/format';
import { PortalRole } from '../../../core/navigation/navigation';
import { Icon } from '../../../shared/icon/icon';
import { NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { Status } from '../../../shared/status/status';

const LOW_STOCK = 10;

function stockState(stock: number): StatusView {
  if (stock === 0) {
    return { label: 'نفد المخزون', tone: 'error', icon: 'block' };
  }
  return stock < LOW_STOCK
    ? { label: 'مخزون منخفض', tone: 'warning', icon: 'inventory_2' }
    : { label: 'متوفر', tone: 'success', icon: 'check_circle' };
}

@Component({
  selector: 'app-store',
  imports: [MatButtonModule, Icon, Status, NumberPipe, SarPipe],
  template: `
    <div class="mp-page">
      <div class="mp-intro">
        <p>
          {{
            role() === 'admin'
              ? 'منتجات المتجر ومستويات المخزون المتاحة لملاك القاعات.'
              : 'تجهيزات وهدايا ضيافة تُطلب لمناسباتك وتُسلَّم إلى القاعة.'
          }}
        </p>
      </div>
      <ul class="products">
        @for (item of items(); track item.product.id) {
          <li class="product">
            <span class="art"><app-icon [name]="item.product.icon" /></span>
            <div class="body">
              <p class="category">{{ item.product.category }}</p>
              <h2>{{ item.product.name }}</h2>
              <p class="price">
                <strong class="sh-num">{{ item.product.price | sar }}</strong>
                <span>/ {{ item.product.unit }}</span>
              </p>
              <app-status [value]="item.state" />
              @if (role() === 'admin') {
                <p class="stock sh-num">المخزون: {{ item.product.stock | num }}</p>
              }
            </div>
            @if (role() === 'admin') {
              <button matButton="tonal" type="button" (click)="restock(item.product)">
                <app-icon name="add" />إضافة 50 للمخزون
              </button>
            } @else {
              <div class="order">
                <div class="stepper" role="group" [attr.aria-label]="'كمية ' + item.product.name">
                  <button
                    mat-icon-button
                    type="button"
                    aria-label="إنقاص الكمية"
                    [disabled]="item.quantity <= 1 || item.product.stock === 0"
                    (click)="setQuantity(item.product, item.quantity - 1)"
                  >
                    <app-icon name="remove" />
                  </button>
                  <output class="sh-num" aria-live="polite">{{ item.quantity | num }}</output>
                  <button
                    mat-icon-button
                    type="button"
                    aria-label="زيادة الكمية"
                    [disabled]="item.quantity >= item.product.stock"
                    (click)="setQuantity(item.product, item.quantity + 1)"
                  >
                    <app-icon name="add" />
                  </button>
                </div>
                <button
                  mat-flat-button
                  type="button"
                  [disabled]="item.product.stock === 0"
                  (click)="order(item.product, item.quantity)"
                >
                  اطلب
                </button>
              </div>
            }
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .products {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .product {
      display: grid;
      align-content: start;
      gap: 14px;
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-low);
      padding: 18px;
    }
    .art {
      --sh-icon-size: 32px;
      display: grid;
      height: 96px;
      place-items: center;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-primary);
    }
    .body {
      display: grid;
      justify-items: start;
      gap: 4px;
    }
    .category {
      color: var(--sh-gold-text);
      font: var(--mat-sys-label-medium);
      font-weight: 700;
    }
    h2 {
      font: var(--mat-sys-title-medium);
      font-weight: 700;
    }
    .price {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-block-end: 4px;
      color: var(--mat-sys-on-surface-variant);
    }
    .price strong {
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-title-medium);
      font-weight: 700;
    }
    .stock {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    .order {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .stepper {
      display: flex;
      align-items: center;
      border-radius: var(--mat-sys-corner-full);
      background: var(--mat-sys-surface-container-high);
    }
    output {
      min-width: 32px;
      font-weight: 700;
      text-align: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Store {
  private readonly notifier = inject(Notifier);
  readonly role = input<PortalRole>('owner');

  private readonly products = signal<readonly Product[]>(DEMO_PRODUCTS);
  private readonly quantities = signal<ReadonlyMap<string, number>>(new Map());

  protected readonly items = computed(() =>
    this.products().map((product) => ({
      product,
      state: stockState(product.stock),
      quantity: Math.min(this.quantities().get(product.id) ?? 1, Math.max(product.stock, 1)),
    })),
  );

  protected setQuantity(product: Product, quantity: number): void {
    const bounded = Math.max(1, Math.min(quantity, product.stock));
    this.quantities.update((current) => new Map(current).set(product.id, bounded));
  }

  protected order(product: Product, quantity: number): void {
    this.updateStock(product.id, -quantity);
    this.quantities.update((current) => new Map(current).set(product.id, 1));
    this.notifier.open(
      `طُلب ${quantity} × ${product.name} بإجمالي ${formatSar(quantity * product.price)}`,
    );
  }

  protected restock(product: Product): void {
    this.updateStock(product.id, 50);
    this.notifier.open(`أُضيفت 50 وحدة إلى «${product.name}»`);
  }

  private updateStock(id: string, delta: number): void {
    this.products.update((list) =>
      list.map((product) =>
        product.id === id ? { ...product, stock: Math.max(0, product.stock + delta) } : product,
      ),
    );
  }
}
