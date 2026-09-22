import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Mail,
  MessageSquare,
  ArrowRight,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  PlusCircle,
  Receipt,
  FileCheck,
  Building,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { Quote, QuoteStatus, DocumentLineItem, Client, Product } from '../types';
import {
  formatCurrency,
  formatDate,
  resolveClientProductPrice,
  calculateLineItem,
  calculateDocumentTotals,
  generateDocumentNumber,
} from '../utils/calculator';
import { generateQuotePDF } from '../utils/pdfGenerator';

interface QuotesViewProps {
  onOpenEmailModal: (quote: Quote) => void;
  onOpenWhatsAppModal: (quote: Quote) => void;
  initialNewQuoteClient?: Client | null;
  onClearInitialClient?: () => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  onOpenEmailModal,
  onOpenWhatsAppModal,
  initialNewQuoteClient,
  onClearInitialClient,
}) => {
  const {
    quotes,
    clients,
    products,
    shippingRates,
    companySettings,
    addQuote,
    updateQuote,
    deleteQuote,
    convertQuoteToInvoice,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(quotes[0] || null);

  // Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<{
    id?: string;
    clientId: string;
    quoteDate: string;
    validUntil: string;
    items: DocumentLineItem[];
    shippingCost: number;
    shippingDetails: string;
    vatRate: number;
    notes: string;
    terms: string;
    status: QuoteStatus;
  } | null>(null);

  // Trigger add quote from outside if initial client provided
  React.useEffect(() => {
    if (initialNewQuoteClient) {
      handleOpenCreateWithClient(initialNewQuoteClient);
      onClearInitialClient?.();
    }
  }, [initialNewQuoteClient]);

  const filteredQuotes = quotes.filter((q) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(query) ||
      q.clientSnapshot?.companyName?.toLowerCase().includes(query) ||
      q.clientSnapshot?.contactPerson?.toLowerCase().includes(query);
    const matchesStatus = selectedStatus === 'All' || q.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreateWithClient = (client: Client) => {
    const today = new Date().toISOString().split('T')[0];
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + (companySettings.quoteValidityDays || 14));
    const validUntil = validUntilDate.toISOString().split('T')[0];

    // Find default shipping for this client's country
    const defaultShip = shippingRates.find((s) => s.destinationCountry.toLowerCase() === client.country.toLowerCase());

    setEditingQuote({
      clientId: client.id,
      quoteDate: today,
      validUntil,
      items: [],
      shippingCost: defaultShip?.cost || 0,
      shippingDetails: defaultShip ? `${defaultShip.shippingMethod} (${defaultShip.destinationCountry})` : '',
      vatRate: companySettings.defaultVatRate || 15,
      notes: client.notes || '',
      terms: companySettings.paymentTerms || 'Valid for 14 days. Pre-payment EFT required prior to dispatch.',
      status: 'Draft',
    });
    setIsEditorOpen(true);
  };

  const handleOpenCreate = () => {
    const defaultClient = clients[0];
    if (!defaultClient) {
      alert('Please add at least one client first.');
      return;
    }
    handleOpenCreateWithClient(defaultClient);
  };

  const handleOpenEdit = (quote: Quote) => {
    setEditingQuote({
      id: quote.id,
      clientId: quote.clientId,
      quoteDate: quote.quoteDate,
      validUntil: quote.validUntil,
      items: [...quote.items],
      shippingCost: quote.shippingCost,
      shippingDetails: quote.shippingDetails,
      vatRate: quote.vatRate,
      notes: quote.notes,
      terms: quote.terms,
      status: quote.status,
    });
    setIsEditorOpen(true);
  };

  const handleClientChange = (newClientId: string) => {
    if (!editingQuote) return;
    const client = clients.find((c) => c.id === newClientId);
    if (!client) return;

    // Recalculate prices for existing items based on new client pricing
    const updatedItems = editingQuote.items.map((item) => {
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

    setEditingQuote({
      ...editingQuote,
      clientId: newClientId,
      items: updatedItems,
      shippingCost: defaultShip ? defaultShip.cost : editingQuote.shippingCost,
      shippingDetails: defaultShip ? `${defaultShip.shippingMethod} (${defaultShip.destinationCountry})` : editingQuote.shippingDetails,
    });
  };

  const handleAddItem = (productId: string) => {
    if (!editingQuote) return;
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const client = clients.find((c) => c.id === editingQuote.clientId);
    const pricing = resolveClientProductPrice(client, prod);

    const newItemCalculated = calculateLineItem({
      quantity: 100, // default good initial order
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
      discountAmount: newItemCalculated.discountAmount,
      lineTotal: newItemCalculated.lineTotal,
      priceSource: pricing.priceSource,
    };

    setEditingQuote({
      ...editingQuote,
      items: [...editingQuote.items, newItem],
    });
  };

  const handleUpdateItem = (itemId: string, field: keyof DocumentLineItem, value: any) => {
    if (!editingQuote) return;
    const updatedItems = editingQuote.items.map((item) => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      const calculated = calculateLineItem({
        quantity: updated.quantity,
        unitPrice: updated.unitPrice,
        discountPercent: updated.discountPercent,
      });
      return { ...updated, ...calculated };
    });

    setEditingQuote({ ...editingQuote, items: updatedItems });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!editingQuote) return;
    setEditingQuote({
      ...editingQuote,
      items: editingQuote.items.filter((i) => i.id !== itemId),
    });
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote || editingQuote.items.length === 0) {
      alert('Please add at least one line item product.');
      return;
    }

    const client = clients.find((c) => c.id === editingQuote.clientId);
    if (!client) {
      alert('Client not found.');
      return;
    }

    const totals = calculateDocumentTotals(
      editingQuote.items,
      editingQuote.shippingCost,
      editingQuote.vatRate
    );

    const quotePayload: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'> = {
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
      quoteDate: editingQuote.quoteDate,
      validUntil: editingQuote.validUntil,
      items: editingQuote.items,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      shippingCost: totals.shippingCost,
      shippingDetails: editingQuote.shippingDetails,
      vatRate: totals.vatRate,
      vatAmount: totals.vatAmount,
      grandTotal: totals.grandTotal,
      currency: client.currency || companySettings.defaultCurrency || 'ZAR',
      paymentTerms: client.paymentTerms || companySettings.paymentTerms,
      notes: editingQuote.notes,
      terms: editingQuote.terms,
      status: editingQuote.status,
    };

    if (editingQuote.id) {
      await updateQuote(editingQuote.id, quotePayload);
      const updated = { ...selectedQuote, ...quotePayload, id: editingQuote.id } as Quote;
      setSelectedQuote(updated);
    } else {
      const created = await addQuote(quotePayload);
      setSelectedQuote(created);
    }

    setIsEditorOpen(false);
    setEditingQuote(null);
  };

  const handleDownloadPDF = (quote: Quote) => {
    const doc = generateQuotePDF(quote, companySettings);
    doc.save(`${quote.quoteNumber}_${quote.clientSnapshot.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const handleConvertQuote = async (quote: Quote) => {
    if (window.confirm(`Convert quotation ${quote.quoteNumber} to an official Tax Invoice?`)) {
      const createdInvoice = await convertQuoteToInvoice(quote.id);
      alert(`Successfully generated Tax Invoice ${createdInvoice.invoiceNumber}!`);
      // update selected quote status locally
      setSelectedQuote({ ...quote, status: 'Converted', convertedInvoiceId: createdInvoice.id });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this quotation permanently?')) {
      await deleteQuote(id);
      if (selectedQuote?.id === id) {
        setSelectedQuote(quotes.find((q) => q.id !== id) || null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold font-mono text-white tracking-tight uppercase">Quotations Matrix</h1>
            <span className="text-[10px] bg-yellow-950 text-[#EAB308] border border-yellow-800/40 px-2 py-0.5 rounded font-mono font-semibold">
              {quotes.length} RECORDS
            </span>
          </div>
          <p className="text-xs font-mono text-[#9CA3AF] border-t border-[#1F2430] mt-1 pt-1">
            Generate formal agricultural sales quotes with live pricing rules, frozen historical line items, and 1-click invoice conversion.
          </p>
        </div>

        <button
          id="quotes-new-btn"
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors border border-yellow-200/50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Quote</span>
        </button>
      </div>

      {/* Main Grid: Master Quotes List (4 cols) & Document Preview (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Quotes List */}
        <div className="lg:col-span-4 space-y-2.5">
          {/* Search & Filter */}
          <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-3 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
              <input
                id="quotes-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quote number, client..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#EAB308]/50 focus:border-[#EAB308]"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1">
              {['All', 'Draft', 'Sent', 'Accepted', 'Converted'].map((st) => (
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

          {/* Quotes cards list */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredQuotes.map((q) => {
              const isSelected = selectedQuote?.id === q.id;
              return (
                <div
                  key={q.id}
                  id={`quote-card-${q.id}`}
                  onClick={() => setSelectedQuote(q)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all font-mono ${
                    isSelected
                      ? 'bg-[#161B28] border-[#EAB308]/60 shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                      : 'bg-[#11141D] border-[#1F2430] hover:border-[#2E384D] hover:bg-[#151924]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-white">{q.quoteNumber}</span>
                      <p className="text-xs text-[#D1D5DB] font-semibold mt-0.5">{q.clientSnapshot?.companyName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(q);
                        }}
                        className="p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded transition-colors"
                        title="Download Quote PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                          q.status === 'Accepted'
                            ? 'bg-yellow-950 text-yellow-200 border border-yellow-800/40'
                            : q.status === 'Converted'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800/40'
                            : q.status === 'Sent'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                            : 'bg-[#1F2430] text-[#9CA3AF] border border-[#2D3748]'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#9CA3AF]">
                    <span>{formatDate(q.quoteDate)} • {q.items?.length} items</span>
                    <span className="font-mono font-bold text-[#EAB308]">{formatCurrency(q.grandTotal, q.currency)}</span>
                  </div>
                </div>
              );
            })}

            {filteredQuotes.length === 0 && (
              <div className="p-8 text-center bg-[#11141D] rounded-xl border border-[#1F2430] text-[#6B7280] text-xs font-mono">
                No quotations found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quote Preview & Action Center */}
        <div className="lg:col-span-8">
          {selectedQuote ? (
            <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm overflow-hidden space-y-0">
              {/* Action Toolbar */}
              <div className="bg-[#151924] p-3 border-b border-[#1F2430] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-white">
                    {selectedQuote.quoteNumber}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-yellow-950 text-[#EAB308] border border-yellow-800/40 rounded font-mono font-medium">
                    {selectedQuote.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedQuote.status !== 'Converted' && (
                    <button
                      id="quote-convert-btn"
                      onClick={() => handleConvertQuote(selectedQuote)}
                      className="px-2.5 py-1 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded shadow-sm transition-colors flex items-center space-x-1"
                      title="Convert this Quote into a Tax Invoice"
                    >
                      <Receipt className="w-3 h-3 text-black" />
                      <span>Convert to Invoice</span>
                    </button>
                  )}

                  <button
                    id="quote-download-pdf-btn"
                    onClick={() => handleDownloadPDF(selectedQuote)}
                    className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/50 text-xs font-mono font-bold rounded shadow-sm transition-colors flex items-center space-x-1.5"
                    title="Generate and Download High-Density Quotation PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    id="quote-send-email-btn"
                    onClick={() => onOpenEmailModal(selectedQuote)}
                    className="px-2.5 py-1 bg-[#1A202C] hover:bg-[#252D3D] text-[#D1D5DB] border border-[#2D3748] text-xs font-mono rounded shadow-sm transition-colors flex items-center space-x-1"
                  >
                    <Mail className="w-3 h-3 text-cyan-400" />
                    <span>Email</span>
                  </button>

                  <button
                    id="quote-send-whatsapp-btn"
                    onClick={() => onOpenWhatsAppModal(selectedQuote)}
                    className="px-2.5 py-1 bg-[#1A202C] hover:bg-[#252D3D] text-[#D1D5DB] border border-[#2D3748] text-xs font-mono rounded shadow-sm transition-colors flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3 h-3 text-[#EAB308]" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    id="quote-edit-btn"
                    onClick={() => handleOpenEdit(selectedQuote)}
                    className="p-1 text-[#9CA3AF] hover:text-[#EAB308] rounded hover:bg-[#1E2536]"
                    title="Edit Quote"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="quote-delete-btn"
                    onClick={() => handleDelete(selectedQuote.id)}
                    className="p-1 text-[#6B7280] hover:text-rose-400 rounded hover:bg-rose-950/40"
                    title="Delete Quote"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Clean Document View (High Density Dark Sheet) */}
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
                    <span className="font-bold text-xs uppercase text-[#EAB308] block tracking-wider">OFFICIAL QUOTATION</span>
                    <p className="font-mono font-bold text-sm text-white">{selectedQuote.quoteNumber}</p>
                    <p className="text-[#9CA3AF] text-[11px]">Date: <strong>{formatDate(selectedQuote.quoteDate)}</strong></p>
                    <p className="text-[#9CA3AF] text-[11px]">Valid Until: <strong>{formatDate(selectedQuote.validUntil)}</strong></p>
                  </div>
                </div>

                {/* Bill To & Ship To */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430]">
                  <div>
                    <span className="text-[10px] text-[#EAB308] font-bold uppercase tracking-wider block mb-1">
                      Quotation Prepared For:
                    </span>
                    <p className="font-bold text-xs text-white">{selectedQuote.clientSnapshot?.companyName}</p>
                    <p className="text-[#9CA3AF]">Attn: {selectedQuote.clientSnapshot?.contactPerson}</p>
                    <p className="text-[#6B7280]">{selectedQuote.clientSnapshot?.email}</p>
                    <p className="text-[#6B7280]">{selectedQuote.clientSnapshot?.phone || selectedQuote.clientSnapshot?.whatsapp}</p>
                    {selectedQuote.clientSnapshot?.vatNumber && (
                      <p className="text-[#6B7280] text-[10px]">Client VAT: {selectedQuote.clientSnapshot.vatNumber}</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-[#EAB308] font-bold uppercase tracking-wider block mb-1">
                      Delivery Destination & Method:
                    </span>
                    <p className="text-[#D1D5DB] font-medium">{selectedQuote.shippingDetails || 'Standard Delivery'}</p>
                    <p className="text-[#6B7280]">{selectedQuote.clientSnapshot?.shippingAddress || selectedQuote.clientSnapshot?.billingAddress}</p>
                    <p className="text-[#6B7280]">{selectedQuote.clientSnapshot?.city}, {selectedQuote.clientSnapshot?.country}</p>
                  </div>
                </div>

                {/* Line Items Table */}
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
                      {selectedQuote.items?.map((item, idx) => (
                        <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-[#0E1118]' : 'bg-[#11141D]'}>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-white block">{item.name}</span>
                            <span className="text-[10px] text-[#6B7280] font-mono">
                              SKU: {item.sku} • Source: {item.priceSource}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-white">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#D1D5DB]">
                            {formatCurrency(item.unitPrice, selectedQuote.currency)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#9CA3AF]">
                            {item.discountPercent ? `${item.discountPercent}%` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white">
                            {formatCurrency(item.lineTotal, selectedQuote.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & Official Banking Details Section */}
                <div className="space-y-4 pt-1">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="sm:max-w-xs space-y-2 text-[11px] text-[#9CA3AF]">
                      <p>
                        <strong className="text-white">Payment Terms:</strong> {selectedQuote.paymentTerms || companySettings.paymentTerms}
                      </p>
                      {selectedQuote.notes && (
                        <p className="bg-amber-950/60 p-2 rounded border border-amber-800/40 text-amber-300">
                          <strong>Notes:</strong> {selectedQuote.notes}
                        </p>
                      )}
                    </div>

                    <div className="w-full sm:w-72 space-y-1.5 text-xs bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430]">
                      <div className="flex justify-between text-[#9CA3AF]">
                        <span>Subtotal:</span>
                        <span className="font-mono text-white">{formatCurrency(selectedQuote.subtotal, selectedQuote.currency)}</span>
                      </div>
                      {selectedQuote.discountTotal > 0 && (
                        <div className="flex justify-between text-[#EAB308]">
                          <span>Discount:</span>
                          <span className="font-mono">-{formatCurrency(selectedQuote.discountTotal, selectedQuote.currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#9CA3AF]">
                        <span>Shipping Freight:</span>
                        <span className="font-mono text-white">{formatCurrency(selectedQuote.shippingCost, selectedQuote.currency)}</span>
                      </div>
                      <div className="flex justify-between text-[#9CA3AF]">
                        <span>VAT ({selectedQuote.vatRate}%):</span>
                        <span className="font-mono text-white">{formatCurrency(selectedQuote.vatAmount, selectedQuote.currency)}</span>
                      </div>
                      <div className="pt-2 border-t border-[#1F2430] flex justify-between font-bold text-sm text-[#EAB308]">
                        <span>Grand Total:</span>
                        <span className="font-mono text-white">{formatCurrency(selectedQuote.grandTotal, selectedQuote.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Official Banking & Acceptance Box */}
                  <div className="bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430] space-y-2 text-xs">
                    <span className="font-bold text-[10px] text-[#EAB308] uppercase tracking-wider block flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Official EFT Banking Details for Acceptance
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#9CA3AF]">
                      <p>Bank: <strong className="text-white">{companySettings.bankName}</strong></p>
                      <p>Account Name: <strong className="text-white">{companySettings.accountName}</strong> ({companySettings.accountType || 'Current Account'})</p>
                      <p>Account No: <strong className="font-mono text-[#EAB308]">{companySettings.accountNumber}</strong></p>
                      <p>Branch Code: <strong className="font-mono text-white">{companySettings.branchCode}</strong></p>
                      <p className="sm:col-span-2">Payment Ref: <strong className="font-mono text-[#EAB308]">{selectedQuote.quoteNumber}</strong> or (Client Name / Number)</p>
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
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#11141D] rounded-xl border border-[#1F2430] text-[#6B7280] text-xs font-mono">
              Select a quote from the list to view its complete document details and conversion options.
            </div>
          )}
        </div>
      </div>

      {/* Quote Creator / Editor Modal */}
      {isEditorOpen && editingQuote && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141D] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#1F2430] text-[#E5E7EB]">
            <form onSubmit={handleSaveQuote}>
              <div className="p-4 border-b border-[#1F2430] flex items-center justify-between sticky top-0 bg-[#11141D] z-10">
                <h3 className="text-base font-bold text-white font-mono">
                  {editingQuote.id ? 'Edit Quotation' : 'Create New Quotation'}
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
                {/* Client & Date Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Select Client *</label>
                    <select
                      value={editingQuote.clientId}
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
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Quote Date</label>
                    <input
                      type="date"
                      value={editingQuote.quoteDate}
                      onChange={(e) => setEditingQuote({ ...editingQuote, quoteDate: e.target.value })}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={editingQuote.validUntil}
                      onChange={(e) => setEditingQuote({ ...editingQuote, validUntil: e.target.value })}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>

                {/* Line Items Editor */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-[#EAB308]">
                      Quotation Line Items ({editingQuote.items.length})
                    </span>

                    {/* Add Product Dropdown */}
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
                        {editingQuote.items.map((item) => (
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

                        {editingQuote.items.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-[#6B7280]">
                              No products added yet. Select a product above to add to this quote.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Shipping & Tax Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0E1118] p-3.5 rounded-lg border border-[#1F2430]">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Shipping Freight (R)</label>
                    <input
                      type="number"
                      step="10"
                      value={editingQuote.shippingCost}
                      onChange={(e) => setEditingQuote({ ...editingQuote, shippingCost: parseFloat(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-[#11141D] border border-[#252D3D] rounded text-xs font-mono font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Shipping Method / Destination</label>
                    <input
                      type="text"
                      value={editingQuote.shippingDetails}
                      onChange={(e) => setEditingQuote({ ...editingQuote, shippingDetails: e.target.value })}
                      placeholder="e.g. Cross-Border Road Freight (Botswana)"
                      className="w-full p-1.5 bg-[#11141D] border border-[#252D3D] rounded text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">VAT Rate (%)</label>
                    <input
                      type="number"
                      value={editingQuote.vatRate}
                      onChange={(e) => setEditingQuote({ ...editingQuote, vatRate: parseFloat(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-[#11141D] border border-[#252D3D] rounded text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#9CA3AF] mb-1">Notes & Terms for Quote</label>
                  <textarea
                    rows={2}
                    value={editingQuote.notes}
                    onChange={(e) => setEditingQuote({ ...editingQuote, notes: e.target.value })}
                    placeholder="e.g. Special VIP Pricing applied for client. Phyto certificate enclosed."
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
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
