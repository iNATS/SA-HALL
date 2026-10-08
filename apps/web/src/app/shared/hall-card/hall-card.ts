import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  computed,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterLink } from '@angular/router';
import { Favorites } from '../../core/demo/favorites';
import { Hall } from '../../core/domain/models';
import { photoSrc, photoSrcset } from '../../core/domain/photos';
import { Icon } from '../icon/icon';
import { NumberPipe, SarPipe } from '../pipes/format.pipes';

@Component({
  selector: 'app-hall-card',
  imports: [MatButtonModule, MatCardModule, RouterLink, Icon, NumberPipe, SarPipe],
  templateUrl: './hall-card.html',
  styleUrl: './hall-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HallCard {
  private readonly favorites = inject(Favorites);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  readonly hall = input.required<Hall>();
  /** Eager-load the first visible cards; everything else is lazy. */
  readonly eager = input(false);
  readonly sizes = input('(max-width: 599px) 85vw, (max-width: 1239px) 45vw, 380px');
  readonly headingLevel = input<2 | 3>(3);

  protected readonly src = computed(() => photoSrc(this.hall().photo, 480));
  protected readonly srcset = computed(() => photoSrcset(this.hall().photo));
  protected readonly saved = computed(() => this.favorites.all().has(this.hall().slug));

  protected async toggleFavorite(): Promise<void> {
    const added = this.favorites.toggle(this.hall().slug);
    // Feedback code loads on first use so browsing pages stay light.
    const { Notifier } = await import('../../core/feedback/notifier');
    const ref = this.injector
      .get(Notifier)
      .open(
        added ? 'أُضيفت القاعة إلى المفضلة' : 'أُزيلت القاعة من المفضلة',
        added ? 'عرض' : undefined,
      );
    ref.onAction().subscribe(() => void this.router.navigateByUrl('/client/favorites'));
  }
}
