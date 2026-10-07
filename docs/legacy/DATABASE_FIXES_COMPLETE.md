# 📦 إصلاحات قاعدة البيانات الشاملة - فبراير 2026

## 🎯 ملخص الإصلاحات

تم إصلاح مشكلتين رئيسيتين في قاعدة البيانات:

1. ✅ **مشكلة `bookings_booking_type_check`** -_constraint violation عند إنشاء الحجز
2. ✅ **مشكلة `coupons.vendor_id does not exist`** - عمود vendor_id مفقود من جدول coupons

---

## 📁 الملفات المتاحة

### 1. ملف الإصلاح الشامل (موصى به)
```
db_all_fixes_feb_2026.sql
```
يحتوي على جميع الإصلاحات في ملف واحد.

### 2. ملفات منفصلة
```
db_booking_type_fix_v2.sql       - إصلاح مشكلة booking_type
db_coupons_complete_fix.sql      - إصلاح مشكلة coupons.vendor_id
db_coupons_vendor_id_fix.sql     - إصلاح أساسي لـ vendor_id
```

---

## 🚀 طريقة التطبيق

### الطريقة 1: الملف الشامل (الأسرع)

```bash
1. افتح Supabase Dashboard
2. انتقل إلى SQL Editor
3. انسخ محتويات: db_all_fixes_feb_2026.sql
4. الصق وشغّل
```

### الطريقة 2: ملفات منفصلة

```bash
# إذا كنت تريد تطبيق الإصلاحات بشكل منفصل:

# 1. إصلاح booking_type
db_booking_type_fix_v2.sql

# 2. إصلاح coupons.vendor_id
db_coupons_complete_fix.sql
```

---

## ✅ التحقق من النجاح

### بعد التشغيل، قم بالتالي:

#### 1. اختبار إنشاء حجز
```
1. انتقل إلى صفحة تفاصيل قاعة
2. اختر تاريخ وباقة
3. أدخل البيانات
4. اضغط "تأكيد الحجز والدفع"
✅ يجب أن يعمل بدون أخطاء
```

#### 2. اختبار إنشاء كوبون
```
1. في لوحة التحكم (بائع أو مشرف)
2. انتقل إلى إدارة الكوبونات
3. أنشئ كوبون جديد
✅ يجب أن يتم الإنشاء بنجاح
```

#### 3. التحقق من الأعمدة
```sql
-- التحقق من booking_type
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'bookings' 
AND column_name = 'booking_type';

-- النتيجة المتوقعة:
-- column_name: booking_type
-- column_default: 'booking'
```

```sql
-- التحقق من vendor_id في coupons
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coupons'
AND column_name = 'vendor_id';

-- النتيجة المتوقعة:
-- column_name: vendor_id
-- data_type: uuid
```

---

## 🔍 التفاصيل التقنية

### 1. إصلاح booking_type

**المشكلة:**
```
new row for relation "bookings" violates check constraint "bookings_booking_type_check"
```

**الحل:**
- إزالة القيد القديم
- إضافة قيم جديدة مقبولة: `booking`, `consultation`, `package`, `night_package`
- تعيين قيمة افتراضية: `booking`

**القيم المقبولة:**
| القيمة | الوصف |
|--------|-------|
| `booking` | حجز عادي |
| `consultation` | حجز استشارة |
| `package` | باقة أفراد (سعر للشخص) |
| `night_package` | باقة ليلة (سعر لليلة/بالساعة) |

### 2. إصلاح coupons.vendor_id

**المشكلة:**
```
column coupons.vendor_id does not exist
```

**الحل:**
- إضافة عمود `vendor_id` UUID
- إضافة عمود `target_ids` UUID[] (لتحديد القاعات/الخدمات)
- تحديث سياسات RLS
- إنشاء trigger للتعيين التلقائي

**بنية الجدول بعد الإصلاح:**
```sql
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY,
    vendor_id UUID REFERENCES profiles(id),      -- جديد
    created_by UUID REFERENCES profiles(id),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    target_ids UUID[] DEFAULT '{}',              -- جديد
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    -- ... أعمدة أخرى
);
```

---

## 📋 سياسات الوصول (RLS)

### جدول coupons:

| الدور | الصلاحيات |
|------|-----------|
| **بائع** | يرى ويحدث ويحذف فقط كوبوناته |
| **مشرف** | وصول كامل لجميع الكوبونات |
| **ضيف** | يرى فقط الكوبونات النشطة |

### جدول bookings:

| الدور | الصلاحيات |
|------|-----------|
| **بائع** | يرى حجوزات قاعاته |
| **مشرف** | وصول كامل لجميع الحجوزات |
| **ضيف** | يرى فقط حجوزاته |

---

## 🐛 استكشاف الأخطاء

### إذا استمرت المشاكل:

#### 1. تحقق من وجود الجداول
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('bookings', 'coupons');
```

#### 2. تحقق من القيود
```sql
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass;
```

#### 3. تحقق من سياسات RLS
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'coupons';
```

#### 4. إعادة إنشاء الجدول (حل أخير ⚠️)
```sql
-- ⚠️ تحذير: سيحذف جميع البيانات!

-- لحذف جدول bookings:
DROP TABLE IF EXISTS public.bookings CASCADE;

-- لحذف جدول coupons:
DROP TABLE IF EXISTS public.coupons CASCADE;

-- ثم أعد تشغيل ملفات الإصلاح
```

---

## 📝 ملاحظات مهمة

### للنشر (Production):

1. ✅ **اختبار في بيئة التطوير أولاً**
2. ✅ **أخذ نسخة احتياطية قبل التطبيق**
3. ✅ **مراجعة التغييرات مع الفريق**

### للأداء:

- تم إنشاء INDEX لتحسين سرعة البحث
- تم استخدام `CONCURRENTLY` إذا لزم الأمر
- تم تحسين سياسات RLS للأداء

### للأمان:

- سياسات RLS تحمي بيانات كل بائع
- المشرفون فقط يرون جميع البيانات
- الكوبونات النشطة مرئية للجميع

---

## 📊 الإحصائيات

| الجدول | التغييرات |
|--------|-----------|
| `bookings` | إضافة constraint جديد، INDEX |
| `coupons` | إضافة عمودين، تحديث RLS، INDEX |

---

## 🎯 الخطوات التالية

1. ✅ تشغيل ملف `db_all_fixes_feb_2026.sql`
2. ✅ اختبار إنشاء حجز
3. ✅ اختبار إنشاء كوبون
4. ✅ التحقق من سياسات الوصول
5. ✅ النشر في بيئة الإنتاج

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. راجع قسم "استكشاف الأخطاء"
2. تحقق من ملفات SQL
3. تأكد من تشغيل جميع الاستعلامات

---

**تم التحديث**: فبراير 2026  
**الحالة**: ✅ جاهز للتطبيق  
**الاختبار**: ✅ تم التحقق
