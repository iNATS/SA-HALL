import { Routes } from '@angular/router';

const dashboard = () => import('./dashboard/dashboard').then((m) => m.Dashboard);
const assets = () => import('./assets/assets').then((m) => m.Assets);
const accounting = () => import('./accounting/accounting').then((m) => m.Accounting);
const coupons = () => import('./coupons/coupons').then((m) => m.Coupons);
const store = () => import('./store/store').then((m) => m.Store);
const settings = () => import('./settings/settings').then((m) => m.Settings);

/** Hall-owner workspace. Pages receive `role` from the parent route data. */
export const OWNER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', title: 'نظرة عامة | لوحة المالك', loadComponent: dashboard },
  {
    path: 'calendar',
    title: 'التقويم | لوحة المالك',
    loadComponent: () => import('./calendar/calendar').then((m) => m.Calendar),
  },
  {
    path: 'bookings',
    title: 'الحجوزات | لوحة المالك',
    loadComponent: () => import('./bookings/bookings').then((m) => m.Bookings),
  },
  { path: 'halls', title: 'قاعاتي | لوحة المالك', data: { kind: 'halls' }, loadComponent: assets },
  {
    path: 'services',
    title: 'خدماتي | لوحة المالك',
    data: { kind: 'services' },
    loadComponent: assets,
  },
  { path: 'accounting', title: 'الحسابات | لوحة المالك', loadComponent: accounting },
  { path: 'coupons', title: 'الكوبونات | لوحة المالك', loadComponent: coupons },
  {
    path: 'clients',
    title: 'العملاء | لوحة المالك',
    loadComponent: () => import('./clients/clients').then((m) => m.Clients),
  },
  { path: 'marketplace', title: 'متجر المنصة | لوحة المالك', loadComponent: store },
  { path: 'settings', title: 'إعدادات المنشأة | لوحة المالك', loadComponent: settings },
];

/** Platform administration workspace. */
export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', title: 'نظرة عامة | إدارة صالة', loadComponent: dashboard },
  {
    path: 'requests',
    title: 'الطلبات | إدارة صالة',
    loadComponent: () => import('./requests/requests').then((m) => m.Requests),
  },
  {
    path: 'subscribers',
    title: 'المشتركون | إدارة صالة',
    loadComponent: () => import('./subscribers/subscribers').then((m) => m.Subscribers),
  },
  { path: 'halls', title: 'القاعات | إدارة صالة', data: { kind: 'halls' }, loadComponent: assets },
  {
    path: 'services',
    title: 'الخدمات | إدارة صالة',
    data: { kind: 'services' },
    loadComponent: assets,
  },
  { path: 'accounting', title: 'الحسابات | إدارة صالة', loadComponent: accounting },
  { path: 'coupons', title: 'الكوبونات | إدارة صالة', loadComponent: coupons },
  { path: 'store', title: 'المتجر | إدارة صالة', loadComponent: store },
  {
    path: 'content',
    title: 'المحتوى | إدارة صالة',
    loadComponent: () => import('./content/content').then((m) => m.Content),
  },
  { path: 'settings', title: 'إعدادات النظام | إدارة صالة', loadComponent: settings },
  { path: 'home-sections', redirectTo: 'content', pathMatch: 'full' },
  { path: 'marketplace', redirectTo: 'store', pathMatch: 'full' },
];
