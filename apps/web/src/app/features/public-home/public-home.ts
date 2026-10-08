import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';

type SearchMode = 'venues' | 'services';

interface DemoVenue {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly capacity: string;
  readonly price: string;
  readonly rating: string;
  readonly tag: string;
  readonly imagePosition: string;
}

interface DemoService {
  readonly name: string;
  readonly description: string;
  readonly price: string;
  readonly icon: 'camera' | 'flower' | 'coffee' | 'music';
}

@Component({
  selector: 'app-public-home',
  imports: [MatButtonModule, MatToolbarModule, RouterLink],
  templateUrl: './public-home.html',
  styleUrl: './public-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicHome {
  readonly searchMode = signal<SearchMode>('venues');
  readonly searchNotice = signal('');

  readonly venues: readonly DemoVenue[] = [
    {
      slug: 'lilac-royal',
      name: 'قاعة ليلك الملكية',
      city: 'الرياض',
      capacity: '300–500 ضيف',
      price: '18,500 ر.س',
      rating: '4.9',
      tag: 'الأكثر طلباً',
      imagePosition: '18% center',
    },
    {
      slug: 'aroma-palace',
      name: 'قصر أروما',
      city: 'جدة',
      capacity: '200–350 ضيف',
      price: '14,200 ر.س',
      rating: '4.8',
      tag: 'عرض مميز',
      imagePosition: '42% center',
    },
    {
      slug: 'noura-hall',
      name: 'قاعة نورا',
      city: 'الخبر',
      capacity: '150–250 ضيف',
      price: '11,900 ر.س',
      rating: '4.7',
      tag: 'حجز فوري',
      imagePosition: '68% center',
    },
    {
      slug: 'dar-al-sahab',
      name: 'دار السحاب',
      city: 'المدينة المنورة',
      capacity: '350–600 ضيف',
      price: '21,000 ر.س',
      rating: '4.9',
      tag: 'موصى بها',
      imagePosition: '84% center',
    },
  ];

  readonly services: readonly DemoService[] = [
    {
      name: 'التصوير والتوثيق',
      description: 'فرق محترفة لتوثيق يومك بأسلوب أنيق وطبيعي.',
      price: 'من 2,800 ر.س',
      icon: 'camera',
    },
    {
      name: 'تنسيق الزهور',
      description: 'تصاميم متكاملة للطاولات والمداخل ومنصة الحفل.',
      price: 'من 3,500 ر.س',
      icon: 'flower',
    },
    {
      name: 'الضيافة والحلويات',
      description: 'قوائم مرنة وتجربة ضيافة سعودية بمعايير عالية.',
      price: 'من 95 ر.س للفرد',
      icon: 'coffee',
    },
    {
      name: 'الصوت والإضاءة',
      description: 'تجهيز تقني متكامل يناسب مساحة القاعة وبرنامج الحفل.',
      price: 'من 1,900 ر.س',
      icon: 'music',
    },
  ];

  setSearchMode(mode: SearchMode): void {
    this.searchMode.set(mode);
    this.searchNotice.set('');
  }

  runDemoSearch(): void {
    const subject = this.searchMode() === 'venues' ? 'القاعات' : 'الخدمات';
    this.searchNotice.set(`تم عرض نتائج ${subject} التجريبية أدناه.`);
  }
}
