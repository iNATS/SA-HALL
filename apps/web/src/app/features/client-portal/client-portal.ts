import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { PublicHeader } from '../../shared/public-header/public-header';

type ClientTab = 'bookings' | 'orders' | 'profile';

@Component({
  selector: 'app-client-portal',
  imports: [MatButtonModule, RouterLink, PublicHeader],
  templateUrl: './client-portal.html',
  styleUrl: './client-portal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientPortal {
  readonly activeTab = signal<ClientTab>('bookings');
  readonly selectedBooking = signal<string | null>(null);
  selectTab(tab: ClientTab): void {
    this.activeTab.set(tab);
    this.selectedBooking.set(null);
  }
  openBooking(id: string): void {
    this.selectedBooking.set(id);
  }
  closeBooking(): void {
    this.selectedBooking.set(null);
  }
}
