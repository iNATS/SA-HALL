
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Hall, Service, SAUDI_CITIES, SERVICE_CATEGORIES } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { 
  Search, ExternalLink, Power, PowerOff, Mail, CheckCircle, 
  XCircle, ShieldCheck, Building2, Sparkles, Trash2, 
  Eye, EyeOff, Key, UserPlus, Edit3, Save, Plus, Store
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const VendorSubscriptions: React.FC = () => {
  const [subscribers, setSubscribers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<UserProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Vendor Asset State
  const [subHalls, setSubHalls] = useState<Hall[]>([]);
  const [subServices, setSubServices] = useState<Service[]>([]);
  const [activeView, setActiveView] = useState<'info' | 'halls' | 'services'>('info');
  
  // Asset Form State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<{type: 'hall' | 'service', data: any} | null>(null);
  
  const { toast } = useToast();

  const fetchSubscribers = async () => {
    setLoading(true);
    // Only Vendors
    const { data } = await supabase.from('profiles').select('*').eq('role', 'vendor').order('created_at', { ascending: false });
    if (data) setSubscribers(data as UserProfile[]);
    setLoading(false);
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const fetchVendorAssets = async (vendorId: string) => {
    const [{ data: halls }, { data: services }] = await Promise.all([
      supabase.from('halls').select('*').eq('vendor_id', vendorId),
      supabase.from('services').select('*').eq('vendor_id', vendorId)
    ]);
    setSubHalls(halls || []);
    setSubServices(services || []);
  };

  const handleStatusUpdate = async (id: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (!error) {
      toast({ title: 'تم التحديث', variant: 'success' });
      fetchSubscribers();
      if (selectedSub?.id === id) setSelectedSub({ ...selectedSub, ...updates });
    }
  };

  const toggleAssetVisibility = async (type: 'hall' | 'service', id: string, currentStatus: boolean) => {
    const table = type === 'hall' ? 'halls' : 'services';
    const { error } = await supabase.from(table).update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      toast({ title: 'تم تحديث العرض', variant: 'success' });
      if (selectedSub) fetchVendorAssets(selectedSub.id);
    }
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !selectedSub) return;
    const { type, data } = editingAsset;
    const table = type === 'hall' ? 'halls' : 'services';
    
    const payload = { ...data, vendor_id: selectedSub.id };
    
    const { error } = data.id 
      ? await supabase.from(table).update(payload).eq('id', data.id)
      : await supabase.from(table).insert([payload]);

    if (!error) {
      toast({ title: 'تم الحفظ بنجاح', variant: 'success' });
      setIsAssetModalOpen(false);
      fetchVendorAssets(selectedSub.id);
    } else {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const deleteAsset = async (type: 'hall' | 'service', id: string) => {
    if (!confirm('هل أنت متأكد من الحذف النهائي لهذا الأصل؟')) return;
    const table = type === 'hall' ? 'halls' : 'services';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      toast({ title: 'تم الحذف', variant: 'success' });
      if (selectedSub) fetchVendorAssets(selectedSub.id);
    }
  };

  const filtered = subscribers.filter(s => 
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.business_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 text-right font-tajawal pb-10" dir="rtl">
      
      {/* Standard Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-black text-primary flex items-center gap-2">
             <Building2 className="w-8 h-8" /> أصحاب القاعات
          </h2>
          <p className="text-sm text-gray-400 mt-1 font-bold">إدارة شركاء النجاح وأصولهم.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 w-full md:w-auto">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input 
            type="text" placeholder="بحث باسم البائع أو النشاط..." 
            className="bg-transparent border-none focus:outline-none text-sm w-full text-right font-bold h-8"
            value={search} onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-50/50 text-gray-500">
            <tr>
              <th className="p-5 font-black uppercase text-[10px]">البائع / النشاط</th>
              <th className="p-5 font-black uppercase text-[10px]">حالة الطلب</th>
              <th className="p-5 font-black uppercase text-[10px]">الحساب</th>
              <th className="p-5 font-black uppercase text-[10px] text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center animate-pulse text-gray-400 font-bold">جاري التحميل...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-bold">لا يوجد بائعين مسجلين</td></tr>
            ) : filtered.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50/30 cursor-pointer transition-colors group" onClick={() => { 
                setSelectedSub(sub); 
                fetchVendorAssets(sub.id);
                setIsDetailOpen(true); 
                setActiveView('info');
              }}>
                <td className="p-5">
                  <div className="font-black text-gray-900 text-sm flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                          {sub.business_name?.[0] || sub.full_name?.[0]}
                      </div>
                      <div>
                          <div className="line-clamp-1">{sub.business_name || sub.full_name}</div>
                          <div className="text-[10px] text-gray-400">{sub.email}</div>
                      </div>
                  </div>
                </td>
                <td className="p-5">
                  <Badge variant={sub.status === 'approved' ? 'success' : sub.status === 'pending' ? 'warning' : 'destructive'}>
                    {sub.status === 'approved' ? 'مقبول' : sub.status === 'pending' ? 'بانتظار الموافقة' : 'مرفوض'}
                  </Badge>
                </td>
                <td className="p-5">
                   <Badge variant={sub.is_enabled ? 'default' : 'destructive'}>{sub.is_enabled ? 'نشط' : 'معطل'}</Badge>
                </td>
                <td className="p-5 text-center">
                    <button className="text-gray-400 hover:text-primary p-2 rounded-xl transition-all group-hover:bg-white group-hover:shadow-sm"><ExternalLink className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vendor Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="إدارة حساب البائع">
        {selectedSub && (
          <div className="space-y-6 text-right font-tajawal">
            <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
               <button onClick={() => setActiveView('info')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeView === 'info' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}>الحساب والاعتماد</button>
               <button onClick={() => setActiveView('halls')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeView === 'halls' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}>القاعات ({subHalls.length})</button>
               <button onClick={() => setActiveView('services')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${activeView === 'services' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}>الخدمات ({subServices.length})</button>
            </div>

            {activeView === 'info' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                 <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black text-gray-400 uppercase tracking-widest">إدارة طلب الانضمام</span>
                       <div className="flex gap-2">
                          {selectedSub.status !== 'approved' && (
                            <Button size="sm" onClick={() => handleStatusUpdate(selectedSub.id, { status: 'approved' })} className="h-10 rounded-xl bg-green-500 hover:bg-green-600 px-6 font-bold shadow-lg shadow-green-200">قبول الطلب</Button>
                          )}
                          {selectedSub.status !== 'rejected' && (
                            <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(selectedSub.id, { status: 'rejected' })} className="h-10 rounded-xl px-6 font-bold">رفض</Button>
                          )}
                       </div>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black text-gray-400 uppercase tracking-widest">حالة الحساب</span>
                       <button 
                        onClick={() => handleStatusUpdate(selectedSub.id, { is_enabled: !selectedSub.is_enabled })}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${selectedSub.is_enabled ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                       >
                          {selectedSub.is_enabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          {selectedSub.is_enabled ? 'تجميد الحساب' : 'تنشيط الحساب'}
                       </button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">البيانات الأساسية</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <Input label="البريد الإلكتروني" value={selectedSub.email} onChange={e => setSelectedSub({...selectedSub, email: e.target.value})} className="h-12 rounded-xl font-bold" />
                       <Input label="اسم النشاط التجاري" value={selectedSub.business_name || ''} onChange={e => setSelectedSub({...selectedSub, business_name: e.target.value})} className="h-12 rounded-xl font-bold" />
                    </div>
                    <Button onClick={() => handleStatusUpdate(selectedSub.id, { email: selectedSub.email, business_name: selectedSub.business_name })} className="w-full h-12 rounded-xl font-black gap-2 shadow-lg shadow-primary/20">
                       <Save className="w-4 h-4" /> حفظ التعديلات
                    </Button>
                 </div>
              </div>
            )}

            {activeView === 'halls' && (
              <div className="space-y-4 animate-in slide-in-from-right-2">
                <div className="flex justify-between items-center mb-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">قائمة القاعات</p>
                   <Button size="sm" onClick={() => { setEditingAsset({type: 'hall', data: { name: '', city: SAUDI_CITIES[0], price_per_night: 0, capacity: 100, is_active: true }}); setIsAssetModalOpen(true); }} className="h-9 rounded-xl gap-1.5 font-bold"><Plus className="w-3.5 h-3.5" /> إضافة قاعة</Button>
                </div>
                {subHalls.length === 0 ? <div className="text-center py-12 text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-2xl">لا يوجد قاعات مضافة</div> : subHalls.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-primary shadow-sm"><Building2 className="w-6 h-6" /></div>
                       <div className="text-right">
                          <p className="text-sm font-black text-gray-900">{h.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">{h.city} • {h.price_per_night} ر.س</p>
                       </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => toggleAssetVisibility('hall', h.id, h.is_active)} title="تبديل الحالة" className={`p-2 rounded-xl transition-all ${h.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {h.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                       </button>
                       <button onClick={() => { setEditingAsset({type: 'hall', data: h}); setIsAssetModalOpen(true); }} className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:text-primary transition-colors"><Edit3 className="w-4 h-4" /></button>
                       <button onClick={() => deleteAsset('hall', h.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeView === 'services' && (
              <div className="space-y-4 animate-in slide-in-from-right-2">
                <div className="flex justify-between items-center mb-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">قائمة الخدمات</p>
                   <Button size="sm" onClick={() => { setEditingAsset({type: 'service', data: { name: '', category: SERVICE_CATEGORIES[0], price: 0, is_active: true }}); setIsAssetModalOpen(true); }} className="h-9 rounded-xl gap-1.5 font-bold"><Plus className="w-3.5 h-3.5" /> إضافة خدمة</Button>
                </div>
                {subServices.length === 0 ? <div className="text-center py-12 text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-2xl">لا يوجد خدمات مضافة</div> : subServices.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-orange-500 shadow-sm"><Sparkles className="w-6 h-6" /></div>
                       <div className="text-right">
                          <p className="text-sm font-black text-gray-900">{s.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">{s.category} • {s.price} ر.س</p>
                       </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => toggleAssetVisibility('service', s.id, s.is_active)} title="تبديل الحالة" className={`p-2 rounded-xl transition-all ${s.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {s.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                       </button>
                       <button onClick={() => { setEditingAsset({type: 'service', data: s}); setIsAssetModalOpen(true); }} className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:text-primary transition-colors"><Edit3 className="w-4 h-4" /></button>
                       <button onClick={() => deleteAsset('service', s.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Asset Edit Modal (Same logic) */}
      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title={editingAsset?.data.id ? 'تعديل الأصل' : 'إضافة أصل جديد'}>
         {editingAsset && (
           <form onSubmit={handleSaveAsset} className="space-y-6 text-right">
              <Input label="الاسم" value={editingAsset.data.name} onChange={e => setEditingAsset({...editingAsset, data: {...editingAsset.data, name: e.target.value}})} required className="h-12 rounded-xl font-bold" />
              
              {editingAsset.type === 'hall' ? (
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400">المدينة</label>
                      <select className="w-full h-12 border rounded-xl px-4 text-xs font-bold bg-white" value={editingAsset.data.city} onChange={e => setEditingAsset({...editingAsset, data: {...editingAsset.data, city: e.target.value}})}>
                         {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <Input label="سعر الليلة" type="number" value={editingAsset.data.price_per_night} onChange={e => setEditingAsset({...editingAsset, data: {...editingAsset.data, price_per_night: Number(e.target.value)}})} required className="h-12 rounded-xl font-bold" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400">التصنيف</label>
                      <select className="w-full h-12 border rounded-xl px-4 text-xs font-bold bg-white" value={editingAsset.data.category} onChange={e => setEditingAsset({...editingAsset, data: {...editingAsset.data, category: e.target.value}})}>
                         {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <Input label="السعر" type="number" value={editingAsset.data.price} onChange={e => setEditingAsset({...editingAsset, data: {...editingAsset.data, price: Number(e.target.value)}})} required className="h-12 rounded-xl font-bold" />
                </div>
              )}

              <Button type="submit" className="w-full h-12 rounded-xl font-black text-lg shadow-xl shadow-primary/20">تأكيد وحفظ</Button>
           </form>
         )}
      </Modal>
    </div>
  );
};
