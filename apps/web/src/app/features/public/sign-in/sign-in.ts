import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../shared/icon/icon';
import type { IconName } from '../../../shared/icon/icons';

interface Workspace {
  readonly audience: string;
  readonly title: string;
  readonly icon: IconName;
  readonly link: string;
  readonly action: string;
  readonly features: readonly string[];
}

/**
 * Demo workspace chooser. Real sign-in (password + server-issued OTP with rate
 * limits) belongs to the API identity module and is intentionally not faked here.
 */
@Component({
  selector: 'app-sign-in',
  imports: [MatButtonModule, RouterLink, Icon],
  template: `
    <div class="sh-container page">
      <header class="intro">
        <p class="sh-eyebrow">مساحات العمل</p>
        <h1>اختر طريقة دخولك إلى صالة</h1>
        <p class="sh-muted">
          تجربة كاملة لكل دور بتصميم موحّد. الدخول هنا تجريبي ولا يتطلب كلمة مرور.
        </p>
      </header>
      <ul class="workspaces">
        @for (space of workspaces; track space.link; let first = $first) {
          <li [class.featured]="first">
            <span class="icon"><app-icon [name]="space.icon" filled /></span>
            <p class="audience">{{ space.audience }}</p>
            <h2>{{ space.title }}</h2>
            <ul class="features">
              @for (feature of space.features; track feature) {
                <li><app-icon name="check" />{{ feature }}</li>
              }
            </ul>
            <a mat-flat-button [routerLink]="space.link">{{ space.action }}</a>
          </li>
        }
      </ul>
      <p class="notice">
        <app-icon name="verified_user" />
        سيُفعَّل تسجيل الدخول الحقيقي عبر خادم صالة مع رموز تحقق مؤقتة وصلاحيات تُفرض من الخادم.
      </p>
    </div>
  `,
  styles: `
    .page {
      padding-block: 40px 24px;
    }
    .intro {
      max-width: 640px;
    }
    .intro h1 {
      margin-block: 6px 8px;
      font: var(--mat-sys-headline-large);
      font-size: clamp(1.7rem, 3.4vw, 2.4rem);
      font-weight: 700;
    }
    .workspaces {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin: 32px 0 0;
      padding: 0;
      list-style: none;
    }
    .workspaces > li {
      display: grid;
      align-content: start;
      gap: 10px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-extra-large);
      background: var(--mat-sys-surface-container-lowest);
      padding: 24px;
    }
    .workspaces > li.featured {
      border-color: transparent;
      background: var(--sh-hero-ink);
      color: var(--sh-on-hero);
      --mat-button-filled-container-color: var(--sh-hero-accent);
      --mat-button-filled-label-text-color: #241a00;
    }
    .icon {
      display: grid;
      width: 56px;
      height: 56px;
      place-items: center;
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .featured .icon {
      background: rgb(255 255 255 / 12%);
      color: var(--sh-hero-accent);
    }
    .audience {
      margin-block-start: 8px;
      color: var(--sh-gold-text);
      font: var(--mat-sys-label-large);
      font-weight: 700;
    }
    .featured .audience {
      color: var(--sh-hero-accent);
    }
    h2 {
      font: var(--mat-sys-headline-small);
      font-weight: 700;
    }
    .features {
      --sh-icon-size: 18px;
      display: grid;
      gap: 6px;
      margin: 4px 0 16px;
      padding: 0;
      color: var(--mat-sys-on-surface-variant);
      list-style: none;
    }
    .featured .features {
      color: var(--sh-on-hero-variant);
    }
    .features li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .features app-icon {
      color: var(--mat-sys-primary);
    }
    .featured .features app-icon {
      color: var(--sh-hero-accent);
    }
    a[mat-flat-button] {
      height: 48px;
    }
    .notice {
      display: flex;
      align-items: start;
      gap: 10px;
      margin-block-start: 24px;
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-low);
      padding: 16px;
      color: var(--mat-sys-on-surface-variant);
    }
    @media (max-width: 899.98px) {
      .workspaces {
        grid-template-columns: 1fr;
      }
      .page {
        padding-block-start: 24px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn {
  protected readonly workspaces: readonly Workspace[] = [
    {
      audience: 'للعملاء',
      title: 'حجوزاتي ومناسباتي',
      icon: 'confirmation_number',
      link: '/client/bookings',
      action: 'الدخول كعميل',
      features: ['متابعة حالة الحجز والدفعات', 'المفضلة وطلبات المتجر', 'الملف الشخصي والتنبيهات'],
    },
    {
      audience: 'لملاك القاعات',
      title: 'إدارة المنشأة',
      icon: 'domain',
      link: '/owner/dashboard',
      action: 'الدخول كمالك قاعة',
      features: [
        'التقويم والحجوزات والموافقات',
        'القاعات والخدمات والكوبونات',
        'الحسابات والعملاء',
      ],
    },
    {
      audience: 'لإدارة صالة',
      title: 'إدارة المنصة',
      icon: 'admin_panel_settings',
      link: '/admin/dashboard',
      action: 'الدخول كمدير',
      features: [
        'طلبات التسجيل والترقيات',
        'المشتركون والقاعات والمتجر',
        'المحتوى وإعدادات النظام',
      ],
    },
  ];
}
