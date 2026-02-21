import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, ArrowRight } from 'lucide-react';

const POS_CATEGORIES = ['عام', 'طعام', 'مشروبات', 'حلويات', 'وجبات سريعة', 'أخرى'];

interface VendorPOSItemFormProps {
  item?: any;
  onBack: () => void;
}

export const VendorPOSItemForm: React.FC<VendorPOSItemFormProps> = ({ item, onBack }) => {
  const [currentItem, setCurrentItem] = useState({
    name: '',
    price: 0,
    stock: 100,
    barcode: '',
    category: 'عام'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setCurrentItem({
        name: item.name,
        price: item.price,
        stock: item.stock,
        barcode: item.barcode || '',
        category: item.category
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!currentItem.name.trim() || !currentItem.price) return;

    setSaving(true);
    try {
      const itemData = {
        name: currentItem.name.trim(),
        price: currentItem.price,
        stock: currentItem.stock,
        barcode: currentItem.barcode || null,
        category: currentItem.category
      };

      if (item) {
        // Update
        const { error } = await supabase
          .from('pos_items')
          .update(itemData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('pos_items')
          .insert([itemData]);

        if (error) throw error;
      }

      onBack();
    } catch (error) {
      console.error('Error saving item:', error);
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
          <h1 className="text-xl font-black">{item ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8">
          <div className="space-y-4 text-right">
            <Input label="اسم الصنف" value={currentItem.name} onChange={e => setCurrentItem({...currentItem, name: e.target.value})} className="h-12 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
               <Input label="السعر" type="number" value={currentItem.price} onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})} className="h-12 rounded-xl" />
               <Input label="الكمية (المخزون)" type="number" value={currentItem.stock} onChange={e => setCurrentItem({...currentItem, stock: Number(e.target.value)})} className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Input label="الباركود (اختياري)" value={currentItem.barcode} onChange={e => setCurrentItem({...currentItem, barcode: e.target.value})} className="h-12 rounded-xl" />
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">التصنيف</label>
                  <select className="w-full h-12 border border-gray-200 rounded-xl px-4 font-bold bg-white focus:ring-2 focus:ring-primary/10 outline-none" value={currentItem.category} onChange={e => setCurrentItem({...currentItem, category: e.target.value})}>
                      {POS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full h-14 rounded-xl font-black mt-4">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ البيانات'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};