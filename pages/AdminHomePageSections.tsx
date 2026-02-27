import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Plus, Edit3, Trash2, GripVertical, Eye, EyeOff, Building2, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface HomePageSection {
  id: string;
  title_ar: string;
  title_en?: string;
  section_type: 'halls' | 'services' | 'mixed';
  display_order: number;
  is_active: boolean;
  max_items: number;
  assigned_halls: string[];
  assigned_services: string[];
  created_at: string;
}

interface Hall {
  id: string;
  name: string;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  is_active: boolean;
}

export const AdminHomePageSections: React.FC = () => {
  const [sections, setSections] = useState<HomePageSection[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<Partial<HomePageSection>>({
    title_ar: '',
    title_en: '',
    section_type: 'halls',
    display_order: 0,
    is_active: true,
    max_items: 8,
    assigned_halls: [],
    assigned_services: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sectionsData, hallsData, servicesData] = await Promise.all([
        supabase.from('home_page_sections').select('*').order('display_order'),
        supabase.from('halls').select('id, name, is_active'),
        supabase.from('services').select('id, name, is_active')
      ]);

      setSections(sectionsData.data || []);
      setHalls(hallsData.data || []);
      setServices(servicesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (section?: HomePageSection) => {
    if (section) {
      setCurrentSection({ ...section });
    } else {
      setCurrentSection({
        title_ar: '',
        title_en: '',
        section_type: 'halls',
        display_order: sections.length,
        is_active: true,
        max_items: 8,
        assigned_halls: [],
        assigned_services: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentSection.title_ar) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال عنوان القسم', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title_ar: currentSection.title_ar,
        title_en: currentSection.title_en,
        section_type: currentSection.section_type,
        display_order: currentSection.display_order,
        is_active: currentSection.is_active,
        max_items: currentSection.max_items || 8,
        assigned_halls: currentSection.assigned_halls || [],
        assigned_services: currentSection.assigned_services || [],
        updated_at: new Date().toISOString()
      };

      let error;
      if (currentSection.id) {
        const result = await supabase
          .from('home_page_sections')
          .update(payload)
          .eq('id', currentSection.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('home_page_sections')
          .insert([payload]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: currentSection.id ? 'تم تحديث القسم' : 'تم إنشاء القسم بنجاح',
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
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;

    const { error } = await supabase.from('home_page_sections').delete().eq('id', id);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'تم الحذف', description: 'تم حذف القسم بنجاح', variant: 'success' });
    fetchData();
  };

  const toggleSectionStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('home_page_sections')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    // Swap display_order
    const tempOrder = newSections[index].display_order;
    newSections[index].display_order = newSections[targetIndex].display_order;
    newSections[targetIndex].display_order = tempOrder;

    // Sort by display_order
    newSections.sort((a, b) => a.display_order - b.display_order);

    setSections(newSections);

    // Update in database
    await supabase
      .from('home_page_sections')
      .update({ display_order: newSections[index].display_order })
      .eq('id', newSections[index].id);

    await supabase
      .from('home_page_sections')
      .update({ display_order: newSections[targetIndex].display_order })
      .eq('id', newSections[targetIndex].id);
  };

  const toggleHallAssignment = (hallId: string) => {
    const currentHalls = currentSection.assigned_halls || [];
    if (currentHalls.includes(hallId)) {
      setCurrentSection({ ...currentSection, assigned_halls: currentHalls.filter(id => id !== hallId) });
    } else {
      setCurrentSection({ ...currentSection, assigned_halls: [...currentHalls, hallId] });
    }
  };

  const toggleServiceAssignment = (serviceId: string) => {
    const currentServices = currentSection.assigned_services || [];
    if (currentServices.includes(serviceId)) {
      setCurrentSection({ ...currentSection, assigned_services: currentServices.filter(id => id !== serviceId) });
    } else {
      setCurrentSection({ ...currentSection, assigned_services: [...currentServices, serviceId] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">أقسام الصفحة الرئيسية</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة أقسام ومعروضات الصفحة الرئيسية</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          قسم جديد
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
            <tr>
              <th className="p-4">الترتيب</th>
              <th className="p-4">عنوان القسم</th>
              <th className="p-4">النوع</th>
              <th className="p-4">عدد العناصر</th>
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
            ) : sections.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                  لا توجد أقسام
                </td>
              </tr>
            ) : (
              sections.map((section, index) => (
                <tr key={section.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <GripVertical className="w-4 h-4 rotate-90" />
                      </button>
                      <span className="text-sm font-bold text-gray-700 w-8 text-center">{index + 1}</span>
                      <button
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <GripVertical className="w-4 h-4 -rotate-90" />
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-bold text-gray-900">{section.title_ar}</div>
                      {section.title_en && (
                        <div className="text-xs text-gray-500">{section.title_en}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={
                      section.section_type === 'halls' ? 'default' :
                      section.section_type === 'services' ? 'success' : 'warning'
                    }>
                      {section.section_type === 'halls' ? 'قاعات' :
                       section.section_type === 'services' ? 'خدمات' : 'مختلط'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-gray-700">{section.max_items}</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={section.is_active ? 'success' : 'default'}>
                      {section.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => toggleSectionStatus(section.id, section.is_active)}
                        className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {section.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(section)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
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
        title={currentSection.id ? 'تعديل القسم' : 'إضافة قسم جديد'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="العنوان (عربي)"
              value={currentSection.title_ar || ''}
              onChange={(e) => setCurrentSection({ ...currentSection, title_ar: e.target.value })}
              className="h-12"
              placeholder="عنوان القسم بالعربية"
            />
            <Input
              label="العنوان (إنجليزي)"
              value={currentSection.title_en || ''}
              onChange={(e) => setCurrentSection({ ...currentSection, title_en: e.target.value })}
              className="h-12"
              placeholder="Section Title in English"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">نوع القسم</label>
              <select
                className="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-bold bg-white outline-none"
                value={currentSection.section_type}
                onChange={(e) => setCurrentSection({ ...currentSection, section_type: e.target.value as any })}
              >
                <option value="halls">قاعات فقط</option>
                <option value="services">خدمات فقط</option>
                <option value="mixed">مختلط</option>
              </select>
            </div>
            <Input
              label="الحد الأقصى للعناصر"
              type="number"
              value={currentSection.max_items || 8}
              onChange={(e) => setCurrentSection({ ...currentSection, max_items: Number(e.target.value) })}
              className="h-12"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={currentSection.is_active}
              onChange={(e) => setCurrentSection({ ...currentSection, is_active: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="is_active" className="text-sm font-bold text-gray-700">
              قسم نشط
            </label>
          </div>

          {/* Assign Halls */}
          {(currentSection.section_type === 'halls' || currentSection.section_type === 'mixed') && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">تعيين القاعات</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                {halls.map(hall => (
                  <label key={hall.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={(currentSection.assigned_halls || []).includes(hall.id)}
                      onChange={() => toggleHallAssignment(hall.id)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-gray-700">{hall.name}</span>
                    {!hall.is_active && <Badge variant="default" className="text-[10px]">غير نشط</Badge>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Assign Services */}
          {(currentSection.section_type === 'services' || currentSection.section_type === 'mixed') && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">تعيين الخدمات</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                {services.map(service => (
                  <label key={service.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={(currentSection.assigned_services || []).includes(service.id)}
                      onChange={() => toggleServiceAssignment(service.id)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-gray-700">{service.name}</span>
                    {!service.is_active && <Badge variant="default" className="text-[10px]">غير نشط</Badge>}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
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
