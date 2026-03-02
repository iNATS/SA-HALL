import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, ArrowRight, Smartphone, Mail, ShieldCheck, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { normalizeNumbers, isValidSaudiPhone } from '../utils/helpers';
import { sendSMSOTP, verifySMSOTP } from '../services/smsService';

export const GuestLogin: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [sendMethod, setSendMethod] = useState<'sms' | 'email'>('sms');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [systemLogo, setSystemLogo] = useState('https://dash.hall.sa/logo.svg');
  const [foundEmail, setFoundEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'platform_config').maybeSingle();
    if (data?.value?.platform_logo_url) {
      setSystemLogo(data.value.platform_logo_url);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);

    try {
      // SMS Method
      if (sendMethod === 'sms') {
        const normalizedPhone = normalizeNumbers(phone);

        if (!normalizedPhone) {
          toast({ 
            title: 'رقم الجوال مطلوب', 
            description: 'يرجى إدخال رقم الجوال المسجل في الحجوزات.', 
            variant: 'destructive' 
          });
          setLoading(false);
          return;
        }

        if (!isValidSaudiPhone(normalizedPhone)) {
          toast({ 
            title: 'رقم غير صالح', 
            description: 'يرجى إدخال رقم سعودي صحيح (يبدأ بـ 05).', 
            variant: 'destructive' 
          });
          setLoading(false);
          return;
        }

        console.log('📱 Sending SMS OTP to:', normalizedPhone);

        // Send via SMS Service (uses static OTP 222222 in testing mode)
        const smsResult = await sendSMSOTP(normalizedPhone);

        if (!smsResult.success) {
          throw new Error(smsResult.error || 'فشل إرسال الرسالة النصية');
        }

        toast({ 
          title: 'تم الإرسال', 
          description: `تم إرسال رمز التحقق إلى رقم جوالك.\n(رمز الاختبار: 222222)`, 
          variant: 'success' 
        });
        setPhone(normalizedPhone);
        setStep(2);

      } else {
        // Email Method - First find email from phone
        const normalizedPhone = normalizeNumbers(phone);

        if (!normalizedPhone) {
          toast({ 
            title: 'رقم الجوال مطلوب', 
            description: 'يرجى إدخال رقم الجوال المسجل في الحجوزات.', 
            variant: 'destructive' 
          });
          setLoading(false);
          return;
        }

        // Search for bookings with this phone
        const { data: bookingData, error: lookupError } = await supabase
          .from('bookings')
          .select('guest_email, guest_phone')
          .eq('guest_phone', normalizedPhone)
          .not('guest_email', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lookupError) throw lookupError;

        if (!bookingData?.guest_email) {
          toast({
            title: 'لم يتم العثور على حجوزات',
            description: 'لم نجد أي حجوزات مرتبطة برقم الجوال هذا. تأكد من الرقم أو استخدم طريقة الرسائل النصية.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        const targetEmail = bookingData.guest_email;
        setEmail(targetEmail);
        setFoundEmail(targetEmail);

        // Send OTP via email
        const { error: authError } = await supabase.auth.signInWithOtp({ email: targetEmail });
        if (authError) throw authError;

        toast({ 
          title: 'تم الإرسال', 
          description: `تم إرسال رمز الدخول إلى بريدك الإلكتروني.`, 
          variant: 'success' 
        });
        setStep(2);
      }

    } catch (err: any) {
      console.error('Send OTP Error:', err);
      toast({
        title: 'خطأ',
        description: err.message || 'حدث خطأ أثناء محاولة الدخول. يرجى المحاولة مرة أخرى.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast({ 
        title: 'أدخل الرمز', 
        description: 'يرجى إدخال رمز التحقق.', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      // Verify SMS OTP
      if (sendMethod === 'sms') {
        const normalizedPhone = normalizeNumbers(phone);
        const result = await verifySMSOTP(normalizedPhone, otp);

        if (!result.success) {
          throw new Error(result.error || 'الرمز غير صحيح أو منتهي الصلاحية');
        }

        toast({ 
          title: 'تم التحقق', 
          description: 'تم التحقق بنجاح، جاري تسجيل الدخول...', 
          variant: 'success' 
        });

        // Create or fetch user profile
        await handleLoginSuccess(normalizedPhone);

      } else {
        // Verify Email OTP
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: normalizeNumbers(otp),
          type: 'magiclink'
        });

        if (error) throw error;

        toast({ 
          title: 'تم تسجيل الدخول', 
          variant: 'success' 
        });
        if (onBack) onBack();
      }
    } catch (err: any) {
      toast({ 
        title: 'رمز خاطئ', 
        description: err.message || 'تأكد من الرمز وحاول مرة أخرى.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (phoneNumber: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Create guest user with phone number
        const randomPassword = Math.random().toString(36).slice(-10);
        const { data: authData, error: authError } = await supabase.auth.signUp({
          phone: phoneNumber,
          password: randomPassword,
          options: {
            data: {
              phone_number: phoneNumber,
              full_name: `ضيف_${phoneNumber.slice(-4)}`,
              role: 'user'
            }
          }
        });

        if (authError) throw authError;
      }

      // Fetch or create profile
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (!profile) {
        const userId = user?.id || (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
          await supabase.from('profiles').insert([{
            id: userId,
            email: `guest_${phoneNumber.slice(-4)}@guest.local`,
            phone_number: phoneNumber,
            full_name: `ضيف_${phoneNumber.slice(-4)}`,
            role: 'user',
            status: 'approved',
            is_enabled: true
          }]);

          profile = {
            id: userId,
            email: `guest_${phoneNumber.slice(-4)}@guest.local`,
            phone_number: phoneNumber,
            full_name: `ضيف_${phoneNumber.slice(-4)}`,
            role: 'user',
            status: 'approved',
            is_enabled: true
          };
        }
      }

      if (onBack) onBack();
      
    } catch (err: any) {
      console.error('Login success error:', err);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تسجيل الدخول',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex font-tajawal text-right bg-gradient-to-br from-primary/5 via-white to-purple-50" dir="rtl">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">

          {/* Header */}
          <div className="text-right space-y-3 mb-6">
            <button 
              onClick={onBack} 
              className="text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-2 font-bold text-xs transition-colors"
            >
              <ArrowRight className="w-4 h-4" /> 
              العودة للرئيسية
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                  {step === 1 ? 'بوابة الضيوف' : 'التحقق من الهوية'}
                </h2>
                <p className="text-gray-500 font-bold text-sm">
                  {step === 1 ? 'سجل دخولك برقم جوالك' : 'أدخل رمز التحقق المرسل'}
                </p>
              </div>
            </div>
          </div>

          {/* Testing Mode Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-800">🧪 وضع الاختبار مفعّل</p>
                <p className="text-[10px] text-blue-600 mt-1">
                  استخدم الرمز <b className="font-black text-lg">222222</b> لجميع الأرقام
                </p>
              </div>
            </div>
          </div>

          {step === 1 && (
            <>
              {/* Method Selection */}
              <div className="text-center mb-4">
                <p className="text-sm font-bold text-gray-500 mb-3">اختر طريقة إرسال الرمز</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSendMethod('sms')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      sendMethod === 'sms'
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/20'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    رسالة نصية
                  </button>
                  <button
                    onClick={() => setSendMethod('email')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      sendMethod === 'email'
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/20'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    بريد إلكتروني
                  </button>
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 block">
                    {sendMethod === 'sms' ? 'رقم الجوال المسجل' : 'رقم الجوال للبحث عن البريد'}
                  </label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(normalizeNumbers(e.target.value))}
                    className="h-12 rounded-xl border-gray-200 text-lg font-bold tracking-wide"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>

                {foundEmail && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-green-700">
                      ✓ تم العثور على البريد: <b>{foundEmail}</b>
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button 
                    onClick={handleSendOtp} 
                    disabled={loading || !phone} 
                    className="w-full h-12 rounded-xl font-black text-base bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'إرسال رمز التحقق'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/20 animate-in zoom-in duration-300">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    تم إرسال رمز التحقق إلى
                  </p>
                  <p className="text-base font-black text-gray-900 mt-1">
                    {sendMethod === 'sms' ? phone : foundEmail}
                  </p>
                </div>
              </div>

              {/* OTP Input */}
              <div className="space-y-3">
                <Input
                  value={otp}
                  onChange={e => setOtp(normalizeNumbers(e.target.value))}
                  className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 focus:border-primary"
                  placeholder="------"
                  maxLength={6}
                  dir="ltr"
                />
                <p className="text-[10px] text-gray-400 font-bold">
                  {sendMethod === 'sms' && '💡 استخدم الرمز 222222 في وضع الاختبار'}
                </p>
              </div>

              {/* Verify Button */}
              <Button 
                onClick={handleVerifyOtp} 
                disabled={loading || otp.length < 4} 
                className="w-full h-12 rounded-xl font-black text-base bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'تحقق ودخول'}
              </Button>

              {/* Back Button */}
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-xs text-gray-400 hover:text-primary font-bold transition-colors"
              >
                تغيير الطريقة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Logo */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary to-purple-600 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="relative z-10 text-center">
          <img 
            src={systemLogo} 
            className="h-64 w-auto mx-auto mb-6 invert brightness-0 filter drop-shadow-xl object-contain" 
            alt="Logo" 
          />
          <p className="text-white/80 font-bold text-sm mt-4">بوابة الضيوف الذكية</p>
        </div>
      </div>
    </div>
  );
};
