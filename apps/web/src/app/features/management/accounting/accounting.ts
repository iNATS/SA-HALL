import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { DEMO_LEDGER, DEMO_SUBSCRIBERS } from '../../../core/demo/demo-data';
import { DemoStore } from '../../../core/demo/demo-store';
import { LedgerEntry } from '../../../core/domain/models';
import { PLATFORM_FEE_RATE, bookingQuote, outstanding } from '../../../core/domain/pricing';
import { StatusView } from '../../../core/domain/status';
import { downloadCsv } from '../../../core/format/csv';
import { formatNumber, formatSar } from '../../../core/format/format';
import { Viewport } from '../../../core/layout/viewport';
import { PortalRole } from '../../../core/navigation/navigation';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe, NumberPipe, SarPipe } from '../../../shared/pipes/format.pipes';
import { StatCard } from '../../../shared/stat-card/stat-card';
import { Status } from '../../../shared/status/status';

const LEDGER_KIND: Record<LedgerEntry['kind'], StatusView> = {
  collection: { label: 'تحصيل', tone: 'success', icon: 'payments' },
  fee: { label: 'عمولة', tone: 'neutral', icon: 'receipt_long' },
  payout: { label: 'تحويل', tone: 'info', icon: 'account_balance_wallet' },
  refund: { label: 'استرداد', tone: 'warning', icon: 'undo' },
};

/** Monthly subscription prices per plan, in whole SAR. */
const PLAN_PRICE: Record<string, number> = { الأساسية: 300, الفضية: 600, الذهبية: 1200 };

@Component({
  selector: 'app-accounting',
  imports: [
    MatButtonModule,
    MatTableModule,
    Icon,
    StatCard,
    Status,
    ArDatePipe,
    NumberPipe,
    SarPipe,
  ],
  templateUrl: './accounting.html',
  styleUrl: './accounting.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Accounting {
  private readonly store = inject(DemoStore);
  protected readonly compact = inject(Viewport).compact;

  readonly role = input<PortalRole>('owner');

  protected readonly ledger = [...DEMO_LEDGER]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => ({ ...entry, view: LEDGER_KIND[entry.kind] }));
  protected readonly ledgerColumns = ['date', 'reference', 'description', 'kind', 'amount'];
  protected readonly vendorColumns = ['vendor', 'bookings', 'collected', 'fee', 'net'];

  protected readonly ownerStats = computed(() => {
    const balance = DEMO_LEDGER.reduce((sum, entry) => sum + entry.amount, 0);
    const receivable = this.store.ownerBookings().reduce((sum, b) => sum + outstanding(b), 0);
    const monthFees = DEMO_LEDGER.filter(
      (entry) => entry.kind === 'fee' && entry.date.startsWith('2026-10'),
    ).reduce((sum, entry) => sum - entry.amount, 0);
    const refunds = DEMO_LEDGER.filter((entry) => entry.kind === 'refund').reduce(
      (sum, entry) => sum - entry.amount,
      0,
    );
    return [
      {
        label: 'الرصيد المتاح',
        value: formatSar(balance),
        hint: 'جاهز للتحويل',
        icon: 'account_balance_wallet',
        featured: true,
      },
      {
        label: 'مستحقات قادمة',
        value: formatSar(receivable),
        hint: 'أرصدة حجوزات مؤكدة',
        icon: 'schedule',
        featured: false,
      },
      {
        label: 'عمولة المنصة',
        value: formatSar(monthFees),
        hint: 'أكتوبر 2026',
        icon: 'receipt_long',
        featured: false,
      },
      {
        label: 'المبالغ المستردة',
        value: formatSar(refunds),
        hint: 'حجوزات ملغاة',
        icon: 'undo',
        featured: false,
      },
    ] as const;
  });

  protected readonly vendors = computed(() =>
    DEMO_SUBSCRIBERS.filter((vendor) => vendor.kind.includes('قاعات')).map((vendor) => {
      const halls = new Set(
        this.store
          .halls()
          .filter((hall) => hall.vendorId === vendor.id)
          .map((hall) => hall.slug),
      );
      const bookings = this.store
        .bookings()
        .filter((booking) => halls.has(booking.hallSlug) && booking.status !== 'cancelled');
      const collected = bookings.reduce((sum, booking) => sum + booking.paid, 0);
      const fee = Math.round(collected * PLATFORM_FEE_RATE);
      return {
        vendor: vendor.name,
        bookings: bookings.length,
        collected,
        fee,
        net: collected - fee,
      };
    }),
  );

  protected readonly adminStats = computed(() => {
    const active = this.store.bookings().filter((b) => b.status !== 'cancelled');
    const gmv = active.reduce((sum, b) => sum + bookingQuote(b).total, 0);
    const collected = active.reduce((sum, b) => sum + b.paid, 0);
    const subscriptions = DEMO_SUBSCRIBERS.filter(
      (s) => s.state === 'active' || s.state === 'expiring',
    ).reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0);
    return [
      {
        label: 'قيمة الحجوزات',
        value: formatSar(gmv),
        hint: `${formatNumber(active.length)} حجزاً نشطاً`,
        icon: 'trending_up',
        featured: true,
      },
      {
        label: 'المحصّل عبر المنصة',
        value: formatSar(collected),
        hint: 'شامل الضريبة',
        icon: 'payments',
        featured: false,
      },
      {
        label: 'عمولات المنصة',
        value: formatSar(Math.round(collected * PLATFORM_FEE_RATE)),
        hint: `${PLATFORM_FEE_RATE * 100}% من المحصّل`,
        icon: 'receipt_long',
        featured: false,
      },
      {
        label: 'الاشتراكات الشهرية',
        value: formatSar(subscriptions),
        hint: 'خطط فعّالة',
        icon: 'badge',
        featured: false,
      },
    ] as const;
  });

  protected readonly stats = computed(() =>
    this.role() === 'admin' ? this.adminStats() : this.ownerStats(),
  );

  protected exportCsv(): void {
    if (this.role() === 'admin') {
      downloadCsv('sa-hall-settlements.csv', [
        ['المنشأة', 'الحجوزات', 'المحصل', 'العمولة', 'الصافي'],
        ...this.vendors().map((v) => [v.vendor, v.bookings, v.collected, v.fee, v.net]),
      ]);
      return;
    }
    downloadCsv('sa-hall-ledger.csv', [
      ['التاريخ', 'المرجع', 'البيان', 'النوع', 'المبلغ'],
      ...this.ledger.map((e) => [
        e.date,
        e.reference,
        e.description,
        LEDGER_KIND[e.kind].label,
        e.amount,
      ]),
    ]);
  }
}
