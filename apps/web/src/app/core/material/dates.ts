import { Provider } from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

/**
 * Date picker support for the components that need it (Gregorian calendar,
 * Arabic month names, Latin digits). Provided per component so screens without
 * a date picker never download the adapter.
 */
export function provideArabicDates(): Provider[] {
  return [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'ar-SA-u-ca-gregory-nu-latn' },
  ];
}
