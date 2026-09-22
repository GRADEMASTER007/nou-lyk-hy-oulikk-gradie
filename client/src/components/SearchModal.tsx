import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Users,
  Package,
  FileText,
  Receipt,
  Truck,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { NavSection } from './Navbar';
import { formatCurrency } from '../utils/calculator';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavSection) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { clients, products, quotes, invoices, shippingRates, knowledge: knowledgeBase } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled elsewhere
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingClients = q
    ? clients.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
      )
    : clients.slice(0, 3);

  const matchingProducts = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    : products.slice(0, 3);

  const matchingInvoices = q
    ? invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.clientSnapshot?.companyName?.toLowerCase().includes(q)
      )
    : invoices.slice(0, 3);

  const matchingQuotes = q
    ? quotes.filter(
        (quo) =>
          quo.quoteNumber.toLowerCase().includes(q) ||
          quo.clientSnapshot?.companyName?.toLowerCase().includes(q)
      )
    : quotes.slice(0, 3);

  const matchingKnowledge = q
    ? knowledgeBase.filter(
        (k) =>
          k.topic.toLowerCase().includes(q) ||
          k.content.toLowerCase().includes(q) ||
          k.category.toLowerCase().includes(q)
      )
    : knowledgeBase.slice(0, 2);

  const hasResults =
    matchingClients.length > 0 ||
    matchingProducts.length > 0 ||
    matchingInvoices.length > 0 ||
    matchingQuotes.length > 0 ||
    matchingKnowledge.length > 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="bg-[#11141D] border border-[#252D3D] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden font-mono text-xs">
        {/* Search Input Bar */}
        <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-[#1F2430] bg-[#0A0B0E]">
          <Search className="w-4 h-4 text-[#EAB308]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, dragon fruit cultivars, invoices, quotes, rules... (ESC to close)"
            className="flex-1 bg-transparent text-white placeholder-[#6B7280] focus:outline-none text-xs sm:text-sm font-mono"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#6B7280] hover:text-white p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[10px] bg-[#1A202C] text-[#9CA3AF] px-1.5 py-0.5 rounded border border-[#2D3748] hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!hasResults && (
            <div className="py-12 text-center text-[#6B7280]">
              <Search className="w-8 h-8 mx-auto mb-2 text-[#374151]" />
              <p className="text-white font-bold">No results found for "{query}"</p>
              <p className="text-[11px] mt-1">Try typing a cultivar name, client, or invoice number.</p>
            </div>
          )}

          {/* Clients Section */}
          {matchingClients.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#EAB308] uppercase tracking-wider font-bold px-2 py-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Clients ({matchingClients.length})
                </span>
                <button
                  onClick={() => {
                    onNavigate('clients');
                    onClose();
                  }}
                  className="hover:underline text-[10px] flex items-center gap-0.5 text-[#9CA3AF] hover:text-yellow-200"
                >
                  View all <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
              {matchingClients.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onNavigate('clients');
                    onClose();
                  }}
                  className="p-2 rounded-lg bg-[#0E1118] hover:bg-[#161B28] border border-[#1F2430] hover:border-[#EAB308]/50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-white text-xs">{c.companyName}</span>
                    <p className="text-[10px] text-[#9CA3AF]">{c.contactPerson} • {c.city}, {c.country}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-yellow-950 text-yellow-200 rounded">
                    {c.clientType}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Products Section */}
          {matchingProducts.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#EAB308] uppercase tracking-wider font-bold px-2 py-1">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> Products & Cultivars ({matchingProducts.length})
                </span>
                <button
                  onClick={() => {
                    onNavigate('products');
                    onClose();
                  }}
                  className="hover:underline text-[10px] flex items-center gap-0.5 text-[#9CA3AF] hover:text-yellow-200"
                >
                  View all <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
              {matchingProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onNavigate('products');
                    onClose();
                  }}
                  className="p-2 rounded-lg bg-[#0E1118] hover:bg-[#161B28] border border-[#1F2430] hover:border-[#EAB308]/50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-white text-xs">{p.name}</span>
                    <span className="text-[10px] text-[#6B7280] ml-2">SKU: {p.sku}</span>
                    <p className="text-[10px] text-[#9CA3AF]">{p.category}</p>
                  </div>
                  <span className="font-bold text-[#EAB308] text-xs">
                    {formatCurrency(p.standardPrice, p.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Invoices Section */}
          {matchingInvoices.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#EAB308] uppercase tracking-wider font-bold px-2 py-1">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-3 h-3" /> Invoices ({matchingInvoices.length})
                </span>
                <button
                  onClick={() => {
                    onNavigate('invoices');
                    onClose();
                  }}
                  className="hover:underline text-[10px] flex items-center gap-0.5 text-[#9CA3AF] hover:text-yellow-200"
                >
                  View all <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
              {matchingInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => {
                    onNavigate('invoices');
                    onClose();
                  }}
                  className="p-2 rounded-lg bg-[#0E1118] hover:bg-[#161B28] border border-[#1F2430] hover:border-[#EAB308]/50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-white text-xs">{inv.invoiceNumber}</span>
                    <span className="text-[10px] text-[#9CA3AF] ml-2">{inv.clientSnapshot?.companyName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#151924] text-[#D1D5DB] rounded">
                      {inv.status}
                    </span>
                    <span className="font-bold text-white text-xs">
                      {formatCurrency(inv.grandTotal, inv.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Knowledge Base Section */}
          {matchingKnowledge.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#EAB308] uppercase tracking-wider font-bold px-2 py-1">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> Knowledge Base & Policies
                </span>
                <button
                  onClick={() => {
                    onNavigate('knowledge');
                    onClose();
                  }}
                  className="hover:underline text-[10px] flex items-center gap-0.5 text-[#9CA3AF] hover:text-yellow-200"
                >
                  View all <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
              {matchingKnowledge.map((k) => (
                <div
                  key={k.id}
                  onClick={() => {
                    onNavigate('knowledge');
                    onClose();
                  }}
                  className="p-2 rounded-lg bg-[#0E1118] hover:bg-[#161B28] border border-[#1F2430] hover:border-[#EAB308]/50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-white text-xs">{k.topic}</span>
                    <p className="text-[10px] text-[#9CA3AF] line-clamp-1">{k.content}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#1A202C] text-[#EAB308] rounded">
                    {k.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0A0B0E] px-4 py-2 border-t border-[#1F2430] flex items-center justify-between text-[10px] text-[#6B7280]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3 h-3 text-[#EAB308]" />
            <span>Type anytime to filter • Press ESC to exit</span>
          </div>
          <span>ProAgriSA & Healthy Fields Unified Search</span>
        </div>
      </div>
    </div>
  );
};
