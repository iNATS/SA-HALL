import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, Save, ArrowRight } from 'lucide-react';

interface ServiceCategoryFormProps {
  category?: any;
  onBack: () => void;
}

export const ServiceCategoryForm: React.FC<ServiceCategoryFormProps> = ({ category: initialCategory, onBack }) => {
  const [formData, setFormData] = useState({ name: '', icon: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setFormData({ name: initialCategory.name, icon: initialCategory.icon || '' });
    }
  }, [initialCategory]);

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (initialCategory?.id) {
        // Update
        const { error } = await supabase
          .from('service_categories')
          .update({ name: formData.name.trim(), icon: formData.icon.trim() })
          .eq('id', initialCategory.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('service_categories')
          .insert([{ name: formData.name.trim(), icon: formData.icon.trim() }]);

        if (error) throw error;
      }

      onBack();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-tajawal">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button onClick={onBack} variant="ghost" className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            العودة
          </Button>
          <h1 className="text-xl font-black">{initialCategory?.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
          <div className="space-y-6 text-right">
            <Input
              label="اسم التصنيف"
              placeholder="مثال: تصوير جوي"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="h-12 rounded-xl text-right"
            />
            <Input
              label="أيقونة التصنيف (اختياري)"
              placeholder="مثال: Camera"
              value={formData.icon}
              onChange={e => setFormData({...formData, icon: e.target.value})}
              className="h-12 rounded-xl text-right"
            />
            <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl font-bold gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};