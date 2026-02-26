import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Booking } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PriceTag } from '../components/ui/PriceTag';
import { EditBookingDetailsModal } from '../components/Booking/EditBookingDetailsModal';
import { AddBookingModal } from '../components/Booking/AddBookingModal';
import {
  Search, Plus, Inbox, CheckCircle2, Clock, CalendarCheck,
  Building2, Filter, XCircle, Calendar, User, CreditCard
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface VendorBookingsProps {
  user: UserProfile;
}

export const VendorBookings: React.FC<VendorBookingsProps> = ({ user }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    paidAmount: 0
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          halls:hall_id (name, city),
          chalets:chalet_id (name, city),
          client:user_id (full_name, email, phone_number),
          services:service_id (name)
        `)
        .eq('vendor_id', user.id)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setBookings(data as any[] || []);
    } catch (err: any) {
      toast({ title: 'خطأ', description: 'فشل في تحميل الحجوزات.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user.id, toast]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Calculate stats
  useEffect(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const revenue = bookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    const paid = bookings.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);

    setStats({
      totalBookings: total,
      confirmedBookings: confirmed,
      pendingBookings: pending,
      cancelledBookings: cancelled,
      totalRevenue: revenue,
      paidAmount: paid
    });
  }, [bookings]);

  const filteredBookings = bookings.filter(b => {
    const searchTerm = b.guest_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                      b.client?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                      b.id?.includes(filters.search) ||
                      b.halls?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                      b.chalets?.name?.toLowerCase().includes(filters.search.toLowerCase());

    const matchStatus = filters.status === 'all' || b.status === filters.status;

    let matchDate = true;
    if (filters.dateFrom && filters.dateTo) {
      const bookingDate = parseISO(b.booking_date);
      const start = startOfDay(parseISO(filters.dateFrom));
      const end = endOfDay(parseISO(filters.dateTo));
      matchDate = isWithinInterval(bookingDate, { start, end });
    }

    return matchStatus && matchDate && (filters.search ? searchTerm : true);
  });

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">سجل الحجوزات</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة ومتابعة كافة الحجوزات</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          حجز جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title="إجمالي الحجوزات"
          value={stats.totalBookings}
          icon={Inbox}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="مؤكدة"
          value={stats.confirmedBookings}
          icon={CheckCircle2}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="معلقة"
          value={stats.pendingBookings}
          icon={Clock}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="ملغاة"
          value={stats.cancelledBookings}
          icon={XCircle}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={<PriceTag amount={stats.totalRevenue} className="text-xl font-bold" />}
          icon={CreditCard}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="المحصّل"
          value={<PriceTag amount={stats.paidAmount} className="text-xl font-bold" />}
          icon={CalendarCheck}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث بالعميل، رقم الحجز، المكان..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pr-10 h-10"
            />
          </div>
          <select
            className="h-10 px-4 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">كل الحالات</option>
            <option value="pending">معلق</option>
            <option value="confirmed">مؤكد</option>
            <option value="cancelled">ملغي</option>
          </select>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="h-10"
            placeholder="من تاريخ"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="h-10"
            placeholder="إلى تاريخ"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
            <tr>
              <th className="p-4">رقم الحجز</th>
              <th className="p-4">العميل</th>
              <th className="p-4">المكان</th>
              <th className="p-4">التاريخ</th>
              <th className="p-4">المبلغ</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">الدفع</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-10 text-center">
                  <Clock className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-gray-400 font-bold">
                  لا توجد حجوزات
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <code className="text-sm font-black text-gray-700">#{booking.id?.substring(0, 8)}</code>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {booking.guest_name || booking.client?.full_name || 'عميل'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {booking.halls?.name || booking.chalets?.name || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(booking.booking_date), 'dd MMM yyyy', { locale: arSA })}
                    </div>
                  </td>
                  <td className="p-4">
                    <PriceTag amount={booking.total_amount} className="text-sm font-bold" />
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
                    <span className={`text-xs font-bold ${
                      booking.payment_status === 'paid' ? 'text-green-600' :
                      booking.payment_status === 'partial' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {booking.payment_status === 'paid' ? 'مدفوع' :
                       booking.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        عرض
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedBooking && (
        <EditBookingDetailsModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onSuccess={fetchBookings}
        />
      )}
      <AddBookingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        vendorId={user.id}
        onSuccess={fetchBookings}
      />
    </div>
  );
};
