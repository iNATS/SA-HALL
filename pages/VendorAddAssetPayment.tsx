import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { Button } from '../components/ui/Button';
import { PriceTag } from '../components/ui/PriceTag';
import { useToast } from '../context/ToastContext';
import { HyperPayForm } from '../components/Payment/HyperPayForm';
import { Modal } from '../components/ui/Modal';
import {
  Building2, Sparkles, Check, CreditCard, ShieldCheck,
  Loader2, XCircle, CheckCircle, AlertCircle
} from 'lucide-react';

interface VendorAddAssetPaymentProps {
  user: UserProfile;
  assetType: 'hall' | 'service';
  assetData: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VendorAddAssetPayment: React.FC<VendorAddAssetPaymentProps> = ({
  user,
  assetType,
  assetData,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'payment' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'lifetime'>('lifetime');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const { toast } = useToast();

  // Prices from admin settings
  const [prices, setPrices] = useState({
    hall: 500,
    service: 200
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'vendor_subscription_prices')
      .maybeSingle();
    
    if (data?.value) {
      setPrices(data.value);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const price = typeof prices[assetType] === 'number' ? prices[assetType] : Number(prices[assetType]) || prices[assetType];

      // Create subscription record
      const subscription = {
        vendor_id: user.id,
        subscription_type: assetType,
        amount: price,
        payment_status: 'completed' as const,
        payment_method: 'lifetime' as const,
        is_lifetime: true,
        created_at: new Date().toISOString()
      };

      const { data: subData, error: subError } = await supabase
        .from('vendor_subscriptions')
        .insert([subscription])
        .select()
        .single();

      if (subError) throw subError;

      // Create the asset (hall or service)
      if (assetType === 'hall') {
        const hallPayload = {
          ...assetData,
          vendor_id: user.id,
          is_active: true,
          type: 'hall' as const
        };

        const { error: hallError } = await supabase
          .from('halls')
          .insert([hallPayload]);

        if (hallError) throw hallError;
      } else {
        const servicePayload = {
          ...assetData,
          vendor_id: user.id,
          is_active: true
        };

        const { error: serviceError } = await supabase
          .from('services')
          .insert([servicePayload]);

        if (serviceError) throw serviceError;
      }

      // Update user profile limits
      const limitField = assetType === 'hall' ? 'hall_limit' : 'service_limit';
      const currentLimit = Number(user[limitField as keyof UserProfile] || 0);
      
      await supabase
        .from('profiles')
        .update({
          [limitField]: currentLimit + 1,
          has_active_subscription: true
        })
        .eq('id', user.id);

      toast({
        title: 'تم بنجاح',
        description: `تم إضافة ${assetType === 'hall' ? 'القاعة' : 'الخدمة'} بنجاح وتفعيل اشتراكك`,
        variant: 'success'
      });

      setPaymentStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error(err);
      toast({
        title: 'خطأ',
        description: err.message || 'حدث خطأ أثناء المعاملة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (paymentData: any) => {
    setLoading(true);
    try {
      const price = typeof prices[assetType] === 'number' ? prices[assetType] : Number(prices[assetType]) || prices[assetType];

      // Verify payment with HyperPay
      const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('verify-payment', {
        body: { paymentData, amount: price }
      });

      if (paymentError) throw paymentError;
      if (!paymentResult?.success) throw new Error('فشل التحقق من الدفع');

      // Create subscription record
      const subscription = {
        vendor_id: user.id,
        subscription_type: assetType,
        amount: price,
        payment_status: 'completed' as const,
        payment_method: 'card' as const,
        is_lifetime: false,
        payment_reference: paymentResult.id,
        created_at: new Date().toISOString()
      };

      const { data: subData, error: subError } = await supabase
        .from('vendor_subscriptions')
        .insert([subscription])
        .select()
        .single();

      if (subError) throw subError;

      // Create the asset
      if (assetType === 'hall') {
        const hallPayload = {
          ...assetData,
          vendor_id: user.id,
          is_active: true,
          type: 'hall' as const
        };

        const { error: hallError } = await supabase
          .from('halls')
          .insert([hallPayload]);

        if (hallError) throw hallError;
      } else {
        const servicePayload = {
          ...assetData,
          vendor_id: user.id,
          is_active: true
        };

        const { error: serviceError } = await supabase
          .from('services')
          .insert([servicePayload]);

        if (serviceError) throw serviceError;
      }

      // Update user profile
      const limitField = assetType === 'hall' ? 'hall_limit' : 'service_limit';
      const currentLimit = Number(user[limitField as keyof UserProfile] || 0);
      
      await supabase
        .from('profiles')
        .update({
          [limitField]: currentLimit + 1
        })
        .eq('id', user.id);

      toast({
        title: 'تم الدفع بنجاح',
        description: `تم إضافة ${assetType === 'hall' ? 'القاعة' : 'الخدمة'} بنجاح`,
        variant: 'success'
      });

      setPaymentStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error(err);
      toast({
        title: 'خطأ في الدفع',
        description: err.message || 'حدث خطأ أثناء معالجة الدفع',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const price = prices[assetType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-black text-gray-900">
            {paymentStep === 'select' ? 'طريقة الدفع' : paymentStep === 'payment' ? 'الدفع الإلكتروني' : 'تم بنجاح'}
          </h2>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentStep === 'select' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    assetType === 'hall' ? 'bg-primary text-white' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {assetType === 'hall' ? <Building2 className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">
                      إضافة {assetType === 'hall' ? 'قاعة جديدة' : 'خدمة جديدة'}
                    </h3>
                    <p className="text-sm text-gray-500 font-bold">
                      {assetType === 'hall' ? assetData?.name : assetData?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                  <span className="text-sm font-bold text-gray-600">رسم الاشتراك (مدى الحياة)</span>
                  <PriceTag amount={price} className="text-2xl font-black text-primary" />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h4 className="text-lg font-black text-gray-900">اختر طريقة الدفع</h4>
                
                {/* Lifetime Payment */}
                <div
                  onClick={() => setPaymentMethod('lifetime')}
                  className={`cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                    paymentMethod === 'lifetime'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'lifetime' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="font-black text-gray-900">دفع لمرة واحدة - مدى الحياة</h5>
                        <p className="text-sm text-gray-500 font-bold">اشتراك دائم بدون تجديد</p>
                      </div>
                    </div>
                    {paymentMethod === 'lifetime' && (
                      <Check className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </div>

                {/* Card Payment */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'card' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="font-black text-gray-900">بطاقة ائتمان / مدى</h5>
                        <p className="text-sm text-gray-500 font-bold">فيزا، ماستركارد، مدى</p>
                      </div>
                    </div>
                    {paymentMethod === 'card' && (
                      <Check className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full h-14 text-lg font-black"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    تأكيد ودفع <PriceTag amount={price} className="text-lg" />
                  </>
                )}
              </Button>
            </div>
          )}

          {paymentStep === 'payment' && checkoutId && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-600">المبلغ المطلوب</span>
                  <PriceTag amount={price} className="text-xl font-black text-primary" />
                </div>
              </div>
              <HyperPayForm
                checkoutId={checkoutId || ''}
                baseUrl="https://eu-test.oppwa.com"
                redirectUrl={window.location.origin + '/payment-result'}
              />
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">تم بنجاح!</h3>
              <p className="text-gray-500 font-bold">
                تم إضافة {assetType === 'hall' ? 'القاعة' : 'الخدمة'} وتفعيل الاشتراك
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
