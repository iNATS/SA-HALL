-- =====================================================
-- Hall Night Packages Table Setup
-- =====================================================

-- Create hall_night_packages table if not exists
CREATE TABLE IF NOT EXISTS public.hall_night_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hall_id UUID REFERENCES public.halls(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    package_type VARCHAR(50) NOT NULL DEFAULT 'night', -- 'night', 'per_person', 'hourly'
    price DECIMAL(10,2) NOT NULL,
    capacity INTEGER,
    duration_hours INTEGER, -- for hourly packages
    description TEXT,
    includes TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hall_night_packages_hall ON hall_night_packages(hall_id);
CREATE INDEX IF NOT EXISTS idx_hall_night_packages_active ON hall_night_packages(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hall_night_packages_type ON hall_night_packages(package_type);
CREATE INDEX IF NOT EXISTS idx_hall_night_packages_default ON hall_night_packages(is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.hall_night_packages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view active hall packages" ON public.hall_night_packages;
DROP POLICY IF EXISTS "Vendors manage own hall packages" ON public.hall_night_packages;
DROP POLICY IF EXISTS "Super admins manage all packages" ON public.hall_night_packages;

-- Create policies
CREATE POLICY "Anyone can view active hall packages" ON public.hall_night_packages
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Vendors manage own hall packages" ON public.hall_night_packages
    FOR ALL
    USING (
        hall_id IN (
            SELECT id FROM public.halls WHERE vendor_id = auth.uid()
        )
    );

CREATE POLICY "Super admins manage all packages" ON public.hall_night_packages
    FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'super_admin'
    ));

-- Add comments
COMMENT ON TABLE public.hall_night_packages IS 'Night packages for halls (alternative to per-night pricing)';
COMMENT ON COLUMN public.hall_night_packages.package_type IS 'Package type: night, per_person, hourly';
COMMENT ON COLUMN public.hall_night_packages.capacity IS 'Total capacity (number of people)';
COMMENT ON COLUMN public.hall_night_packages.includes IS 'What the package includes';
