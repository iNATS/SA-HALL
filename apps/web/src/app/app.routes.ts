import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'صالة | قاعات وخدمات المناسبات',
    loadComponent: () =>
      import('./features/public-home/public-home').then((module) => module.PublicHome),
  },
  {
    path: 'halls',
    title: 'القاعات | صالة',
    data: { kind: 'halls' },
    loadComponent: () => import('./features/catalog/catalog').then((module) => module.Catalog),
  },
  {
    path: 'services',
    title: 'الخدمات | صالة',
    data: { kind: 'services' },
    loadComponent: () => import('./features/catalog/catalog').then((module) => module.Catalog),
  },
  {
    path: 'halls/:slug',
    title: 'تفاصيل القاعة | صالة',
    loadComponent: () =>
      import('./features/venue-detail/venue-detail').then((module) => module.VenueDetail),
  },
  {
    path: 'booking/:slug',
    title: 'إتمام الحجز | صالة',
    loadComponent: () =>
      import('./features/booking-flow/booking-flow').then((module) => module.BookingFlow),
  },
  {
    path: 'portals',
    title: 'بوابات صالة',
    loadComponent: () =>
      import('./features/access-portal/access-portal').then((module) => module.AccessPortal),
  },
  {
    path: 'client',
    title: 'حساب العميل | صالة',
    loadComponent: () =>
      import('./features/client-portal/client-portal').then((module) => module.ClientPortal),
  },
  ...[
    'dashboard',
    'bookings',
    'calendar',
    'halls',
    'services',
    'accounting',
    'clients',
    'settings',
    'coupons',
    'marketplace',
  ].map((page) => ({
    path: `owner/${page}`,
    title: 'لوحة مالك القاعة | صالة',
    data: { role: 'owner', page },
    loadComponent: () =>
      import('./features/management-portal/management-portal').then(
        (module) => module.ManagementPortal,
      ),
  })),
  { path: 'owner', redirectTo: 'owner/dashboard', pathMatch: 'full' },
  ...[
    'dashboard',
    'requests',
    'halls',
    'services',
    'subscribers',
    'accounting',
    'content',
    'settings',
    'coupons',
  ].map((page) => ({
    path: `admin/${page}`,
    title: 'إدارة المنصة | صالة',
    data: { role: 'admin', page },
    loadComponent: () =>
      import('./features/management-portal/management-portal').then(
        (module) => module.ManagementPortal,
      ),
  })),
  {
    path: 'admin/home-sections',
    title: 'أقسام الصفحة الرئيسية | صالة',
    data: { role: 'admin', page: 'content' },
    loadComponent: () =>
      import('./features/management-portal/management-portal').then(
        (module) => module.ManagementPortal,
      ),
  },
  {
    path: 'admin/store',
    title: 'إدارة المتجر | صالة',
    data: { role: 'admin', page: 'marketplace' },
    loadComponent: () =>
      import('./features/management-portal/management-portal').then(
        (module) => module.ManagementPortal,
      ),
  },
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
