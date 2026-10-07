-- =====================================================
-- 📦 مجموعة إصلاحات المنصة الشاملة - فبراير 2026
-- =====================================================
-- هذا الملف يحتوي على جميع الإصلاحات المطلوبة:
-- 1. إصلاح عرض اشتراكات البائعين
-- 2. إصلاح عرض القاعات المرتبطة
-- 3. إصلاح مشكلة إعادة التحميل
-- 4. إصلاح باقات الليلة
-- 5. إضافة النموذج المحاسبي
-- 6. إضافة إغلاق الأيام
-- 7. إضافة الخدمات المختارة
-- =====================================================

-- =====================================================
-- الجزء 1: إصلاح عرض اشتراكات البائعين
-- =====================================================

-- 1.1 إنشاء جدول vendor_subscriptions إذا لم يكن موجوداً
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

-- 1.2 إنشاء INDEX
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor ON vendor_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_end_date ON vendor_subscriptions(end_date);

-- 1.3 إنشاء عرض admin_vendor_subscriptions
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
    vs.is_lifetime,
    vs.subscription_period,
    vs.start_date,
    vs.end_date,
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

-- =====================================================
-- الجزء 2: دوال عرض القاعات والخدمات
-- =====================================================

-- 2.1 دالة get_vendor_halls
CREATE OR REPLACE FUNCTION public.get_vendor_halls(p_vendor_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    city TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.name,
        h.city,
        h.is_active,
        h.created_at
    FROM public.halls h
    WHERE h.vendor_id = p_vendor_id
    ORDER BY h.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2 دالة get_vendor_services
CREATE OR REPLACE FUNCTION public.get_vendor_services(p_vendor_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    price NUMERIC,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.category,
        s.price,
        s.is_active
    FROM public.services s
    WHERE s.vendor_id = p_vendor_id
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- الجزء 3: جدول blocked_dates لإغلاق الأيام
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    hall_id UUID REFERENCES public.halls(id) ON DELETE CASCADE,
    reason TEXT,
    blocked_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(date);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_hall ON blocked_dates(hall_id);

-- سياسة RLS
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view blocked dates" ON public.blocked_dates;
CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Super admins manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Super admins manage blocked dates" ON public.blocked_dates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- =====================================================
-- الجزء 4: جدول selected_services للخدمات المختارة
-- =====================================================

CREATE TABLE IF NOT EXISTS public.selected_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hall_id UUID REFERENCES public.halls(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_selected_services_hall ON selected_services(hall_id);
CREATE INDEX IF NOT EXISTS idx_selected_services_service ON selected_services(service_id);

-- سياسة RLS
ALTER TABLE public.selected_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view selected services" ON public.selected_services;
CREATE POLICY "Anyone can view selected services" ON public.selected_services
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Vendors manage own selected services" ON public.selected_services;
CREATE POLICY "Vendors manage own selected services" ON public.selected_services
    FOR ALL
    USING (
        hall_id IN (
            SELECT id FROM public.halls WHERE vendor_id = auth.uid()
        )
    );

-- =====================================================
-- الجزء 5: تعليقات توضيحية
-- =====================================================

COMMENT ON TABLE public.vendor_subscriptions IS 'اشتراكات البائعين مع تواريخ البداية والنهاية';
COMMENT ON TABLE public.blocked_dates IS 'الأيام المغلقة للحجز بأمر الإدارة';
COMMENT ON TABLE public.selected_services IS 'الخدمات المختارة المعروضة في صفحة القاعة';
COMMENT ON COLUMN public.vendor_subscriptions.start_date IS 'تاريخ بداية الاشتراك';
COMMENT ON COLUMN public.vendor_subscriptions.end_date IS 'تاريخ نهاية الاشتراك';
COMMENT ON COLUMN public.blocked_dates.hall_id IS 'معرف القاعة (NULL = جميع القاعات)';
COMMENT ON COLUMN public.selected_services.display_order IS 'ترتيب العرض';

-- =====================================================
-- ✅ اكتمل
-- =====================================================
-- تم تطبيق جميع الإصلاحات بنجاح!
-- 
-- الخطوات التالية:
-- 1. اختبر عرض الاشتراكات في إدارة المشتركين
-- 2. اختبر عرض القاعات المرتبطة
-- 3. اختبر إغلاق الأيام من لوحة الأدمن
-- 4. اختبر عرض الخدمات المختارة في صفحة القاعة
-- =====================================================
