import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, VendorClient } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Search, Plus, Edit3, Trash2, User, Phone, Mail, MapPin, Loader2, Star, UserCheck, Filter } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface VendorClientsProps {
  user: UserProfile;
}

export const VendorClients: React.FC<VendorClientsProps> = ({ user }) => {
  const [clients, setClients] = useState<VendorClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<VendorClient>>({});
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendor_clients')
      .select('*')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, [user.id]);

  const handleSave = async () => {
    if (!currentClient.full_name) {
        toast({ title: 'خطأ', description: 'اسم العميل مطلوب', variant: 'destructive' });
        return;
    }
    setSaving(true);
    const payload = { ...currentClient, vendor_id: user.id };

    const { error } = currentClient.id
      ? await supabase.from('vendor_clients').update(payload).eq('id', currentClient.id)
      : await supabase.from('vendor_clients').insert([payload]);

    if (!error) {
      toast({ title: 'تم الحفظ', variant: 'success' });
      setIsModalOpen(false);
      fetchClients();
    } else {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm('هل أنت متأكد من حذف العميل؟')) return;
    const { error } = await supabase.from('vendor_clients').delete().eq('id', id);
    if (!error) {
        toast({ title: 'تم الحذف', variant: 'success' });
        fetchClients();
    } else {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const filteredClients = clients.filter(c => {
    const matchSearch = !search || 
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_number?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchType = filterType === 'all' || 
      (filterType === 'vip' && c.is_vip) ||
      (filterType === 'registered' && c.profile_id) ||
      (filterType === 'external' && !c.profile_id);
    
    return matchSearch && matchType;
  });

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

  const totalClients = clients.length;
  const vipClients = clients.filter(c => c.is_vip).length;
  const registeredClients = clients.filter(c => c.profile_id).length;
  const externalClients = clients.filter(c => !c.profile_id).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة العملاء</h2>
          <p className="text-sm text-gray-500 mt-1">قاعدة بيانات عملائك وسجل التواصل</p>
        </div>
        <Button onClick={() => { setCurrentClient({}); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          عميل جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="إجمالي العملاء"
          value={totalClients}
          icon={User}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="العملاء المميزين"
          value={vipClients}
          icon={Star}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          title="عملاء مسجلين"
          value={registeredClients}
          icon={UserCheck}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="عملاء خارجيين"
          value={externalClients}
          icon={User}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث بالاسم أو الجوال أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 h-10"
            />
          </div>
          <select
            className="h-10 px-4 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">كل العملاء</option>
            <option value="vip">المميزين (VIP)</option>
            <option value="registered">المسجلين</option>
            <option value="external">الخارجيين</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
            <tr>
              <th className="p-4">العميل</th>
              <th className="p-4">رقم الجوال</th>
              <th className="p-4">البريد الإلكتروني</th>
              <th className="p-4">العنوان</th>
              <th className="p-4">النوع</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                  لا يوجد عملاء مضافين
                </td>
              </tr>
            ) : (
              filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-sm">
                        {client.full_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{client.full_name}</span>
                          {client.is_vip && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {client.profile_id ? 'مسجل في التطبيق' : 'عميل خارجي'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {client.phone_number ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {client.phone_number}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    {client.email ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {client.email}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    {client.address ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-[200px]">{client.address}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={client.is_vip ? 'success' : client.profile_id ? 'default' : 'warning'}>
                      {client.is_vip ? 'مميز' : client.profile_id ? 'مسجل' : 'خارجي'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => { setCurrentClient(client); setIsModalOpen(true); }}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
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
        title={currentClient.id ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
      >
        <div className="space-y-4">
          <Input
            label="الاسم الكامل"
            value={currentClient.full_name || ''}
            onChange={(e) => setCurrentClient({...currentClient, full_name: e.target.value})}
            className="h-12"
            placeholder="اسم العميل"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="رقم الجوال"
              value={currentClient.phone_number || ''}
              onChange={(e) => setCurrentClient({...currentClient, phone_number: e.target.value})}
              className="h-12"
              placeholder="05xxxxxxxx"
            />
            <Input
              label="البريد الإلكتروني"
              value={currentClient.email || ''}
              onChange={(e) => setCurrentClient({...currentClient, email: e.target.value})}
              className="h-12"
              placeholder="email@example.com"
            />
          </div>

          <Input
            label="العنوان"
            value={currentClient.address || ''}
            onChange={(e) => setCurrentClient({...currentClient, address: e.target.value})}
            className="h-12"
            placeholder="المدينة، الحي"
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">ملاحظات</label>
            <textarea
              className="w-full h-24 border border-gray-200 rounded-xl p-3 text-sm font-bold bg-white outline-none resize-none"
              value={currentClient.notes || ''}
              onChange={(e) => setCurrentClient({...currentClient, notes: e.target.value})}
              placeholder="اكتب ملاحظات عن العميل..."
            />
          </div>

          <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
            <input
              type="checkbox"
              id="is_vip"
              checked={currentClient.is_vip || false}
              onChange={(e) => setCurrentClient({...currentClient, is_vip: e.target.checked})}
              className="w-5 h-5 accent-yellow-500"
            />
            <label htmlFor="is_vip" className="text-sm font-bold text-yellow-700 flex items-center gap-2">
              <Star className="w-4 h-4" />
              عميل مميز (VIP)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-12"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ البيانات'}
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
