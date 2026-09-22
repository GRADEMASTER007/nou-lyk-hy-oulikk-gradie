import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Loader2,
  FileText,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Download,
  Mail,
  MessageSquare,
  Eye,
  Building,
  Check,
  FileDown,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { NavSection } from './Navbar';
import {
  calculateDocumentTotals,
  formatCurrency,
  formatDate,
  generateDocumentNumber,
} from '../utils/calculator';
import { generateInvoicePDF, generateQuotePDF } from '../utils/pdfGenerator';
import { Quote, Invoice, DocumentLineItem, Client } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionDraft?: {
    type: 'create_quote' | 'create_invoice' | 'quote_preview' | 'invoice_preview';
    data: any;
  } | null;
  savedDocument?: {
    type: 'Quote' | 'Invoice';
    item: Quote | Invoice;
  } | null;
  timestamp: string;
}

interface AIAssistantViewProps {
  onNavigate: (section: NavSection) => void;
  onOpenEmailModal?: (doc: Quote | Invoice, type: 'Quote' | 'Invoice') => void;
  onOpenWhatsAppModal?: (doc: Quote | Invoice, type: 'Quote' | 'Invoice') => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  onNavigate,
  onOpenEmailModal,
  onOpenWhatsAppModal,
}) => {
  const {
    clients,
    products,
    shippingRates,
    companySettings,
    quotes,
    invoices,
    addQuote,
    addInvoice,
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **Healthy Fields & ProAgriSA AI Business Copilot**.

I have direct access to your client directory, special pricing matrices, product catalog, cross-border shipping rates, and live accounting ledger.

**Instant PDF Invoicing & Operations I can perform for you:**
- **Generate Tax Invoice & PDF**: *"Create an invoice for Gaborone Commercial Orchards with 500 Ruby Rose & give me a downloadable PDF"*
- **Draft Quotations**: *"Draft a quote for Namibia Dragon Fruit Projects for 300 White King plants with road freight to Namibia"*
- **Price Matrix Check**: *"What is the special price for Ruby Rose for Gaborone Commercial Orchards vs standard wholesale?"*
- **Audit Ledger**: *"Which invoices are currently unpaid and what is my total outstanding balance?"*
- **Official Address Verified**: *Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    'Create an invoice for Gaborone Commercial Orchards with 500 Ruby Rose & download PDF',
    'Draft a quotation for Namibia Dragon Fruit Projects with 300 White King & shipping to Namibia',
    'Which invoices are currently outstanding and what is the total balance due?',
    'What are the wholesale and special prices for Ruby Rose plants?',
  ];

  // Helper to build a temporary or concrete document from action draft
  const buildDocumentFromDraft = (actionDraft: { type: string; data: any }): {
    docType: 'Invoice' | 'Quote';
    client: Client;
    totals: ReturnType<typeof calculateDocumentTotals>;
    document: Invoice | Quote;
  } => {
    const isInvoice = actionDraft.type === 'create_invoice' || actionDraft.type === 'invoice_preview';
    const client =
      clients.find((c) => c.id === actionDraft.data.clientId) ||
      clients.find(
        (c) =>
          c.companyName.toLowerCase().includes((actionDraft.data.clientName || '').toLowerCase()) ||
          (actionDraft.data.clientName || '').toLowerCase().includes(c.companyName.toLowerCase())
      ) ||
      clients[0];

    const totals = calculateDocumentTotals(
      actionDraft.data.items || [],
      actionDraft.data.shippingCost || 0,
      actionDraft.data.vatRate ?? companySettings.defaultVatRate,
      0
    );

    const clientSnapshot = {
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
    };

    if (isInvoice) {
      const inv: Invoice = {
        id: `temp-${Date.now()}`,
        invoiceNumber: actionDraft.data.invoiceNumber || generateDocumentNumber('INV', invoices.length + 1),
        clientId: client.id,
        clientSnapshot,
        invoiceDate: actionDraft.data.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: actionDraft.data.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        items: actionDraft.data.items || [],
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        shippingCost: totals.shippingCost,
        shippingDetails: actionDraft.data.shippingDetails || 'Road Freight',
        vatRate: totals.vatRate,
        vatAmount: totals.vatAmount,
        grandTotal: totals.grandTotal,
        amountPaid: 0,
        balanceDue: totals.grandTotal,
        currency: client.currency || companySettings.defaultCurrency,
        paymentInstructions: companySettings.paymentInstructions,
        bankingSnapshot: {
          bankName: companySettings.bankName,
          accountName: companySettings.accountName,
          accountNumber: companySettings.accountNumber,
          branchCode: companySettings.branchCode,
          swiftCode: companySettings.swiftCode,
        },
        notes: actionDraft.data.notes || 'Generated by Healthy Fields AI Copilot',
        terms: companySettings.invoiceTerms,
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { docType: 'Invoice', client, totals, document: inv };
    } else {
      const quote: Quote = {
        id: `temp-${Date.now()}`,
        quoteNumber: actionDraft.data.quoteNumber || generateDocumentNumber('QUO', quotes.length + 1),
        clientId: client.id,
        clientSnapshot,
        quoteDate: actionDraft.data.quoteDate || new Date().toISOString().split('T')[0],
        validUntil: actionDraft.data.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        items: actionDraft.data.items || [],
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        shippingCost: totals.shippingCost,
        shippingDetails: actionDraft.data.shippingDetails || 'Road Freight',
        vatRate: totals.vatRate,
        vatAmount: totals.vatAmount,
        grandTotal: totals.grandTotal,
        currency: client.currency || companySettings.defaultCurrency,
        paymentTerms: client.paymentTerms || companySettings.paymentTerms,
        notes: actionDraft.data.notes || 'Generated by Healthy Fields AI Copilot',
        terms: companySettings.paymentTerms,
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { docType: 'Quote', client, totals, document: quote };
    }
  };

  // Direct download PDF without saving
  const handleDownloadDraftPDF = (actionDraft: { type: string; data: any }) => {
    try {
      const { docType, document } = buildDocumentFromDraft(actionDraft);
      if (docType === 'Invoice') {
        const inv = document as Invoice;
        const doc = generateInvoicePDF(inv, companySettings);
        doc.save(`${inv.invoiceNumber}_${inv.clientSnapshot.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        setActionSuccessMessage(`Generated & Downloaded PDF for Tax Invoice ${inv.invoiceNumber}!`);
      } else {
        const qte = document as Quote;
        const doc = generateQuotePDF(qte, companySettings);
        doc.save(`${qte.quoteNumber}_${qte.clientSnapshot.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        setActionSuccessMessage(`Generated & Downloaded PDF for Quotation ${qte.quoteNumber}!`);
      }
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`Failed to generate PDF: ${err.message}`);
    }
  };

  // Direct download of an existing saved invoice or quote
  const handleDownloadSavedDocPDF = (doc: Quote | Invoice, type: 'Quote' | 'Invoice') => {
    try {
      if (type === 'Invoice') {
        const inv = doc as Invoice;
        const pdf = generateInvoicePDF(inv, companySettings);
        pdf.save(`${inv.invoiceNumber}_${inv.clientSnapshot.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        setActionSuccessMessage(`Downloaded PDF for Tax Invoice ${inv.invoiceNumber}!`);
      } else {
        const qte = doc as Quote;
        const pdf = generateQuotePDF(qte, companySettings);
        pdf.save(`${qte.quoteNumber}_${qte.clientSnapshot.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        setActionSuccessMessage(`Downloaded PDF for Quotation ${qte.quoteNumber}!`);
      }
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`Failed to download PDF: ${err.message}`);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Build conversation history payload
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history,
          context: {
            clients,
            products,
            shippingRates,
            companySettings,
            quotesSummary: {
              total: quotes.length,
              pending: quotes.filter((q) => q.status === 'Sent' || q.status === 'Draft').length,
            },
            invoicesSummary: {
              total: invoices.length,
              outstanding: invoices.filter((i) => i.status !== 'Paid'),
              totalPaid: invoices.reduce((s, i) => s + (i.amountPaid || 0), 0),
            },
          },
        }),
      });

      const data = await response.json();

      let assistantText = data.content || data.text || 'I processed your request.';
      let actionDraft = data.actionDraft || null;

      // Check if text contains action_draft or json_action block
      const actionDraftMatch = assistantText.match(/```(?:action_draft|json_action)\s*([\s\S]*?)\s*```/);
      if (actionDraftMatch && actionDraftMatch[1]) {
        try {
          actionDraft = JSON.parse(actionDraftMatch[1]);
          if (actionDraft.type === 'invoice_preview') actionDraft.type = 'create_invoice';
          if (actionDraft.type === 'quote_preview') actionDraft.type = 'create_quote';
          assistantText = assistantText.replace(/```(?:action_draft|json_action)[\s\S]*?```/, '').trim();
        } catch (e) {
          console.error('Error parsing action draft JSON:', e);
        }
      }

      // Check if user specifically asked to create an invoice/quote or download PDF
      const lower = messageText.toLowerCase();
      if (!actionDraft && (lower.includes('invoice') || lower.includes('quote') || lower.includes('pdf'))) {
        // Try local matching to create an immediate draft
        const matchedClient = clients.find(
          (c) =>
            lower.includes(c.companyName.toLowerCase()) ||
            lower.includes(c.contactPerson.toLowerCase()) ||
            (c.country && lower.includes(c.country.toLowerCase()))
        );

        if (matchedClient) {
          const isQuote = lower.includes('quote') || lower.includes('quotation');
          // Find matched products
          const matchedProducts = products.filter(
            (p) => lower.includes(p.name.toLowerCase()) || lower.includes(p.sku.toLowerCase())
          );
          const targetProducts = matchedProducts.length > 0 ? matchedProducts : [products[0]];

          // Quantity parsing (e.g. "500", "300")
          const qtyMatch = messageText.match(/(\d+)\s*(?:plants?|units?|boxes?|trays?|x)?/i);
          const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 500;

          // Find shipping cost
          const ship = shippingRates.find((s) => s.destinationCountry.toLowerCase() === matchedClient.country.toLowerCase()) || shippingRates[0];
          const shippingCost = ship ? ship.cost : 0;

          const items: DocumentLineItem[] = targetProducts.map((p) => {
            const special = matchedClient.specialPricing?.[p.id];
            const unitPrice = special ?? p.wholesalePrice ?? p.standardPrice;
            return {
              productId: p.id,
              sku: p.sku,
              name: p.name,
              unit: p.unit,
              quantity: qty,
              unitPrice,
              discountPercent: 0,
              discountAmount: 0,
              lineTotal: qty * unitPrice,
              priceSource: special ? 'client_special' : 'wholesale',
            };
          });

          actionDraft = {
            type: isQuote ? 'create_quote' : 'create_invoice',
            title: isQuote ? `Quotation for ${matchedClient.companyName}` : `Tax Invoice for ${matchedClient.companyName}`,
            summary: `${items.length} product(s) for ${matchedClient.companyName} with PDF download ready`,
            data: {
              clientId: matchedClient.id,
              clientName: matchedClient.companyName,
              items,
              shippingCost,
              shippingDetails: ship ? `${ship.shippingCompany} to ${ship.destinationCountry}` : 'Road Freight',
              vatRate: companySettings.defaultVatRate,
            },
          };
        }
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: assistantText,
        actionDraft,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);

      // If user explicitly asked for "and download pdf", auto trigger PDF generation after 300ms
      if (actionDraft && lower.includes('download') && lower.includes('pdf')) {
        setTimeout(() => {
          handleDownloadDraftPDF(actionDraft);
        }, 400);
      }
    } catch (err: any) {
      console.error('AI chat failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Notice: Could not connect to the remote AI service (${err.message || 'Check connection'}). You can still use the prompt templates below or generate documents directly in Quotes and Invoices!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (
    actionDraft: { type: string; data: any },
    messageId: string,
    autoDownloadPdf = false
  ) => {
    try {
      const isInvoice = actionDraft.type === 'create_invoice' || actionDraft.type === 'invoice_preview';
      const client =
        clients.find((c) => c.id === actionDraft.data.clientId) ||
        clients.find((c) => c.companyName === actionDraft.data.clientName) ||
        clients[0];

      const totals = calculateDocumentTotals(
        actionDraft.data.items || [],
        actionDraft.data.shippingCost || 0,
        actionDraft.data.vatRate ?? companySettings.defaultVatRate,
        0
      );

      const clientSnapshot = {
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
      };

      if (!isInvoice) {
        // Create Quote
        const created = await addQuote({
          clientId: client.id,
          clientSnapshot,
          quoteDate: actionDraft.data.quoteDate || new Date().toISOString().split('T')[0],
          validUntil: actionDraft.data.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          items: actionDraft.data.items || [],
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          shippingCost: totals.shippingCost,
          shippingDetails: actionDraft.data.shippingDetails || 'Road Freight',
          vatRate: totals.vatRate,
          vatAmount: totals.vatAmount,
          grandTotal: totals.grandTotal,
          currency: client.currency || companySettings.defaultCurrency,
          paymentTerms: client.paymentTerms || companySettings.paymentTerms,
          notes: actionDraft.data.notes || 'Created via AI Assistant',
          terms: companySettings.paymentTerms,
          status: 'Draft',
        });

        // Update message state with saved document
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, savedDocument: { type: 'Quote', item: created }, actionDraft: null }
              : m
          )
        );

        if (autoDownloadPdf) {
          const doc = generateQuotePDF(created, companySettings);
          doc.save(`${created.quoteNumber}_${created.clientSnapshot.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
          setActionSuccessMessage(`Successfully saved Quotation ${created.quoteNumber} and downloaded PDF!`);
        } else {
          setActionSuccessMessage(`Successfully created & saved Quotation ${created.quoteNumber}!`);
        }
        setTimeout(() => setActionSuccessMessage(null), 5000);
      } else {
        // Create Invoice
        const created = await addInvoice({
          clientId: client.id,
          clientSnapshot,
          invoiceDate: actionDraft.data.invoiceDate || new Date().toISOString().split('T')[0],
          dueDate: actionDraft.data.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          items: actionDraft.data.items || [],
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          shippingCost: totals.shippingCost,
          shippingDetails: actionDraft.data.shippingDetails || 'Road Freight',
          vatRate: totals.vatRate,
          vatAmount: totals.vatAmount,
          grandTotal: totals.grandTotal,
          amountPaid: 0,
          balanceDue: totals.grandTotal,
          currency: client.currency || companySettings.defaultCurrency,
          paymentInstructions: companySettings.paymentInstructions,
          bankingSnapshot: {
            bankName: companySettings.bankName,
            accountName: companySettings.accountName,
            accountNumber: companySettings.accountNumber,
            branchCode: companySettings.branchCode,
            swiftCode: companySettings.swiftCode,
          },
          notes: actionDraft.data.notes || 'Created via AI Assistant',
          terms: companySettings.invoiceTerms,
          status: 'Draft',
        });

        // Update message state with saved document
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, savedDocument: { type: 'Invoice', item: created }, actionDraft: null }
              : m
          )
        );

        if (autoDownloadPdf) {
          const doc = generateInvoicePDF(created, companySettings);
          doc.save(`${created.invoiceNumber}_${created.clientSnapshot.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
          setActionSuccessMessage(`Successfully saved Tax Invoice ${created.invoiceNumber} and downloaded PDF!`);
        } else {
          setActionSuccessMessage(`Successfully created & saved Tax Invoice ${created.invoiceNumber}!`);
        }
        setTimeout(() => setActionSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      alert(`Error saving document from AI draft: ${err.message}`);
    }
  };

  return (
    <div className="space-y-3.5 max-w-5xl mx-auto font-mono">
      {/* Header Banner */}
      <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#1B2130] text-[#EAB308] border border-[#EAB308]/30 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold font-mono text-white tracking-tight">
                Healthy Fields & ProAgriSA AI Business Copilot
              </h1>
              <span className="text-[9px] bg-yellow-950 text-[#EAB308] border border-yellow-800/40 px-1.5 py-0.5 rounded font-mono font-bold">
                PDF ENGINE READY
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#9CA3AF]">
              Instant quotes, Tax Invoices, downloadable official PDFs, pricing matrices & ledger audit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setMessages([
                {
                  id: 'reset',
                  sender: 'assistant',
                  text: 'Chat history cleared. How may I assist you with your farming invoices, quotations, or PDF generation today?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1B2130] hover:bg-[#252D3D] text-[#9CA3AF] hover:text-white border border-[#252D3D] rounded-lg text-xs font-mono transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="p-3 bg-yellow-950/60 border border-yellow-800/80 rounded-xl text-xs text-yellow-200 flex items-center justify-between font-mono animate-fade-in shadow-md">
          <span className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#EAB308] shrink-0" />
            {actionSuccessMessage}
          </span>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs text-[#EAB308] underline font-semibold hover:text-yellow-200"
          >
            View Invoices Ledger →
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 sm:p-5 min-h-[460px] max-h-[580px] overflow-y-auto space-y-3.5 font-mono">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div
                className={`p-1.5 rounded-lg flex-shrink-0 border ${
                  isUser
                    ? 'bg-yellow-950/60 text-yellow-200 border-yellow-700/50'
                    : 'bg-[#1B2130] text-cyan-400 border-[#252D3D]'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[90%] sm:max-w-[82%] rounded-xl p-3.5 text-xs font-mono space-y-2 border ${
                  isUser
                    ? 'bg-[#151F28] text-yellow-200 border-yellow-800/40 rounded-tr-none'
                    : 'bg-[#151924] text-[#E5E7EB] border-[#1F2430] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed space-y-1">
                  {msg.text.split('\n').map((line, idx) => {
                    const formatted = line.replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-white font-bold">$1</strong>'
                    );
                    return (
                      <p
                        key={idx}
                        className={line.startsWith('- ') ? 'ml-2 list-disc list-inside text-[#D1D5DB]' : ''}
                        dangerouslySetInnerHTML={{ __html: formatted }}
                      />
                    );
                  })}
                </div>

                {/* Render Interactive Action Draft Card if generated by AI */}
                {msg.actionDraft && (
                  <div className="mt-3 bg-[#0A0B0E] p-3.5 rounded-lg border border-yellow-800/60 shadow-md space-y-2.5 font-mono">
                    <div className="flex items-center justify-between border-b border-[#1F2430] pb-2">
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                        {msg.actionDraft.type === 'create_quote' || msg.actionDraft.type === 'quote_preview' ? (
                          <FileText className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Receipt className="w-4 h-4 text-[#EAB308]" />
                        )}
                        <span>
                          {msg.actionDraft.type === 'create_quote' || msg.actionDraft.type === 'quote_preview'
                            ? 'Quotation Draft & PDF Ready'
                            : 'Tax Invoice Draft & PDF Ready'}
                        </span>
                      </span>
                      <span className="text-[9px] px-2 py-0.5 bg-yellow-950 text-yellow-200 border border-yellow-700/50 rounded font-bold uppercase">
                        Download / Save Ready
                      </span>
                    </div>

                    <div className="text-[11px] text-[#9CA3AF] space-y-1 bg-[#11141D] p-2.5 rounded border border-[#1F2430]">
                      <div className="flex justify-between items-center">
                        <span>Client:</span>
                        <strong className="text-white">
                          {msg.actionDraft.data.clientName || 'Assigned Client'}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Line Items:</span>
                        <strong className="text-white">
                          {msg.actionDraft.data.items?.length || 0} Products (
                          {msg.actionDraft.data.items?.reduce(
                            (s: number, i: any) => s + (i.quantity || 0),
                            0
                          )}{' '}
                          units)
                        </strong>
                      </div>
                      {msg.actionDraft.data.shippingCost !== undefined && (
                        <div className="flex justify-between items-center">
                          <span>Freight / Shipping:</span>
                          <strong className="text-[#EAB308]">
                            {formatCurrency(msg.actionDraft.data.shippingCost)}
                          </strong>
                        </div>
                      )}
                      {msg.actionDraft.data.grandTotal !== undefined && (
                        <div className="flex justify-between items-center pt-1 border-t border-[#1F2430] text-xs">
                          <span className="font-bold text-white">Calculated Grand Total:</span>
                          <strong className="text-[#EAB308] font-bold font-mono">
                            {formatCurrency(msg.actionDraft.data.grandTotal)}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for AI Draft */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Save and Download PDF */}
                      <button
                        onClick={() => handleExecuteAction(msg.actionDraft!, msg.id, true)}
                        className="py-2 px-3 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>⚡ Save & Download PDF</span>
                      </button>

                      {/* Download PDF directly without saving */}
                      <button
                        onClick={() => handleDownloadDraftPDF(msg.actionDraft!)}
                        className="py-2 px-3 bg-[#1A2333] hover:bg-[#232F45] text-[#EAB308] border border-yellow-700/40 text-xs font-mono font-bold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-1.5"
                      >
                        <FileDown className="w-3.5 h-3.5 shrink-0 text-[#EAB308]" />
                        <span>📥 Download PDF Now</span>
                      </button>

                      {/* Save to ledger only */}
                      <button
                        onClick={() => handleExecuteAction(msg.actionDraft!, msg.id, false)}
                        className="py-1.5 px-3 bg-[#1E2536] hover:bg-[#2A344A] text-[#D1D5DB] border border-[#2D3748] text-xs font-mono rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-3 h-3" />
                        <span>Confirm & Save to Ledger</span>
                      </button>

                      {/* View Draft Details */}
                      <button
                        onClick={() => {
                          const isQuote =
                            msg.actionDraft!.type === 'create_quote' ||
                            msg.actionDraft!.type === 'quote_preview';
                          onNavigate(isQuote ? 'quotes' : 'invoices');
                        }}
                        className="py-1.5 px-3 bg-[#1E2536] hover:bg-[#2A344A] text-[#9CA3AF] hover:text-white border border-[#2D3748] text-xs font-mono rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Open Invoices / Quotes Tab</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Render Saved Document Card if just saved by AI */}
                {msg.savedDocument && (
                  <div className="mt-3 bg-[#0A0B0E] p-3.5 rounded-lg border border-#EAB308/50 shadow-md space-y-2.5 font-mono animate-fade-in">
                    <div className="flex items-center justify-between border-b border-[#1F2430] pb-2">
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-[#EAB308]" />
                        <span>
                          {msg.savedDocument.type === 'Invoice'
                            ? `Tax Invoice ${(msg.savedDocument.item as Invoice).invoiceNumber}`
                            : `Quotation ${(msg.savedDocument.item as Quote).quoteNumber}`}
                        </span>
                      </span>
                      <span className="text-[9px] px-2 py-0.5 bg-yellow-950 text-[#EAB308] border border-yellow-800/40 rounded font-bold">
                        Saved in Database
                      </span>
                    </div>

                    <div className="text-[11px] text-[#9CA3AF] space-y-1">
                      <p>
                        Client: <strong className="text-white">{msg.savedDocument.item.clientSnapshot.companyName}</strong>
                      </p>
                      <p>
                        Grand Total:{' '}
                        <strong className="text-[#EAB308] font-bold">
                          {formatCurrency(msg.savedDocument.item.grandTotal, msg.savedDocument.item.currency)}
                        </strong>
                      </p>
                    </div>

                    {/* Actions on saved document */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        onClick={() => handleDownloadSavedDocPDF(msg.savedDocument!.item, msg.savedDocument!.type)}
                        className="px-2.5 py-1.5 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download Official PDF</span>
                      </button>

                      {onOpenEmailModal && (
                        <button
                          onClick={() => onOpenEmailModal(msg.savedDocument!.item, msg.savedDocument!.type)}
                          className="px-2.5 py-1.5 bg-[#1B2130] hover:bg-[#252D3D] text-cyan-300 border border-cyan-800/40 text-xs rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email PDF</span>
                        </button>
                      )}

                      {onOpenWhatsAppModal && (
                        <button
                          onClick={() => onOpenWhatsAppModal(msg.savedDocument!.item, msg.savedDocument!.type)}
                          className="px-2.5 py-1.5 bg-[#1B2130] hover:bg-[#252D3D] text-yellow-200 border border-yellow-800/40 text-xs rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate(msg.savedDocument!.type === 'Invoice' ? 'invoices' : 'quotes')}
                        className="px-2.5 py-1.5 bg-[#1B2130] hover:bg-[#252D3D] text-[#D1D5DB] border border-[#252D3D] text-xs rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View in Ledger</span>
                      </button>
                    </div>
                  </div>
                )}

                <span className="text-[9px] text-[#6B7280] block text-right pt-0.5 font-mono">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[#1B2130] text-cyan-400 border border-[#252D3D]">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-[#151924] rounded-xl rounded-tl-none p-3 border border-[#1F2430] text-xs text-[#9CA3AF] font-mono flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EAB308]" />
              <span>Analyzing catalog, client matrix & generating invoice calculations and PDF...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="space-y-1 font-mono">
        <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider block">
          One-Click Prompts & Invoice PDF Requests:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] px-2.5 py-1 bg-[#11141D] hover:bg-[#1B2130] hover:text-white text-[#9CA3AF] rounded-lg border border-[#1F2430] hover:border-[#252D3D] transition-colors text-left font-mono"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-2 flex items-center space-x-2 font-mono">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="e.g. 'Create an invoice for Gaborone Commercial Orchards with 500 Ruby Rose & download PDF'..."
          className="flex-1 p-2 bg-transparent text-xs text-white placeholder-[#6B7280] font-mono focus:outline-none resize-none"
        />

        <button
          id="ai-send-btn"
          disabled={!input.trim() || isLoading}
          onClick={() => handleSendMessage()}
          className={`p-2.5 rounded-lg font-mono transition-colors ${
            input.trim() && !isLoading
              ? 'bg-[#EAB308] text-black hover:bg-#EAB308 shadow-sm font-bold'
              : 'bg-[#1B2130] text-[#6B7280] cursor-not-allowed border border-[#252D3D]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
