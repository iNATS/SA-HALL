import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DEMO_HALLS } from '../../core/demo/demo-data';
import { PublicHeader } from '../../shared/public-header/public-header';

@Component({
  selector: 'app-venue-detail',
  imports: [MatButtonModule, RouterLink, PublicHeader],
  templateUrl: './venue-detail.html',
  styleUrl: './venue-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueDetail {
  private readonly route = inject(ActivatedRoute);
  readonly hall =
    DEMO_HALLS.find((item) => item.slug === this.route.snapshot.paramMap.get('slug')) ??
    DEMO_HALLS[0];
  readonly features = [
    'مدخل مستقل للنساء والرجال',
    'مواقف تتسع لـ 180 سيارة',
    'غرفة عروس مجهزة بالكامل',
    'نظام صوت وإضاءة مدمج',
    'منطقة ضيافة وقهوة',
    'دخول مهيأ للكراسي المتحركة',
  ];
  readonly additions = [
    { name: 'تنسيق المنصة والزهور', price: '3,500 ر.س' },
    { name: 'بوفيه عشاء فاخر', price: '135 ر.س / فرد' },
    { name: 'التصوير والفيديو', price: '2,800 ر.س' },
  ];
}
