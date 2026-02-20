
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Users, Edit, Trash2, Search, Plus, Phone, Shield, UserCheck, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface FormErrors {
  general?: string;
  email?: string;
  full_name?: string;
}

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<UserProfile>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const fetchUsers = async () => {
    setLoading(true);
    // Filter only role = 'user' (Customers)
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'user').order('created_at', { ascending: false });
    if (!error && data) {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    if (!currentUser.full_name?.trim()) { newErrors.full_name = 'الاسم الكامل مطلوب'; isValid = false; }
    if (!currentUser.email?.trim()) { newErrors.email = 'البريد الإلكتروني مطلوب'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    setErrors({});
    if (!validateForm()) return;
    setLoading(true);

    try {
        if (!currentUser.id) {
            const { data: existing } = await supabase.from('profiles').select('id').eq('email', currentUser.email).maybeSingle(); 
            if (existing) throw new Error('البريد الإلكتروني مسجل بالفعل.');
        }

        const payload = {
            full_name: currentUser.full_name, 
            role: 'user', // Force user role
            phone_number: currentUser.phone_number
        };

        if (currentUser.id) {
            const { error } = await supabase.from('profiles').update(payload).eq('id', currentUser.id);
            if(error) throw error;
        } else {
            // Usually auth.users creation happens separately, this is just profile
            // For admin creating user manually, ideally we use supabase.auth.admin.createUser
            // But here we simulate profile insertion if auth logic handled elsewhere or for simplistic CRM
            const fakeId = crypto.randomUUID(); 
            const { error } = await supabase.from('profiles').insert([{ ...payload, id: fakeId, email: currentUser.email, is_enabled: true, status: 'approved' }]);
            if(error) throw error;
        }

        setIsModalOpen(false);
        setCurrentUser({});
        fetchUsers();
        toast({ title: 'تم الحفظ', variant: 'success' });

    } catch (err: any) {
        setErrors(prev => ({ ...prev, general: err.message }));
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            fetchUsers();
            toast({ title: 'تم الحذف', variant: 'success' });
        } catch (err: any) {
             toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
        }
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 text-right pb-10 font-tajawal">
      
      {/* Standard Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm gap-4">
        <div>
            <h2 className="text-3xl font-black text-primary flex items-center gap-2">
                <Users className="w-8 h-8" /> إدارة العملاء
            </h2>
            <p className="text-sm text-gray-400 font-bold mt-1">قائمة المستخدمين المسجلين في التطبيق.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Input 
                    placeholder="بحث عن عميل..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 rounded-xl bg-gray-50 border-transparent pr-10 text-sm font-bold"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <Button onClick={() => { setCurrentUser({}); setErrors({}); setIsModalOpen(true); }} className="h-12 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> إضافة عميل
            </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-right text-sm">
            <thead className="bg-gray-50/50 text-gray-500 text-[10px] font-black uppercase">
                <tr>
                    <th className="p-6">العميل</th>
                    <th className="p-6">الجوال</th>
                    <th className="p-6">تاريخ الانضمام</th>
                    <th className="p-6">الحالة</th>
                    <th className="p-6 text-center">إجراءات</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {loading ? (
                    <tr><td colSpan={5} className="p-10 text-center animate-pulse text-gray-400 font-bold">جاري التحميل...</td></tr>
                ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-bold">لا يوجد عملاء مطابقين</td></tr>
                ) : filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="p-6">
                            <div className="font-black text-gray-900 text-sm flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold">
                                    {u.full_name?.[0] || 'U'}
                                </div>
                                <div>
                                    <div className="line-clamp-1">{u.full_name}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5 font-normal">{u.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="p-6">
                            <div className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" /> {u.phone_number || '-'}
                            </div>
                        </td>
                        <td className="p-6">
                            <div className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {u.created_at ? new Date(u.created_at).toLocaleDateString('ar-SA') : '-'}
                            </div>
                        </td>
                        <td className="p-6">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black ${u.is_enabled ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {u.is_enabled ? 'نشط' : 'محظور'}
                            </span>
                        </td>
                        <td className="p-6 text-center">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setCurrentUser(u); setErrors({}); setIsModalOpen(true); }} className="p-2 bg-gray-50 text-gray-500 rounded-xl hover:text-primary hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(u.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all border border-transparent hover:border-red-200"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentUser.id ? 'تعديل بيانات العميل' : 'عميل جديد'}>
        <div className="space-y-4 text-right">
            {errors.general && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl font-bold">{errors.general}</div>}
            
            <Input label="الاسم الكامل" value={currentUser.full_name || ''} onChange={e => setCurrentUser({...currentUser, full_name: e.target.value})} error={errors.full_name} className="h-12 rounded-xl font-bold" />
            <Input label="البريد الإلكتروني" value={currentUser.email || ''} onChange={e => setCurrentUser({...currentUser, email: e.target.value})} disabled={!!currentUser.id} className="h-12 rounded-xl font-bold" error={errors.email} />
            <Input label="رقم الهاتف" value={currentUser.phone_number || ''} onChange={e => setCurrentUser({...currentUser, phone_number: e.target.value})} className="h-12 rounded-xl font-bold" />

            <Button onClick={handleSave} disabled={loading} className="w-full h-12 rounded-xl font-black mt-4 shadow-lg shadow-primary/20">
                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
        </div>
      </Modal>
    </div>
  );
};
