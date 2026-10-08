import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { DemoStore } from '../../../core/demo/demo-store';
import { Favorites } from '../../../core/demo/favorites';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { HallCard } from '../../../shared/hall-card/hall-card';

@Component({
  selector: 'app-client-favorites',
  imports: [MatButtonModule, RouterLink, EmptyState, HallCard],
  template: `
    <h2 class="sh-visually-hidden">القاعات المفضلة</h2>
    <div class="grid" role="list">
      @for (hall of halls(); track hall.slug) {
        <app-hall-card role="listitem" [hall]="hall" />
      } @empty {
        <app-empty-state
          class="span-all"
          icon="favorite"
          title="لا توجد قاعات محفوظة"
          message="اضغط على رمز القلب في أي قاعة لحفظها هنا ومقارنتها لاحقاً."
        >
          <a mat-flat-button routerLink="/halls">اكتشف القاعات</a>
        </app-empty-state>
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    }
    .span-all {
      grid-column: 1 / -1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFavorites {
  private readonly store = inject(DemoStore);
  private readonly favorites = inject(Favorites);

  protected readonly halls = computed(() => {
    const saved = this.favorites.all();
    return this.store.publicHalls().filter((hall) => saved.has(hall.slug));
  });
}
