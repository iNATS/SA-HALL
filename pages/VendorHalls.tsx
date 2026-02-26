import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Hall, SAUDI_CITIES, HallAddon, HallPackage, HALL_AMENITIES, SeasonalPrice } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { PriceTag } from '../components/ui/PriceTag';
import { Plus, X, Loader2, Trash2, Package, CheckSquare, CalendarDays, Image as ImageIcon, Search, Building2, MapPin, Users, Edit3 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Calendar } from '../components/ui/Calendar';
import { format, isSameDay, parseISO, eachDayOfInterval, getDay } from 'date-fns';

interface VendorHallsProps {
  user: UserProfile;
}

export const VendorHalls: React.FC<VendorHallsProps> = ({ user }) => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'packages' | 'calendar' | 'policies'>('info');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [currentHall, setCurrentHall] = useState<Partial<Hall & { name_en?: string, description_en?: string, capacity_men?: number, capacity_women?: number }>>({
      images: [], amenities: [], city: SAUDI_CITIES[0], addons: [], packages: [], seasonal_prices: []
  });

  // Package State
  const [newPackage, setNewPackage] = useState<HallPackage>({
      name: '', price: 0, min_men: 0, max_men: 100, min_women: 0, max_women: 100, is_default: false, items: []
  });

  // Addon State
  const [newAddon, setNewAddon] = useState<HallAddon>({ name: '', price: 0, description: '' });

  // Amenity State
  const [newAmenity, setNewAmenity] = useState('');

  // Seasonal State
  const [newSeason, setNewSeason] = useState<SeasonalPrice>({ name: '', start_date: '', end_date: '', increase_percentage: 0 });

  // Calendar State
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  // Bulk Blocking State
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkDay, setBulkDay] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: hallsData } = await supabase.from('halls').select('*').eq('vendor_id', user.id).eq('type', 'hall');
      setHalls(hallsData || []);
    } catch (err: any) {
      toast({ title: 'خطأ', description: 'فشل في تحميل البيانات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user.id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddNew = () => {
      setCurrentHall({ images: [], amenities: [], is_active: true, city: SAUDI_CITIES[0], capacity: 0, addons: [], packages: [], seasonal_prices: [], type: 'hall', capacity_men: 0, capacity_women: 0 });
      setIsEditing(true);
      setActiveTab('info');
  };

  const handleEdit = async (hall: Hall) => {
      setCurrentHall(hall);
      setIsEditing(true);
      setActiveTab('info');
      const { data } = await supabase.from('bookings').select('booking_date').eq('hall_id', hall.id).eq('status', 'blocked');
      if (data) {
          setBlockedDates(data.map(d => parseISO(d.booking_date)));
      }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('hall-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('hall-images').getPublicUrl(fileName);
      const newImages = [...(currentHall.images || []), publicUrl];
      setCurrentHall(prev => ({ ...prev, images: newImages, image_url: newImages[0] }));
      toast({ title: 'تم الرفع', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const addPackage = () => {
      if (!newPackage.name || newPackage.price <= 0) {
          toast({ title: 'تنبيه', description: 'يرجى إدخال اسم الباقة وسعر الفرد.', variant: 'destructive' });
          return;
      }
      const updatedPackages = currentHall.packages ? [...currentHall.packages] : [];
      if (newPackage.is_default) {
          updatedPackages.forEach(p => p.is_default = false);
      }
      updatedPackages.push(newPackage);
      setCurrentHall(prev => ({ ...prev, packages: updatedPackages }));
      setNewPackage({ name: '', price: 0, min_men: 0, max_men: 100, min_women: 0, max_women: 100, is_default: false, items: [] });
  };

  const addAddon = () => {
      if (!newAddon.name || newAddon.price < 0) return;
      setCurrentHall(prev => ({ ...prev, addons: [...(prev.addons || []), newAddon] }));
      setNewAddon({ name: '', price: 0, description: '' });
  };

  const handleAddAmenity = () => {
      if (!newAmenity.trim()) return;
      if (currentHall.amenities?.includes(newAmenity.trim())) {
          toast({ title: 'تنبيه', description: 'هذه الميزة مضافة بالفعل.', variant: 'warning' });
          return;
      }
      setCurrentHall(prev => ({ ...prev, amenities: [...(prev.amenities || []), newAmenity.trim()] }));
      setNewAmenity('');
  };

  const removeAmenity = (index: number) => {
      setCurrentHall(prev => ({ ...prev, amenities: prev.amenities?.filter((_, i) => i !== index) }));
  };

  const addSeason = () => {
      if (!newSeason.name || !newSeason.start_date || !newSeason.end_date || newSeason.increase_percentage <= 0) return;
      setCurrentHall(prev => ({ ...prev, seasonal_prices: [...(prev.seasonal_prices || []), newSeason] }));
      setNewSeason({ name: '', start_date: '', end_date: '', increase_percentage: 0 });
  };

  const toggleBlockDate = async (date: Date) => {
      if (!currentHall.id) return;
      const dateStr = format(date, 'yyyy-MM-dd');
      const isBlocked = blockedDates.some(d => isSameDay(d, date));

      if (isBlocked) {
          await supabase.from('bookings').delete().eq('hall_id', currentHall.id).eq('booking_date', dateStr).eq('status', 'blocked');
          setBlockedDates(prev => prev.filter(d => !isSameDay(d, date)));
      } else {
          await supabase.from('bookings').insert([{
              hall_id: currentHall.id,
              vendor_id: user.id,
              booking_date: dateStr,
              status: 'blocked',
              total_amount: 0,
              vat_amount: 0,
              notes: 'Blocked by Vendor'
          }]);
          setBlockedDates(prev => [...prev, date]);
      }
  };

  const handleBulkBlock = async () => {
      if (!bulkStart || !bulkEnd) {
          toast({ title: 'ناقص البيانات', description: 'يرجى تحديد فترة التاريخ.', variant: 'destructive' });
          return;
      }
      if (!currentHall.id) return;

      const start = parseISO(bulkStart);
      const end = parseISO(bulkEnd);
      const daysToBlock: string[] = [];
      const interval = eachDayOfInterval({ start, end });

      interval.forEach(day => {
          const shouldBlock = bulkDay === '' || getDay(day) === parseInt(bulkDay);
          if (shouldBlock) {
              const str = format(day, 'yyyy-MM-dd');
              if (!blockedDates.some(d => isSameDay(d, day))) {
                  daysToBlock.push(str);
              }
          }
      });

      if (daysToBlock.length === 0) {
          toast({ title: 'لا يوجد أيام', description: 'لم يتم العثور على أيام للحجب في هذه الفترة.', variant: 'warning' });
          return;
      }

      const payloads = daysToBlock.map(dateStr => ({
          hall_id: currentHall.id,
          vendor_id: user.id,
          booking_date: dateStr,
          status: 'blocked',
          total_amount: 0,
          vat_amount: 0,
          notes: bulkDay !== '' ? `Blocked recurring day ${bulkDay}` : 'Blocked date range'
      }));

      const { error } = await supabase.from('bookings').insert(payloads);

      if (error) {
          toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      } else {
          const msg = bulkDay !== ''
            ? `تم حظر ${daysToBlock.length} يوم متكرر بنجاح.`
            : `تم حظر ${daysToBlock.length} يوم في الفترة بنجاح.`;
          toast({ title: 'تم الحجب', description: msg, variant: 'success' });
          setBlockedDates(prev => [...prev, ...daysToBlock.map(d => parseISO(d))]);
          setBulkStart('');
          setBulkEnd('');
          setBulkDay('');
      }
  };

  const handleSave = async () => {
    if (!currentHall.name || !currentHall.city) {
      toast({ title: 'تنبيه', description: 'يرجى إكمال البيانات الأساسية.', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
          ...currentHall,
          vendor_id: user.id,
          image_url: currentHall.images?.[0] || '',
          capacity: (Number(currentHall.capacity_men) || 0) + (Number(currentHall.capacity_women) || 0),
          capacity_men: Number(currentHall.capacity_men) || 0,
          capacity_women: Number(currentHall.capacity_women) || 0,
          type: 'hall'
      };

      const { error } = currentHall.id ? await supabase.from('halls').update(payload).eq('id', currentHall.id) : await supabase.from('halls').insert([payload]);
      if (error) throw error;
      toast({ title: 'تم الحفظ', variant: 'success' });
      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    }
  };

  const filteredHalls = halls.filter(hall => {
    const matchSearch = !searchQuery || hall.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? hall.is_active : !hall.is_active);
    return matchSearch && matchStatus;
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

  const activeHalls = halls.filter(h => h.is_active).length;
  const inactiveHalls = halls.filter(h => !h.is_active).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة القاعات</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة القاعات وتفاصيلها</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة قاعة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="إجمالي القاعات"
          value={halls.length}
          icon={Building2}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="القاعات النشطة"
          value={activeHalls}
          icon={CheckSquare}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="القاعات غير النشطة"
          value={inactiveHalls}
          icon={X}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="الحد المسموح"
          value={user.hall_limit || 0}
          icon={Package}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث باسم القاعة..."
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
            <option value="all">كل القاعات</option>
            <option value="active">نشطة</option>
            <option value="inactive">غير نشطة</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))
        ) : filteredHalls.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg border border-gray-200 p-10 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">لا توجد قاعات</p>
          </div>
        ) : (
          filteredHalls.map(hall => (
            <div key={hall.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all flex flex-col">
              <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                {hall.image_url ? (
                  <img src={hall.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="flex h-full items-center justify-center opacity-10">
                    <Building2 className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={hall.is_active ? 'success' : 'default'}>
                    {hall.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-3">
                <h3 className="font-bold text-base text-gray-900 truncate">{hall.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{hall.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{hall.capacity} ضيف</span>
                </div>
                {hall.price_per_night && (
                  <PriceTag amount={hall.price_per_night} className="text-lg font-bold" />
                )}
                <div className="mt-auto flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-lg text-xs font-bold"
                    onClick={() => handleEdit(hall)}
                  >
                    <Edit3 className="w-3 h-3 ml-1" /> تعديل
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
          <div className="w-full md:max-w-5xl h-full bg-white overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-black text-2xl text-primary">{currentHall.id ? 'تعديل القاعة' : 'إضافة قاعة جديدة'}</h3>
              <div className="w-10" />
            </div>

            <div className="flex bg-gray-50 p-2 gap-2 overflow-x-auto border-b border-gray-200">
              <button onClick={() => setActiveTab('info')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'info' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>
                البيانات الأساسية
              </button>
              <button onClick={() => setActiveTab('packages')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'packages' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>
                الباقات والإضافات
              </button>
              <button onClick={() => setActiveTab('policies')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'policies' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>
                الشروط والأسعار الموسمية
              </button>
              {currentHall.id && (
                <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === 'calendar' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>
                  التقويم والحجب
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black text-primary mb-4">البيانات الأساسية</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="اسم القاعة (عربي)" value={currentHall.name || ''} onChange={e => setCurrentHall({...currentHall, name: e.target.value})} className="h-12" />
                      <Input label="اسم القاعة (إنجليزي)" value={currentHall.name_en || ''} onChange={e => setCurrentHall({...currentHall, name_en: e.target.value})} className="h-12 text-left" dir="ltr" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="سعة الرجال" type="number" value={currentHall.capacity_men || ''} onChange={e => setCurrentHall({...currentHall, capacity_men: Number(e.target.value)})} className="h-12" />
                      <Input label="سعة النساء" type="number" value={currentHall.capacity_women || ''} onChange={e => setCurrentHall({...currentHall, capacity_women: Number(e.target.value)})} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500">المدينة</label>
                      <select className="w-full h-12 border border-gray-200 rounded-xl px-4 bg-white outline-none font-bold text-sm" value={currentHall.city} onChange={e => setCurrentHall({...currentHall, city: e.target.value})}>
                        {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500">سعر الليلة (ريال سعودي)</label>
                      <Input type="number" value={currentHall.price_per_night || ''} onChange={e => setCurrentHall({...currentHall, price_per_night: Number(e.target.value)})} className="h-12" placeholder="أدخل سعر الليلة" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">الوصف (عربي)</label>
                        <textarea className="w-full h-32 border border-gray-200 rounded-xl p-3 bg-white outline-none resize-none font-bold text-sm" value={currentHall.description || ''} onChange={e => setCurrentHall({...currentHall, description: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">الوصف (إنجليزي)</label>
                        <textarea className="w-full h-32 border border-gray-200 rounded-xl p-3 bg-white outline-none resize-none font-bold text-sm text-left" dir="ltr" value={currentHall.description_en || ''} onChange={e => setCurrentHall({...currentHall, description_en: e.target.value})} />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-black text-primary mb-4">صور القاعة</h3>
                      <div className="flex flex-wrap gap-4">
                        <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-all text-gray-400 hover:text-primary">
                          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-8 h-8 mb-2" />}
                          <span className="text-xs font-bold">رفع صورة</span>
                        </div>
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
                        {currentHall.images?.map((img, i) => (
                          <div key={i} className="w-32 h-32 rounded-2xl overflow-hidden relative group border border-gray-200">
                            <img src={img} className="w-full h-full object-cover" />
                            <button onClick={() => setCurrentHall({...currentHall, images: currentHall.images?.filter((_, idx) => idx !== i)})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-black text-primary mb-4">المرافق والمميزات</h3>
                      <div className="flex gap-2 mb-4">
                        <Button onClick={handleAddAmenity} className="h-11 w-11 rounded-xl bg-primary text-white p-0 flex items-center justify-center">
                          <Plus className="w-5 h-5" />
                        </Button>
                        <Input placeholder="اكتب الميزة هنا..." value={newAmenity} onChange={e => setNewAmenity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddAmenity()} className="h-11 flex-1 bg-gray-50" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentHall.amenities?.map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 transition-all hover:border-primary/50 group">
                            <CheckSquare className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-gray-700">{amenity}</span>
                            <button onClick={() => removeAmenity(idx)} className="text-gray-400 hover:text-red-500 transition-colors mr-2">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'packages' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black text-primary mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4" /> باقات الحجز
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="اسم الباقة" value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} className="h-11 bg-white" />
                        <Input placeholder="سعر الفرد" type="number" value={newPackage.price || ''} onChange={e => setNewPackage({...newPackage, price: Number(e.target.value)})} className="h-11 bg-white" />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Input label="أقل رجال" type="number" value={newPackage.min_men} onChange={e => setNewPackage({...newPackage, min_men: Number(e.target.value)})} className="h-10 bg-white" />
                        <Input label="أكثر رجال" type="number" value={newPackage.max_men} onChange={e => setNewPackage({...newPackage, max_men: Number(e.target.value)})} className="h-10 bg-white" />
                        <Input label="أقل نساء" type="number" value={newPackage.min_women} onChange={e => setNewPackage({...newPackage, min_women: Number(e.target.value)})} className="h-10 bg-white" />
                        <Input label="أكثر نساء" type="number" value={newPackage.max_women} onChange={e => setNewPackage({...newPackage, max_women: Number(e.target.value)})} className="h-10 bg-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={newPackage.is_default} onChange={e => setNewPackage({...newPackage, is_default: e.target.checked})} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-bold">باقة افتراضية</span>
                      </div>
                      <Button onClick={addPackage} className="w-full h-11 rounded-xl font-bold bg-gray-900 text-white gap-2">
                        <Plus className="w-4 h-4" /> إضافة باقة
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {currentHall.packages?.map((pkg, idx) => (
                        <div key={idx} className="p-4 border rounded-2xl relative bg-white border-gray-200">
                          <button onClick={() => setCurrentHall(prev => ({...prev, packages: prev.packages?.filter((_, i) => i !== idx)}))} className="absolute top-4 left-4 text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <h4 className="font-bold text-gray-900">{pkg.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {pkg.min_men}-{pkg.max_men} رجال | {pkg.min_women}-{pkg.max_women} نساء
                          </p>
                          <PriceTag amount={pkg.price} className="text-lg font-bold text-primary mt-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black text-primary mb-4">الإضافات</h3>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                      <Input placeholder="اسم الإضافة" value={newAddon.name} onChange={e => setNewAddon({...newAddon, name: e.target.value})} className="h-11 bg-white" />
                      <Input placeholder="السعر" type="number" value={newAddon.price || ''} onChange={e => setNewAddon({...newAddon, price: Number(e.target.value)})} className="h-11 bg-white" />
                      <Input placeholder="الوصف" value={newAddon.description || ''} onChange={e => setNewAddon({...newAddon, description: e.target.value})} className="h-11 bg-white" />
                      <Button onClick={addAddon} className="w-full h-11 rounded-xl font-bold bg-gray-900 text-white gap-2">
                        <Plus className="w-4 h-4" /> إضافة
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {currentHall.addons?.map((addon, idx) => (
                        <div key={idx} className="p-4 border rounded-2xl flex justify-between items-center bg-white border-gray-200">
                          <div>
                            <h4 className="font-bold text-gray-900">{addon.name}</h4>
                            <p className="text-sm text-gray-600">{addon.description}</p>
                            <PriceTag amount={addon.price} className="text-sm font-bold text-primary mt-1" />
                          </div>
                          <button onClick={() => setCurrentHall(prev => ({...prev, addons: prev.addons?.filter((_, i) => i !== idx)}))} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black text-primary mb-4">الأسعار الموسمية</h3>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                      <Input placeholder="اسم الموسم" value={newSeason.name} onChange={e => setNewSeason({...newSeason, name: e.target.value})} className="h-11 bg-white" />
                      <div className="grid grid-cols-3 gap-2">
                        <Input label="من" type="date" value={newSeason.start_date} onChange={e => setNewSeason({...newSeason, start_date: e.target.value})} className="h-11 bg-white" />
                        <Input label="إلى" type="date" value={newSeason.end_date} onChange={e => setNewSeason({...newSeason, end_date: e.target.value})} className="h-11 bg-white" />
                        <Input label="الزيادة %" type="number" value={newSeason.increase_percentage || ''} onChange={e => setNewSeason({...newSeason, increase_percentage: Number(e.target.value)})} className="h-11 bg-white" />
                      </div>
                      <Button onClick={addSeason} className="w-full h-11 rounded-xl font-bold bg-gray-900 text-white gap-2">
                        <Plus className="w-4 h-4" /> إضافة موسم
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {currentHall.seasonal_prices?.map((season, idx) => (
                        <div key={idx} className="p-4 border rounded-2xl flex justify-between items-center bg-white border-gray-200">
                          <div>
                            <h4 className="font-bold text-gray-900">{season.name}</h4>
                            <p className="text-sm text-gray-600">
                              {season.start_date} - {season.end_date}
                            </p>
                            <span className="text-xs font-bold text-primary">+{season.increase_percentage}%</span>
                          </div>
                          <button onClick={() => setCurrentHall(prev => ({...prev, seasonal_prices: prev.seasonal_prices?.filter((_, i) => i !== idx)}))} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'calendar' && currentHall.id && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-sm font-black text-primary mb-4">حجب التواريخ</h3>
                    <Calendar
                      mode="single"
                      selected={calendarDate}
                      onSelect={setCalendarDate}
                      modifiers={{ blocked: blockedDates }}
                      modifiersStyles={{ blocked: { textDecoration: 'line-through', color: 'red', fontWeight: 'bold' } }}
                      onDayClick={toggleBlockDate}
                    />
                    <p className="text-xs text-gray-500 mt-2">انقر على التاريخ لحظره أو إلغاء الحظر</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black text-primary mb-4">الحجب الجماعي</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Input label="من تاريخ" type="date" value={bulkStart} onChange={e => setBulkStart(e.target.value)} className="h-12" />
                      <Input label="إلى تاريخ" type="date" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} className="h-12" />
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">يوم محدد</label>
                        <select className="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-bold bg-white outline-none" value={bulkDay} onChange={e => setBulkDay(e.target.value)}>
                          <option value="">كل الأيام</option>
                          <option value="0">الأحد</option>
                          <option value="1">الاثنين</option>
                          <option value="2">الثلاثاء</option>
                          <option value="3">الأربعاء</option>
                          <option value="4">الخميس</option>
                          <option value="5">الجمعة</option>
                          <option value="6">السبت</option>
                        </select>
                      </div>
                    </div>
                    <Button onClick={handleBulkBlock} className="w-full h-12 rounded-xl font-bold gap-2">
                      <CalendarDays className="w-4 h-4" /> حظر الفترة المحددة
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-white">
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={loading} className="flex-1 h-12">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 h-12">
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
