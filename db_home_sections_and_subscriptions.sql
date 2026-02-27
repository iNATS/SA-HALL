-- =====================================================
-- Home Page Sections & Subscription Updates
-- =====================================================

-- 1. Create home_page_sections table
CREATE TABLE IF NOT EXISTS public.home_page_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    section_type VARCHAR(50) NOT NULL DEFAULT 'halls', -- 'halls', 'services', 'mixed'
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    max_items INTEGER DEFAULT 8,
    assigned_halls UUID[] DEFAULT '{}', -- Array of hall IDs
    assigned_services UUID[] DEFAULT '{}', -- Array of service IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_home_page_sections_order ON home_page_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_home_page_sections_active ON home_page_sections(is_active) WHERE is_active = true;

-- 2. Update vendor_subscriptions table for monthly subscriptions
ALTER TABLE public.vendor_subscriptions 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_period VARCHAR(50) DEFAULT 'monthly', -- 'monthly', 'yearly', 'lifetime'
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ;

-- Set default start_date and end_date for existing records
UPDATE public.vendor_subscriptions 
SET 
    start_date = created_at,
    end_date = CASE 
        WHEN is_lifetime = true THEN NULL
        ELSE created_at + INTERVAL '1 month'
    END
WHERE start_date IS NULL;

-- 3. Create hall_night_packages table
CREATE TABLE IF NOT EXISTS public.hall_night_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hall_id UUID REFERENCES public.halls(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    package_name_en VARCHAR(255),
    package_type VARCHAR(50) NOT NULL DEFAULT 'night', -- 'night', 'per_person', 'hourly'
    price DECIMAL(10,2) NOT NULL,
    min_capacity INTEGER,
    max_capacity INTEGER,
    min_men INTEGER DEFAULT 0,
    max_men INTEGER DEFAULT 1000,
    min_women INTEGER DEFAULT 0,
    max_women INTEGER DEFAULT 1000,
    duration_hours INTEGER, -- for hourly packages
    description TEXT,
    description_en TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hall_night_packages_hall ON hall_night_packages(hall_id);
CREATE INDEX IF NOT EXISTS idx_hall_night_packages_active ON hall_night_packages(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hall_night_packages_type ON hall_night_packages(package_type);

-- 4. Create subscription_alerts table for admin notifications
CREATE TABLE IF NOT EXISTS public.subscription_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.vendor_subscriptions(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'expiring_soon', 'expired', 'renewal_failed'
    days_until_expiry INTEGER,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_alerts_vendor ON subscription_alerts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_subscription_alerts_read ON subscription_alerts(is_read) WHERE is_read = false;

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

-- 6. Create function to check expiring soon subscriptions (7 days warning)
CREATE OR REPLACE FUNCTION public.check_expiring_soon_subscriptions()
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
END;
$$ LANGUAGE plpgsql;

-- 7. Create scheduled job to run checks daily (using pg_cron if available)
-- Note: This requires pg_cron extension. If not available, run manually or via API call
DO $$
BEGIN
    -- Try to create cron job if pg_cron is available
    BEGIN
        PERFORM cron.schedule(
            'check-subscriptions-daily',
            '0 2 * * *', -- Run at 2 AM daily
            $$
            SELECT public.check_expired_subscriptions();
            SELECT public.check_expiring_soon_subscriptions();
            $$
        );
    EXCEPTION
        WHEN undefined_function THEN
            -- pg_cron not available, skip
            NULL;
    END;
END $$;

-- 8. Add RLS policies
ALTER TABLE public.home_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_night_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_alerts ENABLE ROW LEVEL SECURITY;

-- Home page sections policies
DROP POLICY IF EXISTS "Anyone can view active home sections" ON public.home_page_sections;
CREATE POLICY "Anyone can view active home sections" ON public.home_page_sections
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Super admins manage home sections" ON public.home_page_sections;
CREATE POLICY "Super admins manage home sections" ON public.home_page_sections
    FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE role = 'super_admin'
    ));

-- Hall night packages policies
DROP POLICY IF EXISTS "Anyone can view active hall packages" ON public.hall_night_packages;
CREATE POLICY "Anyone can view active hall packages" ON public.hall_night_packages
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Vendors manage own hall packages" ON public.hall_night_packages;
CREATE POLICY "Vendors manage own hall packages" ON public.hall_night_packages
    FOR ALL
    USING (
        hall_id IN (
            SELECT id FROM public.halls WHERE vendor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Super admins manage all packages" ON public.hall_night_packages;
CREATE POLICY "Super admins manage all packages" ON public.hall_night_packages
    FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE role = 'super_admin'
    ));

-- Subscription alerts policies
DROP POLICY IF EXISTS "Vendors view own alerts" ON public.subscription_alerts;
CREATE POLICY "Vendors view own alerts" ON public.subscription_alerts
    FOR SELECT
    USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Super admins view all alerts" ON public.subscription_alerts;
CREATE POLICY "Super admins view all alerts" ON public.subscription_alerts
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE role = 'super_admin'
    ));

-- 9. Add comments
COMMENT ON TABLE public.home_page_sections IS 'Configurable sections for home page display';
COMMENT ON TABLE public.hall_night_packages IS 'Night packages for halls (alternative to per-person pricing)';
COMMENT ON TABLE public.subscription_alerts IS 'Alerts for subscription expiry notifications';
COMMENT ON COLUMN public.vendor_subscriptions.subscription_period IS 'Subscription billing period: monthly, yearly, lifetime';
COMMENT ON COLUMN public.vendor_subscriptions.start_date IS 'Subscription start date';
COMMENT ON COLUMN public.vendor_subscriptions.end_date IS 'Subscription end date (NULL for lifetime)';

-- 10. Insert default home page sections
INSERT INTO public.home_page_sections (title_ar, title_en, section_type, display_order, max_items, is_active) VALUES
('القاعات المميزة', 'Featured Halls', 'halls', 1, 8, true),
('الخدمات المميزة', 'Featured Services', 'services', 2, 8, true),
('أحدث القاعات', 'Latest Halls', 'halls', 3, 6, true),
('أحدث الخدمات', 'Latest Services', 'services', 4, 6, true)
ON CONFLICT DO NOTHING;

-- 11. Update vendor_subscriptions to support monthly pricing
-- Add monthly_price column to system_settings if not exists
INSERT INTO public.system_settings (key, value, created_at)
VALUES (
    'vendor_subscription_pricing',
    '{"hall_monthly": 100, "service_monthly": 50, "both_monthly": 130, "hall_yearly": 1000, "service_yearly": 500, "both_yearly": 1300, "hall_lifetime": 500, "service_lifetime": 200, "both_lifetime": 600}'::jsonb,
    NOW()
)
ON CONFLICT (key) DO NOTHING;
