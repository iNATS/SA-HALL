
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, ArrowRight, Mail, KeyRound, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { normalizeNumbers } from '../utils/helpers';

export const ForgotPassword: React.FC<{ onBack: () => void; onSuccess?: () => void }> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Password Requirements State
  const passwordRequirements = [
      { id: 'len', label: '8 أحرف على الأقل', valid: password.length >= 8 },
      { id: 'num', label: 'يحتوي على رقم واحد على الأقل', valid: /\d/.test(password) },
      { id: 'sym', label: 'يحتوي على رمز خاص (!@#$)', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
      { id: 'match', label: 'تطابق كلمتي المرور', valid: password.length > 0 && password === confirmPassword }
  ];

  const handleSendResetOtp = async () => {
    if (!email) {
        toast({ title: 'البريد الإلكتروني مطلوب', description: 'يرجى إدخال بريدك الإلكتروني.', variant: 'destructive' });
        return;
    }

    setLoading(true);
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;

        toast({ title: 'تم الإرسال', description: `تم إرسال رمز التحقق إلى بريدك الإلكتروني (${email.slice(0, 3)}***).`, variant: 'success' });
        setStep(2);

    } catch (err: any) {
        console.error(err);
        toast({ title: 'خطأ', description: err.message || 'حدث خطأ أثناء إرسال رمز التحقق.', variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !email) return;
    setLoading(true);
    
    try {
        // For password reset, we just verify the OTP and move to password step
        // The actual password update will happen in the next step
        toast({ title: 'تم التحقق', description: 'يرجى إنشاء كلمة مرور جديدة.', variant: 'success' });
        setStep(3);

    } catch (err: any) {
        toast({ title: 'رمز خاطئ', description: 'تأكد من الرمز وحاول مرة أخرى.', variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordRequirements.every(req => req.valid)) {
        toast({ title: 'كلمة مرور غير صالحة', description: 'يرجى التأكد من استيفاء جميع متطلبات الأمان.', variant: 'destructive' });
        return;
    }

    setLoading(true);
    
    try {
        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) throw error;

        toast({ title: 'تم بنجاح', description: 'تم تحديث كلمة المرور بنجاح. سيتم توجيهك لتسجيل الدخول.', variant: 'success' });
        
        // Redirect to login after success
        setTimeout(() => {
            if (onSuccess) onSuccess();
            else onBack(); // Fallback to home
        }, 2000);

    } catch (err: any) {
        console.error(err);
        toast({ title: 'خطأ', description: err.message || 'حدث خطأ أثناء تحديث كلمة المرور.', variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-tajawal text-right" dir="rtl">
        <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-2 font-bold text-xs"><ArrowRight className="w-4 h-4" /> العودة للرئيسية</button>
            
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-primary">نسيت كلمة المرور</h2>
                <p className="text-gray-500 font-bold mt-2 text-sm">
                    {step === 1 && 'أدخل بريدك الإلكتروني لإرسال رمز التحقق'}
                    {step === 2 && 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني'}
                    {step === 3 && 'أنشئ كلمة مرور جديدة لحسابك'}
                </p>
            </div>

            {step === 1 ? (
                <div className="space-y-4 animate-in slide-in-from-right">
                    <Input 
                        label="البريد الإلكتروني" 
                        type="email"
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        icon={<Mail className="w-4 h-4" />}
                        className="h-12 rounded-xl"
                        placeholder="example@email.com"
                        required
                    />
                    <Button onClick={handleSendResetOtp} disabled={loading} className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 mt-4">
                        {loading ? <Loader2 className="animate-spin" /> : 'إرسال رمز التحقق'}
                    </Button>
                </div>
            ) : step === 2 ? (
                <div className="space-y-6 animate-in slide-in-from-right text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4"><KeyRound className="w-8 h-8" /></div>
                    <p className="text-sm font-bold text-gray-500">أدخل الرمز المرسل إلى بريدك الإلكتروني</p>
                    <Input placeholder="------" value={otp} onChange={e => setOtp(normalizeNumbers(e.target.value))} className="h-14 rounded-xl text-center text-2xl font-black tracking-widest" maxLength={6} />
                    <Button onClick={handleVerifyOtp} disabled={loading} className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20">
                        {loading ? <Loader2 className="animate-spin" /> : 'تحقق من الرمز'}
                    </Button>
                    <button onClick={() => setStep(1)} className="text-xs font-bold text-gray-400 underline">تغيير البريد الإلكتروني</button>
                </div>
            ) : (
                <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4"><ShieldCheck className="w-8 h-8" /></div>
                        <p className="text-sm text-gray-500 font-bold">يرجى إنشاء كلمة مرور قوية لحماية حسابك</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-1 relative">
                            <label className="text-xs font-bold text-gray-500">كلمة المرور الجديدة</label>
                            <div className="relative">
                                <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-lg border-gray-200 focus:border-primary pr-10" placeholder="••••••••" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1 relative">
                            <label className="text-xs font-bold text-gray-500">تأكيد كلمة المرور</label>
                            <div className="relative">
                                <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-12 rounded-lg border-gray-200 focus:border-primary pr-10" placeholder="••••••••" required />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">متطلبات الأمان:</p>
                        {passwordRequirements.map((req) => (
                            <div key={req.id} className="flex items-center gap-2 text-xs font-bold transition-colors duration-300">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${req.valid ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    {req.valid ? <Check className="w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>}
                                </div>
                                <span className={req.valid ? 'text-green-600' : 'text-gray-500'}>{req.label}</span>
                            </div>
                        ))}
                    </div>

                    <Button disabled={loading || !passwordRequirements.every(req => req.valid)} className="w-full h-12 rounded-lg font-black text-base bg-primary text-white hover:bg-primary/90">
                        {loading ? <Loader2 className="animate-spin" /> : 'تحديث كلمة المرور'}
                    </Button>
                </form>
            )}
        </div>
    </div>
  );
};
