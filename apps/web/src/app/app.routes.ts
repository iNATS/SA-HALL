import { Routes } from '@angular/router';
import { ADMIN_NAV, OWNER_NAV } from './core/navigation/navigation';
import { PublicShell } from './layout/public-shell/public-shell';

/**
 * Every screen is a lazy chunk, so a visitor downloads only the code for the
 * screens they open. Authorization will be enforced by the API; route guards
 * added later only shape navigation.
 */
export const routes: Routes = [
  {
    path: 'booking/:slug',
    title: 'إتمام الحجز | صالة',
    loadComponent: () =>
      import('./features/public/booking-flow/booking-flow').then((m) => m.BookingFlow),
  },
  {
    path: 'owner',
    data: { nav: OWNER_NAV, role: 'owner' },
    loadComponent: () =>
      import('./layout/management-shell/management-shell').then((m) => m.ManagementShell),
    loadChildren: () =>
      import('./features/management/management.routes').then((m) => m.OWNER_ROUTES),
  },
  {
    path: 'admin',
    data: { nav: ADMIN_NAV, role: 'admin' },
    loadComponent: () =>
      import('./layout/management-shell/management-shell').then((m) => m.ManagementShell),
    loadChildren: () =>
      import('./features/management/management.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    component: PublicShell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'صالة | حجز القاعات الفاخرة',
        loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
      },
      {
        path: 'halls',
        title: 'القاعات | صالة',
        data: { kind: 'halls' },
        loadComponent: () => import('./features/public/catalog/catalog').then((m) => m.Catalog),
      },
      {
        path: 'halls/:slug',
        title: 'تفاصيل القاعة | صالة',
        data: { chrome: 'detail' },
        loadComponent: () =>
          import('./features/public/venue-detail/venue-detail').then((m) => m.VenueDetail),
      },
      {
        path: 'services',
        title: 'الخدمات | صالة',
        data: { kind: 'services' },
        loadComponent: () => import('./features/public/catalog/catalog').then((m) => m.Catalog),
      },
      {
        path: 'sign-in',
        title: 'مساحات العمل | صالة',
        loadComponent: () => import('./features/public/sign-in/sign-in').then((m) => m.SignIn),
      },
      { path: 'portals', redirectTo: 'sign-in', pathMatch: 'full' },
      {
        path: 'client/bookings/:id',
        title: 'تفاصيل الحجز | صالة',
        data: { chrome: 'detail' },
        loadComponent: () =>
          import('./features/client/booking-detail/booking-detail').then((m) => m.BookingDetail),
      },
      {
        path: 'client',
        loadChildren: () => import('./features/client/client.routes').then((m) => m.CLIENT_ROUTES),
      },
      {
        path: '**',
        title: 'الصفحة غير موجودة | صالة',
        loadComponent: () =>
          import('./features/public/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
