import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Mail,
  MessageSquare,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  DollarSign,
  Building,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { Invoice, InvoiceStatus, DocumentLineItem, Client, Product } from '../types';
import {
  formatCurrency,
  formatDate,
  resolveClientProductPrice,
  calculateLineItem,
  calculateDocumentTotals,
} from '../utils/calculator';
import { generateInvoicePDF } from '../utils/pdfGenerator';

interface InvoicesViewProps {
  onOpenEmailModal: (invoice: Invoice) => void;
  onOpenWhatsAppModal: (invoice: Invoice) => void;
  onOpenPaymentModal: (invoice: Invoice) => void;
  initialNewInvoiceClient?: Client | null;
  onClearInitialClient?: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onOpenEmailModal,
  onOpenWhatsAppModal,
  onOpenPaymentModal,
  initialNewInvoiceClient,
  onClearInitialClient,
}) => {
  const {
    invoices,
    clients,
    products,
    shippingRates,
    companySettings,
    addInvoice,
    updateInvoice,
    deleteInvoice,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);

  // Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<{
    id?: string;
    clientId: string;
    invoiceDate: string;
    dueDate: string;
    items: DocumentLineItem[];
    shippingCost: number;
    shippingDetails: string;
    vatRate: number;
    amountPaid: number;
    notes: string;
    terms: string;
    status: InvoiceStatus;
  } | null>(null);

  // Trigger add invoice from outside if initial client provided
  React.useEffect(() => {
    if (initialNewInvoiceClient) {
      handleOpenCreateWithClient(initialNewInvoiceClient);
      onClearInitialClient?.();
    }
  }, [initialNewInvoiceClient]);

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.clientSnapshot?.companyName?.toLowerCase().includes(query) ||
      inv.clientSnapshot?.contactPerson?.toLowerCase().includes(query);
    const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreateWithClient = (client: Client) => {
    const today = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 14);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const defaultShip = shippingRates.find((s) => s.destinationCountry.toLowerCase() === client.country.toLowerCase());

    setEditingInvoice({
      clientId: client.id,
      invoiceDate: today,
      dueDate,
      items: [],
      shippingCost: defaultShip?.cost || 0,
      shippingDetails: defaultShip ? `${defaultShip.shippingMethod} (${defaultShip.destinationCountry})` : '',
      vatRate: companySettings.defaultVatRate || 15,
      amountPaid: 0,
      notes: client.notes || '',
      terms: companySettings.invoiceTerms || 'Interest of 2.5% per month charged on overdue accounts.',
      status: 'Draft',
    });
    setIsEditorOpen(true);
  };

  const handleOpenCreate = () => {
    const defaultClient = clients[0];
    if (!defaultClient) {
      alert('Please add a client first.');
      return;
    }
    handleOpenCreateWithClient(defaultClient);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice({
      id: inv.id,
      clientId: inv.clientId,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      items: [...inv.items],
      shippingCost: inv.shippingCost,
      shippingDetails: inv.shippingDetails,
      vatRate: inv.vatRate,
      amountPaid: inv.amountPaid,
      notes: inv.notes,
      terms: inv.terms,
      status: inv.status,
    });
    setIsEditorOpen(true);
  };

  const handleClientChange = (newClientId: string) => {
    if (!editingInvoice) return;
    const client = clients.find((c) => c.id === newClientId);
    if (!client) return;

    const updatedItems = editingInvoice.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return item;
      const res = resolveClientProductPrice(client, prod);
      const calculated = calculateLineItem({
        quantity: item.quantity,
        unitPrice: res.unitPrice,
        discountPercent: item.discountPercent,
      });
      return {
        ...item,
        unitPrice: res.unitPrice,
        priceSource: res.priceSource,
        ...calculated,
      };
    });

    const defaultShip = shippingRates.find((s) => s.destinationCountry.toLowerCase() === client.country.toLowerCase());

    setEditingInvoice({
      ...editingInvoice,
      clientId: newClientId,
      items: updatedItems,
      shippingCost: defaultShip ? defaultShip.cost : editingInvoice.shippingCost,
      shippingDetails: defaultShip ? `${defaultShip.shippingMethod} (${defaultShip.destinationCountry})` : editingInvoice.shippingDetails,
    });
  };

  const handleAddItem = (productId: string) => {
    if (!editingInvoice) return;
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const client = clients.find((c) => c.id === editingInvoice.clientId);
    const pricing = resolveClientProductPrice(client, prod);

    const calculated = calculateLineItem({
      quantity: 100,
      unitPrice: pricing.unitPrice,
      discountPercent: 0,
    });

    const newItem: DocumentLineItem = {
      id: `item-${Date.now()}`,
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
      unit: prod.unit,
      quantity: 100,
      unitPrice: pricing.unitPrice,
      costPrice: prod.costPrice,
      discountPercent: 0,
      discountAmount: calculated.discountAmount,
      lineTotal: calculated.lineTotal,
      priceSource: pricing.priceSource,
    };

    setEditingInvoice({
      ...editingInvoice,
      items: [...editingInvoice.items, newItem],
    });
  };

  const handleUpdateItem = (itemId: string, field: keyof DocumentLineItem, value: any) => {
    if (!editingInvoice) return;
    const updatedItems = editingInvoice.items.map((item) => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      const calculated = calculateLineItem({
        quantity: updated.quantity,
        unitPrice: updated.unitPrice,
        discountPercent: updated.discountPercent,
      });
      return { ...updated, ...calculated };
    });

    setEditingInvoice({ ...editingInvoice, items: updatedItems });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!editingInvoice) return;
    setEditingInvoice({
      ...editingInvoice,
      items: editingInvoice.items.filter((i) => i.id !== itemId),
    });
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice || editingInvoice.items.length === 0) {
      alert('Please add at least one line item product.');
      return;
    }

    const client = clients.find((c) => c.id === editingInvoice.clientId);
    if (!client) {
      alert('Client not found.');
      return;
    }

    const totals = calculateDocumentTotals(
      editingInvoice.items,
      editingInvoice.shippingCost,
      editingInvoice.vatRate,
      editingInvoice.amountPaid
    );

    let status: InvoiceStatus = editingInvoice.status;
    if (totals.balanceDue <= 0 && totals.grandTotal > 0) {
      status = 'Paid';
    } else if (totals.amountPaid > 0) {
      status = 'Partially Paid';
    }

    const invoicePayload: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'> = {
      clientId: client.id,
      clientSnapshot: {
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        whatsapp: client.whatsapp,
        billingAddress: client.billingAddress,
        shippingAddress: client.shippingAddress,
        city: client.city,
        province: client.province,
        country: client.country,
        vatNumber: client.vatNumber,
      },
      invoiceDate: editingInvoice.invoiceDate,
      dueDate: editingInvoice.dueDate,
      items: editingInvoice.items,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      shippingCost: totals.shippingCost,
      shippingDetails: editingInvoice.shippingDetails,
      vatRate: totals.vatRate,
      vatAmount: totals.vatAmount,
      grandTotal: totals.grandTotal,
      amountPaid: totals.amountPaid,
      balanceDue: totals.balanceDue,
      currency: client.currency || companySettings.defaultCurrency || 'ZAR',
      paymentInstructions: companySettings.paymentInstructions,
      bankingSnapshot: {
        bankName: companySettings.bankName,
        accountName: companySettings.accountName,
        accountNumber: companySettings.accountNumber,
        branchCode: companySettings.branchCode,
        swiftCode: companySettings.swiftCode,
      },
      notes: editingInvoice.notes,
      terms: editingInvoice.terms,
      status,
    };

    if (editingInvoice.id) {
      await updateInvoice(editingInvoice.id, invoicePayload);
      const updated = { ...selectedInvoice, ...invoicePayload, id: editingInvoice.id } as Invoice;
      setSelectedInvoice(updated);
    } else {
      const created = await addInvoice(invoicePayload);
      setSelectedInvoice(created);
    }

    setIsEditorOpen(false);
    setEditingInvoice(null);
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    const doc = generateInvoicePDF(invoice, companySettings);
    doc.save(`${invoice.invoiceNumber}_${invoice.clientSnapshot.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this invoice record?')) {
      await deleteInvoice(id);
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(invoices.find((i) => i.id !== id) || null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold font-mono text-white tracking-tight uppercase">Tax Invoices Matrix</h1>
            <span className="text-[10px] bg-yellow-950 text-[#EAB308] border border-yellow-800/40 px-2 py-0.5 rounded font-mono font-semibold">
              {invoices.length} RECORDS
            </span>
          </div>
          <p className="text-xs font-mono text-[#9CA3AF]">
            Official billing records, live EFT payment tracking, balance calculations, and multi-channel dispatch.
          </p>
        </div>

        <button
          id="invoices-new-btn"
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors border border-yellow-200/50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Invoice</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Invoices List */}
        <div className="lg:col-span-4 space-y-2.5">
          {/* Search & Filter */}
          <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-3 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
              <input
                id="invoices-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice #, client..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#EAB308]/50 focus:border-[#EAB308]"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1">
              {['All', 'Draft', 'Sent', 'Partially Paid', 'Paid'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors border ${
                    selectedStatus === st
                      ? 'bg-[#EAB308] text-black font-semibold border-#EAB308'
                      : 'bg-[#151924] text-[#9CA3AF] hover:text-[#E5E7EB] border-[#252D3D]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredInvoices.map((inv) => {
              const isSelected = selectedInvoice?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  id={`invoice-card-${inv.id}`}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all font-mono ${
                    isSelected
                      ? 'bg-[#161B28] border-[#EAB308]/60 shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                      : 'bg-[#11141D] border-[#1F2430] hover:border-[#2E384D] hover:bg-[#151924]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-white">{inv.invoiceNumber}</span>
                      <p className="text-xs text-[#D1D5DB] font-semibold mt-0.5">{inv.clientSnapshot?.companyName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(inv);
                        }}
                        className="p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                          inv.status === 'Paid'
                            ? 'bg-yellow-950 text-yellow-200 border border-yellow-800/40'
                            : inv.status === 'Partially Paid'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#9CA3AF]">
                    <span>Due: {formatDate(inv.dueDate)}</span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-white block">
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </span>
                      {inv.balanceDue > 0 && (
                        <span className="text-[9px] text-rose-400 font-semibold">
                          Due: {formatCurrency(inv.balanceDue, inv.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredInvoices.length === 0 && (
              <div className="p-8 text-center bg-[#11141D] rounded-xl border border-[#1F2430] text-[#6B7280] text-xs font-mono">
                No invoices found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoice Document Preview & Payment Center */}
        <div className="lg:col-span-8">
          {selectedInvoice ? (
            <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm overflow-hidden space-y-0">
              {/* Action Toolbar */}
              <div className="bg-[#151924] p-3 border-b border-[#1F2430] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-white">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                      selectedInvoice.status === 'Paid'
                        ? 'bg-yellow-950 text-yellow-200 border border-yellow-800/40'
                        : selectedInvoice.status === 'Partially Paid'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                    }`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedInvoice.balanceDue > 0 && (
                    <button
                      id="invoice-record-pay-btn"
                      onClick={() => onOpenPaymentModal(selectedInvoice)}
                      className="px-2.5 py-1 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded shadow-sm transition-colors flex items-center space-x-1"
                    >
                      <CreditCard className="w-3 h-3 text-black" />
                      <span>Record Payment</span>
                    </button>
                  )}

                  <button
                    id="invoice-download-pdf-btn"
                    onClick={() => handleDownloadPDF(selectedInvoice)}
                    className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/50 text-xs font-mono font-bold rounded shadow-sm transition-colors flex items-center space-x-1.5"
                    title="Generate and Download High-Density Tax Invoice PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    id="invoice-send-email-btn"
                    onClick={() => onOpenEmailModal(selectedInvoice)}
                    className="px-2.5 py-1 bg-[#1A202C] hover:bg-[#252D3D] text-[#D1D5DB] border border-[#2D3748] text-xs font-mono rounded shadow-sm transition-colors flex items-center space-x-1"
                  >
                    <Mail className="w-3 h-3 text-cyan-400" />
                    <span>Email</span>
                  </button>

                  <button
                    id="invoice-send-whatsapp-btn"
                    onClick={() => onOpenWhatsAppModal(selectedInvoice)}
                    className="px-2.5 py-1 bg-[#1A202C] hover:bg-[#252D3D] text-[#D1D5DB] border border-[#2D3748] text-xs font-mono rounded shadow-sm transition-colors flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3 h-3 text-[#EAB308]" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    id="invoice-edit-btn"
                    onClick={() => handleOpenEdit(selectedInvoice)}
                    className="p-1 text-[#9CA3AF] hover:text-[#EAB308] rounded hover:bg-[#1E2536]"
                    title="Edit Invoice"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="invoice-delete-btn"
                    onClick={() => handleDelete(selectedInvoice.id)}
                    className="p-1 text-[#6B7280] hover:text-rose-400 rounded hover:bg-rose-950/40"
                    title="Delete Invoice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Document View (High Density Dark Sheet) */}
              <div className="p-5 space-y-5 text-xs bg-[#0E1118] text-[#D1D5DB] font-mono">
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-[#1F2430]">
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 shrink-0 bg-white rounded-lg p-1 flex items-center justify-center border border-slate-300 overflow-hidden shadow-sm">
                      {companySettings.logoUrl ? (
                        <img
                          src={companySettings.logoUrl}
                          alt="Healthy Fields Logo"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Building className="w-8 h-8 text-yellow-800" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-mono font-bold text-base text-white">
                        {companySettings.companyName}
                      </h3>
                      {companySettings.tradingName && (
                        <p className="text-[#EAB308] text-[10px] font-semibold">{companySettings.tradingName}</p>
                      )}
                      <p className="text-[#9CA3AF] text-[11px] mt-0.5">{companySettings.physicalAddress}</p>
                      <p className="text-[#9CA3AF] text-[11px]">
                        WhatsApp: <strong className="text-yellow-200">{companySettings.whatsapp || companySettings.phone}</strong> • Email: {companySettings.email}
                      </p>
                      <p className="text-[#9CA3AF] text-[11px]">
                        VAT Reg: <strong className="text-white">{companySettings.vatNumber}</strong> • Web: {companySettings.website}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right space-y-1">
                    <span className="font-bold text-xs uppercase text-[#EAB308] block tracking-wider">TAX INVOICE</span>
                    <p className="font-mono font-bold text-sm text-white">{selectedInvoice.invoiceNumber}</p>
                    <p className="text-[#9CA3AF] text-[11px]">Date: <strong>{formatDate(selectedInvoice.invoiceDate)}</strong></p>
                    <p className="text-[#9CA3AF] text-[11px]">Due Date: <strong>{formatDate(selectedInvoice.dueDate)}</strong></p>
                  </div>
                </div>

                {/* Billed To & Shipped To */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430]">
                  <div>
                    <span className="text-[10px] text-[#EAB308] font-bold uppercase tracking-wider block mb-1">
                      Billed To:
                    </span>
                    <p className="font-bold text-xs text-white">{selectedInvoice.clientSnapshot?.companyName}</p>
                    <p className="text-[#9CA3AF]">Attn: {selectedInvoice.clientSnapshot?.contactPerson}</p>
                    <p className="text-[#6B7280]">{selectedInvoice.clientSnapshot?.email}</p>
                    <p className="text-[#6B7280]">{selectedInvoice.clientSnapshot?.phone || selectedInvoice.clientSnapshot?.whatsapp}</p>
                    {selectedInvoice.clientSnapshot?.vatNumber && (
                      <p className="text-[#6B7280] text-[10px]">Client VAT: {selectedInvoice.clientSnapshot.vatNumber}</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-[#EAB308] font-bold uppercase tracking-wider block mb-1">
                      Shipping & Dispatch Method:
                    </span>
                    <p className="text-[#D1D5DB] font-medium">{selectedInvoice.shippingDetails || 'Standard Freight'}</p>
                    <p className="text-[#6B7280]">{selectedInvoice.clientSnapshot?.shippingAddress || selectedInvoice.clientSnapshot?.billingAddress}</p>
                    <p className="text-[#6B7280]">{selectedInvoice.clientSnapshot?.city}, {selectedInvoice.clientSnapshot?.country}</p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="border border-[#1F2430] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#151924] text-[#9CA3AF] font-semibold border-b border-[#1F2430]">
                      <tr>
                        <th className="py-2 px-3">Item & Description</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Discount</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#191F2D]">
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-[#0E1118]' : 'bg-[#11141D]'}>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-white block">{item.name}</span>
                            <span className="text-[10px] text-[#6B7280] font-mono">
                              SKU: {item.sku} • Tier: {item.priceSource}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-white">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#D1D5DB]">
                            {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#9CA3AF]">
                            {item.discountPercent ? `${item.discountPercent}%` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white">
                            {formatCurrency(item.lineTotal, selectedInvoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals, Payments & Banking Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Banking Snapshot */}
                  <div className="bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430] space-y-2">
                    <span className="font-bold text-[10px] text-[#EAB308] uppercase tracking-wider block flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Official EFT Banking Details
                    </span>
                    <div className="space-y-1 text-[#9CA3AF] text-[11px]">
                      <p>Bank: <strong className="text-white">{selectedInvoice.bankingSnapshot?.bankName || companySettings.bankName}</strong></p>
                      <p>Account Name: <strong className="text-white">{selectedInvoice.bankingSnapshot?.accountName || companySettings.accountName}</strong> ({companySettings.accountType || 'Current Account'})</p>
                      <p>Account No: <strong className="font-mono text-[#EAB308]">{selectedInvoice.bankingSnapshot?.accountNumber || companySettings.accountNumber}</strong></p>
                      <p>Branch Code: <strong className="font-mono text-white">{selectedInvoice.bankingSnapshot?.branchCode || companySettings.branchCode}</strong></p>
                      <p>Payment Ref: <strong className="font-mono text-[#EAB308]">{selectedInvoice.invoiceNumber}</strong> (or Name/Number)</p>
                    </div>

                    {/* Capitec Warning */}
                    <div className="p-2 rounded bg-amber-950/60 border border-amber-800/40 text-amber-200 text-[10px] flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{companySettings.bankingNotice || '⚠️ IMPORTANT: Please select Capitec Business Bank on your banking app (NOT "Capitec Bank").'}</span>
                    </div>

                    {/* Next Steps */}
                    <div className="p-2 rounded bg-yellow-950/40 border border-yellow-800/30 text-yellow-200 text-[10px]">
                      <strong>Next Steps:</strong> {companySettings.paymentNextSteps || 'Send through your full delivery address 📍 Share your proof of payment once complete 📲'}
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="space-y-1.5 text-xs bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430]">
                    <div className="flex justify-between text-[#9CA3AF]">
                      <span>Subtotal:</span>
                      <span className="font-mono text-white">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                    </div>
                    {selectedInvoice.discountTotal > 0 && (
                      <div className="flex justify-between text-[#EAB308]">
                        <span>Discount:</span>
                        <span className="font-mono">-{formatCurrency(selectedInvoice.discountTotal, selectedInvoice.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#9CA3AF]">
                      <span>Shipping:</span>
                      <span className="font-mono text-white">{formatCurrency(selectedInvoice.shippingCost, selectedInvoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-[#9CA3AF]">
                      <span>VAT ({selectedInvoice.vatRate}%):</span>
                      <span className="font-mono text-white">{formatCurrency(selectedInvoice.vatAmount, selectedInvoice.currency)}</span>
                    </div>
                    <div className="pt-2 border-t border-[#1F2430] flex justify-between font-bold text-sm text-white">
                      <span>Grand Total:</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.grandTotal, selectedInvoice.currency)}</span>
                    </div>
                    {selectedInvoice.amountPaid > 0 && (
                      <div className="flex justify-between text-[#EAB308] font-semibold pt-1">
                        <span>Amount Paid:</span>
                        <span className="font-mono">-{formatCurrency(selectedInvoice.amountPaid, selectedInvoice.currency)}</span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-[#1F2430] flex justify-between font-bold text-sm text-rose-400">
                      <span>Balance Due:</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.balanceDue, selectedInvoice.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#11141D] rounded-xl border border-[#1F2430] text-[#6B7280] text-xs font-mono">
              Select an invoice from the list to view billing information, download PDF, or record customer payments.
            </div>
          )}
        </div>
      </div>

      {/* Invoice Editor Modal */}
      {isEditorOpen && editingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141D] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#1F2430] text-[#E5E7EB]">
            <form onSubmit={handleSaveInvoice}>
              <div className="p-4 border-b border-[#1F2430] flex items-center justify-between sticky top-0 bg-[#11141D] z-10">
                <h3 className="text-base font-bold text-white font-mono">
                  {editingInvoice.id ? 'Edit Tax Invoice' : 'Create New Tax Invoice'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E2536]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs font-mono">
                {/* Client & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Select Client *</label>
                    <select
                      value={editingInvoice.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#11141D] text-white">
                          {c.companyName} ({c.contactPerson} - {c.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Invoice Date</label>
                    <input
                      type="date"
                      value={editingInvoice.invoiceDate}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, invoiceDate: e.target.value })}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Payment Due Date</label>
                    <input
                      type="date"
                      value={editingInvoice.dueDate}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-[#EAB308]">
                      Invoice Line Items ({editingInvoice.items.length})
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[#9CA3AF] text-[11px]">Add Product:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddItem(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="p-1.5 bg-[#151924] border border-[#EAB308]/40 rounded-lg text-xs font-semibold text-yellow-200 max-w-xs truncate"
                      >
                        <option value="" disabled className="bg-[#11141D]">
                          + Select Product to Add...
                        </option>
                        {Array.from(new Set(products.map((p) => p.category || 'Other'))).sort().map((cat) => (
                          <optgroup key={cat} label={cat} className="bg-[#151924] text-[#EAB308] font-bold">
                            {products
                              .filter((p) => (p.category || 'Other') === cat)
                              .map((p) => (
                                <option key={p.id} value={p.id} className="bg-[#11141D] text-white font-normal">
                                  {p.name} ({p.sku}) — {formatCurrency(p.standardPrice, p.currency)}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border border-[#1F2430] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#151924] border-b border-[#1F2430] text-[#9CA3AF] font-semibold">
                        <tr>
                          <th className="py-2 px-3">Product</th>
                          <th className="py-2 px-2 w-24">Qty</th>
                          <th className="py-2 px-2 w-28">Unit Price (R)</th>
                          <th className="py-2 px-2 w-20">Disc %</th>
                          <th className="py-2 px-3 text-right">Total (R)</th>
                          <th className="py-2 px-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#191F2D]">
                        {editingInvoice.items.map((item) => (
                          <tr key={item.id} className="bg-[#0E1118]">
                            <td className="py-2 px-3">
                              <span className="font-semibold text-white block">{item.name}</span>
                              <span className="text-[10px] text-[#6B7280] font-mono">
                                SKU: {item.sku} • Tier: {item.priceSource}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-full p-1 bg-[#11141D] border border-[#252D3D] rounded font-mono text-xs font-bold text-white"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                step="0.5"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full p-1 bg-[#11141D] border border-[#252D3D] rounded font-mono text-xs font-bold text-[#EAB308]"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discountPercent || 0}
                                onChange={(e) => handleUpdateItem(item.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                                className="w-full p-1 bg-[#11141D] border border-[#252D3D] rounded font-mono text-xs text-white"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-white">
                              {formatCurrency(item.lineTotal, 'ZAR')}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-[#6B7280] hover:text-rose-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {editingInvoice.items.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-[#6B7280]">
                              No products added yet. Select a product above to add to this invoice.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Freight & Tax */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0E1118] p-3.5 rounded-lg border border-[#1F2430]">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Shipping Freight (R)</label>
                    <input
                      type="number"
                      step="10"
                      value={editingInvoice.shippingCost}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, shippingCost: parseFloat(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-[#11141D] border border-[#252D3D] rounded text-xs font-mono font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Shipping Details</label>
                    <input
                      type="text"
                      value={editingInvoice.shippingDetails}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, shippingDetails: e.target.value })}
                      placeholder="e.g. Cross-Border Freight (Botswana)"
                      className="w-full p-1.5 bg-[#11141D] border border-[#252D3D] rounded text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">VAT Rate (%)</label>
                    <input
                      type="number"
                      value={editingInvoice.vatRate}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, vatRate: parseFloat(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-[#11141D] border border-[#252D3D] rounded text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#9CA3AF] mb-1">Invoice Notes</label>
                  <textarea
                    rows={2}
                    value={editingInvoice.notes}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                    placeholder="e.g. Biological plant stock certified for export. Phyto documents attached."
                    className="w-full p-2 bg-[#0E1118] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                  />
                </div>
              </div>

              <div className="p-3.5 border-t border-[#1F2430] bg-[#151924] flex items-center justify-end space-x-2.5 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-3 py-1.5 text-xs font-mono text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors"
                >
                  Save Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
