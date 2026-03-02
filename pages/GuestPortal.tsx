import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Booking, StoreOrder } from '../types';
import { PriceTag } from '../components/ui/PriceTag';
import { Button } from '../components/ui/Button';
import { InvoiceModal } from '../components/Invoice/InvoiceModal';
import {
  ShoppingBag, CalendarCheck, Clock,
  MapPin, CheckCircle2, Package, Truck,
  Receipt, Building2, Sparkles, Palmtree, LogOut, ArrowRight,
  Calendar, User, Phone, Mail, Star, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useToast } from '../context/ToastContext';
import { normalizeNumbers } from '../utils/helpers';

interface GuestPortalProps {
  user: UserProfile;
  onLogout: () => void;
}

export const GuestPortal: React.FC<GuestPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders' | 'profile'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [systemLogo, setSystemLogo] = useState('https://dash.hall.sa/logo.svg');

  const { toast } = useToast();

  // Extract First Name
  const firstName = user.full_name?.split(' ')[0] || 'ضيف';

  useEffect(() => {
    fetchLogo();
    fetchData();
  }, [user]);

  const fetchLogo = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'platform_config').maybeSingle();
    if (data?.value?.platform_logo_url) {
      setSystemLogo(data.value.platform_logo_url);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const phone = normalizeNumbers(user.phone_number || '');
      const email = user.email;

      // Fetch Bookings
      let bookingQuery = supabase.from('bookings')
        .select('*, halls(name, city, image_url, capacity), chalets(name, city, image_url), services(name, image_url, category), vendor:vendor_id(business_name, phone_number)')
        .order('booking_date', { ascending: false });

      if (user.role === 'user' && user.email !== 'guest') {
        const conditions = [`user_id.eq.${user.id}`];
        if (phone) conditions.push(`guest_phone.eq.${phone}`);
        if (email) conditions.push(`guest_email.eq.${email}`);
        bookingQuery = bookingQuery.or(conditions.join(','));
      } else if (phone) {
        bookingQuery = bookingQuery.eq('guest_phone', phone);
      } else {
        bookingQuery = bookingQuery.eq('user_id', user.id);
      }

      const { data: bookingsData, error: bError } = await bookingQuery;
      if (bError) throw bError;
      setBookings(bookingsData as any[] || []);

      // Fetch Store Orders
      let orderQuery = supabase.from('store_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (user.role === 'user' && user.email !== 'guest') {
        orderQuery = orderQuery.eq('user_id', user.id);
      } else if (user.phone_number) {
        orderQuery = orderQuery.eq('user_id', user.id);
      }

      const { data: ordersData } = await orderQuery;
      setOrders(ordersData as any[] || []);

    } catch (err: any) {
      console.error(err);
      toast({ title: 'خطأ', description: 'لم نتمكن من تحميل بياناتك.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    if (status === 'pending') return 1;
    if (status === 'processing') return 2;
    if (status === 'shipped') return 3;
    if (status === 'delivered') return 4;
    return 0;
  };

  const getAssetIcon = (b: Booking) => {
    if (b.chalet_id) return <Palmtree className="w-5 h-5 text-blue-500" />;
    if (b.service_id) return <Sparkles className="w-5 h-5 text-orange-500" />;
    return <Building2 className="w-5 h-5 text-purple-500" />;
  };

  const getImage = (b: Booking) => {
    return b.halls?.image_url || b.chalets?.image_url || b.services?.image_url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: 'قيد الانتظار', color: 'yellow' },
      confirmed: { text: 'مؤكد', color: 'green' },
      cancelled: { text: 'ملغي', color: 'red' },
      processing: { text: 'قيد التجهيز', color: 'blue' },
      shipped: { text: 'جاري التوصيل', color: 'blue' },
      delivered: { text: 'تم التسليم', color: 'green' }
    };
    const badge = badges[status as keyof typeof badges] || { text: status, color: 'gray' };
    
    const colors = {
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      red: 'bg-red-50 text-red-600 border-red-100',
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      gray: 'bg-gray-50 text-gray-600 border-gray-100'
    };

    return (
      <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${colors[badge.color as keyof typeof colors]}`}>
        {badge.text}
      </span>
    );
  };

  // Upcoming Bookings Filter
  const upcomingBookings = bookings.filter(b => new Date(b.booking_date) >= new Date());
  const pastBookings = bookings.filter(b => new Date(b.booking_date) < new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 pb-20 font-tajawal" dir="rtl">
      
      {/* 1. Premium Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-2xl items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                {firstName[0]}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                  مرحباً بك، {firstName} 👋
                </h1>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 mt-0.5">
                  بوابة الضيوف الذكية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={onLogout} 
                variant="outline" 
                className="rounded-xl h-10 gap-2 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* 2. Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={() => setActiveTab('bookings')}
            className={`cursor-pointer p-4 sm:p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-lg ${
              activeTab === 'bookings' 
                ? 'bg-white border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20' 
                : 'bg-white border-gray-100 hover:border-primary/30'
            }`}
          >
            <div className={`p-3 rounded-2xl w-fit mb-3 ${
              activeTab === 'bookings' ? 'bg-gradient-to-br from-primary to-purple-600 text-white' : 'bg-gray-50 text-gray-400'
            }`}>
              <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{bookings.length}</p>
            <p className={`text-xs sm:text-sm font-bold mt-1 ${activeTab === 'bookings' ? 'text-primary' : 'text-gray-500'}`}>حجوزاتي</p>
          </div>

          <div
            onClick={() => setActiveTab('orders')}
            className={`cursor-pointer p-4 sm:p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-lg ${
              activeTab === 'orders' 
                ? 'bg-white border-orange-500 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/20' 
                : 'bg-white border-gray-100 hover:border-orange-200'
            }`}
          >
            <div className={`p-3 rounded-2xl w-fit mb-3 ${
              activeTab === 'orders' ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white' : 'bg-gray-50 text-gray-400'
            }`}>
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{orders.length}</p>
            <p className={`text-xs sm:text-sm font-bold mt-1 ${activeTab === 'orders' ? 'text-orange-600' : 'text-gray-500'}`}>طلباتي</p>
          </div>

          <div
            onClick={() => setActiveTab('profile')}
            className={`cursor-pointer p-4 sm:p-6 rounded-[2rem] border transition-all duration-300 hover:shadow-lg ${
              activeTab === 'profile' 
                ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20' 
                : 'bg-white border-gray-100 hover:border-blue-200'
            }`}
          >
            <div className={`p-3 rounded-2xl w-fit mb-3 ${
              activeTab === 'profile' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gray-50 text-gray-400'
            }`}>
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold mt-1 text-gray-500">حسابي</p>
          </div>

          <div className="p-4 sm:p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 to-purple-100 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-xs font-bold text-primary">نقاط الولاء</span>
            </div>
            <p className="text-2xl font-black text-primary">0</p>
          </div>
        </div>

        {/* 3. Tab Navigation */}
        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          {[
            { id: 'bookings', label: 'الحجوزات', icon: CalendarCheck },
            { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
            { id: 'profile', label: 'حسابي', icon: User }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 4. Content */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  الحجوزات القادمة
                </h3>
                <div className="grid gap-4 sm:gap-6">
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} className="bg-white p-4 sm:p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Image */}
                        <div className="w-full sm:w-48 h-48 rounded-[2rem] overflow-hidden bg-gray-50 relative shrink-0">
                          <img src={getImage(booking)} className="w-full h-full object-cover" />
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur p-2 rounded-xl shadow-sm">
                            {getAssetIcon(booking)}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between py-2">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg sm:text-xl font-black text-gray-900 line-clamp-1">
                                {booking.halls?.name || booking.chalets?.name || booking.services?.name}
                              </h3>
                              {getStatusBadge(booking.status)}
                            </div>

                            <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-500">
                              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: arSA })}
                              </span>
                              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                {booking.halls?.city || booking.chalets?.city || 'الرياض'}
                              </span>
                              {booking.halls?.capacity && (
                                <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                  <User className="w-3.5 h-3.5 text-primary" />
                                  {booking.halls.capacity} ضيف
                                </span>
                              )}
                            </div>

                            {booking.vendor?.business_name && (
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>{booking.vendor.business_name}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400">الإجمالي</p>
                              <PriceTag amount={booking.total_amount} className="text-xl font-black text-primary" />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => { setSelectedBooking(booking); setShowInvoice(true); }} 
                                variant="outline" 
                                className="rounded-xl h-10 text-xs font-bold border-gray-200 gap-2"
                              >
                                <Receipt className="w-3.5 h-3.5" /> 
                                <span className="hidden sm:inline">الفاتورة</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2 text-gray-400">
                  <Clock className="w-5 h-5" />
                  الحجوزات السابقة
                </h3>
                <div className="grid gap-4 sm:gap-6 opacity-70">
                  {pastBookings.map(booking => (
                    <div key={booking.id} className="bg-white p-4 sm:p-6 rounded-[2.5rem] border border-gray-100">
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="w-full sm:w-48 h-48 rounded-[2rem] overflow-hidden bg-gray-50 relative shrink-0">
                          <img src={getImage(booking)} className="w-full h-full object-cover grayscale" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-gray-900">
                            {booking.halls?.name || booking.chalets?.name || booking.services?.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {format(new Date(booking.booking_date), 'dd MMMM yyyy', { locale: arSA })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bookings.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                <CalendarCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-lg">لا توجد حجوزات مسجلة</p>
                <p className="text-gray-400 font-bold text-sm mt-2">حجوزاتك ستظهر هنا</p>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200">
                <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-lg">لا توجد طلبات متجر سابقة</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {orders.map(order => {
                  const step = getStatusStep(order.delivery_status || 'pending');
                  return (
                    <div key={order.id} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition-all">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" /> 
                            طلب #{order.id.slice(0, 8)}
                          </h3>
                          <p className="text-xs font-bold text-gray-400 mt-1">
                            {format(new Date(order.created_at), 'dd/MM/yyyy p', { locale: arSA })}
                          </p>
                        </div>
                        <div className="text-left">
                          <PriceTag amount={order.total_amount} className="text-xl font-black text-gray-900" />
                          <p className="text-[10px] font-bold text-gray-400">{order.items?.length || 0} منتجات</p>
                        </div>
                      </div>

                      {/* Tracking Stepper */}
                      <div className="relative mb-6 px-2">
                        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-100 -translate-y-1/2 rounded-full z-0"></div>
                        <div className="absolute top-1/2 left-0 h-1.5 bg-green-500 -translate-y-1/2 rounded-full z-0 transition-all duration-1000" style={{ width: `${((step - 1) * 33.33)}%` }}></div>

                        <div className="relative z-10 flex justify-between w-full">
                          {[
                            { label: 'قيد المعالجة', icon: Clock, active: step >= 1 },
                            { label: 'تم التجهيز', icon: Package, active: step >= 2 },
                            { label: 'جاري التوصيل', icon: Truck, active: step >= 3 },
                            { label: 'تم التسليم', icon: CheckCircle2, active: step >= 4 },
                          ].map((s, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                s.active ? 'bg-green-500 border-green-100 text-white scale-110' : 'bg-white border-gray-100 text-gray-300'
                              }`}>
                                <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </div>
                              <span className={`text-[9px] sm:text-[10px] font-bold text-center ${s.active ? 'text-gray-900' : 'text-gray-300'}`}>
                                {s.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="space-y-2">
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm font-bold text-gray-700">
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {item.name}
                              </span>
                              <span className="text-gray-400">x{item.qty}</span>
                            </div>
                          ))}
                          {(order.items?.length || 0) > 3 && (
                            <p className="text-[10px] font-bold text-primary pt-2">
                              + {(order.items?.length || 0) - 3} منتجات أخرى
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg shadow-primary/20">
                  {firstName[0]}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">{user.full_name || 'مستخدم'}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500">رقم الجوال</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{user.phone_number || 'غير متوفر'}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500">البريد الإلكتروني</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{user.email}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500">تاريخ الانضمام</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {user.created_at ? format(new Date(user.created_at), 'dd MMMM yyyy', { locale: arSA }) : 'غير متوفر'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-500">نوع الحساب</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {user.role === 'vendor' ? 'شريك' : user.role === 'super_admin' ? 'مدير' : 'ضيف'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showInvoice && selectedBooking && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          booking={selectedBooking}
        />
      )}
    </div>
  );
};
