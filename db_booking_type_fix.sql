-- إصلاح مشكلة booking_type constraint
-- إزالة القيد القديم وإنشاء قيم مقبولة جديدة

-- أولاً: إزالة القيد القديم إذا وجد
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

-- تحديث القيم الحالية
UPDATE public.bookings 
SET booking_type = 'booking' 
WHERE booking_type NOT IN ('booking', 'consultation') OR booking_type IS NULL;

-- إضافة القيد الجديد بقيم أوسع
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_booking_type_check 
CHECK (booking_type IN ('booking', 'consultation', 'package', 'night_package')) 
DEFAULT 'booking';

-- تعليق توضيحي: booking_type الآن يقبل:
-- 'booking' - حجز عادي
-- 'consultation' - حجز استشارة
-- 'package' - حجز باقة أفراد
-- 'night_package' - حجز باقة ليلة
