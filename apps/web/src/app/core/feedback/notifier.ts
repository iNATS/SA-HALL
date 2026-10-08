import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

/**
 * Snack bar feedback with the app's defaults. Kept out of the root providers so
 * the overlay code is only downloaded by screens that actually give feedback.
 */
@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly snackBar = inject(MatSnackBar);

  open(message: string, action?: string): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action, {
      duration: action ? 6000 : 4000,
      panelClass: 'sh-snackbar',
      politeness: 'polite',
    });
  }
}
