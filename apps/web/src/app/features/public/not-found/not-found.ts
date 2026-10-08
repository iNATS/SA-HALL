import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../shared/empty-state/empty-state';

@Component({
  selector: 'app-not-found',
  imports: [MatButtonModule, RouterLink, EmptyState],
  template: `
    <div class="sh-container page">
      <h1 class="sh-visually-hidden">الصفحة غير موجودة</h1>
      <app-empty-state
        icon="help"
        title="لم نجد هذه الصفحة"
        message="ربما تغيّر الرابط أو أُزيلت الصفحة. يمكنك متابعة التصفح من الرئيسية."
      >
        <a mat-flat-button routerLink="/">العودة للرئيسية</a>
      </app-empty-state>
    </div>
  `,
  styles: `
    .page {
      padding-block: 48px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
