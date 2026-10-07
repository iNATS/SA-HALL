import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'صالة | قاعات وخدمات المناسبات',
    loadComponent: () =>
      import('./features/public-home/public-home').then((module) => module.PublicHome),
  },
  { path: '**', redirectTo: '' },
];
