-- =====================================================
-- Vendor Subscription System - Monthly & Lifetime Plans
-- مع عرض تواريخ البداية والنهاية
-- =====================================================

-- 1. Create vendor_subscriptions table if not exists
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor ON vendor_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_end_date ON vendor_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_active ON vendor_subscriptions(is_lifetime, end_date) WHERE is_lifetime = FALSE;
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_status ON vendor_subscriptions(payment_status);

-- 3. Create function to auto-update profiles on subscription purchase
CREATE OR REPLACE FUNCTION public.handle_subscription_purchase()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile subscription status
    UPDATE public.profiles
    SET 
        subscription_status = NEW.subscription_type,
        subscription_paid_at = NEW.created_at,
        subscription_amount = NEW.amount,
        has_active_subscription = TRUE,
        updated_at = NOW()
    WHERE id = NEW.vendor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for subscription purchase
DROP TRIGGER IF EXISTS trg_subscription_purchase ON public.vendor_subscriptions;
CREATE TRIGGER trg_subscription_purchase
    AFTER INSERT ON public.vendor_subscriptions
    FOR EACH ROW
    WHEN (NEW.payment_status = 'completed')
    EXECUTE FUNCTION public.handle_subscription_purchase();

-- 5. Create function to check and disable expired subscriptions
CREATE OR REPLACE FUNCTION public.check_expired_subscriptions()
RETURNS void AS $$
BEGIN
    -- Disable halls for expired subscriptions
    UPDATE public.halls h
    SET is_active = false
    WHERE vendor_id IN (
        SELECT vs.vendor_id
        FROM public.vendor_subscriptions vs
        WHERE vs.end_date < NOW()
        AND vs.is_lifetime = false
        AND vs.subscription_period != 'lifetime'
    );

    -- Disable services for expired subscriptions
    UPDATE public.services s
    SET is_active = false
    WHERE vendor_id IN (
        SELECT vs.vendor_id
        FROM public.vendor_subscriptions vs
        WHERE vs.end_date < NOW()
        AND vs.is_lifetime = false
        AND vs.subscription_period != 'lifetime'
    );

    -- Raise notification (optional - for future implementation)
    RAISE NOTICE 'Expired subscriptions checked and assets disabled';
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to check expiring soon subscriptions (7 days warning)
CREATE OR REPLACE FUNCTION public.check_expiring_soon_subscriptions()
RETURNS TABLE (
    vendor_id UUID,
    subscription_id UUID,
    subscription_type TEXT,
    end_date TIMESTAMPTZ,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vs.vendor_id,
        vs.id as subscription_id,
        vs.subscription_type,
        vs.end_date,
        FLOOR(EXTRACT(EPOCH FROM (vs.end_date - NOW())) / 86400)::INTEGER as days_remaining
    FROM public.vendor_subscriptions vs
    WHERE vs.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    AND vs.is_lifetime = false
    AND vs.subscription_period != 'lifetime';
END;
$$ LANGUAGE plpgsql;

-- 7. Create subscription_alerts table for admin notifications
CREATE TABLE IF NOT EXISTS public.subscription_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.vendor_subscriptions(id) ON DELETE CASCADE,
    alert_type TEXT CHECK (alert_type IN ('expiring_soon', 'expired', 'renewal_failed', 'renewed')),
    days_until_expiry INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_alerts_vendor ON subscription_alerts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_subscription_alerts_read ON subscription_alerts(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_subscription_alerts_type ON subscription_alerts(alert_type);

-- 8. Create function to create expiration alerts
CREATE OR REPLACE FUNCTION public.create_expiration_alerts()
RETURNS void AS $$
BEGIN
    -- Create alerts for subscriptions expiring in 7 days
    INSERT INTO public.subscription_alerts (vendor_id, subscription_id, alert_type, days_until_expiry)
    SELECT
        vs.vendor_id,
        vs.id,
        'expiring_soon',
        FLOOR(EXTRACT(EPOCH FROM (vs.end_date - NOW())) / 86400)::INTEGER
    FROM public.vendor_subscriptions vs
    WHERE vs.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    AND vs.is_lifetime = false
    AND vs.subscription_period != 'lifetime'
    AND NOT EXISTS (
        SELECT 1 FROM public.subscription_alerts sa
        WHERE sa.subscription_id = vs.id
        AND sa.alert_type = 'expiring_soon'
        AND sa.created_at > NOW() - INTERVAL '1 day'
    );

    -- Create alerts for expired subscriptions
    INSERT INTO public.subscription_alerts (vendor_id, subscription_id, alert_type, days_until_expiry)
    SELECT
        vs.vendor_id,
        vs.id,
        'expired',
        0
    FROM public.vendor_subscriptions vs
    WHERE vs.end_date < NOW()
    AND vs.is_lifetime = false
    AND vs.subscription_period != 'lifetime'
    AND NOT EXISTS (
        SELECT 1 FROM public.subscription_alerts sa
        WHERE sa.subscription_id = vs.id
        AND sa.alert_type = 'expired'
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Enable RLS
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_alerts ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for vendor_subscriptions
DROP POLICY IF EXISTS "Vendors view own subscriptions" ON public.vendor_subscriptions;
CREATE POLICY "Vendors view own subscriptions" ON public.vendor_subscriptions
    FOR SELECT
    USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendors insert own subscriptions" ON public.vendor_subscriptions;
CREATE POLICY "Vendors insert own subscriptions" ON public.vendor_subscriptions
    FOR INSERT
    WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Super admins view all subscriptions" ON public.vendor_subscriptions;
CREATE POLICY "Super admins view all subscriptions" ON public.vendor_subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "Super admins manage all subscriptions" ON public.vendor_subscriptions;
CREATE POLICY "Super admins manage all subscriptions" ON public.vendor_subscriptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- 11. Create RLS policies for subscription_alerts
DROP POLICY IF EXISTS "Vendors view own alerts" ON public.subscription_alerts;
CREATE POLICY "Vendors view own alerts" ON public.subscription_alerts
    FOR SELECT
    USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Super admins view all alerts" ON public.subscription_alerts;
CREATE POLICY "Super admins view all alerts" ON public.subscription_alerts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- 12. Insert default subscription pricing
INSERT INTO public.system_settings (key, value, created_at)
VALUES (
    'vendor_subscription_pricing',
    '{
        "hall_monthly": 100,
        "service_monthly": 50,
        "both_monthly": 130,
        "hall_yearly": 1000,
        "service_yearly": 500,
        "both_yearly": 1300,
        "hall_lifetime": 500,
        "service_lifetime": 200,
        "both_lifetime": 600
    }'::jsonb,
    NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 13. Helper function to create subscription with proper dates
CREATE OR REPLACE FUNCTION public.create_vendor_subscription(
    p_vendor_id UUID,
    p_subscription_type TEXT,
    p_amount NUMERIC,
    p_period TEXT DEFAULT 'monthly',
    p_is_lifetime BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_subscription_id UUID;
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
BEGIN
    v_start_date = NOW();
    
    -- Calculate end date based on period
    IF p_is_lifetime THEN
        v_end_date = NULL;
    ELSIF p_period = 'yearly' THEN
        v_end_date = v_start_date + INTERVAL '1 year';
    ELSE
        v_end_date = v_start_date + INTERVAL '1 month';
    END IF;

    INSERT INTO public.vendor_subscriptions (
        vendor_id,
        subscription_type,
        amount,
        payment_status,
        is_lifetime,
        start_date,
        end_date,
        subscription_period
    ) VALUES (
        p_vendor_id,
        p_subscription_type,
        p_amount,
        'completed',
        p_is_lifetime,
        v_start_date,
        v_end_date,
        p_period
    ) RETURNING id INTO v_subscription_id;

    RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. View for admin dashboard - Active Subscriptions
CREATE OR REPLACE VIEW public.admin_active_subscriptions AS
SELECT 
    vs.id,
    vs.vendor_id,
    p.full_name as vendor_name,
    p.email as vendor_email,
    p.phone_number as vendor_phone,
    vs.subscription_type,
    vs.amount,
    vs.payment_status,
    vs.is_lifetime,
    vs.subscription_period,
    vs.start_date,
    vs.end_date,
    vs.created_at,
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

-- Grant access to super admins
GRANT SELECT ON public.admin_active_subscriptions TO authenticated;

-- 15. Comments
COMMENT ON TABLE public.vendor_subscriptions IS 'Vendor subscription tracking with start/end dates';
COMMENT ON COLUMN public.vendor_subscriptions.subscription_period IS 'Billing period: monthly, yearly, lifetime';
COMMENT ON COLUMN public.vendor_subscriptions.start_date IS 'Subscription activation date';
COMMENT ON COLUMN public.vendor_subscriptions.end_date IS 'Subscription expiry date (NULL for lifetime)';
COMMENT ON COLUMN public.vendor_subscriptions.auto_renew IS 'Auto-renewal enabled';
COMMENT ON TABLE public.subscription_alerts IS 'Alerts for subscription expiry notifications';

-- 16. Sample data for testing (optional - remove in production)
-- INSERT INTO public.vendor_subscriptions (vendor_id, subscription_type, amount, payment_status, is_lifetime, subscription_period, start_date, end_date)
-- SELECT 
--     id,
--     'hall',
--     100,
--     'completed',
--     false,
--     'monthly',
--     NOW(),
--     NOW() + INTERVAL '1 month'
-- FROM public.profiles 
-- WHERE role = 'vendor' 
-- LIMIT 3;

-- =====================================================
-- تعليمات الاستخدام:
-- =====================================================
-- 1. لإنشاء اشتراك جديد:
--    SELECT create_vendor_subscription('vendor-uuid', 'hall', 100, 'monthly', false);
--
-- 2. للتحقق من الاشتراكات منتهية الصلاحية:
--    SELECT check_expired_subscriptions();
--
-- 3. للتحقق من الاشتراكات التي ستنتهي قريباً:
--    SELECT * FROM check_expiring_soon_subscriptions();
--
-- 4. لإنشاء تنبيهات:
--    SELECT create_expiration_alerts();
--
-- 5. لعرض جميع الاشتراكات في لوحة التحكم:
--    SELECT * FROM admin_active_subscriptions;
-- =====================================================
