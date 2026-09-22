import React, { useState } from 'react';
import {
  Users,
  Package,
  FileText,
  Receipt,
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Send,
  CreditCard,
  Truck,
  BookOpen,
  Settings,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  BarChart3,
  Percent,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { formatCurrency, formatDate } from '../utils/calculator';
import { NavSection } from './Navbar';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MessageSquare, Mail } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (section: NavSection) => void;
  onOpenNewClient: () => void;
  onOpenNewProduct: () => void;
  onOpenNewQuote: () => void;
  onOpenNewInvoice: () => void;
  onOpenPaymentForInvoice: (invoiceId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewClient,
  onOpenNewProduct,
  onOpenNewQuote,
  onOpenNewInvoice,
  onOpenPaymentForInvoice,
}) => {
  const { user, clients, products, quotes, invoices, payments, activities, companySettings, shippingRates, knowledge: knowledgeBase } = useApp();
  
  const [whatsappUnread, setWhatsappUnread] = useState(0);
  const [emailUnread, setEmailUnread] = useState(0);

  React.useEffect(() => {
    if (!user) return;

    const qW = query(collection(db, 'whatsapp_conversations'), where('unreadCount', '>', 0));
    const uW = onSnapshot(qW, snap => setWhatsappUnread(snap.docs.reduce((acc, doc) => acc + (doc.data().unreadCount || 0), 0)));
    
    const qE = query(collection(db, 'email_conversations'), where('unreadCount', '>', 0));
    const uE = onSnapshot(qE, snap => setEmailUnread(snap.docs.reduce((acc, doc) => acc + (doc.data().unreadCount || 0), 0)));
    
    return () => { uW(); uE(); };
  }, [user]);


  // Metrics Calculations
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'Active').length;

  const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const quotesThisMonth = quotes.filter((q) => q.quoteDate?.startsWith(thisMonth)).length;
  const pendingQuotes = quotes.filter((q) => q.status === 'Sent' || q.status === 'Draft').length;
  const acceptedQuotes = quotes.filter((q) => q.status === 'Accepted' || q.status === 'Converted').length;
  const quoteConversionRate = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0;

  const invoicesThisMonth = invoices.filter((i) => i.invoiceDate?.startsWith(thisMonth)).length;
  const outstandingInvoices = invoices.filter((i) => i.status !== 'Paid' && i.balanceDue > 0);
  const totalOutstandingBalance = outstandingInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  const paidInvoices = invoices.filter((i) => i.status === 'Paid').length;
  const totalSales = invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
  const totalInvoicedValue = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  // Top products calculation from line items
  const productSalesMap: Record<string, { name: string; qty: number; total: number }> = {};
  invoices.forEach((inv) => {
    inv.items?.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, qty: 0, total: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].total += item.lineTotal;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  // Monthly revenue calculation from invoices
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().substring(0, 7);
  }).reverse();

  const monthlyRevenueData = last6Months.map(month => {
    const monthName = new Date(month + '-01').toLocaleString('default', { month: 'short' });
    const amount = invoices
      .filter(inv => inv.invoiceDate?.startsWith(month))
      .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    
    // Default targets or 0 if no data
    const target = 100000; 
    return { 
      month: month === thisMonth ? 'Current' : monthName, 
      amount, 
      target 
    };
  });

  const maxRevenueVal = Math.max(...monthlyRevenueData.map((d) => Math.max(d.amount, d.target)), 100000) * 1.15;

  return (
    <div className="space-y-4 font-mono">
      {/* Welcome & Ask AI High-Density Banner */}
      <div className="bg-gradient-to-r from-[#0F141F] via-[#141B2B] to-[#0D1C18] rounded-xl p-4 sm:p-5 text-white border-l-4 border-l-[#EAB308] border-t border-r border-b border-[#1F293D] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#EAB308]/5 skew-x-12 transform origin-top-right pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#EAB308] text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#EAB308] animate-ping"></span>
              <Sparkles className="w-3.5 h-3.5" />
              <span>EXECUTIVE TELEMETRY & BUSINESS TERMINAL</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight uppercase">
              {companySettings.companyName || 'Healthy Fields & ProAgriSA'}
            </h1>
            <p className="text-xs font-mono text-[#9CA3AF] mt-1 max-w-xl border-t border-[#1F293D] pt-1">
              Dragon fruit cultivar catalog, wholesale tiering, cross-border road logistics, and AI invoice automation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="dash-hero-ask-ai-btn"
              onClick={() => onNavigate('ai-assistant')}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#EAB308] hover:bg-[#FACC15] text-black font-mono font-bold text-xs sm:text-sm rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-yellow-200/40"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>ASK AI BUSINESS COPILOT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Large Prominent Quick-Action Buttons (All 8 Modules Direct Link) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <button
          id="dash-quick-clients"
          onClick={() => onNavigate('clients')}
          className="flex flex-col items-center justify-center p-2.5 bg-[#11141D] rounded-xl border border-[#1F2430] hover:border-[#EAB308]/50 hover:bg-[#161B28] text-[#E5E7EB] transition-all shadow-sm group"
        >
          <div className="p-2 rounded-lg bg-yellow-950/80 text-[#EAB308] border border-yellow-700/40 group-hover:bg-#EAB308 group-hover:text-black transition-colors mb-1.5">
            <Users className="w-4 h-4" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-tight">Clients</span>
          <span className="text-[9px] text-[#6B7280]">{clients.length} records</span>
        </button>

        <button
          id="dash-quick-products"
          onClick={() => onNavigate('products')}
          className="flex flex-col items-center justify-center p-2.5 bg-[#11141D] rounded-xl border border-[#1F2430] hover:border-[#EAB308]/50 hover:bg-[#161B28] text-[#E5E7EB] transition-all shadow-sm group"
        >
          <div className="p-2 rounded-lg bg-yellow-950/80 text-[#EAB308] border border-yellow-700/40 group-hover:bg-#EAB308 group-hover:text-black transition-colors mb-1.5">
            <Package className="w-4 h-4" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-tight">Products</span>
          <span className="text-[9px] text-[#6B7280]">{products.length} items</span>
        </button>

        <button
          id="dash-quick-quotes"
          onClick={() => onNavigate('quotes')}
          className="flex flex-col items-center justify-center p-2.5 bg-[#11141D] rounded-xl border border-[#1F2430] hover:border-[#EAB308]/50 hover:bg-[#161B28] text-[#E5E7EB] transition-all shadow-sm group"
        >
          <div className="p-2 rounded-lg bg-yellow-950/80 text-[#EAB308] border border-yellow-700/40 group-hover:bg-#EAB308 group-hover:text-black transition-colors mb-1.5">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-tight">Quotes</span>
          <span className="text-[9px] text-[#6B7280]">{quotes.length} quotes</span>
        </button>

        <button
          id="dash-quick-invoices"
          onClick={() => onNavigate('invoices')}
          className="flex flex-col items-center justify-center p-2.5 bg-[#11141D] rounded-xl border border-[#1F2430] hover:border-[#EAB308]/50 hover:bg-[#161B28] text-[#E5E7EB] transition-all shadow-sm group"
        >
          <div className="p-2 rounded-lg bg-yellow-950/80 text-[#EAB308] border border-yellow-700/40 group-hover:bg-#EAB308 group-hover:text-black transition-colors mb-1.5">
            <Receipt className="w-4 h-4" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-tight">Invoices</span>
          <span className="text-[9px] text-[#6B7280]">{invoices.length} invoices</span>
        </button>

        <button
          id="dash-quick-shipping"
          onClick={() => onNavigate('shipping')}
          className="flex flex-col items-center justify-center p-2.5 bg-[#11141D] rounded-xl border border-[#1F2430] hover:border-[#EAB308]/50 hover:bg-[#161B28] text-[#E5E7EB] transition-all shadow-sm group"
        >
          <div className="p-2 rounded-lg bg-yellow-950/80 text-[#EAB308] border border-yellow-700/40 group-hover:bg-#EAB308 group-hover:text-black transition-colors mb-1.5">
            <Truck className="w-4 h-4" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-tight">Shipping</span>
          <span className="text-[9px] text-[#6B7280]">{shippingRates.length} routes</span>
        </button>

        <button
          id="dash-quick-ai"
          onClick={() => onNavigate('ai-assistant')}
          className="flex flex-col items-center justify-center p-2.5 bg-[#EAB308]/10 rounded-xl border border-[#EAB308]/40 hover:border-[#EAB308] hover:bg-[#EAB308]/20 text-[#EAB308] transition-all shadow-sm group"
        >
          <div className="p-2 rounded-lg bg-[#EAB308]/20 text-[#EAB308] group-hover:bg-[#EAB308] group-hover:text-black transition-colors mb-1.5">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-tight">AI Assistant</span>
          <span className="text-[9px] text-[#EAB308]">Copilot</span>
        </button>

        <button
          id="dash-quick-knowledge"
          onClick={() => onNavigate('knowledge')}
          className="flex flex-col items-center justify-center p-2.5 bg-[#11141D] rounded-xl border border-[#1F2430] hover:border-[#EAB308]/50 hover:bg-[#161B28] text-[#E5E7EB] transition-all shadow-sm group"
        >
          <div className="p-2 rounded-lg bg-yellow-950/80 text-[#EAB308] border border-yellow-700/40 group-hover:bg-#EAB308 group-hover:text-black transition-colors mb-1.5">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-tight">Knowledge</span>
          <span className="text-[9px] text-[#6B7280]">{knowledgeBase.length} articles</span>
        </button>

        <button
          id="dash-quick-settings"
          onClick={() => onNavigate('company-settings')}
          className="flex flex-col items-center justify-center p-2.5 bg-[#11141D] rounded-xl border border-[#1F2430] hover:border-[#EAB308]/50 hover:bg-[#161B28] text-[#E5E7EB] transition-all shadow-sm group"
        >
          <div className="p-2 rounded-lg bg-yellow-950/80 text-[#EAB308] border border-yellow-700/40 group-hover:bg-#EAB308 group-hover:text-black transition-colors mb-1.5">
            <Settings className="w-4 h-4" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-tight">Settings</span>
          <span className="text-[9px] text-[#6B7280]">Profile & Tax</span>
        </button>
      </div>

      {/* KPI Stats Grid with Sleek Visuals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sales Paid (CREDIT) */}
        <div className="bg-[#11141D] p-4 rounded-xl border-t border-r border-b border-[#1F2430] border-l-4 border-l-#EAB308 shadow-sm relative overflow-hidden group hover:border-[#EAB308]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider">Total Sales Paid</span>
            <div className="p-2 bg-yellow-950/80 text-[#EAB308] border border-yellow-800/40 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#EAB308] mt-2 font-mono">
            {formatCurrency(totalSales, companySettings.defaultCurrency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-[#EAB308] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#EAB308]" />
              <span>{paidInvoices} settled</span>
            </span>
          </div>
        </div>

        {/* Outstanding Invoices (DEBIT) */}
        <div className="bg-[#11141D] p-4 rounded-xl border-t border-r border-b border-[#1F2430] border-l-4 border-l-rose-500 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider">Outstanding Balances</span>
            <div className="p-2 bg-rose-950/80 text-rose-400 border border-rose-800/40 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-400 mt-2 font-mono">
            {formatCurrency(totalOutstandingBalance, companySettings.defaultCurrency)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-rose-400/90 font-semibold">
              {outstandingInvoices.length} accounts
            </span>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-rose-400 hover:underline flex items-center gap-0.5"
            >
              Resolve <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Quote Performance */}
        <div className="bg-[#11141D] p-4 rounded-xl border-t border-r border-b border-[#1F2430] border-l-4 border-l-cyan-500 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider">Quote Conversion</span>
            <div className="p-2 bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2 font-mono text-cyan-400">
            <span className="text-xl sm:text-2xl font-bold">{quoteConversionRate}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#9CA3AF]">
            <span>{acceptedQuotes} wins</span>
            <span className="text-cyan-400">+{quotesThisMonth} mo</span>
          </div>
        </div>

        {/* Client CRM Base */}
        <div className="bg-[#11141D] p-4 rounded-xl border-t border-r border-b border-[#1F2430] border-l-4 border-l-[#EAB308] shadow-sm relative overflow-hidden group hover:border-[#EAB308]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider">Client CRM Base</span>
            <div className="p-2 bg-yellow-950/80 text-[#EAB308] border border-yellow-800/40 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2 font-mono text-[#EAB308]">
            <span className="text-xl sm:text-2xl font-bold">{activeClients}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#9CA3AF]">
            <span>{totalClients} total</span>
            <button
              onClick={() => onNavigate('clients')}
              className="text-[#EAB308] hover:underline flex items-center gap-0.5"
            >
              Open <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Communications */}
        <div className="bg-[#11141D] p-4 rounded-xl border-t border-r border-b border-[#1F2430] border-l-4 border-l-#EAB308 shadow-sm relative overflow-hidden group hover:border-[#EAB308]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider">WhatsApp Comms</span>
            <div className="p-2 bg-yellow-950/80 text-[#EAB308] border border-yellow-800/40 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2 font-mono text-[#EAB308]">
            <span className="text-xl sm:text-2xl font-bold">{whatsappUnread}</span>
            <span className="text-xs font-bold uppercase tracking-tighter">Unread</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#9CA3AF]">
            <span>Business Inbox</span>
            <button
              onClick={() => onNavigate('whatsapp-inbox')}
              className="text-[#EAB308] hover:underline flex items-center gap-0.5"
            >
              Open <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Email Communications */}
        <div className="bg-[#11141D] p-4 rounded-xl border-t border-r border-b border-[#1F2430] border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#9CA3AF] uppercase tracking-wider">Email Queue</span>
            <div className="p-2 bg-blue-950/80 text-blue-400 border border-blue-800/40 rounded-lg">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2 font-mono text-blue-400">
            <span className="text-xl sm:text-2xl font-bold">{emailUnread}</span>
            <span className="text-xs font-bold uppercase tracking-tighter">Unread</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#9CA3AF]">
            <span>Support & Sales</span>
            <button
              onClick={() => onNavigate('email-inbox')}
              className="text-blue-400 hover:underline flex items-center gap-0.5"
            >
              Open <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Monthly Revenue & Target Performance Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-[#11141D] rounded-xl border border-[#1F2430] p-4.5 space-y-4 shadow-sm border-t-[#EAB308]/30 border-t-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2430] pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#EAB308]" />
                <h3 className="font-bold text-sm text-white uppercase tracking-tight">Revenue & Sales Telemetry (ZAR)</h3>
              </div>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5 uppercase tracking-wide">
                Monthly billed turnover vs target performance across agricultural products.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-[10px] uppercase font-bold">
              <span className="flex items-center gap-1.5 text-[#EAB308]">
                <span className="w-3 h-3 rounded bg-[#EAB308]" /> Billed
              </span>
              <span className="flex items-center gap-1.5 text-[#EAB308]">
                <span className="w-3 h-1 rounded bg-[#EAB308]" /> Target
              </span>
            </div>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="pt-2 pb-1">
            <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-48 border-b border-[#1F2430] pb-2">
              {monthlyRevenueData.map((data, index) => {
                const heightPercent = Math.min(100, Math.round((data.amount / maxRevenueVal) * 100));
                const targetPercent = Math.min(100, Math.round((data.target / maxRevenueVal) * 100));
                const isCurrent = data.month === 'Current';

                return (
                  <div key={index} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-[#0A0B0E] text-white text-[10px] py-1 px-2 rounded border border-[#EAB308]/40 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                      <span className="font-bold">{data.month}:</span> {formatCurrency(data.amount, 'ZAR')}
                    </div>

                    {/* Bar Container */}
                    <div className="w-full max-w-[38px] bg-[#161B28] rounded-t-sm relative flex items-end justify-center h-full overflow-hidden">
                      {/* Target line indicator */}
                      <div
                        className="absolute w-full border-t-2 border-[#EAB308] z-10 opacity-60"
                        style={{ bottom: `${targetPercent}%` }}
                      />
                      {/* Actual Fill */}
                      <div
                        className={`w-full transition-all duration-500 rounded-t-sm ${
                          isCurrent
                            ? 'bg-gradient-to-t from-yellow-700 to-#EAB308 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : 'bg-[#EAB308]/80'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    <span className="text-[10px] text-[#9CA3AF] mt-2 font-bold uppercase tracking-tighter">
                      {data.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Footer */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 bg-[#0A0B0E] rounded-lg border border-[#1F2430]">
              <span className="text-[9px] text-[#6B7280] uppercase block font-bold">Lifetime Invoiced</span>
              <span className="font-bold text-white text-[11px]">
                {formatCurrency(totalInvoicedValue, companySettings.defaultCurrency)}
              </span>
            </div>
            <div className="p-2 bg-[#0A0B0E] rounded-lg border border-[#1F2430]">
              <span className="text-[9px] text-[#6B7280] uppercase block font-bold">Collection Rate</span>
              <span className="font-bold text-[#EAB308] text-[11px]">
                {totalInvoicedValue > 0 ? Math.round((totalSales / totalInvoicedValue) * 100) : 100}%
              </span>
            </div>
            <div className="p-2 bg-[#0A0B0E] rounded-lg border border-[#1F2430]">
              <span className="text-[9px] text-[#6B7280] uppercase block font-bold">Avg Order Value</span>
              <span className="font-bold text-cyan-400 text-[11px]">
                {invoices.length > 0 ? formatCurrency(totalInvoicedValue / invoices.length, companySettings.defaultCurrency) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Top Performing Cultivars & Farm Inputs (4 Cols) */}
        <div className="lg:col-span-4 bg-[#11141D] rounded-xl border border-[#1F2430] p-4.5 space-y-3.5 shadow-sm border-t-[#EAB308]/30 border-t-2">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-2.5">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-[#EAB308]" />
              <h3 className="font-bold text-sm text-white uppercase tracking-tight">Top Plant Cultivars</h3>
            </div>
          </div>

          <div className="space-y-3">
            {products.slice(0, 4).map((p, idx) => (
              <div key={p.id} className="p-2.5 bg-[#0A0B0E] rounded-lg border border-[#1F2430] space-y-1.5 hover:border-[#EAB308]/30 transition-colors">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white uppercase line-clamp-1">{p.name}</span>
                  <span className="font-mono text-[#EAB308] font-bold">
                    {formatCurrency(p.standardPrice, p.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-[#9CA3AF] uppercase font-bold">
                  <span>{p.sku}</span>
                  <span className="px-1.5 py-0.5 bg-yellow-950/50 rounded text-[#EAB308] border border-yellow-800/30">
                    {p.category}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* SADC Logistics & Cross-Border Summary Banner */}
          <div className="p-3 bg-gradient-to-r from-[#121E19] to-[#151B27] rounded-lg border border-yellow-700/40 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-[#EAB308] font-bold uppercase tracking-tighter">
              <Truck className="w-3.5 h-3.5" />
              <span>SADC Cross-Border Logistics</span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] uppercase leading-relaxed">
              Configured for Namibia, Botswana, Zimbabwe & regional phyto clearance.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Outstanding Invoices & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Outstanding Invoices Focus Panel (2 Cols) */}
        <div className="lg:col-span-2 bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-2.5">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-[#EAB308]" />
              <h2 className="font-mono font-bold text-white text-sm">Outstanding & Overdue Invoices</h2>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-mono text-[#EAB308] hover:text-yellow-200 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {outstandingInvoices.length === 0 ? (
            <div className="py-6 text-center text-[#6B7280]">
              <CheckCircle2 className="w-8 h-8 text-[#EAB308] mx-auto mb-1.5" />
              <p className="font-mono text-xs font-semibold text-white">All invoices are settled!</p>
              <p className="font-mono text-[11px] text-[#6B7280]">No outstanding client balances at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A202C]">
              {outstandingInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#161B28] px-2 rounded-lg transition-colors font-mono"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-white">{inv.invoiceNumber}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                          inv.status === 'Partially Paid'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#D1D5DB]">{inv.clientSnapshot?.companyName}</p>
                    <p className="text-[10px] text-[#6B7280]">
                      Due: {formatDate(inv.dueDate)} • Total: {formatCurrency(inv.grandTotal, inv.currency)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3">
                    <div className="text-right">
                      <span className="text-[9px] text-[#6B7280] uppercase block">Balance Due</span>
                      <span className="font-mono font-bold text-xs text-rose-400">
                        {formatCurrency(inv.balanceDue, inv.currency)}
                      </span>
                    </div>

                    <button
                      id={`dash-pay-btn-${inv.id}`}
                      onClick={() => onOpenPaymentForInvoice(inv.id)}
                      className="px-2.5 py-1 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-semibold rounded transition-colors flex items-center space-x-1 shadow-sm"
                    >
                      <CreditCard className="w-3 h-3 text-black" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Feed (1 Col) */}
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-2.5">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#EAB308]" />
              <h2 className="font-mono font-bold text-white text-sm">System Event Log</h2>
            </div>
          </div>

          <div className="space-y-2.5">
            {activities.slice(0, 6).map((act) => (
              <div key={act.id} className="flex items-start space-x-2.5 text-xs font-mono">
                <div className="mt-0.5 p-1 rounded bg-[#1A202C] text-[#EAB308] border border-[#2D3748]">
                  {act.type.includes('payment') ? (
                    <DollarSign className="w-3 h-3" />
                  ) : act.type.includes('quote') ? (
                    <FileText className="w-3 h-3" />
                  ) : act.type.includes('invoice') ? (
                    <Receipt className="w-3 h-3" />
                  ) : (
                    <Users className="w-3 h-3" />
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="font-semibold text-[#E5E7EB] text-[11px]">{act.title}</p>
                  <p className="text-[#9CA3AF] text-[10px] leading-relaxed">{act.description}</p>
                  <span className="text-[9px] text-[#6B7280] block">{formatDate(act.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
