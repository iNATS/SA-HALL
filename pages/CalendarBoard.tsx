import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Booking } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { PriceTag } from '../components/ui/PriceTag';
import { AddBookingModal } from '../components/Booking/AddBookingModal';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Edit, List, Grid3X3, Users, Filter, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useToast } from '../context/ToastContext';

interface CalendarBoardProps {
  user: UserProfile;
}

export const CalendarBoard: React.FC<CalendarBoardProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assets, setAssets] = useState<{id: string, name: string, type: string}[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Partial<Booking> | null>(null);
  const { toast } = useToast();

  // Fetch Assets
  useEffect(() => {
      const fetchAssets = async () => {
          const [halls, chalets] = await Promise.all([
              supabase.from('halls').select('id, name, type').eq('vendor_id', user.id),
              supabase.from('chalets').select('id, name, type').eq('vendor_id', user.id)
          ]);
          setAssets([...(halls.data || []).map(h => ({...h, type: 'hall'})), ...(chalets.data || []).map(c => ({...c, type: 'chalet'}))]);
      };
      fetchAssets();
  }, [user.id]);

  const fetchCalendarData = async () => {
    setLoading(true);
    const firstDay = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const lastDay = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    let query = supabase.from('bookings')
        .select('*, profiles:user_id(full_name), halls(name), chalets(name)')
        .eq('vendor_id', user.id)
        .gte('booking_date', firstDay)
        .lte('booking_date', lastDay);

    if (selectedAsset !== 'all') {
        query = query.or(`hall_id.eq.${selectedAsset},chalet_id.eq.${selectedAsset}`);
    }

    if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setBookings(data as any[] || []);
    setLoading(false);
  };

  useEffect(() => { fetchCalendarData(); }, [currentDate, selectedAsset, statusFilter]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDayClick = (day: Date) => {
    const existing = bookings.find(b => isSameDay(new Date(b.booking_date), day));
    if (existing) {
      setSelectedBooking(existing);
    } else {
      setSelectedBooking({
          booking_date: format(day, 'yyyy-MM-dd'),
          status: 'confirmed',
          vendor_id: user.id,
          hall_id: selectedAsset !== 'all' ? selectedAsset : (assets.find(a => a.type === 'hall')?.id || '')
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedBooking?.hall_id && !selectedBooking?.chalet_id) {
      toast({ title: 'خطأ', description: 'يرجى اختيار القاعة/الشاليه.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const targetId = selectedBooking.hall_id;
    let finalPayload: any = { ...selectedBooking };

    const { data: isHall } = await supabase.from('halls').select('id').eq('id', targetId).maybeSingle();
    if(isHall) {
        finalPayload.hall_id = targetId;
        finalPayload.chalet_id = null;
    } else {
        finalPayload.chalet_id = targetId;
        finalPayload.hall_id = null;
    }

    if (selectedBooking.id) {
        const { error } = await supabase.from('bookings').update(finalPayload).eq('id', selectedBooking.id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('bookings').insert([finalPayload]);
        if (error) throw error;
    }

    toast({ title: 'تم الحفظ', description: 'تم حفظ الحجز بنجاح.', variant: 'success' });
    setIsModalOpen(false);
    fetchCalendarData();
    setLoading(false);
  };

  const handleDelete = async (booking: Booking) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحجز؟')) return;
    setLoading(true);
    await supabase.from('bookings').delete().eq('id', booking.id);
    toast({ title: 'تم الحذف', description: 'تم حذف الحجز بنجاح.', variant: 'success' });
    fetchCalendarData();
    setLoading(false);
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter(b => isSameDay(new Date(b.booking_date), day));
  };

  const getStatusBadge = (status: string) => {
      const validStatus = ['confirmed', 'pending', 'cancelled'].includes(status) ? status : 'pending';
      switch(validStatus) {
          case 'confirmed': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700"><CheckCircle2 className="w-3 h-3" /> مؤكد</span>;
          case 'pending': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3" /> انتظار</span>;
          case 'cancelled': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700"><XCircle className="w-3 h-3" /> ملغي</span>;
          default: return <span className="text-xs">{status}</span>;
      }
  };

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

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التقويم</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة الحجوزات حسب التقويم</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> حجز جديد
          </Button>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="إجمالي الحجوزات"
          value={totalBookings}
          icon={CalendarDays}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="حجوزات مؤكدة"
          value={confirmedBookings}
          icon={CheckCircle2}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="حجوزات معلقة"
          value={pendingBookings}
          icon={Clock}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="الأصول"
          value={assets.length}
          icon={Users}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4 items-center">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="w-10 h-10">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-bold text-lg min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: arSA })}
          </h3>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-10 h-10">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="flex-1" />
          <select
            className="h-10 px-4 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none"
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
          >
            <option value="all">كل الأصول</option>
            {assets.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select
            className="h-10 px-4 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="pending">معلق</option>
            <option value="confirmed">مؤكد</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
              <div key={day} className="p-3 text-center text-xs font-bold text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayBookings = getBookingsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[120px] border-b border-r border-gray-100 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !isCurrentMonth ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                      isTodayDate ? 'bg-primary text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map(booking => (
                      <div
                        key={booking.id}
                        className={`text-[10px] p-1.5 rounded border truncate font-bold ${
                          booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                          booking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {booking.guest_name || booking.profiles?.full_name || 'عميل'}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-gray-500 font-bold text-center">
                        +{dayBookings.length - 3} المزيد
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
              <tr>
                <th className="p-4">التاريخ</th>
                <th className="p-4">العميل</th>
                <th className="p-4">الأصل</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">المبلغ</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                    لا توجد حجوزات في هذا الشهر
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        {format(parseISO(booking.booking_date), 'dd MMM yyyy', { locale: arSA })}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {booking.guest_name || booking.profiles?.full_name || 'عميل'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-700">
                        {booking.halls?.name || booking.chalets?.name || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="p-4">
                      <PriceTag amount={booking.total_amount} className="text-sm font-bold" />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(booking)}
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
      )}

      {/* Edit Modal */}
      {isModalOpen && selectedBooking && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBooking(null);
          }}
          title={selectedBooking.id ? 'تعديل الحجز' : 'إضافة حجز'}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">الأصل</label>
              <select
                className="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-bold bg-white outline-none"
                value={selectedBooking.hall_id || selectedBooking.chalet_id || ''}
                onChange={(e) => setSelectedBooking({ ...selectedBooking, hall_id: e.target.value })}
              >
                <option value="">اختر الأصل</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">تاريخ الحجز</label>
              <Input
                type="date"
                value={selectedBooking.booking_date || ''}
                onChange={(e) => setSelectedBooking({ ...selectedBooking, booking_date: e.target.value })}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">اسم الضيف</label>
              <Input
                type="text"
                value={selectedBooking.guest_name || ''}
                onChange={(e) => setSelectedBooking({ ...selectedBooking, guest_name: e.target.value })}
                className="h-12"
                placeholder="اسم الضيف"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">الحالة</label>
              <select
                className="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm font-bold bg-white outline-none"
                value={selectedBooking.status || 'pending'}
                onChange={(e) => setSelectedBooking({ ...selectedBooking, status: e.target.value as 'pending' | 'confirmed' | 'cancelled' })}
              >
                <option value="pending">معلق</option>
                <option value="confirmed">مؤكد</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={loading} className="flex-1 h-12">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
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
      )}

      {/* Add Booking Modal */}
      <AddBookingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        vendorId={user.id}
        onSuccess={fetchCalendarData}
      />
    </div>
  );
};
