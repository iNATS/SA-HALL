import { Routes } from '@angular/router';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./client-area/client-area').then((m) => m.ClientArea),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'bookings' },
      {
        path: 'bookings',
        title: 'حجوزاتي | صالة',
        loadComponent: () => import('./bookings/client-bookings').then((m) => m.ClientBookings),
      },
      {
        path: 'orders',
        title: 'طلبات المتجر | صالة',
        loadComponent: () => import('./orders/client-orders').then((m) => m.ClientOrders),
      },
      {
        path: 'favorites',
        title: 'المفضلة | صالة',
        loadComponent: () => import('./favorites/client-favorites').then((m) => m.ClientFavorites),
      },
      {
        path: 'profile',
        title: 'الملف الشخصي | صالة',
        loadComponent: () => import('./profile/client-profile').then((m) => m.ClientProfile),
      },
    ],
  },
];
