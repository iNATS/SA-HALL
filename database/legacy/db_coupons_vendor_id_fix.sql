-- =====================================================
-- إصلاح مشكلة عمود vendor_id في جدول coupons
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
        ADD COLUMN vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'تم إضافة عمود vendor_id بنجاح';
    ELSE
        RAISE NOTICE 'عمود vendor_id موجود بالفعل';
    END IF;
END $$;

-- 2. إنشاء INDEX لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_coupons_vendor_id ON public.coupons(vendor_id);

-- 3. تحديث التعليقات التوضيحية
COMMENT ON COLUMN public.coupons.vendor_id IS 'معرف البائع/المورد الذي أنشأ الكوبون';

-- 4. تحديث سياسات RLS لدعم vendor_id
DROP POLICY IF EXISTS "vendors_view_own_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_create_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_update_own_coupons" ON public.coupons;
DROP POLICY IF EXISTS "vendors_delete_own_coupons" ON public.coupons;

-- سياسة عرض الكوبونات الخاصة بالبائع
CREATE POLICY "vendors_view_own_coupons" ON public.coupons
FOR SELECT
USING (
    auth.uid() = vendor_id
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- سياسة إنشاء كوبونات جديدة
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

-- سياسة تحديث الكوبونات الخاصة بالبائع
CREATE POLICY "vendors_update_own_coupons" ON public.coupons
FOR UPDATE
USING (
    auth.uid() = vendor_id
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- سياسة حذف الكوبونات الخاصة بالبائع
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

-- سياسة للمشرفين للوصول الكامل
DROP POLICY IF EXISTS "super_admins_all_access_coupons" ON public.coupons;
CREATE POLICY "super_admins_all_access_coupons" ON public.coupons
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- 5. تحديث الكوبونات الموجودة لتعيين vendor_id = created_by
UPDATE public.coupons
SET vendor_id = created_by
WHERE vendor_id IS NULL AND created_by IS NOT NULL;

-- 6. إنشاء دالة لتعيين vendor_id تلقائياً عند الإنشاء
CREATE OR REPLACE FUNCTION public.set_coupon_vendor_id()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا لم يتم تعيين vendor_id، استخدم created_by
    IF NEW.vendor_id IS NULL THEN
        NEW.vendor_id = auth.uid();
    END IF;
    
    -- إذا لم يتم تعيين created_by، استخدم auth.uid()
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. إنشاء trigger لتعيين vendor_id تلقائياً
DROP TRIGGER IF EXISTS trg_set_coupon_vendor_id ON public.coupons;
CREATE TRIGGER trg_set_coupon_vendor_id
    BEFORE INSERT ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.set_coupon_vendor_id();

-- 8. التأكد من أن created_by يشير إلى profiles وليس auth.users
-- (إذا كان هناك مشكلة في المرجع)
ALTER TABLE public.coupons
DROP CONSTRAINT IF EXISTS coupons_created_by_fkey;

ALTER TABLE public.coupons
ADD CONSTRAINT coupons_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- =====================================================
-- تعليمات الاستخدام:
-- =====================================================
-- 1. قم بتشغيل هذا الملف في Supabase SQL Editor
-- 2. تحقق من نجاح العملية
-- 3. اختبر إنشاء كوبون جديد
--
-- ملاحظات:
-- - vendor_id: معرف البائع (من auth.users)
-- - created_by: معرف من أنشأ الكوبون (من profiles)
-- - البائعون يرون فقط كوبوناتهم الخاصة
-- - المشرفون يرون جميع الكوبونات
-- =====================================================
