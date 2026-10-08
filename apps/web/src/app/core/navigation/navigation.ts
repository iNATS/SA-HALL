import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import type { IconName } from '../../shared/icon/icons';

export interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
  /** Additional URL prefixes that keep this destination highlighted. */
  readonly alsoActiveFor?: readonly string[];
  readonly exact?: boolean;
}

export interface NavGroup {
  readonly title: string;
  readonly items: readonly NavItem[];
}

export type PortalRole = 'owner' | 'admin';

export interface PortalNavigation {
  readonly role: PortalRole;
  readonly label: string;
  readonly groups: readonly NavGroup[];
  /** Up to four destinations for the compact bottom bar; a fifth "more" opens the drawer. */
  readonly primary: readonly NavItem[];
}

export const PUBLIC_NAV: readonly NavItem[] = [
  { path: '/', label: 'الرئيسية', icon: 'home', exact: true },
  { path: '/halls', label: 'القاعات', icon: 'domain' },
  { path: '/services', label: 'الخدمات', icon: 'room_service' },
  { path: '/client/bookings', label: 'حجوزاتي', icon: 'confirmation_number' },
  {
    path: '/client/profile',
    label: 'حسابي',
    icon: 'account_circle',
    alsoActiveFor: ['/client/orders', '/client/favorites', '/sign-in'],
  },
];

const ownerItems = {
  dashboard: { path: '/owner/dashboard', label: 'نظرة عامة', icon: 'space_dashboard' },
  calendar: { path: '/owner/calendar', label: 'التقويم', icon: 'calendar_month' },
  bookings: { path: '/owner/bookings', label: 'الحجوزات', icon: 'event_note' },
  halls: { path: '/owner/halls', label: 'قاعاتي', icon: 'domain' },
  services: { path: '/owner/services', label: 'خدماتي', icon: 'room_service' },
  accounting: { path: '/owner/accounting', label: 'الحسابات', icon: 'account_balance_wallet' },
  coupons: { path: '/owner/coupons', label: 'الكوبونات', icon: 'sell' },
  clients: { path: '/owner/clients', label: 'العملاء', icon: 'group' },
  marketplace: { path: '/owner/marketplace', label: 'متجر المنصة', icon: 'storefront' },
  settings: { path: '/owner/settings', label: 'إعدادات المنشأة', icon: 'settings' },
} satisfies Record<string, NavItem>;

const adminItems = {
  dashboard: { path: '/admin/dashboard', label: 'نظرة عامة', icon: 'space_dashboard' },
  requests: { path: '/admin/requests', label: 'الطلبات', icon: 'inbox' },
  subscribers: { path: '/admin/subscribers', label: 'المشتركون', icon: 'badge' },
  halls: { path: '/admin/halls', label: 'القاعات', icon: 'domain' },
  services: { path: '/admin/services', label: 'الخدمات', icon: 'room_service' },
  accounting: { path: '/admin/accounting', label: 'الحسابات', icon: 'account_balance_wallet' },
  coupons: { path: '/admin/coupons', label: 'الكوبونات', icon: 'sell' },
  store: { path: '/admin/store', label: 'المتجر', icon: 'storefront' },
  content: { path: '/admin/content', label: 'المحتوى', icon: 'web' },
  settings: { path: '/admin/settings', label: 'إعدادات النظام', icon: 'settings' },
} satisfies Record<string, NavItem>;

export const OWNER_NAV: PortalNavigation = {
  role: 'owner',
  label: 'لوحة مالك القاعة',
  groups: [
    {
      title: 'التشغيل',
      items: [ownerItems.dashboard, ownerItems.calendar, ownerItems.bookings],
    },
    { title: 'الأصول', items: [ownerItems.halls, ownerItems.services] },
    {
      title: 'المالية والعملاء',
      items: [
        ownerItems.accounting,
        ownerItems.coupons,
        ownerItems.clients,
        ownerItems.marketplace,
      ],
    },
    { title: 'المنشأة', items: [ownerItems.settings] },
  ],
  primary: [ownerItems.dashboard, ownerItems.calendar, ownerItems.bookings, ownerItems.halls],
};

export const ADMIN_NAV: PortalNavigation = {
  role: 'admin',
  label: 'إدارة المنصة',
  groups: [
    { title: 'المتابعة', items: [adminItems.dashboard, adminItems.requests] },
    {
      title: 'المنصة',
      items: [adminItems.subscribers, adminItems.halls, adminItems.services, adminItems.store],
    },
    { title: 'المالية', items: [adminItems.accounting, adminItems.coupons] },
    { title: 'المحتوى والإعدادات', items: [adminItems.content, adminItems.settings] },
  ],
  primary: [
    adminItems.dashboard,
    adminItems.requests,
    adminItems.subscribers,
    adminItems.accounting,
  ],
};

export function stripUrl(url: string): string {
  return url.split(/[?#]/)[0] || '/';
}

export function isNavActive(item: NavItem, url: string): boolean {
  const path = stripUrl(url);
  if (item.exact) {
    return path === item.path;
  }
  return [item.path, ...(item.alsoActiveFor ?? [])].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Signal of the current URL, updated after every completed navigation. */
export function injectCurrentUrl() {
  const router = inject(Router);
  return toSignal(
    router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: router.url },
  );
}
