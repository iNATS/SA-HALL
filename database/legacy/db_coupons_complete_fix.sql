-- =====================================================
-- إصلاح شامل لمشكلة vendor_id في جدول coupons
-- يحل مشكلة: column coupons.vendor_id does not exist
-- =====================================================

-- 1. إضافة عمود vendor_id إذا لم يكن موجوداً
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
        
        RAISE NOTICE '✓ تم إضافة عمود vendor_id بنجاح';
    ELSE
        RAISE NOTICE '✓ عمود vendor_id موجود بالفعل';
    END IF;
END $$;

-- 2. إضافة عمود target_ids إذا لم يكن موجوداً (لتحديد القاعات/الخدمات المستهدفة)
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
        
        RAISE NOTICE '✓ تم إضافة عمود target_ids بنجاح';
    ELSE
        RAISE NOTICE '✓ عمود target_ids موجود بالفعل';
    END IF;
END $$;

-- 3. إنشاء INDEX لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_coupons_vendor_id ON public.coupons(vendor_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active_dates ON public.coupons(is_active, start_date, end_date);

-- 4. تحديث التعليقات التوضيحية
COMMENT ON COLUMN public.coupons.vendor_id IS 'معرف البائع/المورد الذي أنشأ الكوبون';
COMMENT ON COLUMN public.coupons.target_ids IS 'مصفوفة معرفات القاعات/الخدمات المستهدفة (فارغ = الكل)';

-- 5. تحديث سياسات RLS
DROP POLICY IF EXISTS "vendors_view_own_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_create_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_update_own_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_delete_own_coupons" ON public.coupons;
DROP POLICY IF EXISTS "Vendor Coupons Access" ON public.coupons;
DROP POLICY IF EXISTS "super_admins_all_access_coupons" ON public.coupons;
DROP POLICY IF EXISTS "everyone_view_active_coupons" ON public.coupons;

-- سياسة: البائعون يرون كوبوناتهم الخاصة
CREATE POLICY "vendors_view_own_coupons" ON public.coupons
FOR SELECT
USING (
    auth.uid() = vendor_id
    OR vendor_id IS NULL  -- للسماح بالكوبونات العامة
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- سياسة: البائعون ينشئون كوبونات
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

-- سياسة: البائعون يحدثون كوبوناتهم الخاصة
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

-- سياسة: البائعون يحذفون كوبوناتهم الخاصة
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

-- سياسة: المشرفون للوصول الكامل
CREATE POLICY "super_admins_all_access_coupons" ON public.coupons
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- سياسة: الجميع يمكنه عرض الكوبونات النشطة
CREATE POLICY "everyone_view_active_coupons" ON public.coupons
FOR SELECT
USING (
    is_active = true
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
);

-- 6. تحديث الكوبونات الموجودة
UPDATE public.coupons
SET vendor_id = created_by
WHERE vendor_id IS NULL AND created_by IS NOT NULL;

-- 7. إنشاء دالة لتعيين vendor_id تلقائياً
CREATE OR REPLACE FUNCTION public.set_coupon_vendor_id()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا لم يتم تعيين vendor_id، استخدم created_by أو auth.uid()
    IF NEW.vendor_id IS NULL THEN
        IF NEW.created_by IS NOT NULL THEN
            -- الحصول على user_id من created_by (profile id)
            SELECT id INTO NEW.vendor_id FROM public.profiles WHERE id = NEW.created_by LIMIT 1;
        END IF;
        
        -- إذا لا يزال NULL، استخدم auth.uid()
        IF NEW.vendor_id IS NULL THEN
            NEW.vendor_id = auth.uid();
        END IF;
    END IF;
    
    -- إذا لم يتم تعيين created_by، استخدم auth.uid()
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. إنشاء trigger لتعيين vendor_id تلقائياً
DROP TRIGGER IF EXISTS trg_set_coupon_vendor_id ON public.coupons;
CREATE TRIGGER trg_set_coupon_vendor_id
    BEFORE INSERT ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.set_coupon_vendor_id();

-- 9. التأكد من صحة العلاقات
ALTER TABLE public.coupons
DROP CONSTRAINT IF EXISTS coupons_created_by_fkey;

ALTER TABLE public.coupons
ADD CONSTRAINT coupons_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

ALTER TABLE public.coupons
DROP CONSTRAINT IF EXISTS coupons_vendor_id_fkey;

ALTER TABLE public.coupons
ADD CONSTRAINT coupons_vendor_id_fkey
FOREIGN KEY (vendor_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- =====================================================
-- تعليمات الاستخدام:
-- =====================================================
-- 1. قم بتشغيل هذا الملف في Supabase SQL Editor
-- 2. تحقق من رسائل النجاح
-- 3. اختبر إنشاء كوبون جديد
--
-- ملاحظات مهمة:
-- - vendor_id: معرف البائع من جدول profiles
-- - created_by: معرف من أنشأ الكوبون من جدول profiles
-- - target_ids: مصفوفة معرفات القاعات/الخدمات (فارغ = للجميع)
-- - البائعون يرون فقط كوبوناتهم الخاصة
-- - الكوبونات النشطة مرئية للجميع
-- - المشرفون يرون جميع الكوبونات
-- =====================================================

-- =====================================================
-- استكشاف الأخطاء:
-- =====================================================
-- إذا استمر الخطأ، قم بتشغيل الاستعلامات التالية:

-- التحقق من وجود العمود:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'coupons' AND column_name = 'vendor_id';

-- التحقق من بنية الجدول:
-- \d coupons

-- إعادة إنشاء الجدول إذا لزم الأمر (احذر: سيحذف البيانات):
-- DROP TABLE IF EXISTS public.coupons CASCADE;
-- ثم قم بتشغيل ملف db_coupons.sql متبوعاً بهذا الملف
-- =====================================================
