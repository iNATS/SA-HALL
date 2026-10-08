export interface DemoHall {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly district: string;
  readonly capacity: string;
  readonly price: number;
  readonly rating: string;
  readonly reviews: number;
  readonly tag: string;
  readonly position: string;
}

export interface DemoService {
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly city: string;
  readonly price: number;
  readonly rating: string;
  readonly description: string;
}

export const DEMO_HALLS: readonly DemoHall[] = [
  {
    slug: 'lilac-royal',
    name: 'قاعة ليلك الملكية',
    city: 'الرياض',
    district: 'حي الياسمين',
    capacity: '300–500',
    price: 18500,
    rating: '4.9',
    reviews: 126,
    tag: 'الأكثر طلباً',
    position: '18% center',
  },
  {
    slug: 'aroma-palace',
    name: 'قصر أروما',
    city: 'جدة',
    district: 'حي الشاطئ',
    capacity: '200–350',
    price: 14200,
    rating: '4.8',
    reviews: 94,
    tag: 'عرض مميز',
    position: '42% center',
  },
  {
    slug: 'noura-hall',
    name: 'قاعة نورا',
    city: 'الخبر',
    district: 'حي الحزام',
    capacity: '150–250',
    price: 11900,
    rating: '4.7',
    reviews: 78,
    tag: 'حجز فوري',
    position: '68% center',
  },
  {
    slug: 'dar-al-sahab',
    name: 'دار السحاب',
    city: 'المدينة المنورة',
    district: 'حي الهجرة',
    capacity: '350–600',
    price: 21000,
    rating: '4.9',
    reviews: 142,
    tag: 'موصى بها',
    position: '84% center',
  },
  {
    slug: 'violet-garden',
    name: 'حديقة فيوليت',
    city: 'الرياض',
    district: 'حي الرمال',
    capacity: '180–300',
    price: 13500,
    rating: '4.6',
    reviews: 61,
    tag: 'مساحة خارجية',
    position: '30% center',
  },
  {
    slug: 'al-masa',
    name: 'قاعة الماسة',
    city: 'جدة',
    district: 'حي النهضة',
    capacity: '400–700',
    price: 24500,
    rating: '4.9',
    reviews: 175,
    tag: 'فئة فاخرة',
    position: '74% center',
  },
];

export const DEMO_SERVICES: readonly DemoService[] = [
  {
    slug: 'lens-story',
    name: 'عدسة الحكاية',
    category: 'التصوير والتوثيق',
    city: 'الرياض',
    price: 2800,
    rating: '4.9',
    description: 'تصوير فوتوغرافي وفيديو مع فيلم قصير للمناسبة.',
  },
  {
    slug: 'bloom',
    name: 'بلوم لتنسيق الزهور',
    category: 'التنسيق والديكور',
    city: 'جدة',
    price: 3500,
    rating: '4.8',
    description: 'هوية بصرية متكاملة للطاولات والمداخل والمنصة.',
  },
  {
    slug: 'diwaniya',
    name: 'ضيافة الديوانية',
    category: 'الضيافة والحلويات',
    city: 'الرياض',
    price: 95,
    rating: '4.7',
    description: 'قهوة سعودية وحلويات وطاقم ضيافة محترف.',
  },
  {
    slug: 'tone-light',
    name: 'نغمة ونور',
    category: 'الصوت والإضاءة',
    city: 'الخبر',
    price: 1900,
    rating: '4.8',
    description: 'نظام صوت وإضاءة ذكية بإشراف فني طوال المناسبة.',
  },
  {
    slug: 'white-table',
    name: 'المائدة البيضاء',
    category: 'التموين',
    city: 'جدة',
    price: 140,
    rating: '4.6',
    description: 'قوائم عشاء مرنة وخيارات نباتية وتجهيز كامل.',
  },
  {
    slug: 'invite-studio',
    name: 'استديو الدعوة',
    category: 'الدعوات الرقمية',
    city: 'عن بُعد',
    price: 650,
    rating: '4.9',
    description: 'دعوات رقمية، تأكيد حضور، ورسائل تذكير للضيوف.',
  },
];

export const DEMO_BOOKINGS = [
  {
    id: 'SH-24081',
    hall: 'قاعة ليلك الملكية',
    customer: 'نورة العتيبي',
    date: '18 نوفمبر 2026',
    total: '21,275 ر.س',
    status: 'مؤكد',
    payment: 'مدفوع جزئياً',
  },
  {
    id: 'SH-24074',
    hall: 'قصر أروما',
    customer: 'سارة الحربي',
    date: '24 نوفمبر 2026',
    total: '16,330 ر.س',
    status: 'بانتظار الموافقة',
    payment: 'عربون مدفوع',
  },
  {
    id: 'SH-24063',
    hall: 'قاعة نورا',
    customer: 'ريم القحطاني',
    date: '02 ديسمبر 2026',
    total: '13,685 ر.س',
    status: 'مؤكد',
    payment: 'مدفوع',
  },
  {
    id: 'SH-24052',
    hall: 'دار السحاب',
    customer: 'خالد السبيعي',
    date: '12 ديسمبر 2026',
    total: '24,150 ر.س',
    status: 'قيد المراجعة',
    payment: 'غير مدفوع',
  },
] as const;
