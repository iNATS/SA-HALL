import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Booking } from '../types';
import { PriceTag } from '../components/ui/PriceTag';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  CalendarCheck, Building2, Loader2, TrendingUp, Inbox,
  Clock, CheckCircle2, ArrowUpRight, Filter, Banknote,
  Users, Star, ShoppingBag, Activity
} from 'lucide-react';
import {
  XAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, YAxis,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';
import { format, subMonths, isSameMonth, eachMonthOfInterval } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useToast } from '../context/ToastContext';

interface DashboardProps {
  user: UserProfile;
}

interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingRequests: number;
  totalRevenue: number;
  paidAmount: number;
  outstandingAmount: number;
  activeHalls: number;
  totalHalls: number;
  totalClients: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<{id: string, name: string, type: string}[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('all');
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingRequests: 0,
    totalRevenue: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    activeHalls: 0,
    totalHalls: 0,
    totalClients: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [hallsPieData, setHallsPieData] = useState<any[]>([]);
  const [topHalls, setTopHalls] = useState<any[]>([]);

  // Fetch Assets List
  useEffect(() => {
      const fetchAssets = async () => {
          const [hallsData, servicesData] = await Promise.all([
              supabase.from('halls').select('id, name, is_active').eq('vendor_id', user.id),
              supabase.from('services').select('id, name, is_active').eq('vendor_id', user.id),
          ]);
          const combined = [
              ...(hallsData.data || []).map(h => ({ ...h, type: 'hall' })),
              ...(servicesData.data || []).map(s => ({ ...s, type: 'service' })),
          ];
          setAssets(combined);
          
          // Calculate halls pie data
          const activeCount = hallsData.data?.filter(h => h.is_active).length || 0;
          const inactiveCount = hallsData.data?.filter(h => !h.is_active).length || 0;
          setHallsPieData([
            { name: 'قاعات نشطة', value: activeCount, color: '#10B981' },
            { name: 'قاعات غير نشطة', value: inactiveCount, color: '#EF4444' }
          ]);
      };
      fetchAssets();
  }, [user.id]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const today = new Date();

      let query = supabase
        .from('bookings')
        .select('*, halls(name), chalets(name), profiles:user_id(full_name)')
        .eq('vendor_id', user.id)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (selectedAsset !== 'all') {
          query = query.eq('hall_id', selectedAsset);
      }

      const { data: bookings } = await query;
      const allBookings = (bookings as Booking[]) || [];

      const totalRevenue = allBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
      const paidAmount = allBookings.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);

      // Get total halls count
      const { count: hallsCount } = await supabase
        .from('halls')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id);

      // Get unique clients count
      const { data: clientData } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('vendor_id', user.id)
        .not('user_id', 'is', null);
      const uniqueClients = new Set(clientData?.map(b => b.user_id)).size || 0;

      // Get top halls by bookings
      const hallsBookings = allBookings.reduce((acc, b) => {
        const hallName = b.halls?.name || 'غير معروف';
        if (!acc[hallName]) acc[hallName] = 0;
        acc[hallName]++;
        return acc;
      }, {} as Record<string, number>);
      
      const sortedHalls = Object.entries(hallsBookings)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopHalls(sortedHalls);

      setStats({
        totalBookings: allBookings.length,
        confirmedBookings: allBookings.filter(b => b.status === 'confirmed').length,
        pendingRequests: allBookings.filter(b => b.status === 'pending').length,
        totalRevenue,
        paidAmount,
        outstandingAmount: totalRevenue - paidAmount,
        activeHalls: assets.filter(a => a.type === 'hall').length,
        totalHalls: hallsCount || 0,
        totalClients: uniqueClients,
      });

      const months = eachMonthOfInterval({ start: subMonths(today, 5), end: today });
      const monthlyData = months.map(month => {
        const mBookings = allBookings.filter(b => isSameMonth(new Date(b.booking_date), month));
        const mRevenue = mBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
        return {
            name: format(month, 'MMM', { locale: arSA }),
            revenue: mRevenue,
            bookings: mBookings.length
        };
      });
      setChartData(monthlyData);
      setRecentBookings(allBookings.slice(0, 10));

    } catch (err: any) {
      console.error(err);
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user.id, selectedAsset, assets.length, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleNavigate = (page: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page } }));
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, onClick }: any) => (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">لوحة القيادة</h2>
          <p className="text-sm text-gray-500 mt-1">نظرة عامة على أدائك</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
            <Filter className="w-5 h-5 text-gray-400 mr-2" />
            <select
                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer min-w-[150px]"
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
            >
                <option value="all">كافة الأصول</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="الحجوزات المؤكدة"
          value={stats.confirmedBookings}
          icon={CheckCircle2}
          color="bg-green-50 text-green-600"
          subtitle={`إجمالي ${stats.totalBookings} حجز`}
          onClick={() => handleNavigate('hall_bookings')}
        />
        <StatCard
          title="الطلبات المعلقة"
          value={stats.pendingRequests}
          icon={Clock}
          color="bg-orange-50 text-orange-600"
          subtitle="تحتاج تأكيد"
          onClick={() => handleNavigate('hall_bookings')}
        />
        <StatCard
          title="القاعات النشطة"
          value={stats.activeHalls}
          icon={Building2}
          color="bg-blue-50 text-blue-600"
          subtitle={`إجمالي ${stats.totalHalls} قاعة`}
          onClick={() => handleNavigate('my_halls')}
        />
        <StatCard
          title="العملاء"
          value={stats.totalClients}
          icon={Users}
          color="bg-purple-50 text-purple-600"
          subtitle="عميل فريد"
          onClick={() => handleNavigate('vendor_clients')}
        />
        <StatCard
          title="المبالغ المحصلة"
          value={<PriceTag amount={stats.paidAmount} className="text-xl font-bold" />}
          icon={Banknote}
          color="bg-emerald-50 text-emerald-600"
          subtitle="تم تحصيلها"
          onClick={() => handleNavigate('accounting')}
        />
        <StatCard
          title="المبالغ الآجلة"
          value={<PriceTag amount={stats.outstandingAmount} className="text-xl font-bold" />}
          icon={Inbox}
          color="bg-amber-50 text-amber-600"
          subtitle="غير محصلة"
          onClick={() => handleNavigate('accounting')}
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={<PriceTag amount={stats.totalRevenue} className="text-xl font-bold" />}
          icon={TrendingUp}
          color="bg-indigo-50 text-indigo-600"
          subtitle="كل الحجوزات"
          onClick={() => handleNavigate('accounting')}
        />
        <StatCard
          title="معدل الإشغال"
          value={`${stats.totalHalls > 0 ? Math.round((stats.activeHalls / stats.totalHalls) * 100) : 0}%`}
          icon={Activity}
          color="bg-pink-50 text-pink-600"
          subtitle="نسبة القاعات النشطة"
          onClick={() => handleNavigate('my_halls')}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-bold text-gray-900 mb-4">إجراءات سريعة</h4>
        <div className="grid md:grid-cols-4 gap-3">
          <button
            onClick={() => handleNavigate('my_halls')}
            className="text-right px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold transition-colors text-gray-700 flex justify-between items-center group"
          >
            <span>إدارة القاعات</span>
            <Building2 className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
          </button>
          <button
            onClick={() => handleNavigate('hall_bookings')}
            className="text-right px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold transition-colors text-gray-700 flex justify-between items-center group"
          >
            <span>الحجوزات</span>
            <CalendarCheck className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
          </button>
          <button
            onClick={() => handleNavigate('accounting')}
            className="text-right px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold transition-colors text-gray-700 flex justify-between items-center group"
          >
            <span>الفواتير</span>
            <Banknote className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
          </button>
          <button
            onClick={() => handleNavigate('coupons')}
            className="text-right px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-semibold transition-colors text-gray-700 flex justify-between items-center group"
          >
            <span>الخصومات</span>
            <Clock className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">الأداء المالي</h3>
              <p className="text-xs text-gray-500 mt-1">آخر 6 أشهر</p>
            </div>
          </div>
          <div className="h-[280px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4B0082" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4B0082" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fontSize: 11, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 11, fill: '#9CA3AF'}} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  itemStyle={{color: '#4B0082', fontWeight: 600}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4B0082" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Halls Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">حالة القاعات</h3>
              <p className="text-xs text-gray-500 mt-1">توزيع القاعات النشطة وغير النشطة</p>
            </div>
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-[280px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={hallsPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {hallsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-900">آخر الحجوزات</h4>
                <p className="text-xs text-gray-500 mt-1">آخر 10 حجوزات تمت على أصولك</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleNavigate('hall_bookings')}>
                عرض الكل
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">العميل</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">الأصل</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">المبلغ</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">الحالة</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-gray-500">
                      <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="font-semibold">لا توجد حجوزات</p>
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {booking.guest_name || booking.profiles?.full_name || 'عميل'}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-700">
                          {booking.halls?.name || booking.chalets?.name || '-'}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-gray-900">
                          {Number(booking.total_amount).toLocaleString()} ر.س
                        </p>
                      </td>
                      <td className="p-4">
                        <Badge variant={
                          booking.status === 'confirmed' ? 'success' :
                          booking.status === 'cancelled' ? 'destructive' : 'warning'
                        }>
                          {booking.status === 'confirmed' ? 'مؤكد' :
                           booking.status === 'cancelled' ? 'ملغي' : 'معلق'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-700">
                          {format(new Date(booking.booking_date), 'yyyy/MM/dd')}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Halls */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h4 className="font-bold text-gray-900 mb-4">أكثر القاعات حجزاً</h4>
          <div className="space-y-3">
            {topHalls.length === 0 ? (
              <p className="text-center text-gray-400 font-bold py-8">لا توجد بيانات كافية</p>
            ) : (
              topHalls.map((hall, index) => (
                <div key={hall.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{hall.name}</span>
                  </div>
                  <Badge variant="default">{hall.count} حجز</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
