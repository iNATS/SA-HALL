
-- تحديث دالة إنشاء المستخدم لضمان أن البائع يبدأ بحالة "قيد الانتظار"
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
  -- استخراج البيانات
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'user');
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', '');
  
  -- المنطق الصارم: البائع دائماً يبدأ قيد المراجعة إلا إذا كان هناك دفع مسبق موثق
  IF v_role = 'vendor' THEN
     -- يمكن إضافة شرط هنا: لو payment_status = 'paid' نجعله approved
     -- لكن للسيناريو المطلوب (صفحة الانتظار)، نجعله pending
     v_status := 'pending'; 
  ELSE 
     v_status := 'approved'; -- المستخدم العادي
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
    0, -- الحدود تبدأ بـ 0 لإجباره على الاشتراك لاحقاً بعد الموافقة
    0, 
    'basic'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

  RETURN new;
END;
$$;
