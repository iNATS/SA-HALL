import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Service, ServiceCategory, SAUDI_CITIES } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { PriceTag } from '../components/ui/PriceTag';
import { Plus, Sparkles, Tag, Edit3, Trash2, Package, Upload, Loader2, X, Lock, MapPin, Check, Search, Star, StarOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface VendorServicesProps {
  user: UserProfile;
}

export const VendorServices: React.FC<VendorServicesProps> = ({ user }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<Service>>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        supabase.from('services').select('*').eq('vendor_id', user.id).order('created_at', { ascending: false }),
        supabase.from('service_categories').select('*').order('name'),
      ]);
      setServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err: any) {
      toast({ title: 'خطأ', description: 'فشل في تحميل الخدمات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user.id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileName = `${user.id}/service-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('service-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('service-images').getPublicUrl(fileName);

      const newImages = [...(currentService.images || []), publicUrl];
      setCurrentService(prev => ({
          ...prev,
          images: newImages,
          image_url: newImages[0]
      }));
      toast({ title: 'نجاح', description: 'تم رفع الصورة بنجاح.', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleCity = (city: string) => {
      const currentAreas = currentService.service_areas || [];
      if (currentAreas.includes(city)) {
          setCurrentService(prev => ({ ...prev, service_areas: currentAreas.filter(c => c !== city) }));
      } else {
          setCurrentService(prev => ({ ...prev, service_areas: [...currentAreas, city] }));
      }
  };

  const handleSave = async () => {
    if (!currentService.name || !currentService.price) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال اسم الخدمة وسعرها.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      ...currentService,
      vendor_id: user.id,
      price: Number(currentService.price),
      is_active: currentService.is_active ?? true,
      category: currentService.category || categories[0]?.name || 'عام',
      service_areas: currentService.service_areas || []
    };

    try {
      if (currentService.id) {
        const { error } = await supabase.from('services').update(payload).eq('id', currentService.id);
        if (error) throw error;
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الخدمة بنجاح.', variant: 'success' });
      } else {
        if (services.length >= user.service_limit) {
          toast({ title: 'الحد الأقصى', description: 'وصلت للحد المسموح من الخدمات.', variant: 'warning' });
          setSaving(false);
          return;
        }
        const { error } = await supabase.from('services').insert([payload]);
        if (error) throw error;
        toast({ title: 'تم الحفظ', description: 'تم إضافة الخدمة بنجاح.', variant: 'success' });
      }
      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
        setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
    
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم الحذف', description: 'تم حذف الخدمة بنجاح.', variant: 'success' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const handleAddNew = () => {
    if (services.length >= user.service_limit) {
       toast({ title: 'الحد الأقصى', description: 'وصلت للحد المسموح من الخدمات.', variant: 'warning' });
       return;
    }
    setCurrentService({ is_active: true, category: categories[0]?.name || '', images: [], service_areas: [] });
    setIsEditing(true);
  };

  const filteredServices = services.filter(service => {
    const matchSearch = !searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchSearch && matchCategory;
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

  const activeServices = services.filter(s => s.is_active).length;
  const featuredServices = 0; // is_featured not in Service type

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة الخدمات</h2>
          <p className="text-sm text-gray-500 mt-1">باقات إضافية، ضيافة، وتجهيزات</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="w-4 h-4" />
          خدمة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="إجمالي الخدمات"
          value={services.length}
          icon={Package}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="الخدمات النشطة"
          value={activeServices}
          icon={Check}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="الخدمات المميزة"
          value={featuredServices}
          icon={Star}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          title="الحد المسموح"
          value={user.service_limit || 0}
          icon={Lock}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث باسم الخدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-10"
            />
          </div>
          <select
            className="h-10 px-4 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">كل التصنيفات</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
            <tr>
              <th className="p-4">الخدمة</th>
              <th className="p-4">التصنيف</th>
              <th className="p-4">المناطق</th>
              <th className="p-4">السعر</th>
              <th className="p-4">الحالة</th>
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
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                  لا توجد خدمات
                </td>
              </tr>
            ) : (
              filteredServices.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-200">
                        {s.image_url ? (
                          <img src={s.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{s.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="default">{s.category}</Badge>
                  </td>
                  <td className="p-4">
                    {s.service_areas && s.service_areas.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {s.service_areas.slice(0, 2).map((city, idx) => (
                          <span key={idx} className="text-[10px] bg-gray-50 px-2 py-1 rounded-md text-gray-500 font-bold">
                            {city}
                          </span>
                        ))}
                        {s.service_areas.length > 2 && (
                          <span className="text-[10px] bg-gray-50 px-2 py-1 rounded-md text-gray-500 font-bold">
                            +{s.service_areas.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-green-600 font-bold">كل المناطق</span>
                    )}
                  </td>
                  <td className="p-4">
                    <PriceTag amount={s.price} className="text-sm font-bold" />
                  </td>
                  <td className="p-4">
                    <Badge variant={s.is_active ? 'success' : 'default'}>
                      {s.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => { setCurrentService(s); setIsEditing(true); }}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
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
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title={currentService.id ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
      >
        <div className="space-y-6">
          <Input
            label="اسم الخدمة"
            value={currentService.name || ''}
            onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
            className="h-12"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">التصنيف</label>
              <select
                className="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-bold bg-white outline-none"
                value={currentService.category || ''}
                onChange={(e) => setCurrentService({ ...currentService, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="السعر (ر.س)"
              type="number"
              value={currentService.price || ''}
              onChange={(e) => setCurrentService({ ...currentService, price: Number(e.target.value) })}
              className="h-12"
            />
          </div>

          {/* Service Areas */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              مناطق تقديم الخدمة
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {SAUDI_CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => toggleCity(city)}
                  className={`text-xs font-bold py-2 px-1 rounded-lg transition-all border flex items-center justify-center gap-1 ${
                    currentService.service_areas?.includes(city)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-primary/30'
                  }`}
                >
                  {currentService.service_areas?.includes(city) && <Check className="w-3 h-3" />}
                  {city}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 font-bold text-center">
              تحديد مدن محددة أو تركها فارغة لتشمل جميع المناطق
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">الوصف التفصيلي</label>
            <textarea
              className="w-full h-32 border border-gray-200 rounded-xl p-3 bg-white outline-none resize-none font-bold text-sm"
              value={currentService.description || ''}
              onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">صورة الخدمة</label>
            <div className="flex gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-all text-gray-400 hover:text-primary"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">رفع صورة</span>
                  </>
                )}
              </div>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
              />
              {currentService.images?.map((img, i) => (
                <div key={i} className="w-32 h-32 rounded-xl overflow-hidden relative group border border-gray-200">
                  <img src={img} className="w-full h-full object-cover" />
                  <button
                    onClick={() =>
                      setCurrentService({
                        ...currentService,
                        images: currentService.images?.filter((_, idx) => idx !== i),
                        image_url: currentService.images?.length === 1 ? undefined : currentService.image_url
                      })
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-12"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
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
