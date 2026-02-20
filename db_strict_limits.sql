
-- اجعل الحدود الافتراضية صفر لإجبار البائع على الدفع قبل الإضافة
ALTER TABLE public.profiles 
ALTER COLUMN hall_limit SET DEFAULT 0,
ALTER COLUMN service_limit SET DEFAULT 0;

-- تحديث البائعين الجدد (اختياري، يطبق على من لم يضف شيئاً بعد)
UPDATE public.profiles 
SET hall_limit = 0, service_limit = 0 
WHERE role = 'vendor' 
AND id NOT IN (SELECT vendor_id FROM public.halls) 
AND id NOT IN (SELECT vendor_id FROM public.services);

-- تحديث دالة إنشاء المستخدم لتستخدم 0 كقيمة افتراضية
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_full_name TEXT;
    v_status TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'user');
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', '');
  
  -- البائع يبدأ بحالة معلقة وحدود صفرية
  IF v_role = 'vendor' THEN 
    v_status := 'pending'; 
  ELSE 
    v_status := 'approved'; 
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, role, status, is_enabled, business_name, hall_limit, service_limit, subscription_plan
  )
  VALUES (
    new.id, 
    new.email, 
    v_full_name, 
    v_role, 
    v_status, 
    true, 
    v_full_name,
    0, -- Start with 0 Halls
    0, -- Start with 0 Services
    'basic'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$;
