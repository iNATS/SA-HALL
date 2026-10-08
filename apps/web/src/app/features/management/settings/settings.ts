import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Notifier } from '../../../core/feedback/notifier';
import { CITIES, DEMO_ADMIN, DEMO_OWNER } from '../../../core/demo/demo-data';
import { DEPOSIT_RATE, PLATFORM_FEE_RATE, VAT_RATE } from '../../../core/domain/pricing';
import { PortalRole } from '../../../core/navigation/navigation';
import { confirmAction } from '../../../shared/confirm-dialog/confirm-dialog';
import { Icon } from '../../../shared/icon/icon';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    Icon,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly notifier = inject(Notifier);
  private readonly dialog = inject(MatDialog);

  readonly role = input<PortalRole>('owner');

  protected readonly cities = CITIES;
  protected readonly vatPercent = VAT_RATE * 100;
  protected readonly isAdmin = computed(() => this.role() === 'admin');

  /** Hall-owner organisation profile and booking policy. */
  protected readonly owner = new FormGroup({
    name: new FormControl(DEMO_OWNER.organization, {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    commercialRegister: new FormControl('1010765432', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{10}$/)],
    }),
    // Saudi VAT registration numbers are 15 digits that start and end with 3.
    vatNumber: new FormControl('310123456700003', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^3\d{13}3$/)],
    }),
    email: new FormControl<string>(DEMO_OWNER.contact, {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('0112345678', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^0\d{8,9}$/)],
    }),
    city: new FormControl<string>('الرياض', { nonNullable: true }),
    deposit: new FormControl(DEPOSIT_RATE * 100, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(10), Validators.max(100)],
    }),
    notice: new FormControl(2, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(60)],
    }),
  });

  /** Platform-wide configuration. Gateway credentials never pass through the browser. */
  protected readonly platform = new FormGroup({
    supportEmail: new FormControl<string>('support@sa-hall.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    supportPhone: new FormControl('920012345', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{9,10}$/)],
    }),
    commission: new FormControl(PLATFORM_FEE_RATE * 100, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(30)],
    }),
    deposit: new FormControl(DEPOSIT_RATE * 100, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(10), Validators.max(100)],
    }),
  });

  protected readonly adminEmail = DEMO_ADMIN.email;

  protected save(form: FormGroup): void {
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    form.markAsPristine();
    this.notifier.open('حُفظت الإعدادات (معاينة تجريبية؛ يُطبّق الخادم التغيير مع سجل تدقيق)');
  }

  protected toggleMaintenance(event: MatSlideToggleChange): void {
    if (!event.checked) {
      this.notifier.open('أُعيد فتح المنصة للعملاء');
      return;
    }
    confirmAction(this.dialog, {
      title: 'تفعيل وضع الصيانة؟',
      message: 'سيتوقف استقبال الحجوزات الجديدة وتظهر رسالة صيانة لكل الزوار.',
      confirmLabel: 'تفعيل الصيانة',
      destructive: true,
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.notifier.open('فُعّل وضع الصيانة');
      } else {
        event.source.checked = false;
      }
    });
  }
}
