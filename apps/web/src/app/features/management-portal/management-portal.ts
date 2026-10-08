import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DEMO_BOOKINGS, DEMO_HALLS, DEMO_SERVICES } from '../../core/demo/demo-data';

interface MenuGroup {
  readonly title: string;
  readonly items: readonly { path: string; label: string }[];
}

@Component({
  selector: 'app-management-portal',
  imports: [MatButtonModule, RouterLink, RouterLinkActive, NgTemplateOutlet],
  templateUrl: './management-portal.html',
  styleUrl: './management-portal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementPortal {
  private readonly route = inject(ActivatedRoute);
  readonly role = this.route.snapshot.data['role'] as 'owner' | 'admin';
  readonly page = this.route.snapshot.data['page'] as string;
  readonly mobileMenuOpen = signal(false);
  readonly notice = signal('');
  readonly bookings = DEMO_BOOKINGS;
  readonly halls = DEMO_HALLS.slice(0, 4);
  readonly services = DEMO_SERVICES.slice(0, 4);

  readonly ownerGroups: readonly MenuGroup[] = [
    {
      title: 'لوحة القيادة',
      items: [
        { path: '/owner/dashboard', label: 'نظرة عامة' },
        { path: '/owner/calendar', label: 'التقويم' },
        { path: '/owner/bookings', label: 'سجل الحجوزات' },
      ],
    },
    {
      title: 'إدارة الأصول',
      items: [
        { path: '/owner/halls', label: 'القاعات' },
        { path: '/owner/services', label: 'الخدمات' },
      ],
    },
    {
      title: 'المالية والعملاء',
      items: [
        { path: '/owner/accounting', label: 'الفواتير والحسابات' },
        { path: '/owner/coupons', label: 'كوبونات الخصم' },
        { path: '/owner/marketplace', label: 'متجر المنصة' },
        { path: '/owner/clients', label: 'إدارة العملاء' },
      ],
    },
    { title: 'الإعدادات', items: [{ path: '/owner/settings', label: 'إعدادات المنشأة' }] },
  ];
  readonly adminGroups: readonly MenuGroup[] = [
    {
      title: 'لوحة القيادة',
      items: [
        { path: '/admin/dashboard', label: 'نظرة عامة' },
        { path: '/admin/requests', label: 'الطلبات والترقيات' },
      ],
    },
    {
      title: 'إدارة المنصة',
      items: [
        { path: '/admin/halls', label: 'إدارة القاعات' },
        { path: '/admin/services', label: 'إدارة الخدمات' },
        { path: '/admin/subscribers', label: 'إدارة المشتركين' },
        { path: '/admin/home-sections', label: 'أقسام الصفحة الرئيسية' },
        { path: '/admin/accounting', label: 'الحسابات' },
        { path: '/admin/coupons', label: 'كوبونات الخصم' },
        { path: '/admin/store', label: 'إدارة المتجر' },
      ],
    },
    {
      title: 'الإعدادات والمحتوى',
      items: [
        { path: '/admin/content', label: 'إدارة المحتوى' },
        { path: '/admin/settings', label: 'إعدادات النظام' },
      ],
    },
  ];
  readonly groups = this.role === 'admin' ? this.adminGroups : this.ownerGroups;

  readonly pageCopy: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: this.role === 'admin' ? 'نظرة عامة على المنصة' : 'صباح الخير، مؤسسة ليلك',
      subtitle:
        this.role === 'admin'
          ? 'تابع أداء المنصة والطلبات التي تحتاج قراراً.'
          : 'إليك ملخص الحجوزات والأداء التشغيلي اليوم.',
    },
    bookings: { title: 'سجل الحجوزات', subtitle: 'راجع الطلبات، المدفوعات، وتفاصيل كل مناسبة.' },
    calendar: { title: 'تقويم المناسبات', subtitle: 'عرض تشغيلي لمواعيد القاعات والزيارات.' },
    halls: {
      title: this.role === 'admin' ? 'إدارة القاعات' : 'قاعاتي',
      subtitle: 'الحالة والتوفر والتسعير والظهور في المنصة.',
    },
    services: {
      title: this.role === 'admin' ? 'إدارة الخدمات' : 'خدماتي',
      subtitle: 'الخدمات والباقات المرتبطة بالمناسبات.',
    },
    accounting: { title: 'الفواتير والحسابات', subtitle: 'الإيرادات والمستحقات وحركة المدفوعات.' },
    clients: { title: 'إدارة العملاء', subtitle: 'سجل موحد للعملاء وحجوزاتهم وتواصلهم.' },
    subscribers: {
      title: 'إدارة المشتركين',
      subtitle: 'حسابات مزودي الخدمة وحالات الاشتراك والموافقة.',
    },
    requests: {
      title: 'الطلبات والترقيات',
      subtitle: 'راجع طلبات التسجيل وإضافة الأصول قبل اعتمادها.',
    },
    content: {
      title: 'إدارة المحتوى',
      subtitle: 'الأقسام الرئيسية والإعلانات والصفحات التعريفية.',
    },
    coupons: {
      title: 'كوبونات الخصم',
      subtitle: 'أنشئ العروض وحدد فترة الصلاحية ونطاق الاستخدام.',
    },
    marketplace: {
      title: this.role === 'admin' ? 'إدارة متجر المنصة' : 'متجر المنصة',
      subtitle: 'منتجات وتجهيزات يمكن إضافتها إلى عمليات البيع والمناسبات.',
    },
    settings: {
      title: this.role === 'admin' ? 'إعدادات النظام' : 'إعدادات المنشأة',
      subtitle: 'الهوية وبيانات التواصل والسياسات التشغيلية.',
    },
  };
  readonly copy = this.pageCopy[this.page] ?? this.pageCopy['dashboard'];

  closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }
  toggleMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }
  showNotice(message: string): void {
    this.notice.set(message);
  }
}
