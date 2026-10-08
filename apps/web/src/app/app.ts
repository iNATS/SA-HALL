import { ChangeDetectionStrategy, Component, Injector, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly injector = inject(Injector);

  constructor() {
    const updates = inject(SwUpdate, { optional: true });
    if (!updates?.isEnabled) {
      return;
    }
    updates.versionUpdates
      .pipe(
        filter((event) => event.type === 'VERSION_READY'),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.offerUpdate());
    // A broken cache cannot recover in place; a reload fetches a clean version.
    updates.unrecoverable.pipe(takeUntilDestroyed()).subscribe(() => location.reload());
  }

  /** The snack bar is loaded on demand to keep it out of the initial bundle. */
  private async offerUpdate(): Promise<void> {
    const { MatSnackBar } = await import('@angular/material/snack-bar');
    this.injector
      .get(MatSnackBar)
      .open('يتوفر إصدار أحدث من التطبيق.', 'تحديث', { duration: 0 })
      .onAction()
      .subscribe(() => location.reload());
  }
}
