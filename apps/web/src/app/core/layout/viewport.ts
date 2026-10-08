import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/**
 * Material 3 window size classes. Below 840px the app behaves like a native
 * mobile app (bottom navigation, full-screen dialogs, floating actions).
 */
export const COMPACT_QUERY = '(max-width: 839.98px)';

@Injectable({ providedIn: 'root' })
export class Viewport {
  private readonly observer = inject(BreakpointObserver);

  readonly compact = toSignal(
    this.observer.observe(COMPACT_QUERY).pipe(map((state) => state.matches)),
    { initialValue: false },
  );
}
