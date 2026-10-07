-- =====================================================
-- إصلاح مشكلة booking_type constraint - تحديث شامل
-- هذا الملف يحل مشكلة constraint violation عند إنشاء الحجز
-- =====================================================

-- 1. إزالة القيد القديم إذا وجد
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

-- 2. تحديث القيم القديمة لمنع التعارض
UPDATE public.bookings
SET booking_type = 'booking'
WHERE booking_type IS NULL 
   OR booking_type NOT IN ('booking', 'consultation', 'package', 'night_package');

-- 3. إضافة القيد الجديد مع القيم المقبولة
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_booking_type_check
CHECK (booking_type IN ('booking', 'consultation', 'package', 'night_package'));

-- 4. تعيين القيمة الافتراضية
ALTER TABLE public.bookings
ALTER COLUMN booking_type SET DEFAULT 'booking';

-- 5. تحديث التعليقات التوضيحية
COMMENT ON COLUMN public.bookings.booking_type IS 'نوع الحجز: booking=حجز عادي, consultation=استشارة, package=باقة أفراد, night_package=باقة ليلة';

-- 6. التأكد من أن عمود booking_type موجود (إضافة احتياطية)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'booking_type'
    ) THEN
        ALTER TABLE public.bookings
        ADD COLUMN booking_type TEXT DEFAULT 'booking';
    END IF;
END $$;

-- 7. إنشاء INDEX لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);

-- 8. إنشاء INDEX للبحث حسب النوع
CREATE INDEX IF NOT EXISTS idx_bookings_type_status ON bookings(booking_type, status);

-- =====================================================
-- تعليمات الاستخدام:
-- =====================================================
-- 1. قم بتشغيل هذا الملف في Supabase SQL Editor
-- 2. تحقق من نجاح العملية
-- 3. اختبر إنشاء حجز جديد من صفحة تفاصيل القاعة
--
-- القيم المقبولة لـ booking_type:
-- - 'booking': حجز عادي
-- - 'consultation': حجز استشارة
-- - 'package': باقة أفراد (سعر للشخص)
-- - 'night_package': باقة ليلة (سعر لليلة أو ساعة)
-- =====================================================

