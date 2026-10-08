import { toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, fromEvent, map, startWith } from 'rxjs';

/**
 * True once the page has scrolled under the top app bar. Material 3 separates a
 * scrolled app bar from content by switching it to a tonal container, which is
 * how bars stay distinct without borders or shadows. The listener is passive and
 * only emits when the state actually flips.
 */
export function injectScrolled(threshold = 4) {
  const scrolled = () => window.scrollY > threshold;
  return toSignal(
    fromEvent(window, 'scroll', { passive: true }).pipe(
      map(scrolled),
      startWith(scrolled()),
      distinctUntilChanged(),
    ),
    { initialValue: false },
  );
}
