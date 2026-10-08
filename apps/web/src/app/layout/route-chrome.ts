import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

/**
 * Route-level chrome. `full` shows the shell's app bars; `detail` hands the compact
 * top bar to the page (immersive pushed screens) and hides the bottom navigation.
 */
export type RouteChrome = 'full' | 'detail';

function deepest(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let current = snapshot;
  while (current.firstChild) {
    current = current.firstChild;
  }
  return current;
}

export function injectRouteChrome() {
  const router = inject(Router);
  return toSignal(
    router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(
        () =>
          (deepest(router.routerState.snapshot.root).data['chrome'] as RouteChrome | undefined) ??
          'full',
      ),
    ),
    { initialValue: 'full' as RouteChrome },
  );
}
