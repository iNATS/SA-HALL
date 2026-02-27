import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, POSItem, StoreOrder } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { PriceTag } from '../components/ui/PriceTag';
import { ShoppingCart, Package, Search, Plus, Minus, Store, Loader2, Clock, Truck, CheckCircle2, X, ShoppingBag, CreditCard } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

interface VendorMarketplaceProps {
  user: UserProfile;
}

export const VendorMarketplace: React.FC<VendorMarketplaceProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'orders'>('shop');
  const [items, setItems] = useState<POSItem[]>([]);
  const [myOrders, setMyOrders] = useState<StoreOrder[]>([]);
  const [cart, setCart] = useState<{item: POSItem, qty: number}[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 1. Fetch Admin Products
      const { data: adminItems } = await supabase.from('pos_items')
        .select('*, vendor:vendor_id!inner(role)')
        .eq('vendor.role', 'super_admin')
        .gt('stock', 0);
      setItems(adminItems as any[] || []);

      // 2. Fetch My Orders
      const { data: orders } = await supabase.from('store_orders')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });
      setMyOrders(orders as any[] || []);

      setLoading(false);
    };
    fetchData();
  }, [user.id, activeTab]);

  const categories = useMemo(() => {
      const cats = items.map(i => i.category || 'عام');
      return ['الكل', ...Array.from(new Set(cats))];
  }, [items]);

  const filteredItems = useMemo(() => {
      return items.filter(item => {
          const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchCat = selectedCategory === 'الكل' || item.category === selectedCategory;
          return matchSearch && matchCat;
      });
  }, [items, searchQuery, selectedCategory]);

  const addToCart = (item: POSItem) => {
    setCart(prev => {
        const exists = prev.find(i => i.item.id === item.id);
        if (exists) {
            if (exists.qty >= item.stock) return prev;
            return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i);
        }
        return [...prev, { item, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
        if (i.item.id === id) {
            const newQty = Math.max(1, i.qty + delta);
            if (newQty > i.item.stock) return i;
            return { ...i, qty: newQty };
        }
        return i;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.item.id !== id));

  const submitOrder = async () => {
    setSubmitting(true);
    try {
        const total = cart.reduce((sum, i) => sum + (i.item.price * i.qty), 0);
        const orderItems = cart.map(c => ({
            product_id: c.item.id,
            name: c.item.name,
            price: Number(c.item.price),
            qty: c.qty
        }));

        // 1. Create Order
        const { data: newOrder, error } = await supabase.from('store_orders').insert([{
            vendor_id: user.id,
            items: orderItems,
            total_amount: total,
            status: 'pending',
            payment_status: 'pending',
            delivery_status: 'pending'
        }]).select().single();

        if (error) throw error;

        // 2. Deduct Stock
        for (const c of cart) {
            await supabase.from('pos_items')
                .update({ stock: c.item.stock - c.qty })
                .eq('id', c.item.id);
        }

        toast({ title: 'تم الطلب', description: 'تم تقديم طلبك بنجاح', variant: 'success' });
        setCart([]);
        setIsCartOpen(false);
        
        // Refresh data
        const { data: adminItems } = await supabase.from('pos_items')
          .select('*, vendor:vendor_id!inner(role)')
          .eq('vendor.role', 'super_admin')
          .gt('stock', 0);
        setItems(adminItems as any[] || []);
        
        const { data: orders } = await supabase.from('store_orders')
          .select('*')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false });
        setMyOrders(orders as any[] || []);

    } catch (err: any) {
        toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
        setSubmitting(false);
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

  const totalOrders = myOrders.length;
  const pendingOrders = myOrders.filter(o => o.status === 'pending').length;
  const completedOrders = myOrders.filter(o => o.status === 'completed').length;
  const totalSpent = myOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const getDeliveryStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge variant="warning"><Clock className="w-3 h-3 ml-1" /> قيد المعالجة</Badge>;
      case 'processing': return <Badge variant="default"><Truck className="w-3 h-3 ml-1" /> جاري التجهيز</Badge>;
      case 'delivered': return <Badge variant="success"><CheckCircle2 className="w-3 h-3 ml-1" /> تم التوصيل</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">متجر المنصة</h2>
          <p className="text-sm text-gray-500 mt-1">اطلب المنتجات والخدمات من المنصة</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab('shop')}
            className={`gap-2 ${activeTab === 'shop' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            <ShoppingBag className="w-4 h-4" />
            التسوق
          </Button>
          <Button
            onClick={() => setActiveTab('orders')}
            className={`gap-2 ${activeTab === 'orders' ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            <Clock className="w-4 h-4" />
            طلباتي ({myOrders.length})
          </Button>
        </div>
      </div>

      {/* Stats - Only show on shop tab */}
      {activeTab === 'shop' && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="المنتجات المتاحة"
            value={items.length}
            icon={Package}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="إجمالي الطلبات"
            value={totalOrders}
            icon={ShoppingCart}
            color="bg-purple-50 text-purple-600"
          />
          <StatCard
            title="الطلبات المكتملة"
            value={completedOrders}
            icon={CheckCircle2}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            title="إجمالي ما تم صرفه"
            value={<PriceTag amount={totalSpent} className="text-xl font-bold" />}
            icon={CreditCard}
            color="bg-yellow-50 text-yellow-600"
          />
        </div>
      )}

      {activeTab === 'shop' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="بحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10"
                />
              </div>
              <select
                className="h-10 px-4 border border-gray-200 rounded-lg text-sm font-bold bg-white outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl"></div>
              ))
            ) : filteredItems.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg border border-gray-200 p-10 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">لا توجد منتجات</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all flex flex-col">
                  <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center opacity-10">
                        <Package className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant="default">{item.category || 'عام'}</Badge>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <h3 className="font-bold text-base text-gray-900">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <PriceTag amount={item.price} className="text-lg font-bold" />
                      <span className="text-xs text-gray-500 font-bold">متبقي: {item.stock}</span>
                    </div>
                    <Button
                      onClick={() => addToCart(item)}
                      disabled={item.stock <= 0}
                      className="w-full rounded-xl text-sm font-bold"
                    >
                      <ShoppingCart className="w-4 h-4 ml-2" />
                      {item.stock > 0 ? 'أضف للسلة' : 'نفذت الكمية'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
              <tr>
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">المنتجات</th>
                <th className="p-4">الإجمالي</th>
                <th className="p-4">حالة الطلب</th>
                <th className="p-4">التوصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : myOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                myOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <code className="text-sm font-black text-gray-700">#{order.id.substring(0, 8)}</code>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {format(new Date(order.created_at), 'yyyy/MM/dd')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-700">
                        {order.items?.length || 0} منتجات
                      </div>
                    </td>
                    <td className="p-4">
                      <PriceTag amount={order.total_amount} className="text-sm font-bold" />
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        order.status === 'completed' ? 'success' :
                        order.status === 'cancelled' ? 'destructive' : 'warning'
                      }>
                        {order.status === 'completed' ? 'مكتمل' :
                         order.status === 'cancelled' ? 'ملغي' : 'قيد المعالجة'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {getDeliveryStatusBadge(order.delivery_status || 'pending')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cart Modal */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title="سلة التسوق"
      >
        <div className="space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
              السلة فارغة
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.item.name}</h4>
                      <div className="text-xs text-gray-500">
                        <PriceTag amount={item.item.price} className="text-xs" /> × {item.qty}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.item.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-gray-600">الإجمالي</span>
                  <PriceTag amount={cart.reduce((sum, i) => sum + (i.item.price * i.qty), 0)} className="text-xl font-black text-primary" />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={submitOrder}
                    disabled={submitting || cart.length === 0}
                    className="flex-1 h-12"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الطلب'}
                  </Button>
                  <Button
                    onClick={() => setIsCartOpen(false)}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
