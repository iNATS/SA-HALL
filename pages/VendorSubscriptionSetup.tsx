
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { Button } from '../components/ui/Button';
import { PriceTag } from '../components/ui/PriceTag';
import { Building2, Sparkles, CheckCircle2, ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface VendorSubscriptionSetupProps {
  user: UserProfile;
  onSuccess: () => void;
  onLogout: () => void;
}

export const VendorSubscriptionSetup: React.FC<VendorSubscriptionSetupProps> = ({ user, onSuccess, onLogout }) => {
  const [processingType, setProcessingType] = useState<'hall' | 'service' | null>(null);
  const [fees, setFees] = useState({ hall: 500, service: 200 });
  const { toast } = useToast();

  useEffect(() => {
      const fetchFees = async () => {
          const { data } = await supabase.from('system_settings').select('value').eq('key', 'platform_config').maybeSingle();
          if (data?.value) {
              setFees({
                  hall: data.value.hall_listing_fee || 500,
                  service: data.value.service_listing_fee || 200
              });
          }
      };
      fetchFees();
  }, []);

  const handleSubscribe = async (type: 'hall' | 'service') => {
      setProcessingType(type);
      try {
          const amount = type === 'hall' ? fees.hall : fees.service;
          
          // Simulation of Payment Process
          // In real app, redirect to HyperPay/Stripe here.
          await new Promise(resolve => setTimeout(resolve, 2000));

          // On Success: Update Limit & APPROVE the user status
          const updateField = type === 'hall' ? 'hall_limit' : 'service_limit';
          const { error } = await supabase.from('profiles')
            .update({ 
                [updateField]: (type === 'hall' ? user.hall_limit : user.service_limit) + 1,
                status: 'approved' // Auto-approve upon payment
            })
            .eq('id', user.id);

          if (error) throw error;

          // Log Invoice
          await supabase.from('external_invoices').insert([{
              vendor_id: user.id,
              customer_name: user.business_name || user.full_name,
              total_amount: amount,
              vat_amount: amount * 0.15,
              status: 'paid',
              items: [{ description: `اشتراك ${type === 'hall' ? 'قاعة' : 'خدمة'} جديد`, quantity: 1, unit_price: amount, total: amount }]
          }]);

          toast({ title: 'تم الاشتراك بنجاح', description: 'تم تفعيل حسابك، مرحباً بك!', variant: 'success' });
          onSuccess();

      } catch (err: any) {
          toast({ title: 'خطأ', description: 'حدث خطأ أثناء معالجة الدفع.', variant: 'destructive' });
      } finally {
          setProcessingType(null);
      }
  };

  // Get first name for greeting
  const firstName = user.full_name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-tajawal text-right" dir="rtl">
        <div className="max-w-4xl w-full animate-in fade-in slide-in-from-bottom-4">
            
            <div className="text-center mb-10 space-y-4">
                <h1 className="text-4xl font-black text-gray-900">مرحبا ألف، {firstName} 👋</h1>
                <p className="text-gray-500 font-bold text-lg max-w-xl mx-auto">
                    لقد أوشكت على الانتهاء! قم بتفعيل اشتراك واحد على الأقل للوصول إلى لوحة التحكم وإضافة قاعاتك.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                
                {/* Hall Plan */}
                <div className="bg-white rounded-[3rem] border border-gray-100 p-8 hover:border-primary/30 hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[100%] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary mb-6 border border-gray-50">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">باقة القاعات والشاليهات</h3>
                        <p className="text-gray-400 font-bold text-sm mt-2">مخصصة لقاعات الأفراح، الاستراحات، والمنتجعات.</p>
                        
                        <div className="my-8">
                            <div className="flex items-end gap-1">
                                <PriceTag amount={fees.hall} className="text-4xl font-black text-gray-900" />
                                <span className="text-gray-400 font-bold mb-1.5">/ سنوياً لكل قاعة</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {['لوحة تحكم متكاملة للحجوزات', 'نظام مالي وفواتير إلكترونية', 'رابط خاص وتسويق مجاني', 'دعم فني على مدار الساعة'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> {feat}
                                </li>
                            ))}
                        </ul>

                        <Button 
                            onClick={() => handleSubscribe('hall')} 
                            disabled={!!processingType} 
                            className="w-full h-14 rounded-2xl font-black text-lg bg-gray-900 text-white shadow-xl hover:bg-black"
                        >
                            {processingType === 'hall' ? <Loader2 className="animate-spin" /> : 'اشترك وأضف قاعة'}
                        </Button>
                    </div>
                </div>

                {/* Service Plan */}
                <div className="bg-white rounded-[3rem] border border-gray-100 p-8 hover:border-orange-500/30 hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100%] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-orange-500 mb-6 border border-gray-50">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900">باقة مزودي الخدمات</h3>
                        <p className="text-gray-400 font-bold text-sm mt-2">للضيافة، التصوير، الكوش، والتجهيزات.</p>
                        
                        <div className="my-8">
                            <div className="flex items-end gap-1">
                                <PriceTag amount={fees.service} className="text-4xl font-black text-gray-900" />
                                <span className="text-gray-400 font-bold mb-1.5">/ سنوياً لكل خدمة</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {['إدارة الطلبات والمواعيد', 'معرض أعمال (Portfolio) احترافي', 'نظام الفواتير المبسطة', 'ظهور في نتائج البحث المتقدم'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> {feat}
                                </li>
                            ))}
                        </ul>

                        <Button 
                            onClick={() => handleSubscribe('service')} 
                            disabled={!!processingType} 
                            className="w-full h-14 rounded-2xl font-black text-lg bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-50"
                        >
                            {processingType === 'service' ? <Loader2 className="animate-spin" /> : 'اشترك وأضف خدمة'}
                        </Button>
                    </div>
                </div>

            </div>

            <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-500 mb-6">
                    <ShieldCheck className="w-4 h-4 text-green-600" /> مدفوعات آمنة وموثقة 100%
                </div>
                <br />
                <button onClick={onLogout} className="flex items-center gap-2 mx-auto text-gray-400 hover:text-red-500 font-bold text-sm transition-colors">
                    <LogOut className="w-4 h-4" /> تسجيل الخروج
                </button>
            </div>

        </div>
    </div>
  );
};
