# 🔧 إصلاح مشكلة حجز القاعة - payment_status constraint

## 📋 المشكلة

**الخطأ**:
```
new row for relation "bookings" violates check constraint "bookings_payment_status_check"
```

**السبب**:
- القيم المرسلة لـ `payment_status` لا تتطابق مع القيم المسموحة في القيد
- قد يكون العمود `payment_status` غير موجود في بعض قواعد البيانات
- قد تكون هناك قيم قديمة غير متوافقة

---

## ✅ الحل

### 1. ✅ تشغيل ملف SQL للإصلاح

**الملف**: `db_bookings_payment_status_fix.sql`

**ما يفعله**:
1. يزيل القيد القديم
2. يضيف الأعمدة الناقصة
3. يحدث القيم الحالية
4. يضيف القيد الجديد بقيم صحيحة
5. ينشئ INDEX لتحسين الأداء

---

### 2. ✅ القيم المقبولة

#### payment_status:
| القيمة | الوصف |
|--------|-------|
| `pending` | قيد الدفع (افتراضي) |
| `paid` | تم الدفع |
| `failed` | فشل الدفع |
| `refunded` | تم الاسترداد |
| `cancelled` | ألغي |

#### status:
| القيمة | الوصف |
|--------|-------|
| `pending` | قيد الانتظار (افتراضي) |
| `confirmed` | مؤكد |
| `cancelled` | ملغي |
| `blocked` | محجوب |

---

### 3. ✅ الكود في HallDetails.tsx

**موقع الكود**: السطر 268-295

```typescript
const { data, error } = await supabase.from('bookings').insert([{
    hall_id: item.id,
    vendor_id: item.vendor_id,
    booking_date: format(bookingDate, 'yyyy-MM-dd'),
    total_amount: priceDetails.grandTotal,
    vat_amount: priceDetails.vatAmount,
    paid_amount: 0,
    discount_amount: priceDetails.discountAmount,
    applied_coupon: appliedCoupon?.code,
    booking_option: paymentOption,
    package_details: bookingType === 'package' ? selectedPackage : selectedNightPackage,
    booking_type: bookingType || 'booking',
    guest_name: guestData.name,
    guest_phone: normalizedPhone,
    guest_email: guestData.email,
    user_id: user?.id || null,
    status: 'pending',              // ✅ قيمة صحيحة
    payment_status: 'pending',      // ✅ قيمة صحيحة
    guests_adults: guestCounts.men,
    guests_children: guestCounts.women,
    items: [...]
}]).select().single();
```

---

## 🚀 طريقة التطبيق

### الخطوة 1: تشغيل SQL
```bash
1. افتح Supabase Dashboard
2. انتقل إلى SQL Editor
3. انسخ محتويات: db_bookings_payment_status_fix.sql
4. الصق وشغّل
```

### الخطوة 2: اختبار الحجز
```bash
1. انتقل إلى صفحة تفاصيل قاعة
2. اختر تاريخ وباقة
3. أدخل البيانات
4. اضغط "تأكيد الحجز والدفع"
✅ يجب أن يعمل بدون أخطاء
```

---

## 📁 الملفات الجديدة

| الملف | الوصف |
|------|-------|
| `db_bookings_payment_status_fix.sql` | ⭐ إصلاح قاعدة البيانات |
| `BOOKING_PAYMENT_FIX.md` | ⭐ التوثيق |

---

## 🔍 استكشاف الأخطاء

### إذا استمر الخطأ:

#### 1. تحقق من وجود العمود
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'payment_status';
```

#### 2. تحقق من القيود
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND contype = 'c';
```

#### 3. تحقق من القيم الحالية
```sql
SELECT DISTINCT payment_status, status
FROM bookings;
```

#### 4. إصلاح يدوي (إذا لزم الأمر)
```sql
-- إزالة جميع القيود القديمة
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

-- تحديث القيم
UPDATE bookings
SET payment_status = 'pending'
WHERE payment_status IS NULL 
   OR payment_status NOT IN ('pending', 'paid', 'failed', 'refunded', 'cancelled');

UPDATE bookings
SET status = 'pending'
WHERE status IS NULL 
   OR status NOT IN ('pending', 'confirmed', 'cancelled', 'blocked');

-- إضافة القيود الجديدة
ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'blocked'));
```

---

## 📝 ملاحظات مهمة

### للأمان:
- ✅ جميع القيم الافتراضية `pending`
- ✅ لا يمكن إنشاء حجز بدون `payment_status`
- ✅ القيود تحمي من قيم غير صحيحة

### للأداء:
- ✅ INDEX على `payment_status`
- ✅ INDEX على `status`
- ✅ INDEX على `booking_date`

---

## ✅ التحقق من النجاح

بعد تشغيل الإصلاح:
- ✅ إنشاء حجز جديد يعمل بدون أخطاء
- ✅ القيم `pending` تُقبل بشكل صحيح
- ✅ لا توجد أخطاء constraint
- ✅ الحجز ينتقل بنجاح لبوابة الدفع

---

**تم التحديث**: فبراير 2026  
**الحالة**: ✅ جاهز للتطبيق
