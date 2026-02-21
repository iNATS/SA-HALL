
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Coupon } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ticket, Plus, Trash2, Power, PowerOff, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface VendorCouponsProps {
  user: UserProfile;
  onNavigate?: (tab: string, item?: any) => void;
}

export const VendorCoupons: React.FC<VendorCouponsProps> = ({ user, onNavigate }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({ 
    discount_type: 'percentage', 
    is_active: true,
    start_date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false });
    setCoupons(data as Coupon[] || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!currentCoupon.code || !currentCoupon.discount_value || !currentCoupon.end_date) return;
    setSaving(true);
    const payload = { ...currentCoupon, vendor_id: user.id };
    const { error } = currentCoupon.id 
      ? await supabase.from('coupons').update(payload).eq('id', currentCoupon.id)
      : await supabase.from('coupons').insert([payload]);

    if (!error) {
      toast({ title: 'تم الحفظ', variant: 'success' });
      setCurrentCoupon({ discount_type: 'percentage', is_active: true });
      fetchData();
    } else {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
      await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
      fetchData();
  };

  const handleDelete = async (id: string) => {
      if(!confirm('حذف الكوبون؟')) return;
      await supabase.from('coupons').delete().eq('id', id);
      fetchData();
  };

  return (
    <div className="space-y-8 pb-20 font-tajawal text-right">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2">
             الخصومات والعروض <Ticket className="w-6 h-6" />
          </h2>
          <p className="text-xs font-bold text-gray-400 mt-1">إدارة أكواد الخصم.</p>
        </div>
        <Button onClick={() => { setCurrentCoupon({ discount_type: 'percentage', is_active: true }); onNavigate?.('vendor_coupon_form'); }} className="h-12 px-6 rounded-2xl font-black gap-2 bg-gray-900 text-white">
           كوبون جديد <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase">
                  <tr>
                      <th className="p-5">الكود</th>
                      <th className="p-5">الخصم</th>
                      <th className="p-5">انتهاء الصلاحية</th>
                      <th className="p-5">الحالة</th>
                      <th className="p-5 text-center">إجراءات</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {coupons.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                          <td className="p-5 font-black font-mono text-lg">{c.code}</td>
                          <td className="p-5 font-bold text-primary">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} ر.س`}</td>
                          <td className="p-5 text-sm font-bold text-gray-500">{c.end_date}</td>
                          <td className="p-5">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${c.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                  {c.is_active ? 'نشط' : 'متوقف'}
                              </span>
                          </td>
                          <td className="p-5 text-center flex justify-center gap-2">
                              <button onClick={() => toggleStatus(c.id, c.is_active)} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-primary transition-colors">
                                  {c.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleDelete(c.id)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </td>
                      </tr>
                  ))}
                  {coupons.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-bold">لا توجد كوبونات</td></tr>}
              </tbody>
          </table>
      </div>
    </div>
  );
};
