import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Subscription } from '../types';
import { Button } from '../components/ui/Button';
import { PriceTag } from '../components/ui/PriceTag';
import { useToast } from '../context/ToastContext';
import {
  Building2, Sparkles, Check, CreditCard, ShieldCheck,
  Loader2, Star
} from 'lucide-react';

interface VendorSubscriptionProps {
  user: UserProfile;
  onBack?: () => void;
  onComplete?: () => void;
}

export const VendorSubscription: React.FC<VendorSubscriptionProps> = ({ user, onBack, onComplete }) => {
  const [selectedType, setSelectedType] = useState<'hall' | 'service' | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasAssets, setHasAssets] = useState(false);
  const { toast } = useToast();

  const prices = {
    hall: 500,
    service: 200,
    both: 600
  };

  useEffect(() => {
    checkEligibility();
  }, [user.id]);

  const checkEligibility = async () => {
    // Check if vendor has any assets (halls or services)
    const [halls, services, subscriptions] = await Promise.all([
      supabase.from('halls').select('id', { count: 'exact', head: true }).eq('vendor_id', user.id),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('vendor_id', user.id),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('vendor_id', user.id).eq('payment_status', 'completed')
    ]);

    const hasHalls = (halls.count || 0) > 0;
    const hasServices = (services.count || 0) > 0;
    const hasSubs = (subscriptions.count || 0) > 0;

    setHasAssets(hasHalls || hasServices);
    setHasSubscription(hasSubs);

    // If vendor already has assets, redirect to dashboard
    if (hasHalls || hasServices) {
      if (onComplete) onComplete();
    }
  };

  const handlePayment = async () => {
    if (!selectedType) {
      toast({ title: 'تنبيه', description: 'يرجى اختيار نوع الاشتراك', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Create subscription record
      const subscription: Partial<Subscription> = {
        vendor_id: user.id,
        subscription_type: selectedType,
        amount: prices[selectedType],
        payment_status: 'completed',
        payment_method: 'card',
        is_lifetime: true
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert([subscription])
        .select()
        .single();

      if (error) throw error;

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          subscription_status: selectedType,
          subscription_paid_at: new Date().toISOString(),
          subscription_amount: prices[selectedType],
          has_active_subscription: true
        })
        .eq('id', user.id);

      toast({ 
        title: 'تم الاشتراك', 
        description: `مرحباً ألف ${user.full_name}! تم تفعيل اشتراكك بنجاح. مدى الحياة!`, 
        variant: 'success' 
      });

      if (onComplete) onComplete();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Don't show if vendor already has assets
  if (hasAssets) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 font-tajawal flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-500 font-bold">جاري التوجيه...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-purple-50 py-12 px-4 font-tajawal" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header - مرحبا ألف */}
        <div className="text-center mb-12">
          {/* Welcome Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20 animate-in zoom-in duration-500">
            <Star className="w-12 h-12 text-white fill-white" />
          </div>

          {/* Welcome Text */}
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 leading-tight">
            مرحباً ألف {user.full_name || 'يا بطل'} 👋
          </h1>
          
          <p className="text-xl text-gray-500 font-bold mb-2">
            نورت منصتنا! الآن اختر نوع نشاطك
          </p>
          
          <p className="text-sm text-gray-400 font-bold">
            خطوة واحدة تفصلك عن البدء
          </p>
        </div>

        {/* Subscription Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Hall Subscription */}
          <div
            onClick={() => setSelectedType('hall')}
            className={`cursor-pointer relative bg-white rounded-[3rem] p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
              selectedType === 'hall'
                ? 'border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-white'
                : 'border-gray-100 hover:border-primary/30'
            }`}
          >
            {selectedType === 'hall' && (
              <div className="absolute top-4 left-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-6 h-6 text-white" />
              </div>
            )}

            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                selectedType === 'hall' 
                  ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-xl shadow-primary/20 scale-110' 
                  : 'bg-purple-50 text-purple-600'
              }`}>
                <Building2 className="w-12 h-12" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">قاعات</h3>
                <p className="text-gray-500 font-bold text-sm">للقاعات والمناسبات الكبيرة</p>
              </div>

              <div className="pt-4 border-t border-gray-100 w-full">
                <PriceTag amount={prices.hall} className="text-4xl font-black text-primary" />
                <p className="text-xs text-gray-400 font-bold mt-1">لمرة واحدة - مدى الحياة</p>
              </div>

              <ul className="space-y-2 text-right w-full pt-4">
                {[
                  'إضافة عدد غير محدود من القاعات',
                  'إدارة الحجوزات والتقويم',
                  'لوحة تحكم متكاملة',
                  'دعم فني متميز'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm font-bold text-gray-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Service Subscription */}
          <div
            onClick={() => setSelectedType('service')}
            className={`cursor-pointer relative bg-white rounded-[3rem] p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
              selectedType === 'service'
                ? 'border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-white'
                : 'border-gray-100 hover:border-primary/30'
            }`}
          >
            {selectedType === 'service' && (
              <div className="absolute top-4 left-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-6 h-6 text-white" />
              </div>
            )}

            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                selectedType === 'service' 
                  ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-xl shadow-primary/20 scale-110' 
                  : 'bg-orange-50 text-orange-600'
              }`}>
                <Sparkles className="w-12 h-12" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">خدمات</h3>
                <p className="text-gray-500 font-bold text-sm">للخدمات والمناسبات المتعددة</p>
              </div>

              <div className="pt-4 border-t border-gray-100 w-full">
                <PriceTag amount={prices.service} className="text-4xl font-black text-primary" />
                <p className="text-xs text-gray-400 font-bold mt-1">لمرة واحدة - مدى الحياة</p>
              </div>

              <ul className="space-y-2 text-right w-full pt-4">
                {[
                  'إضافة عدد غير محدود من الخدمات',
                  'إدارة الطلبات والحجوزات',
                  'لوحة تحكم متكاملة',
                  'دعم فني متميز'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm font-bold text-gray-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        {selectedType && (
          <div className="bg-white rounded-[3rem] p-8 border border-gray-200 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-500 mb-1">المبلغ الإجمالي</p>
                <div className="flex items-center gap-2">
                  <PriceTag amount={prices[selectedType]} className="text-4xl font-black text-primary" />
                  <span className="text-xs text-gray-400 font-bold">شامل الضريبة</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={loading}
                className="h-16 px-12 rounded-2xl font-black text-lg bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-2xl hover:shadow-primary/20 transition-all shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-6 h-6 ml-2" />
                    <span>إتمام الدفع وتفعيل الاشتراك</span>
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-gray-400 font-bold mt-4">
              بالضغط على زر الدفع، أنت توافق على{' '}
              <a href="#" className="text-primary underline hover:text-primary/80">شروط وأحكام المنصة</a>
            </p>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: 'اشتراك مدى الحياة',
              desc: 'ادفع مرة واحدة واستمر للأبد'
            },
            {
              icon: <CreditCard className="w-6 h-6" />,
              title: 'دفع آمن',
              desc: 'بوابات دفع مشفرة ومحمية'
            },
            {
              icon: <Building2 className="w-6 h-6" />,
              title: 'دعم فني',
              desc: 'فريق دعم متاح 24/7'
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-gray-100 text-center hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                {feature.icon}
              </div>
              <h4 className="font-black text-gray-900 mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-500 font-bold">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
