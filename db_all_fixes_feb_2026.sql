-- =====================================================
-- 📦 مجموعة إصلاحات قاعدة البيانات - فبراير 2026
-- =====================================================
-- هذا الملف يحتوي على جميع الإصلاحات المطلوبة:
-- 1. إصلاح مشكلة booking_type
-- 2. إصلاح مشكلة coupons.vendor_id
-- =====================================================

-- =====================================================
-- الجزء 1: إصلاح مشكلة booking_type
-- =====================================================

-- 1.1 إزالة القيد القديم
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

-- 1.2 تحديث القيم القديمة
UPDATE public.bookings
SET booking_type = 'booking'
WHERE booking_type IS NULL 
   OR booking_type NOT IN ('booking', 'consultation', 'package', 'night_package');

-- 1.3 إضافة القيد الجديد
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_booking_type_check
CHECK (booking_type IN ('booking', 'consultation', 'package', 'night_package'));

-- 1.4 تعيين القيمة الافتراضية
ALTER TABLE public.bookings
ALTER COLUMN booking_type SET DEFAULT 'booking';

-- 1.5 إنشاء INDEX
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_type_status ON bookings(booking_type, status);

-- =====================================================
-- الجزء 2: إصلاح مشكلة coupons.vendor_id
-- =====================================================

-- 2.1 إضافة عمود vendor_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'coupons'
        AND column_name = 'vendor_id'
    ) THEN
        ALTER TABLE public.coupons
        ADD COLUMN vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        RAISE NOTICE '✓ تم إضافة vendor_id';
    END IF;
END $$;

-- 2.2 إضافة عمود target_ids
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'coupons'
        AND column_name = 'target_ids'
    ) THEN
        ALTER TABLE public.coupons
        ADD COLUMN target_ids UUID[] DEFAULT '{}';
        RAISE NOTICE '✓ تم إضافة target_ids';
    END IF;
END $$;

-- 2.3 إنشاء INDEX
CREATE INDEX IF NOT EXISTS idx_coupons_vendor_id ON public.coupons(vendor_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active_dates ON public.coupons(is_active, start_date, end_date);

-- 2.4 تحديث الكوبونات الموجودة
UPDATE public.coupons
SET vendor_id = created_by
WHERE vendor_id IS NULL AND created_by IS NOT NULL;

-- 2.5 تحديث سياسات RLS
DROP POLICY IF EXISTS "vendors_view_own_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_create_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_update_own_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_delete_own_coupons" ON public.coupons;
DROP POLICY IF EXISTS "Vendor Coupons Access" ON public.coupons;
DROP POLICY IF EXISTS "super_admins_all_access_coupons" ON public.coupons;
DROP POLICY IF EXISTS "everyone_view_active_coupons" ON public.coupons;

-- سياسة العرض للبائعين
CREATE POLICY "vendors_view_own_coupons" ON public.coupons
FOR SELECT
USING (
    auth.uid() = vendor_id
    OR vendor_id IS NULL
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- سياسة الإنشاء
CREATE POLICY "vendors_create_coupons" ON public.coupons
FOR INSERT
WITH CHECK (
    (auth.uid() = vendor_id OR vendor_id IS NULL)
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- سياسة التحديث
CREATE POLICY "vendors_update_own_coupons" ON public.coupons
FOR UPDATE
USING (
    auth.uid() = vendor_id
    OR vendor_id IS NULL
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- سياسة الحذف
CREATE POLICY "vendors_delete_own_coupons" ON public.coupons
FOR DELETE
USING (
    auth.uid() = vendor_id
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- سياسة المشرفين
CREATE POLICY "super_admins_all_access_coupons" ON public.coupons
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- سياسة الكوبونات النشطة
CREATE POLICY "everyone_view_active_coupons" ON public.coupons
FOR SELECT
USING (
    is_active = true
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
);

-- =====================================================
-- الجزء 3: دوال مساعدة
-- =====================================================

-- دالة لتعيين vendor_id تلقائياً
CREATE OR REPLACE FUNCTION public.set_coupon_vendor_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vendor_id IS NULL THEN
        IF NEW.created_by IS NOT NULL THEN
            SELECT id INTO NEW.vendor_id FROM public.profiles WHERE id = NEW.created_by LIMIT 1;
        END IF;
        IF NEW.vendor_id IS NULL THEN
            NEW.vendor_id = auth.uid();
        END IF;
    END IF;
    
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger للتعيين التلقائي
DROP TRIGGER IF EXISTS trg_set_coupon_vendor_id ON public.coupons;
CREATE TRIGGER trg_set_coupon_vendor_id
    BEFORE INSERT ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.set_coupon_vendor_id();

-- =====================================================
-- الجزء 4: تعليقات توضيحية
-- =====================================================

COMMENT ON COLUMN public.bookings.booking_type IS 'نوع الحجز: booking, consultation, package, night_package';
COMMENT ON COLUMN public.coupons.vendor_id IS 'معرف البائع الذي أنشأ الكوبون';
COMMENT ON COLUMN public.coupons.target_ids IS 'مصفوفة معرفات القاعات/الخدمات المستهدفة (فارغ = الكل)';

-- =====================================================
-- ✅ اكتمل
-- =====================================================
-- تم تطبيق جميع الإصلاحات بنجاح!
-- 
-- الخطوات التالية:
-- 1. اختبر إنشاء حجز جديد
-- 2. اختبر إنشاء كوبون جديد
-- 3. تحقق من أن البائعين يرون فقط بياناتهم
-- =====================================================
