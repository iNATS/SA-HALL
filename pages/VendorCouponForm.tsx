import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, ArrowRight } from 'lucide-react';

interface VendorCouponFormProps {
  coupon?: any;
  onBack: () => void;
}

export const VendorCouponForm: React.FC<VendorCouponFormProps> = ({ coupon, onBack }) => {
  const [currentCoupon, setCurrentCoupon] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    end_date: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (coupon) {
      setCurrentCoupon({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        end_date: coupon.end_date,
        is_active: coupon.is_active
      });
    }
  }, [coupon]);

  const handleSave = async () => {
    if (!currentCoupon.code.trim() || !currentCoupon.discount_value || !currentCoupon.end_date) return;

    setSaving(true);
    try {
      const couponData = {
        code: currentCoupon.code.toUpperCase(),
        discount_type: currentCoupon.discount_type,
        discount_value: currentCoupon.discount_value,
        end_date: currentCoupon.end_date,
        is_active: currentCoupon.is_active
      };

      if (coupon) {
        // Update
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', coupon.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('coupons')
          .insert([couponData]);

        if (error) throw error;
      }

      onBack();
    } catch (error) {
      console.error('Error saving coupon:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-tajawal">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button onClick={onBack} variant="ghost" className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            العودة
          </Button>
          <h1 className="text-xl font-black">كوبون جديد</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
          <div className="space-y-4 text-right">
            <Input label="الكود (EN)" value={currentCoupon.code} onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value.toUpperCase()})} className="h-12 rounded-xl text-center font-black uppercase" />
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">النوع</label>
                  <select className="w-full h-12 border border-gray-200 rounded-xl px-4 text-xs font-bold bg-white outline-none" value={currentCoupon.discount_type} onChange={e => setCurrentCoupon({...currentCoupon, discount_type: e.target.value as any})}>
                     <option value="percentage">نسبة مئوية (%)</option>
                     <option value="fixed">مبلغ ثابت (SAR)</option>
                  </select>
               </div>
               <Input label="القيمة" type="number" value={currentCoupon.discount_value} onChange={e => setCurrentCoupon({...currentCoupon, discount_value: Number(e.target.value)})} className="h-12 rounded-xl font-bold" />
            </div>
            <Input label="تاريخ الانتهاء" type="date" value={currentCoupon.end_date} onChange={e => setCurrentCoupon({...currentCoupon, end_date: e.target.value})} className="h-12 rounded-xl font-bold" />
            <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl font-black mt-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};