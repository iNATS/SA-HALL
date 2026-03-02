-- =====================================================
-- إصلاح عرض اشتراكات البائعين في إدارة المشتركين
-- =====================================================

-- 1. التأكد من وجود جدول vendor_subscriptions
CREATE TABLE IF NOT EXISTS public.vendor_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type TEXT CHECK (subscription_type IN ('hall', 'service', 'both')),
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'card',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    is_lifetime BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    subscription_period TEXT DEFAULT 'monthly' CHECK (subscription_period IN ('monthly', 'yearly', 'lifetime')),
    auto_renew BOOLEAN DEFAULT FALSE,
    last_payment_date TIMESTAMPTZ,
    next_payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء INDEX لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor ON vendor_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_end_date ON vendor_subscriptions(end_date);

-- 3. تمكين RLS
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسات الوصول
DROP POLICY IF EXISTS "Super admins view all subscriptions" ON public.vendor_subscriptions;
CREATE POLICY "Super admins view all subscriptions" ON public.vendor_subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "Vendors view own subscriptions" ON public.vendor_subscriptions;
CREATE POLICY "Vendors view own subscriptions" ON public.vendor_subscriptions
    FOR SELECT
    USING (vendor_id = auth.uid());

-- 5. عرض مدمج لعرض جميع الاشتراكات مع معلومات البائع
CREATE OR REPLACE VIEW public.admin_vendor_subscriptions AS
SELECT 
    vs.id,
    vs.vendor_id,
    p.full_name as vendor_name,
    p.email as vendor_email,
    p.phone_number as vendor_phone,
    p.business_name,
    vs.subscription_type,
    vs.amount,
    vs.payment_status,
    vs.payment_method,
    vs.is_lifetime,
    vs.subscription_period,
    vs.start_date,
    vs.end_date,
    vs.auto_renew,
    vs.created_at,
    vs.updated_at,
    CASE 
        WHEN vs.is_lifetime THEN 'lifetime'
        WHEN vs.end_date < NOW() THEN 'expired'
        WHEN vs.end_date < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
        ELSE 'active'
    END as status,
    CASE 
        WHEN vs.end_date IS NOT NULL 
        THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (vs.end_date - NOW())) / 86400)::INTEGER)
        ELSE NULL
    END as days_remaining
FROM public.vendor_subscriptions vs
LEFT JOIN public.profiles p ON p.id = vs.vendor_id
ORDER BY vs.created_at DESC;

-- 6. منح الصلاحيات للمشرفين
GRANT SELECT ON public.admin_vendor_subscriptions TO authenticated;

-- 7. دالة للحصول على اشتراك بائع محدد
CREATE OR REPLACE FUNCTION public.get_vendor_subscription(p_vendor_id UUID)
RETURNS TABLE (
    id UUID,
    subscription_type TEXT,
    amount NUMERIC,
    payment_status TEXT,
    is_lifetime BOOLEAN,
    subscription_period TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vs.id,
        vs.subscription_type,
        vs.amount,
        vs.payment_status,
        vs.is_lifetime,
        vs.subscription_period,
        vs.start_date,
        vs.end_date,
        CASE 
            WHEN vs.end_date IS NOT NULL 
            THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (vs.end_date - NOW())) / 86400)::INTEGER)
            ELSE NULL
        END as days_remaining
    FROM public.vendor_subscriptions vs
    WHERE vs.vendor_id = p_vendor_id
    ORDER BY vs.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. دالة للحصول على جميع قاعات بائع محدد
CREATE OR REPLACE FUNCTION public.get_vendor_halls(p_vendor_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    city TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    booking_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.name,
        h.city,
        h.is_active,
        h.created_at,
        COUNT(b.id) as booking_count
    FROM public.halls h
    LEFT JOIN public.bookings b ON b.hall_id = h.id
    WHERE h.vendor_id = p_vendor_id
    GROUP BY h.id
    ORDER BY h.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. دالة للحصول على جميع خدمات بائع محدد
CREATE OR REPLACE FUNCTION public.get_vendor_services(p_vendor_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    price NUMERIC,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.category,
        s.price,
        s.is_active,
        s.created_at
    FROM public.services s
    WHERE s.vendor_id = p_vendor_id
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- تعليمات الاستخدام:
-- =====================================================
-- 1. قم بتشغيل هذا الملف في Supabase SQL Editor
-- 2. اختبر العرض:
--    SELECT * FROM admin_vendor_subscriptions;
--
-- 3. اختبر الدوال:
--    SELECT * FROM get_vendor_subscription('vendor-uuid');
--    SELECT * FROM get_vendor_halls('vendor-uuid');
--    SELECT * FROM get_vendor_services('vendor-uuid');
-- =====================================================
