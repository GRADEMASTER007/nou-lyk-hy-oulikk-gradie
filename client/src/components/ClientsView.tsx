import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  FileText,
  Receipt,
  DollarSign,
  Tag,
  Clock,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Lock,
  Save,
  CheckCircle2,
  Sparkles,
  StickyNote,
  Copy,
  RotateCcw,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { Client, ClientType, Product } from '../types';
import { formatCurrency, formatDate } from '../utils/calculator';

interface ClientsViewProps {
  onOpenNewQuoteForClient?: (client: Client) => void;
  onOpenNewInvoiceForClient?: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onOpenNewQuoteForClient,
  onOpenNewInvoiceForClient,
}) => {
  const { clients, products, quotes, invoices, payments, communications, addClient, updateClient, deleteClient, companySettings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'quotes' | 'invoices' | 'payments' | 'timeline' | 'notes'>('overview');

  // Client notes active draft state
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);

  // Sync draft when selected client changes
  useEffect(() => {
    if (selectedClient) {
      setNotesDraft(selectedClient.notes || '');
      setNotesSaveStatus('idle');
    }
  }, [selectedClient?.id]);

  const countries = ['All', ...Array.from(new Set(clients.map((c) => c.country).filter(Boolean)))];

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === 'All' || client.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  const handleSaveNotes = async (customText?: string) => {
    if (!selectedClient) return;
    const textToSave = customText !== undefined ? customText : notesDraft;
    setIsSavingNotes(true);
    setNotesSaveStatus('saving');
    try {
      await updateClient(selectedClient.id, { notes: textToSave });
      setSelectedClient((prev) => (prev ? { ...prev, notes: textToSave } : null));
      setNotesSaveStatus('saved');
      setTimeout(() => {
        setNotesSaveStatus('idle');
      }, 2500);
    } catch (err) {
      console.error('Failed to save client notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleInsertTag = (tag: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const snippet = tag === 'timestamp' 
      ? `\n[${dateStr} ${timeStr}] - `
      : `\n\n--- ${tag.toUpperCase()} ---\n• `;
    
    const updated = (notesDraft ? notesDraft + snippet : snippet.trimStart());
    setNotesDraft(updated);
  };

  const handleCopyNotes = () => {
    if (!notesDraft) return;
    navigator.clipboard.writeText(notesDraft);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleOpenAdd = () => {
    setEditingClient({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      whatsapp: '',
      billingAddress: '',
      shippingAddress: '',
      city: '',
      province: '',
      country: 'South Africa',
      postalCode: '',
      vatNumber: '',
      website: '',
      currency: companySettings.defaultCurrency || 'ZAR',
      paymentTerms: 'EFT on invoice prior to dispatch',
      clientType: 'Commercial Farm',
      specialPricing: {},
      notes: '',
      status: 'Active',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient({ ...client, specialPricing: { ...(client.specialPricing || {}) } });
    setIsEditModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.companyName || !editingClient.contactPerson || !editingClient.email) {
      alert('Please fill in Company Name, Contact Person, and Email.');
      return;
    }

    if (editingClient.id) {
      await updateClient(editingClient.id, editingClient);
      const updated = { ...selectedClient, ...editingClient } as Client;
      setSelectedClient(updated);
      setNotesDraft(updated.notes || '');
    } else {
      const created = await addClient(editingClient as any);
      setSelectedClient(created);
      setNotesDraft(created.notes || '');
    }
    setIsEditModalOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client record?')) {
      await deleteClient(id);
      if (selectedClient?.id === id) {
        setSelectedClient(clients.find((c) => c.id !== id) || null);
      }
    }
  };

  const handleUpdateSpecialPrice = async (productId: string, price: number) => {
    if (!selectedClient) return;
    const newSpecialPricing = { ...(selectedClient.specialPricing || {}) };
    if (price > 0) {
      newSpecialPricing[productId] = price;
    } else {
      delete newSpecialPricing[productId];
    }
    await updateClient(selectedClient.id, { specialPricing: newSpecialPricing });
    setSelectedClient({ ...selectedClient, specialPricing: newSpecialPricing });
  };

  // Associated client data
  const clientQuotes = selectedClient ? quotes.filter((q) => q.clientId === selectedClient.id) : [];
  const clientInvoices = selectedClient ? invoices.filter((i) => i.clientId === selectedClient.id) : [];
  const clientPayments = selectedClient ? payments.filter((p) => p.clientId === selectedClient.id) : [];
  const clientCommunications = selectedClient ? communications.filter((c) => c.clientId === selectedClient.id) : [];

  const noteWordCount = notesDraft.trim() ? notesDraft.trim().split(/\s+/).length : 0;
  const noteCharCount = notesDraft.length;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold font-mono text-white tracking-tight uppercase">Client Directory Matrix</h1>
            <span className="text-[10px] bg-yellow-950 text-[#EAB308] border border-yellow-800/40 px-2 py-0.5 rounded font-mono font-semibold">
              {clients.length} ACCOUNTS
            </span>
          </div>
          <p className="text-xs font-mono text-[#9CA3AF] border-t border-[#1F2430] mt-1 pt-1">
            Manage customer accounts, custom special pricing, order histories, and communications.
          </p>
        </div>

        <button
          id="clients-add-new-btn"
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors border border-yellow-200/50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Client</span>
        </button>
      </div>

      {/* Two Column Layout: Master Client List & Detailed Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Client List (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-3 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
              <input
                id="clients-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients, names, cities..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#EAB308]/50 focus:border-[#EAB308]"
              />
            </div>

            {/* Country Filters */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {countries.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(c)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors border ${
                    selectedCountry === c
                      ? 'bg-[#EAB308] text-black font-semibold border-#EAB308'
                      : 'bg-[#151924] text-[#9CA3AF] hover:text-[#E5E7EB] border-[#252D3D]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Client List Cards */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              const hasSpecialPricing = client.specialPricing && Object.keys(client.specialPricing).length > 0;
              return (
                <div
                  key={client.id}
                  id={`client-item-${client.id}`}
                  onClick={() => setSelectedClient(client)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all font-mono ${
                    isSelected
                      ? 'bg-[#161B28] border-[#EAB308]/60 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-[#11141D] border-[#1F2430] hover:border-[#2E384D] hover:bg-[#151924]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-white">{client.companyName}</h3>
                      <p className="text-xs text-[#9CA3AF] font-medium">{client.contactPerson}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#1B2130] text-[#9CA3AF] border border-[#252D3D] rounded font-mono font-semibold">
                      {client.country}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#6B7280]">
                    <span className="truncate max-w-[150px]">{client.email}</span>
                    <div className="flex items-center gap-1">
                      {client.notes && client.notes.trim().length > 0 && (
                        <span
                          title="Has private notes / project context"
                          className="text-[9px] px-1.5 py-0.5 bg-yellow-950/80 text-yellow-200 border border-yellow-800/40 rounded flex items-center gap-0.5"
                        >
                          <Lock className="w-2.5 h-2.5 text-[#EAB308]" /> Notes
                        </span>
                      )}
                      {hasSpecialPricing && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800/40 font-bold rounded flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" /> Special Price
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="p-8 text-center bg-[#11141D] rounded-xl border border-[#1F2430] text-[#6B7280] text-xs font-mono">
                No clients found matching your query.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Client Detailed Workspace (8 cols) */}
        <div className="lg:col-span-8">
          {selectedClient ? (
            <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm overflow-hidden font-mono">
              {/* Client Header Card */}
              <div className="bg-[#151924] p-4 border-b border-[#1F2430] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white font-mono">{selectedClient.companyName}</h2>
                    <span className="text-[10px] px-2 py-0.5 bg-yellow-950 text-yellow-200 border border-yellow-800/40 rounded font-mono font-medium">
                      {selectedClient.clientType}
                    </span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-3">
                    <span>Contact: <strong className="text-white">{selectedClient.contactPerson}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#EAB308]" /> {selectedClient.city}, {selectedClient.country}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {onOpenNewQuoteForClient && (
                    <button
                      id="client-new-quote-action"
                      onClick={() => onOpenNewQuoteForClient(selectedClient)}
                      className="px-2.5 py-1 bg-[#1A202C] hover:bg-[#252D3D] text-[#D1D5DB] border border-[#2D3748] text-xs font-mono rounded shadow-sm transition-colors flex items-center space-x-1"
                    >
                      <FileText className="w-3 h-3 text-cyan-400" />
                      <span>+ Quote</span>
                    </button>
                  )}
                  {onOpenNewInvoiceForClient && (
                    <button
                      id="client-new-invoice-action"
                      onClick={() => onOpenNewInvoiceForClient(selectedClient)}
                      className="px-2.5 py-1 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded shadow-sm transition-colors flex items-center space-x-1"
                    >
                      <Receipt className="w-3 h-3 text-black" />
                      <span>+ Invoice</span>
                    </button>
                  )}
                  <button
                    id="client-edit-btn"
                    onClick={() => handleOpenEdit(selectedClient)}
                    className="p-1 text-[#9CA3AF] hover:text-[#EAB308] hover:bg-[#1E2536] rounded transition-colors"
                    title="Edit Client"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="client-delete-btn"
                    onClick={() => handleDelete(selectedClient.id)}
                    className="p-1 text-[#6B7280] hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                    title="Delete Client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-[#1F2430] px-4 flex space-x-4 overflow-x-auto text-xs font-mono bg-[#0E1118]">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'pricing', label: 'Client Special Pricing' },
                  { id: 'quotes', label: `Quotes (${clientQuotes.length})` },
                  { id: 'invoices', label: `Invoices (${clientInvoices.length})` },
                  { id: 'payments', label: `Payments (${clientPayments.length})` },
                  { id: 'communications', label: `Communication Log (${clientCommunications.length})` },
                  {
                    id: 'notes',
                    label: `Client Notes & Context ${selectedClient.notes?.trim() ? '•' : ''}`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    id={`client-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2.5 border-b-2 whitespace-nowrap transition-colors text-[11px] flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'border-#EAB308 text-[#EAB308] font-bold'
                        : 'border-transparent text-[#6B7280] hover:text-[#D1D5DB]'
                    }`}
                  >
                    {tab.id === 'notes' && <Lock className="w-3 h-3 text-[#EAB308]" />}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="p-4 bg-[#0E1118]">
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 text-xs font-mono">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3 bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430]">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[#EAB308]">
                          Contact Information
                        </h4>
                        <div className="space-y-2 text-[#D1D5DB]">
                          <p className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#6B7280]" />
                            <a href={`mailto:${selectedClient.email}`} className="text-cyan-400 hover:underline">
                              {selectedClient.email}
                            </a>
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span>{selectedClient.phone || '—'}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-[#EAB308]" />
                            <span>WhatsApp: {selectedClient.whatsapp || '—'}</span>
                          </p>
                          {selectedClient.website && (
                            <p className="flex items-center gap-2">
                              <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" />
                              <a href={selectedClient.website} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                                {selectedClient.website}
                              </a>
                            </p>
                          )}
                          <p className="text-[#9CA3AF] pt-1 text-[11px]">
                            VAT / Tax Number: <strong className="text-white">{selectedClient.vatNumber || 'Not registered'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430]">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[#EAB308]">
                          Address & Terms
                        </h4>
                        <div className="space-y-2 text-[#D1D5DB]">
                          <div>
                            <span className="text-[#6B7280] font-semibold block text-[10px] uppercase">Billing Address</span>
                            <p className="font-medium text-white">{selectedClient.billingAddress || '—'}</p>
                            <p className="text-[#9CA3AF] text-[11px]">{selectedClient.city}, {selectedClient.province} {selectedClient.postalCode}, {selectedClient.country}</p>
                          </div>
                          <div className="pt-1">
                            <span className="text-[#6B7280] font-semibold block text-[10px] uppercase">Shipping Address</span>
                            <p className="font-medium text-white">{selectedClient.shippingAddress || selectedClient.billingAddress || '—'}</p>
                          </div>
                          <div className="pt-1">
                            <span className="text-[#6B7280] font-semibold block text-[10px] uppercase">Payment Terms</span>
                            <p className="font-medium text-[#EAB308]">{selectedClient.paymentTerms || 'Standard EFT terms'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Overview Private Notes & Project Context Card */}
                    <div className="bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-3.5 h-3.5 text-[#EAB308]" />
                          <h4 className="font-bold text-xs uppercase tracking-wider text-[#EAB308]">
                            Private Client Notes & Project Context
                          </h4>
                          <span className="text-[9px] bg-[#161B28] text-[#9CA3AF] border border-[#252D3D] px-1.5 py-0.5 rounded font-mono">
                            Internal Company Use Only
                          </span>
                        </div>
                        <button
                          id="open-notes-tab-from-overview-btn"
                          onClick={() => setActiveTab('notes')}
                          className="text-[11px] text-[#EAB308] hover:text-yellow-200 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Open Notes Workspace</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {selectedClient.notes && selectedClient.notes.trim().length > 0 ? (
                        <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#1F2430] text-[#D1D5DB] text-xs whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto font-mono">
                          {selectedClient.notes}
                        </div>
                      ) : (
                        <div className="bg-[#0A0B0E]/60 p-4 rounded-lg border border-dashed border-[#252D3D] text-center text-[#6B7280] text-xs">
                          <p>No private client notes or project context stored yet.</p>
                          <button
                            onClick={() => setActiveTab('notes')}
                            className="mt-1.5 text-[#EAB308] hover:text-yellow-200 text-xs font-semibold underline inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add private notes / project requirements</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SPECIAL PRICING TAB */}
                {activeTab === 'pricing' && (
                  <div className="space-y-3 font-mono">
                    <div className="bg-[#11141D] p-3 rounded-lg border border-[#1F2430] text-xs text-[#9CA3AF]">
                      <p className="font-semibold text-[#EAB308]">Client-Specific Price Overrides for {selectedClient.companyName}</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">
                        When creating quotes or invoices for this client, the system will prioritize these custom prices over wholesale and standard prices.
                      </p>
                    </div>

                    <div className="border border-[#1F2430] rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#151924] border-b border-[#1F2430] text-[#9CA3AF] font-semibold">
                          <tr>
                            <th className="py-2 px-3">Product Name & SKU</th>
                            <th className="py-2 px-3">Standard Price</th>
                            <th className="py-2 px-3">Wholesale</th>
                            <th className="py-2 px-3 font-bold text-[#EAB308]">Special Price for {selectedClient.contactPerson}</th>
                            <th className="py-2 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#191F2D]">
                          {products.map((prod) => {
                            const specialPrice = selectedClient.specialPricing?.[prod.id];
                            return (
                              <tr key={prod.id} className="hover:bg-[#151924]/50">
                                <td className="py-2 px-3">
                                  <span className="font-semibold text-white block">{prod.name}</span>
                                  <span className="text-[10px] text-[#6B7280] font-mono">{prod.sku} • {prod.unit}</span>
                                </td>
                                <td className="py-2 px-3 text-[#9CA3AF] font-mono">
                                  {formatCurrency(prod.standardPrice, prod.currency)}
                                </td>
                                <td className="py-2 px-3 text-[#9CA3AF] font-mono">
                                  {formatCurrency(prod.wholesalePrice, prod.currency)}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[#6B7280] text-xs">R</span>
                                    <input
                                      type="number"
                                      step="0.5"
                                      defaultValue={specialPrice || ''}
                                      placeholder="Standard"
                                      onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        handleUpdateSpecialPrice(prod.id, isNaN(val) ? 0 : val);
                                      }}
                                      className="w-24 px-2 py-1 bg-[#0A0B0E] border border-[#252D3D] rounded text-xs font-mono font-bold text-[#EAB308] focus:outline-none focus:border-[#EAB308]"
                                    />
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {specialPrice ? (
                                    <span className="text-[9px] bg-yellow-950 text-yellow-200 border border-yellow-800/40 px-1.5 py-0.5 rounded font-bold">
                                      Active Override
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-[#6B7280]">Default</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. QUOTES TAB */}
                {activeTab === 'quotes' && (
                  <div className="space-y-3 font-mono">
                    {clientQuotes.length === 0 ? (
                      <p className="text-[#6B7280] text-xs text-center py-4">No quotes found for this client.</p>
                    ) : (
                      <div className="bg-[#11141D] border border-[#1F2430] rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#161B28] text-[#9CA3AF]">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Quote #</th>
                              <th className="px-3 py-2 font-semibold">Date</th>
                              <th className="px-3 py-2 font-semibold">Status</th>
                              <th className="px-3 py-2 text-right font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1F2430]">
                            {clientQuotes.map((q) => (
                              <tr key={q.id} className="hover:bg-[#1A202C] text-white border-[#1F2430]">
                                <td className="px-3 py-2">{q.quoteNumber}</td>
                                <td className="px-3 py-2">{q.quoteDate}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${q.status === 'Accepted' ? 'bg-yellow-950 text-[#EAB308]' : 'bg-[#252D3D] text-gray-300'}`}>{q.status}</span>
                                </td>
                                <td className="px-3 py-2 text-right">{formatCurrency(q.grandTotal, companySettings.defaultCurrency)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. INVOICES TAB */}
                {activeTab === 'invoices' && (
                  <div className="space-y-3 font-mono">
                    {clientInvoices.length === 0 ? (
                      <p className="text-[#6B7280] text-xs text-center py-4">No invoices found for this client.</p>
                    ) : (
                      <div className="bg-[#11141D] border border-[#1F2430] rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#161B28] text-[#9CA3AF]">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Invoice #</th>
                              <th className="px-3 py-2 font-semibold">Date</th>
                              <th className="px-3 py-2 font-semibold">Status</th>
                              <th className="px-3 py-2 text-right font-semibold">Balance</th>
                              <th className="px-3 py-2 text-right font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1F2430]">
                            {clientInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-[#1A202C] text-white border-[#1F2430]">
                                <td className="px-3 py-2">{inv.invoiceNumber}</td>
                                <td className="px-3 py-2">{inv.invoiceDate}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] ${inv.status === 'Paid' ? 'bg-yellow-950 text-[#EAB308]' : inv.status === 'Overdue' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'}`}>{inv.status}</span>
                                </td>
                                <td className="px-3 py-2 text-right text-amber-400">{formatCurrency(inv.balanceDue, companySettings.defaultCurrency)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(inv.grandTotal, companySettings.defaultCurrency)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. PAYMENTS TAB */}
                {activeTab === 'payments' && (
                  <div className="space-y-3 font-mono">
                    {clientPayments.length === 0 ? (
                      <p className="text-[#6B7280] text-xs text-center py-4">No payments found for this client.</p>
                    ) : (
                      <div className="bg-[#11141D] border border-[#1F2430] rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#161B28] text-[#9CA3AF]">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Receipt #</th>
                              <th className="px-3 py-2 font-semibold">Date</th>
                              <th className="px-3 py-2 font-semibold">Method</th>
                              <th className="px-3 py-2 font-semibold">Ref</th>
                              <th className="px-3 py-2 text-right font-semibold">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1F2430]">
                            {clientPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-[#1A202C] text-white border-[#1F2430]">
                                <td className="px-3 py-2">{p.id}</td>
                                <td className="px-3 py-2">{p.paymentDate}</td>
                                <td className="px-3 py-2">{p.paymentMethod}</td>
                                <td className="px-3 py-2">{p.reference}</td>
                                <td className="px-3 py-2 text-right text-[#EAB308]">{formatCurrency(p.amount, companySettings.defaultCurrency)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. TIMELINE TAB */}
                {activeTab === 'timeline' && (
                  <div className="space-y-4 font-mono">
                    {(() => {
                      // Aggregate all events
                      const events = [
                        ...clientQuotes.map(q => ({ type: 'Quote' as const, date: q.quoteDate, data: q })),
                        ...clientInvoices.map(i => ({ type: 'Invoice' as const, date: i.invoiceDate, data: i })),
                        ...clientPayments.map(p => ({ type: 'Payment' as const, date: p.paymentDate, data: p })),
                        ...clientCommunications.map(c => ({ type: 'Communication' as const, date: c.sentAt, data: c }))
                      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                      
                      if (events.length === 0) return <p className="text-xs text-[#6B7280] py-6 text-center">No timeline events recorded.</p>;
                      
                      return events.map((ev, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center border shrink-0 bg-[#161B28]">
                               {ev.type === 'Quote' && <FileText className="w-3 h-3 text-cyan-400" />}
                               {ev.type === 'Invoice' && <Receipt className="w-3 h-3 text-amber-400" />}
                               {ev.type === 'Payment' && <CreditCard className="w-3 h-3 text-[#EAB308]" />}
                               {ev.type === 'Communication' && (ev.data.channel === 'WhatsApp' ? <MessageSquare className="w-3 h-3 text-[#EAB308]" /> : <Mail className="w-3 h-3 text-blue-400" />)}
                            </div>
                            {i !== events.length - 1 && <div className="w-px h-full bg-[#1F2430] my-1"></div>}
                          </div>
                          <div className="pb-4 flex-1">
                             <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-white text-xs">{ev.type}</span>
                                <span className="text-[10px] text-[#6B7280]">{formatDate(ev.date)}</span>
                             </div>
                             <div className="bg-[#11141D] p-3 rounded-lg border border-[#1F2430] text-[11px] text-[#9CA3AF]">
                                {ev.type === 'Quote' && <div>Quote {ev.data.quoteNumber} - {formatCurrency(ev.data.grandTotal, companySettings.defaultCurrency)} ({ev.data.status})</div>}
                                {ev.type === 'Invoice' && <div>Invoice {ev.data.invoiceNumber} - {formatCurrency(ev.data.grandTotal, companySettings.defaultCurrency)} ({ev.data.status})</div>}
                                {ev.type === 'Payment' && <div>Payment {ev.data.id} - {formatCurrency(ev.data.amount, companySettings.defaultCurrency)}</div>}
                                {ev.type === 'Communication' && <div>{ev.data.channel} • {ev.data.documentType}: {ev.data.message}</div>}
                             </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* 7. NOTES TAB */}
                {activeTab === 'notes' && (
                  <div className="space-y-3 font-mono">
                    {/* Header Banner */}
                    <div className="bg-[#11141D] p-3.5 rounded-lg border border-[#1F2430] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Lock className="w-4 h-4 text-[#EAB308]" />
                          <h3 className="font-bold text-sm text-white">Private Client Notes & Project Context</h3>
                          <span className="text-[9px] bg-yellow-950 text-yellow-200 border border-yellow-800/40 px-2 py-0.5 rounded font-bold">
                            INTERNAL ONLY
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                          Store confidential operational specs, crop varieties, farm topography, delivery gate codes, and project history for <strong className="text-white">{selectedClient.companyName}</strong>.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleCopyNotes}
                          disabled={!notesDraft}
                          className="px-2.5 py-1 bg-[#1A202C] hover:bg-[#252D3D] disabled:opacity-40 text-[#D1D5DB] border border-[#2D3748] text-xs rounded transition-colors flex items-center space-x-1"
                          title="Copy all notes to clipboard"
                        >
                          {copiedNotes ? (
                            <>
                              <Check className="w-3 h-3 text-[#EAB308]" />
                              <span className="text-[#EAB308]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#9CA3AF]" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          id="save-client-notes-top-btn"
                          type="button"
                          onClick={() => handleSaveNotes()}
                          disabled={isSavingNotes}
                          className="px-3 py-1 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-bold rounded shadow-sm transition-colors flex items-center space-x-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Insert Snippet Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-[#0A0B0E] p-2 rounded-lg border border-[#1F2430] text-xs">
                      <span className="text-[#6B7280] text-[10px] uppercase font-semibold mr-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Quick Insert:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('timestamp')}
                        className="px-2 py-0.5 bg-[#151924] hover:bg-[#1E2536] text-cyan-300 hover:text-cyan-200 border border-cyan-800/40 rounded text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Clock className="w-2.5 h-2.5" /> + Timestamp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('Project Specification')}
                        className="px-2 py-0.5 bg-[#151924] hover:bg-[#1E2536] text-yellow-200 hover:text-yellow-200 border border-yellow-800/40 rounded text-[10px] transition-colors"
                      >
                        + Project Brief
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('Farm & Site Specs')}
                        className="px-2 py-0.5 bg-[#151924] hover:bg-[#1E2536] text-yellow-200 hover:text-yellow-200 border border-yellow-800/40 rounded text-[10px] transition-colors"
                      >
                        + Farm / Site Specs
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('Logistics & Delivery Route')}
                        className="px-2 py-0.5 bg-[#151924] hover:bg-[#1E2536] text-amber-300 hover:text-amber-200 border border-amber-800/40 rounded text-[10px] transition-colors"
                      >
                        + Logistics / Route
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('Water & Soil Quality Spec')}
                        className="px-2 py-0.5 bg-[#151924] hover:bg-[#1E2536] text-purple-300 hover:text-purple-200 border border-purple-800/40 rounded text-[10px] transition-colors"
                      >
                        + Water & Soil Spec
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTag('Payment & Credit History')}
                        className="px-2 py-0.5 bg-[#151924] hover:bg-[#1E2536] text-rose-300 hover:text-rose-200 border border-rose-800/40 rounded text-[10px] transition-colors"
                      >
                        + Billing & Credit
                      </button>
                    </div>

                    {/* Rich Notes Text Area */}
                    <div className="relative">
                      <textarea
                        id="client-notes-textarea"
                        rows={12}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        onBlur={() => handleSaveNotes()}
                        placeholder={`Enter private notes and project context for ${selectedClient.companyName}...\n\nExamples:\n• Farm Specifications: 50 hectares dragon fruit orchard, trellis spacing 3m x 2.5m, drip irrigation.\n• Logistics: Delivery trucks enter via Gate 4 North-South Road. Depot offload hours 07:00 - 15:00.\n• Water & Soil: High alkaline soil (pH 7.8), foliar feeding required.\n• Commercial Contacts: Farm Manager Jan (072 123 4567), Packhouse Lead Thabo.\n• Important: Prefers rooted cuttings delivered in crates, not plastic bags.`}
                        className="w-full p-4 bg-[#0A0B0E] border border-[#252D3D] focus:border-[#EAB308]/80 rounded-lg text-xs font-mono text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-#EAB308/40 leading-relaxed transition-all"
                      />
                    </div>

                    {/* Bottom Status & Actions Bar */}
                    <div className="p-3 bg-[#11141D] rounded-lg border border-[#1F2430] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#9CA3AF]">
                      <div className="flex items-center space-x-3">
                        <span className="text-[11px]">
                          <strong>{noteWordCount}</strong> words • <strong>{noteCharCount}</strong> chars
                        </span>
                        <span>•</span>
                        {notesSaveStatus === 'saving' && (
                          <span className="text-cyan-400 flex items-center gap-1 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            Saving notes...
                          </span>
                        )}
                        {notesSaveStatus === 'saved' && (
                          <span className="text-[#EAB308] flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Saved to client record
                          </span>
                        )}
                        {notesSaveStatus === 'idle' && (
                          <span className="text-[10px] text-[#6B7280]">
                            {notesDraft !== (selectedClient.notes || '') ? (
                              <span className="text-amber-400 font-semibold">● Unsaved changes (auto-saves on blur)</span>
                            ) : (
                              'Auto-saved on blur'
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {notesDraft !== (selectedClient.notes || '') && (
                          <button
                            type="button"
                            onClick={() => setNotesDraft(selectedClient.notes || '')}
                            className="px-2.5 py-1 text-xs text-[#9CA3AF] hover:text-white hover:bg-[#1E2536] rounded transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revert</span>
                          </button>
                        )}
                        <button
                          id="save-client-notes-btn"
                          type="button"
                          onClick={() => handleSaveNotes()}
                          disabled={isSavingNotes}
                          className="px-4 py-1.5 bg-[#EAB308] hover:bg-#EAB308 disabled:opacity-50 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSavingNotes ? 'Saving...' : 'Save Client Notes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#11141D] rounded-xl border border-[#1F2430] text-[#6B7280] text-sm font-mono">
              Select a client to view their detailed profile, quotes, invoices, and special pricing.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141D] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#1F2430] text-[#E5E7EB] font-mono">
            <form onSubmit={handleSaveClient}>
              <div className="p-4 border-b border-[#1F2430] flex items-center justify-between sticky top-0 bg-[#11141D] z-10">
                <h3 className="text-base font-bold text-white font-mono">
                  {editingClient.id ? 'Edit Client Details' : 'Add New Client'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E2536]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Company / Farm Name *</label>
                    <input
                      type="text"
                      required
                      value={editingClient.companyName || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, companyName: e.target.value })}
                      placeholder="e.g. Smith Commercial Farms"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={editingClient.contactPerson || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, contactPerson: e.target.value })}
                      placeholder="e.g. John Smith"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editingClient.email || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                      placeholder="e.g. john@smithfarms.co.bw"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editingClient.phone || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                      placeholder="e.g. +267 71 234 567"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={editingClient.whatsapp || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, whatsapp: e.target.value })}
                      placeholder="e.g. +267 71 234 567"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Client Type</label>
                    <select
                      value={editingClient.clientType || 'Commercial Farm'}
                      onChange={(e) => setEditingClient({ ...editingClient, clientType: e.target.value as ClientType })}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                    >
                      <option value="Commercial Farm" className="bg-[#11141D]">Commercial Farm</option>
                      <option value="Wholesale" className="bg-[#11141D]">Wholesale</option>
                      <option value="Retailer" className="bg-[#11141D]">Retailer</option>
                      <option value="Distributor" className="bg-[#11141D]">Distributor</option>
                      <option value="Export" className="bg-[#11141D]">Export</option>
                      <option value="Standard" className="bg-[#11141D]">Standard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Billing Address</label>
                    <input
                      type="text"
                      value={editingClient.billingAddress || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, billingAddress: e.target.value })}
                      placeholder="e.g. Plot 104, Phakalane"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Shipping Address</label>
                    <input
                      type="text"
                      value={editingClient.shippingAddress || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, shippingAddress: e.target.value })}
                      placeholder="e.g. Smith Orchards Depot, North-South Road"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">City</label>
                    <input
                      type="text"
                      value={editingClient.city || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
                      placeholder="e.g. Gaborone"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Country</label>
                    <input
                      type="text"
                      value={editingClient.country || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, country: e.target.value })}
                      placeholder="e.g. Botswana / South Africa / Namibia"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">VAT / Tax Reg Number</label>
                    <input
                      type="text"
                      value={editingClient.vatNumber || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, vatNumber: e.target.value })}
                      placeholder="e.g. BW-92817462"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Payment Terms</label>
                    <input
                      type="text"
                      value={editingClient.paymentTerms || ''}
                      onChange={(e) => setEditingClient({ ...editingClient, paymentTerms: e.target.value })}
                      placeholder="e.g. EFT on invoice before dispatch"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-[#9CA3AF] flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-[#EAB308]" />
                      <span>Private Client Notes & Project Context (Internal Only)</span>
                    </label>
                    <span className="text-[10px] text-[#6B7280]">Never printed on customer invoices/quotes</span>
                  </div>
                  <textarea
                    rows={3}
                    value={editingClient.notes || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                    placeholder="Add confidential notes, farm topography, crop specs, preferred carriers, delivery gate codes..."
                    className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                  />
                </div>
              </div>

              <div className="p-3.5 border-t border-[#1F2430] bg-[#151924] flex items-center justify-end space-x-2.5 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-mono text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
