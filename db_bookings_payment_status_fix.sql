-- =====================================================
-- إصلاح مشكلة bookings payment_status constraint
-- =====================================================
-- المشكلة: new row for relation "bookings" violates check constraint "bookings_payment_status_check"
-- السبب: القيم المرسلة لا تتطابق مع القيم المسموحة في القيد
-- =====================================================

-- 1. إزالة القيد القديم إذا وجد
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- 2. إزالة أي قيود أخرى قديمة
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

-- 3. تحديث القيم الحالية لمنع التعارض
UPDATE public.bookings
SET status = 'pending'
WHERE status NOT IN ('pending', 'confirmed', 'cancelled', 'blocked') OR status IS NULL;

UPDATE public.bookings
SET payment_status = 'pending'
WHERE payment_status NOT IN ('pending', 'paid', 'failed', 'refunded', 'cancelled') OR payment_status IS NULL;

-- 4. إضافة القيد الجديد لـ status
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'blocked'));

-- 5. إضافة القيد الجديد لـ payment_status
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

-- 6. تعيين القيم الافتراضية
ALTER TABLE public.bookings
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.bookings
ALTER COLUMN payment_status SET DEFAULT 'pending';

-- 7. التأكد من وجود الأعمدة الصحيحة
DO $$
BEGIN
    -- إضافة عمود payment_status إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;

    -- إضافة عمود paid_amount إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'paid_amount'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN paid_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- إضافة عمود discount_amount إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- إضافة عمود booking_option إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'booking_option'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN booking_option TEXT;
    END IF;

    -- إضافة عمود booking_type إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'booking_type'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN booking_type TEXT DEFAULT 'booking';
    END IF;

    -- إضافة عمود package_details إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'package_details'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN package_details JSONB;
    END IF;

    -- إضافة عمود items إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'items'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- إضافة عمود guest_name إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'guest_name'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN guest_name TEXT;
    END IF;

    -- إضافة عمود guest_phone إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'guest_phone'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN guest_phone TEXT;
    END IF;

    -- إضافة عمود guest_email إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'guest_email'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN guest_email TEXT;
    END IF;

    -- إضافة عمود guests_adults إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'guests_adults'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN guests_adults INTEGER DEFAULT 0;
    END IF;

    -- إضافة عمود guests_children إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'guests_children'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN guests_children INTEGER DEFAULT 0;
    END IF;

    -- إضافة عمود notes إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN notes TEXT;
    END IF;

    -- إضافة عمود applied_coupon إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name = 'applied_coupon'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN applied_coupon TEXT;
    END IF;
END $$;

-- 8. إنشاء INDEX لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor ON bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);

-- 9. تحديث التعليقات التوضيحية
COMMENT ON COLUMN public.bookings.status IS 'حالة الحجز: pending=قيد الانتظار, confirmed=مؤكد, cancelled=ملغي, blocked=محجوب';
COMMENT ON COLUMN public.bookings.payment_status IS 'حالة الدفع: pending=قيد الدفع, paid=مدفوع, failed=فشل, refunded=مسترد, cancelled=ملغي';
COMMENT ON COLUMN public.bookings.paid_amount IS 'المبلغ المدفوع';
COMMENT ON COLUMN public.bookings.discount_amount IS 'مبلغ الخصم';
COMMENT ON COLUMN public.bookings.booking_option IS 'نوع الدفع: deposit=عربون, hold_48h=حجز 48 ساعة, consultation=استشارة';
COMMENT ON COLUMN public.bookings.booking_type IS 'نوع الحجز: booking=عادي, package=باقة أفراد, night_package=باقة ليلة';
COMMENT ON COLUMN public.bookings.package_details IS 'تفاصيل الباقة المختارة (JSON)';
COMMENT ON COLUMN public.bookings.items IS 'عناصر الحجز (JSON)';
COMMENT ON COLUMN public.bookings.guest_name IS 'اسم الضيف';
COMMENT ON COLUMN public.bookings.guest_phone IS 'رقم جوال الضيف';
COMMENT ON COLUMN public.bookings.guest_email IS 'بريد الضيف الإلكتروني';
COMMENT ON COLUMN public.bookings.guests_adults IS 'عدد البالغين';
COMMENT ON COLUMN public.bookings.guests_children IS 'عدد الأطفال';

-- =====================================================
-- تعليمات الاستخدام:
-- =====================================================
-- 1. قم بتشغيل هذا الملف في Supabase SQL Editor
-- 2. اختبر إنشاء حجز جديد من صفحة تفاصيل القاعة
-- 3. تحقق من أن الحجز يتم بنجاح بدون أخطاء
--
-- القيم المقبولة لـ payment_status:
-- - 'pending': قيد الدفع (افتراضي)
-- - 'paid': تم الدفع
-- - 'failed': فشل الدفع
-- - 'refunded': تم الاسترداد
-- - 'cancelled': ألغي
--
-- القيم المقبولة لـ status:
-- - 'pending': قيد الانتظار (افتراضي)
-- - 'confirmed': مؤكد
-- - 'cancelled': ملغي
-- - 'blocked': محجوب
-- =====================================================
