import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile, Invoice, Expense } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PriceTag } from '../components/ui/PriceTag';
import { Badge } from '../components/ui/Badge';
import { InvoiceModal } from '../components/Invoice/InvoiceModal';
import { ExpenseModal } from '../components/Expense/ExpenseModal';
import {
  FileText, Plus, Download, TrendingUp, TrendingDown,
  Calculator, Receipt, CreditCard, Calendar, Search,
  Banknote, Wallet, PieChart
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface VendorAccountingProps {
  user: UserProfile;
}

export const VendorAccounting: React.FC<VendorAccountingProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'zakat'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    vatCollected: 0,
    vatPaid: 0,
    zakatDue: 0,
    netIncome: 0
  });

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesData, expensesData] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      setInvoices(invoicesData.data || []);
      setExpenses(expensesData.data || []);
      calculateStats(invoicesData.data || [], expensesData.data || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'خطأ', description: 'فشل تحميل البيانات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoices: Invoice[], expenses: Expense[]) => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total_amount, 0);
    const vatCollected = invoices.reduce((sum, inv) => sum + inv.vat_amount, 0);
    const vatPaid = expenses.reduce((sum, exp) => sum + exp.vat_amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    const zakatDue = netIncome > 0 ? netIncome * 0.025 : 0;

    setStats({
      totalRevenue,
      totalExpenses,
      vatCollected,
      vatPaid,
      zakatDue,
      netIncome
    });
  };

  const filteredInvoices = invoices.filter(inv =>
    !searchQuery || inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = expenses.filter(exp =>
    !searchQuery || exp.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
            trend > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">الفواتير والحسابات</h2>
          <p className="text-sm text-gray-500 mt-1">إدارة الفواتير والمصروفات والزكاة</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            فاتورة جديدة
          </Button>
          <Button
            onClick={() => setIsExpenseModalOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            مصروف جديد
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="الإيرادات"
          value={<PriceTag amount={stats.totalRevenue} className="text-xl font-bold" />}
          icon={TrendingUp}
          color="bg-green-50 text-green-600"
          trend={12.5}
        />
        <StatCard
          title="المصروفات"
          value={<PriceTag amount={stats.totalExpenses} className="text-xl font-bold" />}
          icon={TrendingDown}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="صافي الدخل"
          value={<PriceTag amount={stats.netIncome} className="text-xl font-bold" />}
          icon={Wallet}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="ضريبة القيمة المضافة"
          value={<PriceTag amount={stats.vatCollected - stats.vatPaid} className="text-xl font-bold" />}
          icon={Calculator}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="الزكاة المستحقة"
          value={<PriceTag amount={stats.zakatDue} className="text-xl font-bold" />}
          icon={PieChart}
          color="bg-yellow-50 text-yellow-600"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              الفواتير ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'expenses'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              المصروفات ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('zakat')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'zakat'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calculator className="w-4 h-4" />
              الزكاة والضريبة
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="بحث بالفاتورة أو العميل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="p-4">رقم الفاتورة</th>
                      <th className="p-4">العميل</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">المبلغ</th>
                      <th className="p-4">ضريبة القيمة المضافة</th>
                      <th className="p-4">الإجمالي</th>
                      <th className="p-4">حالة الدفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        </td>
                      </tr>
                    ) : filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-gray-400 font-bold">
                          لا توجد فواتير
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <code className="text-sm font-black text-gray-700">{invoice.invoice_number}</code>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-semibold text-gray-900">{invoice.customer_name}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {new Date(invoice.issue_date).toLocaleDateString('ar-SA')}
                            </div>
                          </td>
                          <td className="p-4">
                            <PriceTag amount={invoice.subtotal} className="text-sm font-bold" />
                          </td>
                          <td className="p-4">
                            <PriceTag amount={invoice.vat_amount} className="text-sm font-bold text-gray-600" />
                          </td>
                          <td className="p-4">
                            <PriceTag amount={invoice.total_amount} className="text-sm font-bold text-primary" />
                          </td>
                          <td className="p-4">
                            <Badge variant={invoice.payment_status === 'paid' ? 'success' : 'warning'}>
                              {invoice.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="بحث بالمصروف أو المورد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="p-4">المورد</th>
                      <th className="p-4">التصنيف</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">المبلغ</th>
                      <th className="p-4">ضريبة القيمة المضافة</th>
                      <th className="p-4">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        </td>
                      </tr>
                    ) : filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-gray-400 font-bold">
                          لا توجد مصروفات
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <span className="text-sm font-semibold text-gray-900">{expense.supplier_name}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="default">{expense.category}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {new Date(expense.expense_date).toLocaleDateString('ar-SA')}
                            </div>
                          </td>
                          <td className="p-4">
                            <PriceTag amount={expense.total_amount} className="text-sm font-bold" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'zakat' && (
            <div className="space-y-6">
              {/* Zakat Section */}
              <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-yellow-600" />
                  حساب الزكاة
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">صافي الدخل</p>
                    <p className="text-xl font-black text-gray-900">
                      {stats.netIncome.toFixed(2)} ر.س
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">نسبة الزكاة</p>
                    <p className="text-xl font-black text-gray-900">2.5%</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-yellow-200">
                    <p className="text-xs text-yellow-600 font-bold mb-1">الزكاة المستحقة</p>
                    <p className="text-xl font-black text-yellow-600">
                      {stats.zakatDue.toFixed(2)} ر.س
                    </p>
                  </div>
                </div>
              </div>

              {/* VAT Section */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  ضريبة القيمة المضافة
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">ضريبة محصلة</p>
                    <p className="text-xl font-black text-blue-600">
                      {stats.vatCollected.toFixed(2)} ر.س
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">ضريبة مدفوعة</p>
                    <p className="text-xl font-black text-blue-600">
                      {stats.vatPaid.toFixed(2)} ر.س
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
                    <p className="text-xs text-blue-600 font-bold mb-1">صافي الضريبة المستحقة</p>
                    <p className="text-xl font-black text-blue-600">
                      {(stats.vatCollected - stats.vatPaid).toFixed(2)} ر.س
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-black text-gray-900 mb-4">ملخص الزكاة والضريبة</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-bold text-gray-600">إجمالي الزكاة المستحقة</span>
                    <span className="text-lg font-black text-yellow-600">{stats.zakatDue.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-bold text-gray-600">إجمالي الضريبة المستحقة</span>
                    <span className="text-lg font-black text-blue-600">{(stats.vatCollected - stats.vatPaid).toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="text-sm font-bold text-primary">المجموع الكلي</span>
                    <span className="text-xl font-black text-primary">
                      {(stats.zakatDue + stats.vatCollected - stats.vatPaid).toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={fetchData}
        user={user}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={fetchData}
        user={user}
      />
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
