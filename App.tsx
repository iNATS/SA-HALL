import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { UserProfile, VAT_RATE, SAUDI_CITIES, HALL_AMENITIES, SERVICE_CATEGORIES, Hall, ThemeConfig } from './types';
import { Sidebar } from './components/Layout/Sidebar';
import { PublicNavbar } from './components/Layout/PublicNavbar';
import { Footer } from './components/Layout/Footer';
import { Dashboard } from './pages/Dashboard';
import { VendorHalls } from './pages/VendorHalls';
import { VendorChalets } from './pages/VendorChalets';
import { Bookings } from './pages/Bookings';
import { Home } from './pages/Home';
import { VendorSubscriptions } from './pages/VendorSubscriptions';
import { SystemSettings } from './pages/SystemSettings';
import { UsersManagement } from './pages/UsersManagement';
import { AdminDashboard } from './pages/AdminDashboard';
import { ContentCMS } from './pages/ContentCMS';
import { ServiceCategories } from './pages/ServiceCategories'; 
import { AdminStore } from './pages/AdminStore'; 
import { VendorCoupons } from './pages/VendorCoupons';
import { CalendarBoard } from './pages/CalendarBoard';
import { VendorServices } from './pages/VendorServices';
import { VendorBrandSettings } from './pages/VendorBrandSettings';
import { BrowseHalls } from './pages/BrowseHalls';
import { PublicListing } from './pages/PublicListing';
import { PublicStore } from './pages/PublicStore';
import { Favorites } from './pages/Favorites';
import { AdminRequests } from './pages/AdminRequests';
import { VendorAccounting } from './pages/VendorAccounting';
import { HallDetails } from './pages/HallDetails';
import { ChaletDetails } from './pages/ChaletDetails';
import { ServiceDetails } from './pages/ServiceDetails';
import { ForgotPassword } from './pages/ForgotPassword'; 
import { GuestPortal } from './pages/GuestPortal'; 
import { VendorMarketplace } from './pages/VendorMarketplace';
import { VendorClients } from './pages/VendorClients'; 
import { TermsOfService } from './pages/TermsOfService';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ServiceLevelAgreement } from './pages/ServiceLevelAgreement';
import { HelpCenter } from './pages/HelpCenter';
import { VendorSubscriptionSetup } from './pages/VendorSubscriptionSetup'; // New Page
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Modal } from './components/ui/Modal'; 
import { PriceTag } from './components/ui/PriceTag';
import { prepareCheckout, verifyPaymentStatus } from './services/paymentService';
import { HyperPayForm } from './components/Payment/HyperPayForm';
import { 
  Loader2, CheckCircle2, Mail, ArrowLeft,
  Globe, Sparkles, Building2, Palmtree, Lock, CreditCard, User, Check, Eye, EyeOff, LogOut, Plus, ArrowRight, XCircle, FileText, Upload, Clock, Image as ImageIcon, Ticket, ShieldCheck, Hourglass
} from 'lucide-react';
import { useToast } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { checkPasswordStrength, isValidSaudiPhone, normalizeNumbers } from './utils/helpers';
import { VendorAuth } from './pages/VendorAuth';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [loading, setLoading] = useState(true);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  
  // Registration State
  const [regStep, setRegStep] = useState(1);
  const [regData, setRegData] = useState({ fullName: '', email: '', password: '', phone: '' });
  
  const [authLoading, setAuthLoading] = useState(false);
  
  // Navigation State
  const [browseFilters, setBrowseFilters] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [detailType, setDetailType] = useState<'hall' | 'chalet' | 'service'>('hall');

  const { toast } = useToast();

  const applyTheme = (config: ThemeConfig) => {
      const root = document.documentElement;
      if(config.primaryColor) root.style.setProperty('--primary', config.primaryColor);
      if(config.secondaryColor) root.style.setProperty('--secondary', config.secondaryColor);
      if(config.backgroundColor) root.style.setProperty('--background', config.backgroundColor);
      if(config.borderRadius) root.style.setProperty('--radius', config.borderRadius);
  };

  const refreshTheme = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'platform_config').maybeSingle();
      if (data?.value?.theme_config) {
          setThemeConfig(data.value.theme_config);
          applyTheme(data.value.theme_config);
      }
  };

  useEffect(() => {
    refreshTheme();
    
    // Check Session safely to handle Invalid Refresh Token errors
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn("Session error:", error.message);
          await supabase.auth.signOut(); // Clear invalid token
          setUserProfile(null);
          setLoading(false);
          return;
        }

        if (data.session) {
          await fetchProfile(data.session.user.id);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Unexpected session check error:", err);
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
          await fetchProfile(session.user.id);
      } else {
          setUserProfile(null);
          setLoading(false);
          // FIX: Do not redirect to home if user is on auth pages (prevents loop/reload effect)
          setActiveTab(prev => {
              if (['vendor_register', 'vendor_login', 'guest_login'].includes(prev)) {
                  return prev;
              }
              return 'home';
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) {
        console.error("Profile fetch error:", error);
        return;
      }
      
      if (data) {
          setUserProfile(data as UserProfile);
          // Important: Re-route on profile fetch to ensure logic holds
          if (activeTab === 'vendor_login' || activeTab === 'home' || activeTab === 'vendor_register') {
              await routeUser(data as UserProfile, userId);
          }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setActiveTab('home');
  };

  const navigateToDetails = (tab: string, item: any) => {
      if (tab === 'hall_details') {
          setDetailItem(item.item);
          setDetailType(item.type);
          setActiveTab('hall_details');
      } else {
          setActiveTab(tab);
      }
  };

  const handleNavigate = (tab: string, item?: any) => {
      if (item) navigateToDetails(tab, item);
      else {
          // Clear cache/memory when navigating to home
          if (tab === 'home') {
              setBrowseFilters(null);
              setDetailItem(null);
              setDetailType('hall');
          }
          setActiveTab(tab);
      }
  };

  // --- CORE ROUTING LOGIC (UPDATED) ---
  const routeUser = async (profile: UserProfile, userId: string) => {
      if (profile.role === 'vendor') {
          // 1. Subscription Check FIRST (Limits = 0 means new user needs to pay/choose plan)
          if (profile.hall_limit === 0 && profile.service_limit === 0) {
              setActiveTab('vendor_subscription_setup');
          } 
          // 2. Status Check
          else if (profile.status === 'pending') {
              setActiveTab('request_pending');
          } 
          else if (profile.status === 'rejected') {
              setActiveTab('request_rejected'); 
          } 
          // 3. Approved & Subscribed -> Dashboard
          else {
              setActiveTab('dashboard');
          }
      } else if (profile.role === 'super_admin') {
          setActiveTab('admin_dashboard');
      } else {
          // Normal User (Guest) -> Guest Portal (Marhaba Alf)
          setActiveTab('guest_dashboard');
      }
  };

  const handleLoginSuccess = async () => {
      setAuthLoading(true);
      try {
          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;
          if (!data.user) return;

          const user = data.user;
          let profileData = null;
          
          // Retry loop to allow DB trigger to finish
          for (let i = 0; i < 3; i++) {
              const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
              if (data) {
                  profileData = data;
                  break;
              }
              await new Promise(r => setTimeout(r, 1000));
          }
          
          if (profileData) {
              setUserProfile(profileData as UserProfile);
              await routeUser(profileData as UserProfile, user.id);
          } else {
              // Fallback manual create if trigger failed
              const { error: insertError } = await supabase.from('profiles').insert([{
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata.full_name || '',
                  role: user.user_metadata.role || 'user',
                  status: user.user_metadata.role === 'vendor' ? 'pending' : 'approved',
                  is_enabled: true,
                  phone_number: user.user_metadata.phone_number || ''
              }]);

              if (!insertError) {
                  const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                  if (newProfile) {
                      setUserProfile(newProfile as UserProfile);
                      await routeUser(newProfile as UserProfile, user.id);
                  }
              } else {
                  toast({ title: 'خطأ', description: 'تعذر الوصول لملف المستخدم.', variant: 'destructive' });
              }
          }
      } catch (err: any) {
          console.error("Login Error:", err);
          toast({ title: 'خطأ', description: err.message || 'حدث خطأ أثناء التوجيه', variant: 'destructive' });
      } finally {
          setAuthLoading(false);
      }
  };

  const renderContent = () => {
    if (activeTab === 'vendor_login') return <VendorAuth isLogin onRegister={() => setActiveTab('vendor_register')} onLogin={handleLoginSuccess} onNavigate={handleNavigate} onBack={() => setActiveTab('home')} />;
    
    // FIX: Add Vendor Register Handler
    if (activeTab === 'vendor_register') return <VendorAuth isLogin={false} onLogin={() => setActiveTab('vendor_login')} onRegister={handleLoginSuccess} onNavigate={handleNavigate} onBack={() => setActiveTab('home')} />;

    // Status Page: Request Pending
    if (activeTab === 'request_pending') return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-tajawal text-right" dir="rtl">
            <div className="bg-white max-w-lg w-full p-10 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto relative">
                    <Hourglass className="w-10 h-10 text-yellow-600 animate-pulse" />
                    <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3">طلبك قيد المراجعة</h2>
                    <p className="text-gray-500 font-bold text-lg leading-relaxed">
                        شكراً لانضمامك إلينا! يقوم فريق الإدارة بمراجعة بياناتك حالياً.
                    </p>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mt-6">
                        <p className="text-sm font-bold text-blue-800">
                            سيتم تفعيل حسابك وإشعارك عبر البريد الإلكتروني فور الاعتماد.
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleLogout} className="w-full h-14 rounded-2xl font-bold border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 gap-2">
                    <LogOut className="w-5 h-5" /> تسجيل الخروج والعودة لاحقاً
                </Button>
            </div>
        </div>
    );

    // Status Page: Rejected
    if (activeTab === 'request_rejected') return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-tajawal text-right" dir="rtl">
            <div className="bg-white max-w-lg w-full p-10 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-8">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3">عذراً، تم رفض الطلب</h2>
                    <p className="text-gray-500 font-bold text-lg leading-relaxed">
                        نأسف لإبلاغك بأنه لم يتم قبول طلب انضمامك في الوقت الحالي. يرجى التواصل مع الدعم الفني لمزيد من التفاصيل.
                    </p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="w-full h-14 rounded-2xl font-bold">
                    تسجيل الخروج
                </Button>
            </div>
        </div>
    );

    // Force Subscription Page (First Priority for new users)
    if (activeTab === 'vendor_subscription_setup') return userProfile ? <VendorSubscriptionSetup user={userProfile} onSuccess={() => fetchProfile(userProfile.id)} onLogout={handleLogout} /> : null;

    switch (activeTab) {
      // Vendor
      case 'dashboard': return userProfile ? <Dashboard user={userProfile} /> : null;
      case 'my_halls': return userProfile ? <VendorHalls user={userProfile} /> : null;
      case 'hall_bookings': return userProfile ? <Bookings user={userProfile} /> : null;
      case 'coupons': return userProfile ? <VendorCoupons user={userProfile} /> : null;
      case 'calendar': return userProfile ? <CalendarBoard user={userProfile} /> : null;
      case 'vendor_services': return userProfile ? <VendorServices user={userProfile} /> : null;
      case 'brand_settings': return userProfile ? <VendorBrandSettings user={userProfile} onUpdate={() => userProfile && fetchProfile(userProfile.id)} /> : null;
      case 'accounting': return userProfile ? <VendorAccounting user={userProfile} /> : null;
      case 'vendor_marketplace': return userProfile ? <VendorMarketplace user={userProfile} /> : null;
      case 'vendor_clients': return userProfile ? <VendorClients user={userProfile} /> : null;
      
      // Admin
      case 'admin_dashboard': return <AdminDashboard />;
      case 'admin_vendors': return <VendorSubscriptions />;
      case 'admin_customers': return <UsersManagement />;
      case 'admin_cms': return <ContentCMS />;
      case 'admin_categories': return <ServiceCategories />;
      case 'admin_store': return userProfile ? <AdminStore user={userProfile} /> : null;
      case 'settings': return <SystemSettings onThemeUpdate={refreshTheme} />;
      case 'admin_requests': return <AdminRequests />;
      
      // Public
      case 'browse_halls': return <BrowseHalls user={userProfile} entityType="hall" onBack={() => setActiveTab('home')} onNavigate={handleNavigate} initialFilters={browseFilters} />;
      case 'browse_services': return <BrowseHalls user={userProfile} entityType="service" onBack={() => setActiveTab('home')} onNavigate={handleNavigate} initialFilters={browseFilters} />;
      case 'hall_details': return detailItem ? (detailType === 'service' ? <ServiceDetails item={detailItem} user={userProfile} onBack={() => setActiveTab('home')} /> : detailType === 'chalet' ? <ChaletDetails item={detailItem} user={userProfile} onBack={() => setActiveTab('home')} /> : <HallDetails item={detailItem} user={userProfile} onBack={() => setActiveTab('home')} />) : null;
      case 'store_page': return <PublicStore />;
      case 'forgot_password': return <ForgotPassword onBack={() => setActiveTab('vendor_login')} onSuccess={() => setActiveTab('vendor_login')} />;
      case 'terms_of_service': return <TermsOfService onBack={() => setActiveTab('home')} />;
      case 'privacy_policy': return <PrivacyPolicy onBack={() => setActiveTab('home')} />;
      case 'service_level_agreement': return <ServiceLevelAgreement onBack={() => setActiveTab('home')} />;
      case 'help_center': return <HelpCenter onBack={() => setActiveTab('home')} />;
      case 'guest_dashboard': return userProfile ? <GuestPortal user={userProfile} onLogout={handleLogout} /> : null;
      
      default: return <Home user={userProfile} onLoginClick={() => setActiveTab('vendor_login')} onRegisterClick={() => setActiveTab('vendor_register')} onBrowseHalls={(f) => { setBrowseFilters(f); setActiveTab('browse_halls'); }} onNavigate={handleNavigate} onLogout={handleLogout} logoUrl={themeConfig?.logoUrl} />;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  const isAuthPage = ['vendor_login', 'vendor_register', 'guest_login', 'request_pending', 'request_rejected', 'vendor_subscription_setup'].includes(activeTab);
  const isPublicPage = ['home', 'browse_halls', 'browse_services', 'hall_details', 'store_page', 'terms_of_service', 'privacy_policy', 'service_level_agreement', 'help_center'].includes(activeTab);
  
  return (
    <NotificationProvider userId={userProfile?.id}>
        <div className={`min-h-screen ${userProfile?.role !== 'user' && !isPublicPage && !isAuthPage ? 'bg-gray-50' : 'bg-white'}`}>
        {isPublicPage && !isAuthPage && (
            <PublicNavbar user={userProfile} onLoginClick={() => setActiveTab('vendor_login')} onRegisterClick={() => setActiveTab('vendor_register')} onNavigate={handleNavigate} onLogout={handleLogout} activeTab={activeTab} logoUrl={themeConfig?.logoUrl} />
        )}
        
        {isPublicPage || isAuthPage ? (
            <main className={`${isPublicPage && !isAuthPage ? 'pt-28' : ''} ${isAuthPage ? 'h-full' : ''}`}>{renderContent()}</main>
        ) : (
            <div className="flex">
                <Sidebar user={userProfile} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} isOpen={false} setIsOpen={() => {}} platformLogo={userProfile?.role === 'vendor' ? userProfile?.custom_logo_url : themeConfig?.logoUrl || "https://dash.hall.sa/logo.svg"} />
                <main className={`flex-1 p-4 lg:p-8 transition-all duration-300 ${userProfile ? 'lg:mr-72' : ''}`}>{renderContent()}</main>
            </div>
        )}
        {isPublicPage && !isAuthPage && <Footer onNavigate={handleNavigate} />}
        </div>
    </NotificationProvider>
  );
};

export default App;