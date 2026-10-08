import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { Notifier } from '../../../core/feedback/notifier';
import { CITIES, DEMO_CLIENT } from '../../../core/demo/demo-data';
import { Icon } from '../../../shared/icon/icon';

@Component({
  selector: 'app-client-profile',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    RouterLink,
    Icon,
  ],
  template: `
    <div class="layout">
      <form class="card" [formGroup]="form" (ngSubmit)="save()" aria-labelledby="profile-title">
        <h2 id="profile-title">البيانات الشخصية</h2>
        <p class="sh-muted">تُستخدم في حجوزاتك وفواتيرك فقط.</p>
        <div class="sh-form-grid">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>الاسم الكامل</mat-label>
            <input matInput formControlName="name" autocomplete="name" required />
            <mat-error>أدخل الاسم الكامل.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>رقم الجوال</mat-label>
            <input
              matInput
              type="tel"
              dir="ltr"
              inputmode="tel"
              formControlName="phone"
              autocomplete="tel-national"
              required
            />
            <mat-error>أدخل رقم جوال سعودياً يبدأ بـ 05 من 10 أرقام.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>البريد الإلكتروني</mat-label>
            <input matInput type="email" dir="ltr" formControlName="email" autocomplete="email" />
            <mat-error>أدخل بريداً إلكترونياً صحيحاً.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>المدينة</mat-label>
            <mat-select formControlName="city">
              @for (city of cities; track city) {
                <mat-option [value]="city">{{ city }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <button mat-flat-button type="submit" [disabled]="form.pristine">حفظ التغييرات</button>
      </form>

      <section class="card" aria-labelledby="prefs-title">
        <h2 id="prefs-title">التنبيهات</h2>
        <div class="toggle">
          <div>
            <strong>تذكيرات الدفع والمواعيد</strong>
            <small>رسالة نصية قبل موعد السداد والمناسبة.</small>
          </div>
          <mat-slide-toggle checked aria-label="تذكيرات الدفع والمواعيد" />
        </div>
        <div class="toggle">
          <div>
            <strong>العروض الموسمية</strong>
            <small>رسائل بريدية عن عروض القاعات المختارة.</small>
          </div>
          <mat-slide-toggle aria-label="العروض الموسمية" />
        </div>
        <div class="links">
          <a mat-button routerLink="/sign-in"><app-icon name="swap_horiz" />تبديل مساحة العمل</a>
          <a mat-button routerLink="/" class="danger"
            ><app-icon name="logout" mirror />تسجيل الخروج</a
          >
        </div>
      </section>
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      align-items: start;
      gap: 16px;
      grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    }
    .card {
      display: grid;
      gap: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-lowest);
      padding: 20px;
    }
    h2 {
      font: var(--mat-sys-title-large);
      font-weight: 700;
    }
    form button {
      justify-self: start;
      height: 48px;
    }
    .toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-block-end: 1px solid var(--mat-sys-outline-variant);
      padding-block: 8px 14px;
    }
    .toggle div {
      display: grid;
    }
    .toggle small {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
    .links {
      display: grid;
      justify-items: start;
    }
    .danger {
      --mat-button-text-label-text-color: var(--mat-sys-error);
    }
    @media (max-width: 839.98px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientProfile {
  private readonly notifier = inject(Notifier);
  protected readonly cities = CITIES;

  protected readonly form = new FormGroup({
    name: new FormControl(DEMO_CLIENT.name, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(80)],
    }),
    phone: new FormControl(DEMO_CLIENT.phone, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^05\d{8}$/)],
    }),
    email: new FormControl(DEMO_CLIENT.email, {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(120)],
    }),
    city: new FormControl<string>(DEMO_CLIENT.city, { nonNullable: true }),
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.form.markAsPristine();
    this.notifier.open('تم حفظ بياناتك (معاينة تجريبية)');
  }
}
