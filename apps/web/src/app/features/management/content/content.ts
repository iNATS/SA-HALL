import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { Notifier } from '../../../core/feedback/notifier';
import { DemoStore } from '../../../core/demo/demo-store';
import { HomeSection } from '../../../core/domain/models';
import { Icon } from '../../../shared/icon/icon';
import { ArDatePipe } from '../../../shared/pipes/format.pipes';

interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly audience: string;
  readonly until: string;
  readonly published: boolean;
}

@Component({
  selector: 'app-content',
  imports: [MatButtonModule, MatSlideToggleModule, RouterLink, Icon, ArDatePipe],
  template: `
    <div class="mp-page layout">
      <section class="mp-panel" aria-labelledby="sections-title">
        <div class="mp-panel-head">
          <div>
            <h2 id="sections-title">أقسام الصفحة الرئيسية</h2>
            <p>رتّب الأقسام وتحكّم في ظهورها للزوار.</p>
          </div>
          <a mat-button routerLink="/"><app-icon name="visibility" />معاينة</a>
        </div>
        <ol class="sections">
          @for (
            section of store.homeSections();
            track section.id;
            let first = $first;
            let last = $last;
            let index = $index
          ) {
            <li [class.off]="!section.visible">
              <span class="order sh-num" aria-hidden="true">{{ index + 1 }}</span>
              <div class="text">
                <strong>{{ section.title }}</strong>
                <small>{{ section.summary }}</small>
              </div>
              <div class="reorder">
                <button
                  mat-icon-button
                  type="button"
                  [disabled]="first"
                  [attr.aria-label]="'نقل ' + section.title + ' للأعلى'"
                  (click)="store.moveSection(section.id, -1)"
                >
                  <app-icon name="arrow_upward" />
                </button>
                <button
                  mat-icon-button
                  type="button"
                  [disabled]="last"
                  [attr.aria-label]="'نقل ' + section.title + ' للأسفل'"
                  (click)="store.moveSection(section.id, 1)"
                >
                  <app-icon name="arrow_downward" />
                </button>
              </div>
              <mat-slide-toggle
                [checked]="section.visible"
                [attr.aria-label]="'إظهار ' + section.title"
                (change)="setSection(section, $event)"
              />
            </li>
          }
        </ol>
      </section>

      <section class="mp-panel" aria-labelledby="announce-title">
        <div class="mp-panel-head">
          <div>
            <h2 id="announce-title">الإعلانات</h2>
            <p>رسائل قصيرة تظهر أعلى صفحات المنصة.</p>
          </div>
        </div>
        <ul class="mp-list">
          @for (item of announcements(); track item.id) {
            <li class="mp-row">
              <span class="mp-avatar" aria-hidden="true"><app-icon name="campaign" /></span>
              <div class="mp-row-main">
                <strong>{{ item.title }}</strong>
                <small>{{ item.audience }} · حتى {{ item.until | arDate: 'short' }}</small>
              </div>
              <mat-slide-toggle
                [checked]="item.published"
                [attr.aria-label]="'نشر ' + item.title"
                (change)="setAnnouncement(item, $event)"
              />
            </li>
          }
        </ul>
        <p class="note">
          <app-icon name="verified_user" />يُعرض المحتوى كنص منسّق آمن؛ لا يُقبل HTML أو نصوص برمجية
          من محرر المحتوى.
        </p>
      </section>
    </div>
  `,
  styles: `
    .layout {
      align-items: start;
      grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    }
    .sections {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .sections li {
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
      padding: 8px 8px 8px 12px;
    }
    .sections li.off .text {
      opacity: 0.6;
    }
    .order {
      display: grid;
      width: 32px;
      height: 32px;
      flex: none;
      place-items: center;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font-weight: 700;
    }
    .text {
      display: grid;
      flex: 1;
      min-width: 0;
    }
    .text small {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    .reorder {
      display: flex;
    }
    .note {
      --sh-icon-size: 18px;
      display: flex;
      align-items: start;
      gap: 8px;
      margin-block-start: 12px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    @media (max-width: 1099.98px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Content {
  protected readonly store = inject(DemoStore);
  private readonly notifier = inject(Notifier);

  protected readonly announcements = signal<readonly Announcement[]>([
    {
      id: 'winter',
      title: 'عروض موسم الشتاء',
      audience: 'كل الزوار',
      until: '2026-12-31',
      published: true,
    },
    {
      id: 'owners',
      title: 'تحديث سياسة العمولة',
      audience: 'ملاك القاعات',
      until: '2026-11-15',
      published: false,
    },
  ]);

  protected setSection(section: HomeSection, event: MatSlideToggleChange): void {
    this.store.setSectionVisibility(section.id, event.checked);
    this.notifier.open(
      event.checked ? `أصبح «${section.title}» ظاهراً` : `أُخفي «${section.title}»`,
    );
  }

  protected setAnnouncement(item: Announcement, event: MatSlideToggleChange): void {
    this.announcements.update((list) =>
      list.map((a) => (a.id === item.id ? { ...a, published: event.checked } : a)),
    );
    this.notifier.open(event.checked ? 'نُشر الإعلان' : 'أُوقف نشر الإعلان');
  }
}
