# 🔧 إصلاح مشكلة `coupons.vendor_id does not exist`

## 📋 المشكلة

عند محاولة إنشاء أو تعديل كوبون، يظهر الخطأ:
```
column coupons.vendor_id does not exist
```

## 🎯 السبب

جدول `coupons` في قاعدة البيانات لا يحتوي على عمود `vendor_id`، ولكن:
- بعض ملفات SQL تشير إلى هذا العمود
- سياسات RLS (Row Level Security) تتطلب وجوده
- الكود في التطبيق يتوقع وجوده

## ✅ الحل

### الطريقة 1: تشغيل ملف الإصلاح الشامل (موصى به)

```sql
-- في Supabase SQL Editor، قم بتشغيل:
db_coupons_complete_fix.sql
```

هذا الملف يقوم بـ:
1. ✅ إضافة عمود `vendor_id` إذا لم يكن موجوداً
2. ✅ إضافة عمود `target_ids` لتحديد القاعات/الخدمات المستهدفة
3. ✅ إنشاء INDEX لتحسين الأداء
4. ✅ تحديث سياسات RLS
5. ✅ إنشاء trigger لتعيين `vendor_id` تلقائياً
6. ✅ إصلاح العلاقات بين الجداول

### الطريقة 2: الخطوات اليدوية

إذا كنت تفضل التنفيذ اليدوي:

```sql
-- 1. إضافة العمود
ALTER TABLE public.coupons
ADD COLUMN vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. إنشاء INDEX
CREATE INDEX IF NOT EXISTS idx_coupons_vendor_id ON public.coupons(vendor_id);

-- 3. تحديث الكوبونات الموجودة
UPDATE public.coupons
SET vendor_id = created_by
WHERE vendor_id IS NULL AND created_by IS NOT NULL;

-- 4. تحديث سياسات RLS
DROP POLICY IF EXISTS "vendors_view_own_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_create_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_update_own_coupons" ON public.coupons;

CREATE POLICY "vendors_view_own_coupons" ON public.coupons
FOR SELECT
USING (auth.uid() = vendor_id OR vendor_id IS NULL);

CREATE POLICY "vendors_create_coupons" ON public.coupons
FOR INSERT
WITH CHECK (auth.uid() = vendor_id OR vendor_id IS NULL);

CREATE POLICY "vendors_update_own_coupons" ON public.coupons
FOR UPDATE
USING (auth.uid() = vendor_id OR vendor_id IS NULL);
```

## 📁 الملفات ذات الصلة

| الملف | الوصف |
|------|-------|
| `db_coupons_complete_fix.sql` | الإصلاح الشامل (موصى به) |
| `db_coupons_vendor_id_fix.sql` | إصلاح أساسي |
| `db_coupons.sql` | الملف الأصلي (بدون vendor_id) |
| `db_comprehensive_fix.sql` | يحتوي على جدول coupons مع vendor_id |

## 🚀 طريقة التطبيق

### الخطوة 1: تشغيل ملف الإصلاح
```bash
1. افتح Supabase Dashboard
2. انتقل إلى SQL Editor
3. انسخ محتويات: db_coupons_complete_fix.sql
4. الصق وشغّل
```

### الخطوة 2: التحقق من النجاح
```sql
-- التحقق من وجود العمود
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'coupons' AND column_name = 'vendor_id';

-- يجب أن ترى نتيجة مثل:
-- column_name: vendor_id
-- data_type: uuid
-- is_nullable: YES
```

### الخطوة 3: اختبار الإنشاء
```sql
-- اختبار إنشاء كوبون جديد
INSERT INTO public.coupons (code, discount_type, discount_value, start_date, end_date)
VALUES ('TEST10', 'percentage', 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- التحقق من أن vendor_id تم تعيينه تلقائياً
SELECT code, vendor_id, created_by FROM public.coupons WHERE code = 'TEST10';
```

## 🔍 استكشاف الأخطاء

### إذا استمر الخطأ:

#### 1. تحقق من وجود العمود
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'coupons';
```

#### 2. تحقق من سياسات RLS
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'coupons';
```

#### 3. إعادة إنشاء الجدول (حل أخير - ⚠️ سيحذف البيانات)
```sql
-- ⚠️ تحذير: هذا سيحذف جميع الكوبونات!
DROP TABLE IF EXISTS public.coupons CASCADE;

-- ثم قم بتشغيل:
-- 1. db_coupons.sql
-- 2. db_coupons_complete_fix.sql
```

## 📝 ملاحظات مهمة

### بنية جدول coupons:
```sql
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY,
    vendor_id UUID REFERENCES profiles(id),  -- معرف البائع
    created_by UUID REFERENCES profiles(id), -- من أنشأ الكوبون
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    target_ids UUID[] DEFAULT '{}',  -- القاعات/الخدمات المستهدفة
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    -- ... أعمدة أخرى
);
```

### الفرق بين `vendor_id` و `created_by`:
- `vendor_id`: البائع المالك للكوبون (من profiles)
- `created_by`: المستخدم الذي أنشأ الكوبون (من profiles)
- في معظم الحالات، يكونان نفس القيمة

### سياسات الوصول:
| الدور | الصلاحيات |
|------|-----------|
| **بائع** | يرى ويحدث ويحذف فقط كوبوناته |
| **مشرف** | وصول كامل لجميع الكوبونات |
| **ضيف** | يرى فقط الكوبونات النشطة |

## ✅ التحقق من النجاح

بعد تشغيل الإصلاح، يجب أن:
- ✅ لا يظهر خطأ `vendor_id does not exist`
- ✅ يتم إنشاء كوبونات جديدة بنجاح
- ✅ البائعون يرون فقط كوبوناتهم
- ✅ الكوبونات النشطة مرئية للجميع

---

**تم التحديث**: فبراير 2026  
**الحالة**: ✅ جاهز للتطبيق
