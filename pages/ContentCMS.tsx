
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { ContentPage, PromoConfig } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileText, Save, Loader2, Globe, Eye, CheckCircle2, Megaphone, Upload } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ContentCMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pages' | 'promo'>('pages');
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null);
  
  // Promo State
  const [promoConfig, setPromoConfig] = useState<PromoConfig>({
      show: false,
      title: '',
      image_url: '',
      link_tab: '',
      description: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  const fetchContent = async () => {
    setLoading(true);
    // Fetch Pages
    const { data: pageData } = await supabase.from('content_pages').select('*').order('slug');
    if (pageData) {
      setPages(pageData);
      if (!selectedPage && pageData.length > 0) setSelectedPage(pageData[0]);
    }

    // Fetch Promo Config (from system_settings)
    const { data: settingsData } = await supabase.from('system_settings').select('value').eq('key', 'platform_config').maybeSingle();
    if (settingsData?.value?.promo_config) {
        setPromoConfig(settingsData.value.promo_config);
    }

    setLoading(false);
  };

  useEffect(() => { fetchContent(); }, []);

  const handleSavePage = async () => {
    if (!selectedPage) return;
    setSaving(true);
    const { error } = await supabase
      .from('content_pages')
      .update({
        title: selectedPage.title,
        content: selectedPage.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedPage.id);

    if (!error) {
      toast({ title: 'تم الحفظ', description: 'تم تحديث المحتوى بنجاح', variant: 'success' });
      fetchContent();
    } else {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleSavePromo = async () => {
      setSaving(true);
      try {
          // We need to fetch current settings first to merge
          const { data: current } = await supabase.from('system_settings').select('value').eq('key', 'platform_config').single();
          const currentSettings = current?.value || {};
          
          const newSettings = {
              ...currentSettings,
              promo_config: promoConfig
          };

          const { error } = await supabase.from('system_settings').upsert({
              key: 'platform_config',
              value: newSettings,
              updated_at: new Date().toISOString()
          });

          if(error) throw error;
          toast({ title: 'تم الحفظ', description: 'تم تحديث إعدادات الإعلان.', variant: 'success' });

      } catch (err: any) {
          toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
      } finally {
          setSaving(false);
      }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
          const file = files[0];
          const fileName = `promo-${Date.now()}.${file.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage.from('vendor-logos').upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('vendor-logos').getPublicUrl(fileName);
          setPromoConfig(prev => ({ ...prev, image_url: publicUrl }));
          toast({ title: 'تم الرفع', variant: 'success' });
      } catch (err: any) {
          toast({ title: 'فشل الرفع', description: err.message, variant: 'destructive' });
      } finally {
          setUploading(false);
      }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">جاري تحميل المحتوى...</div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 font-tajawal text-right">
      <div className="flex justify-between items-center shrink-0 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
           <h2 className="text-3xl font-black text-primary">إدارة المحتوى (CMS)</h2>
           <p className="text-sm text-gray-400 mt-1 font-bold">تعديل نصوص الصفحات والنوافذ المنبثقة.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button onClick={() => setActiveTab('pages')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'pages' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900'}`}>الصفحات الثابتة</button>
            <button onClick={() => setActiveTab('promo')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'promo' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900'}`}>الإعلان المنبثق</button>
        </div>
      </div>

      {activeTab === 'pages' && (
        <div className="flex-1 grid lg:grid-cols-4 gap-8 min-h-0">
            {/* Sidebar List */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm overflow-y-auto no-scrollbar">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 px-2">الصفحات المتاحة</h3>
                <div className="space-y-2">
                {pages.map(page => (
                    <button
                    key={page.id}
                    onClick={() => setSelectedPage(page)}
                    className={`w-full text-right px-4 py-4 rounded-xl transition-all font-bold text-sm flex items-center justify-between group ${
                        selectedPage?.id === page.id 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                    >
                    <span>{page.title}</span>
                    {selectedPage?.id === page.id && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                ))}
                </div>
            </div>

            {/* Editor Area */}
            <div className="lg:col-span-3 bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col gap-6 overflow-y-auto">
                {selectedPage ? (
                <>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <h3 className="font-black text-xl text-gray-900">{selectedPage.title}</h3>
                        <Button onClick={handleSavePage} disabled={saving} className="h-10 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            حفظ
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Input 
                        label="عنوان الصفحة" 
                        value={selectedPage.title} 
                        onChange={e => setSelectedPage({...selectedPage, title: e.target.value})} 
                        className="text-right h-12 rounded-xl font-bold"
                        />
                        <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500">المعرف (Slug)</label>
                        <div className="flex h-12 w-full rounded-xl border bg-gray-50 px-3 py-1 items-center text-sm text-gray-500 font-mono font-bold" dir="ltr">
                            /{selectedPage.slug}
                        </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2 flex flex-col min-h-[300px]">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-2">
                        محتوى الصفحة <FileText className="w-4 h-4 text-primary" />
                        </label>
                        <textarea 
                        className="flex-1 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-6 py-6 text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none resize-none leading-relaxed"
                        value={selectedPage.content}
                        onChange={e => setSelectedPage({...selectedPage, content: e.target.value})}
                        placeholder="اكتب المحتوى هنا..."
                        />
                        <p className="text-[10px] text-gray-400 font-bold text-center">يدعم النص العادي وبعض تنسيقات HTML البسيطة.</p>
                    </div>
                </>
                ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4">
                    <Globe className="w-16 h-16" />
                    <p className="font-bold">اختر صفحة من القائمة للبدء في التعديل</p>
                </div>
                )}
            </div>
        </div>
      )}

      {activeTab === 'promo' && (
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm max-w-3xl mx-auto w-full">
              <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                  <div>
                      <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><Megaphone className="w-6 h-6 text-primary" /> إعدادات النافذة المنبثقة</h3>
                      <p className="text-sm text-gray-400 mt-1 font-bold">تظهر للزوار عند فتح الموقع.</p>
                  </div>
                  <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${promoConfig.show ? 'text-green-600' : 'text-gray-400'}`}>{promoConfig.show ? 'مفعل' : 'معطل'}</span>
                      <button 
                        onClick={() => setPromoConfig(prev => ({ ...prev, show: !prev.show }))}
                        className={`w-14 h-8 rounded-full p-1 transition-colors ${promoConfig.show ? 'bg-green-500' : 'bg-gray-200'}`}
                      >
                          <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${promoConfig.show ? '-translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                  </div>
              </div>

              <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50 group hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      {promoConfig.image_url ? (
                          <img src={promoConfig.image_url} className="h-48 w-auto object-contain rounded-xl shadow-sm" alt="Promo" />
                      ) : (
                          <div className="text-center text-gray-400">
                              <Upload className="w-10 h-10 mx-auto mb-2" />
                              <span className="text-sm font-bold">رفع صورة الإعلان</span>
                          </div>
                      )}
                      <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
                      {uploading && <p className="text-xs text-primary font-bold mt-2 animate-pulse">جاري الرفع...</p>}
                  </div>

                  <Input label="عنوان الإعلان" value={promoConfig.title} onChange={e => setPromoConfig({...promoConfig, title: e.target.value})} className="h-12 rounded-xl font-bold" />
                  <Input label="الوصف (اختياري)" value={promoConfig.description || ''} onChange={e => setPromoConfig({...promoConfig, description: e.target.value})} className="h-12 rounded-xl font-bold" />
                  
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500">رابط التوجيه (عند الضغط)</label>
                      <select 
                        className="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-bold bg-white outline-none focus:border-primary transition-all"
                        value={promoConfig.link_tab || ''}
                        onChange={e => setPromoConfig({...promoConfig, link_tab: e.target.value})}
                      >
                          <option value="">بدون رابط</option>
                          <option value="browse_halls">تصفح القاعات</option>
                          <option value="browse_services">تصفح الخدمات</option>
                          <option value="store_page">المتجر</option>
                          <option value="vendor_register">تسجيل شريك</option>
                      </select>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                      <Button onClick={handleSavePromo} disabled={saving} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
                          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'حفظ الإعدادات'}
                      </Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
