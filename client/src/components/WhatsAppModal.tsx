import React, { useState } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, X, Send } from 'lucide-react';
import { Quote, Invoice } from '../types';
import { useApp } from '../lib/store';
import { formatCurrency, formatDate } from '../utils/calculator';

interface WhatsAppModalProps {
  document: Quote | Invoice | null;
  type: 'Quote' | 'Invoice';
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ document, type, onClose }) => {
  const { companySettings, logCommunication, updateQuote, updateInvoice } = useApp();

  if (!document) return null;

  const isQuote = type === 'Quote';
  const docNumber = isQuote ? (document as Quote).quoteNumber : (document as Invoice).invoiceNumber;
  const clientName = document.clientSnapshot?.contactPerson || document.clientSnapshot?.companyName;
  const rawPhone = document.clientSnapshot?.whatsapp || document.clientSnapshot?.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

  const defaultMessage = isQuote
    ? `*${companySettings.companyName} - Quotation ${docNumber}*

Hi ${clientName},

Here is the summary of your requested quotation:
• *Quote Number:* ${docNumber}
• *Total Amount:* ${formatCurrency(document.grandTotal, document.currency)}
• *Valid Until:* ${formatDate((document as Quote).validUntil)}
• *Delivery Route:* ${document.shippingDetails || document.clientSnapshot?.country}

Payment terms: ${companySettings.paymentTerms}

Please let us know if you would like us to reserve your plant materials and generate the official tax invoice.

Kind regards,
*${companySettings.ownerName}*
${companySettings.companyName}`
    : `*${companySettings.companyName} - Tax Invoice ${docNumber}*

Hi ${clientName},

Here is your official invoice details:
• *Invoice Number:* ${docNumber}
• *Due Date:* ${formatDate((document as Invoice).dueDate)}
• *Grand Total:* ${formatCurrency(document.grandTotal, document.currency)}
• *Balance Due:* ${formatCurrency((document as Invoice).balanceDue, document.currency)}

*EFT Banking Details:*
• Bank: ${companySettings.bankName}
• Account: ${companySettings.accountName}
• Account No: ${companySettings.accountNumber}
• Branch Code: ${companySettings.branchCode}
• Ref: ${docNumber}

Please send proof of payment to ${companySettings.email} once transferred. Thank you!`;

  const [phone, setPhone] = useState(rawPhone);
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = async () => {
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    // Auto log communication
    await logCommunication({
      clientId: document.clientId,
      clientName: document.clientSnapshot.companyName,
      channel: 'WhatsApp',
      recipient: phone,
      subject: `WhatsApp ${type} ${docNumber}`,
      message,
      documentType: type,
      documentId: document.id,
      documentNumber: docNumber,
      status: 'Sent',
    });

    // Update document status if draft
    if (document.status === 'Draft') {
      if (isQuote) {
        await updateQuote(document.id, { status: 'Sent' });
      } else {
        await updateInvoice(document.id, { status: 'Sent' });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#11141D] rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#1F2430] font-mono text-[#E5E7EB]">
        <div className="p-4 border-b border-[#1F2430] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#1B2130] text-[#EAB308] border border-yellow-800/40 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-mono">Send via WhatsApp</h3>
              <p className="text-[10px] text-[#6B7280] font-mono">{docNumber} • {document.clientSnapshot?.companyName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E2536]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs font-mono">
          <div>
            <label className="block font-semibold text-[#9CA3AF] mb-1">WhatsApp Phone Number (with country code) *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 27821234567 or 26771234567"
              className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[#9CA3AF]">WhatsApp Message</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] text-[#EAB308] hover:text-yellow-200 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3 h-3 text-[#EAB308]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono leading-relaxed text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>
        </div>

        <div className="p-3.5 border-t border-[#1F2430] bg-[#151924] flex items-center justify-between rounded-b-xl font-mono">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono text-[#9CA3AF] hover:text-white"
          >
            Cancel
          </button>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#1B2130] border border-[#252D3D] text-[#D1D5DB] text-xs font-mono rounded-lg hover:text-white hover:bg-[#252D3D] transition-colors"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-4 py-1.5 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
