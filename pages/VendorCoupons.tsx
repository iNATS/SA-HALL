import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Coupon } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { PriceTag } from '../components/ui/PriceTag';
import {
  Ticket, Plus, Edit3, Trash2, Power, PowerOff, Loader2,
  Calendar, Percent, Wallet, Copy, Search, CheckCircle2, XCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface VendorCouponsProps {
  user: UserProfile;
}

export const VendorCoupons: React.FC<VendorCouponsProps> = ({ user }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    applicable_to: 'both',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  }, [user.id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    filterCoupons();
  }, [searchQuery, statusFilter, coupons]);

  const filterCoupons = () => {
    let filtered = [...coupons];

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      const now = new Date().toISOString();
      if (statusFilter === 'active') {
        filtered = filtered.filter(c =>
          c.is_active && (!c.end_date || c.end_date > now)
        );
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(c =>
          c.end_date && c.end_date < now
        );
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(c => !c.is_active);
      }
    }

    setFilteredCoupons(filtered);
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setCurrentCoupon({
        ...coupon,
        start_date: coupon.start_date.split('T')[0],
        end_date: coupon.end_date ? coupon.end_date.split('T')[0] : ''
      });
    } else {
      setCurrentCoupon({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        applicable_to: 'both',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentCoupon.code || !currentCoupon.discount_value) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        code: currentCoupon.code.toUpperCase().trim(),
        discount_type: currentCoupon.discount_type,
        discount_value: currentCoupon.discount_value,
        applicable_to: currentCoupon.applicable_to,
        start_date: new Date(currentCoupon.start_date!).toISOString(),
        end_date: currentCoupon.end_date ? new Date(currentCoupon.end_date).toISOString() : null,
        is_active: currentCoupon.is_active,
        vendor_id: user.id,
        updated_at: new Date().toISOString()
      };

      let error;
      if (currentCoupon.id) {
        const result = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', currentCoupon.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('coupons')
          .insert([payload]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: currentCoupon.id ? 'تم تحديث الكوبون' : 'تم إنشاء الكوبون بنجاح',
        variant: 'success'
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;

    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'تم الحذف', description: 'تم حذف الكوبون بنجاح', variant: 'success' });
    fetchData();
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'تم النسخ', description: 'تم نسخ الكود بنجاح', variant: 'success' });
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );

  const activeCoupons = coupons.filter(c => c.is_active).length;
  const expiredCoupons = coupons.filter(c => c.end_date && new Date(c.end_date) < new Date()).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">كوبونات الخصم</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة أكواد الخصم والعروض</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          كوبون جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="إجمالي الكوبونات"
          value={coupons.length}
          icon={Ticket}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="الكوبونات النشطة"
          value={activeCoupons}
          icon={CheckCircle2}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="الكوبونات منتهية"
          value={expiredCoupons}
          icon={XCircle}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="الكوبونات المعطلة"
          value={coupons.length - activeCoupons - expiredCoupons}
          icon={PowerOff}
          color="bg-gray-50 text-gray-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث بالكود أو الوصف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-10"
            />
          </div>
          <select
            className="h-10 px-4 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="active">نشط</option>
            <option value="expired">منتهي</option>
            <option value="inactive">معطل</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
            <tr>
              <th className="p-4">الكود</th>
              <th className="p-4">الوصف</th>
              <th className="p-4">نوع الخصم</th>
              <th className="p-4">القيمة</th>
              <th className="p-4">تاريخ الانتهاء</th>
              <th className="p-4">الحالة</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-10 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </td>
              </tr>
            ) : filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400 font-bold">
                  لا توجد كوبونات
                </td>
              </tr>
            ) : (
              filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-black text-primary bg-primary/5 px-2 py-1 rounded">
                        {coupon.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className="text-gray-400 hover:text-primary transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                      coupon.discount_type === 'percentage' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {coupon.discount_type === 'percentage' ? (
                        <><Percent className="w-3 h-3" /> نسبة</>
                      ) : (
                        <><Wallet className="w-3 h-3" /> ثابت</>
                      )}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-primary">
                      {coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ' ر.س'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={
                      coupon.is_active && (!coupon.end_date || new Date(coupon.end_date) > new Date())
                        ? 'success'
                        : coupon.end_date && new Date(coupon.end_date) < new Date()
                        ? 'destructive'
                        : 'default'
                    }>
                      {coupon.is_active 
                        ? (!coupon.end_date || new Date(coupon.end_date) > new Date() ? 'نشط' : 'منتهي')
                        : 'معطل'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          coupon.is_active 
                            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={coupon.is_active ? 'تعطيل' : 'تفعيل'}
                      >
                        {coupon.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(coupon)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentCoupon.id ? 'تعديل الكوبون' : 'كوبون جديد'}
      >
        <div className="space-y-4">
          <Input
            label="كود الكوبون"
            value={currentCoupon.code || ''}
            onChange={(e) => setCurrentCoupon({ ...currentCoupon, code: e.target.value.toUpperCase() })}
            placeholder="SUMMER2024"
            className="h-12 font-black uppercase text-center"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">نوع الخصم</label>
              <select
                className="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-bold bg-white outline-none"
                value={currentCoupon.discount_type}
                onChange={(e) => setCurrentCoupon({ ...currentCoupon, discount_type: e.target.value as any })}
              >
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ر.س)</option>
              </select>
            </div>
            <Input
              label="قيمة الخصم"
              type="number"
              value={currentCoupon.discount_value || ''}
              onChange={(e) => setCurrentCoupon({ ...currentCoupon, discount_value: Number(e.target.value) })}
              className="h-12"
              placeholder={currentCoupon.discount_type === 'percentage' ? '10' : '50'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="تاريخ البداية"
              type="date"
              value={currentCoupon.start_date || ''}
              onChange={(e) => setCurrentCoupon({ ...currentCoupon, start_date: e.target.value })}
              className="h-12"
            />
            <Input
              label="تاريخ الانتهاء"
              type="date"
              value={currentCoupon.end_date || ''}
              onChange={(e) => setCurrentCoupon({ ...currentCoupon, end_date: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={currentCoupon.is_active}
              onChange={(e) => setCurrentCoupon({ ...currentCoupon, is_active: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="is_active" className="text-sm font-bold text-gray-700">
              كوبون نشط
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-12"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
            </Button>
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="outline"
              className="flex-1 h-12"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
