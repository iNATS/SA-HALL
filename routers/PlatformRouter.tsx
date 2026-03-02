/**
 * نظام التوجيه المنفصل للمنصات
 * يفصل صفحات المنصات (Admin/Vendor/Guest) عن صفحات الموقع العامة
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, ThemeConfig } from '../types';
import { Sidebar } from './components/Layout/Sidebar';
import { PublicNavbar } from './components/Layout/PublicNavbar';
import { Footer } from './components/Layout/Footer';
import { Loader2 } from 'lucide-react';

// Platform Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminHomePageSections } from './pages/AdminHomePageSections';
import { SubscribersManagement } from './pages/SubscribersManagement';
import { HallsManagement } from './pages/HallsManagement';
import { ServicesManagement } from './pages/ServicesManagement';
import { CouponsManagement } from './pages/CouponsManagement';
import { AdminAccounting } from './pages/AdminAccounting';
import { ContentCMS } from './pages/ContentCMS';
import { AdminStore } from './pages/AdminStore';
import { AdminRequests } from './pages/AdminRequests';
import { UsersManagement } from './pages/UsersManagement';
import { SystemSettings } from './pages/SystemSettings';

import { Dashboard } from './pages/Dashboard';
import { VendorHalls } from './pages/VendorHalls';
import { VendorServices } from './pages/VendorServices';
import { VendorBookings } from './pages/VendorBookings';
import { VendorAccounting } from './pages/VendorAccounting';
import { VendorCoupons } from './pages/VendorCoupons';
import { CalendarBoard } from './pages/CalendarBoard';
import { VendorBrandSettings } from './pages/VendorBrandSettings';
import { VendorMarketplace } from './pages/VendorMarketplace';
import { VendorClients } from './pages/VendorClients';
import { VendorSubscription } from './pages/VendorSubscription';
import { VendorChooseType } from './pages/VendorChooseType';

import { GuestPortal } from './pages/GuestPortal';
import { GuestLogin } from './pages/GuestLogin';

// Public Pages (separate router)
import { Home } from './pages/Home';
import { BrowseHalls } from './pages/BrowseHalls';
import { PublicListing } from './pages/PublicListing';
import { PublicStore } from './pages/PublicStore';
import { HallDetails } from './pages/HallDetails';
import { ChaletDetails } from './pages/ChaletDetails';
import { ServiceDetails } from './pages/ServiceDetails';
import { Favorites } from './pages/Favorites';
import { ForgotPassword } from './pages/ForgotPassword';
import { PaymentCallback } from './pages/PaymentCallback';

type PlatformType = 'admin' | 'vendor' | 'guest' | 'public' | 'auth';

interface PlatformRouterProps {
  userProfile: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  themeConfig: ThemeConfig | null;
  handleNavigate: (tab: string, item?: any) => void;
  browseFilters: any;
  setBrowseFilters: (filters: any) => void;
  detailItem: any;
  setDetailItem: (item: any) => void;
  detailType: 'hall' | 'chalet' | 'service';
  setDetailType: (type: 'hall' | 'chalet' | 'service') => void;
}

export const PlatformRouter: React.FC<PlatformRouterProps> = ({
  userProfile,
  activeTab,
  setActiveTab,
  onLogout,
  themeConfig,
  handleNavigate,
  browseFilters,
  setBrowseFilters,
  detailItem,
  setDetailItem,
  detailType,
  setDetailType
}) => {
  const [platform, setPlatform] = useState<PlatformType>('public');

  useEffect(() => {
    // Determine platform based on activeTab
    if (activeTab.startsWith('admin_')) {
      setPlatform('admin');
    } else if (activeTab.startsWith('vendor_') || 
               ['dashboard', 'my_halls', 'hall_bookings', 'calendar', 'accounting', 'coupons', 'brand_settings', 'vendor_marketplace', 'vendor_clients'].includes(activeTab)) {
      setPlatform('vendor');
    } else if (['guest_login', 'guest_dashboard', 'guest_bookings'].includes(activeTab)) {
      setPlatform('guest');
    } else if (['vendor_login', 'vendor_register', 'forgot_password', 'request_pending', 'vendor_subscription', 'vendor_choose_type'].includes(activeTab)) {
      setPlatform('auth');
    } else {
      setPlatform('public');
    }
  }, [activeTab]);

  // Platform-specific pages
  const renderPlatformContent = () => {
    if (platform === 'admin') {
      return renderAdminPages();
    } else if (platform === 'vendor') {
      return renderVendorPages();
    } else if (platform === 'guest') {
      return renderGuestPages();
    } else if (platform === 'auth') {
      return renderAuthPages();
    } else {
      return renderPublicPages();
    }
  };

  const renderAdminPages = () => {
    switch (activeTab) {
      case 'admin_dashboard': return <AdminDashboard />;
      case 'admin_home_sections': return <AdminHomePageSections />;
      case 'admin_subscribers': return <SubscribersManagement />;
      case 'admin_halls': return <HallsManagement />;
      case 'admin_services': return <ServicesManagement />;
      case 'admin_coupons': return <CouponsManagement />;
      case 'admin_accounting': return <AdminAccounting />;
      case 'admin_cms': return <ContentCMS />;
      case 'admin_store': return <AdminStore />;
      case 'admin_requests': return <AdminRequests />;
      case 'admin_users': return <UsersManagement />;
      case 'settings': return <SystemSettings />;
      default: return <AdminDashboard />;
    }
  };

  const renderVendorPages = () => {
    if (!userProfile) return null;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={userProfile} onNavigate={handleNavigate} />;
      case 'my_halls': return <VendorHalls user={userProfile} />;
      case 'vendor_services': return <VendorServices user={userProfile} />;
      case 'hall_bookings': return <VendorBookings user={userProfile} />;
      case 'calendar': return <CalendarBoard user={userProfile} />;
      case 'accounting': return <VendorAccounting user={userProfile} />;
      case 'coupons': return <VendorCoupons user={userProfile} />;
      case 'brand_settings': return <VendorBrandSettings user={userProfile} onUpdate={() => {}} />;
      case 'vendor_marketplace': return <VendorMarketplace user={userProfile} />;
      case 'vendor_clients': return <VendorClients user={userProfile} />;
      case 'vendor_subscription': return <VendorSubscription user={userProfile} onComplete={() => setActiveTab('dashboard')} />;
      case 'vendor_choose_type': return <VendorChooseType user={userProfile} />;
      default: return <Dashboard user={userProfile} onNavigate={handleNavigate} />;
    }
  };

  const renderGuestPages = () => {
    if (!userProfile) return null;
    
    switch (activeTab) {
      case 'guest_login': return <GuestLogin onBack={() => setActiveTab('home')} />;
      case 'guest_dashboard':
      case 'guest_bookings':
        return <GuestPortal user={userProfile} onLogout={onLogout} />;
      default: return <GuestLogin onBack={() => setActiveTab('home')} />;
    }
  };

  const renderAuthPages = () => {
    switch (activeTab) {
      case 'vendor_login':
      case 'vendor_register':
        // These are handled by VendorAuth component in main App
        return null;
      case 'request_pending':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6 animate-pulse border-4 border-yellow-100">
              <div className="text-4xl">⏳</div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">طلبك قيد المراجعة</h2>
            <p className="text-gray-500 max-w-md font-bold leading-relaxed mb-8">
              شكراً لانضمامك! يقوم فريق الإدارة حالياً بمراجعة بياناتك.
            </p>
          </div>
        );
      case 'vendor_subscription':
        if (!userProfile) return null;
        return <VendorSubscription user={userProfile} onComplete={() => setActiveTab('dashboard')} />;
      case 'vendor_choose_type':
        if (!userProfile) return null;
        return <VendorChooseType user={userProfile} />;
      default:
        return null;
    }
  };

  const renderPublicPages = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home
            user={userProfile}
            onLoginClick={() => setActiveTab('vendor_login')}
            onRegisterClick={() => setActiveTab('vendor_register')}
            onBrowseHalls={(f) => { setBrowseFilters(f); setActiveTab('browse_halls'); }}
            onNavigate={handleNavigate}
            onLogout={onLogout}
          />
        );
      case 'browse_halls':
        return (
          <BrowseHalls
            user={userProfile}
            entityType="hall"
            onBack={() => setActiveTab('home')}
            onNavigate={handleNavigate}
            initialFilters={browseFilters}
          />
        );
      case 'browse_services':
        return (
          <BrowseHalls
            user={userProfile}
            entityType="service"
            onBack={() => setActiveTab('home')}
            onNavigate={handleNavigate}
            initialFilters={browseFilters}
          />
        );
      case 'halls_page':
        return <PublicListing type="hall" title="قاعات الأفراح" onNavigate={handleNavigate} />;
      case 'services_page':
        return <PublicListing type="service" title="خدمات المناسبات" onNavigate={handleNavigate} />;
      case 'store_page':
        return <PublicStore />;
      case 'hall_details':
        if (!detailItem) return null;
        if (detailType === 'service') {
          return <ServiceDetails item={detailItem} user={userProfile} onBack={() => setActiveTab('home')} />;
        } else if (detailType === 'chalet') {
          return <ChaletDetails item={detailItem} user={userProfile} onBack={() => setActiveTab('home')} />;
        } else {
          return <HallDetails item={detailItem} user={userProfile} onBack={() => setActiveTab('home')} onNavigate={handleNavigate} />;
        }
      case 'favorites':
        return <Favorites user={userProfile} onNavigate={handleNavigate} />;
      case 'forgot_password':
        return <ForgotPassword onBack={() => setActiveTab('vendor_login')} onSuccess={() => setActiveTab('vendor_login')} />;
      case 'payment-callback':
        return <PaymentCallback />;
      default:
        return (
          <Home
            user={userProfile}
            onLoginClick={() => setActiveTab('vendor_login')}
            onRegisterClick={() => setActiveTab('vendor_register')}
            onBrowseHalls={(f) => { setBrowseFilters(f); setActiveTab('browse_halls'); }}
            onNavigate={handleNavigate}
            onLogout={onLogout}
          />
        );
    }
  };

  return (
    <div className={platform === 'public' || platform === 'auth' ? 'bg-white' : 'bg-gray-50'}>
      {renderPlatformContent()}
    </div>
  );
};
