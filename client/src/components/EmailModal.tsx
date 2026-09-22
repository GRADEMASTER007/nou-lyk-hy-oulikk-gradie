import React, { useState } from 'react';
import { Mail, Copy, Check, ExternalLink, X, Send } from 'lucide-react';
import { Quote, Invoice } from '../types';
import { useApp } from '../lib/store';
import { formatCurrency, formatDate } from '../utils/calculator';

interface EmailModalProps {
  document: Quote | Invoice | null;
  type: 'Quote' | 'Invoice';
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ document, type, onClose }) => {
  const { companySettings, logCommunication, updateQuote, updateInvoice } = useApp();

  if (!document) return null;

  const isQuote = type === 'Quote';
  const docNumber = isQuote ? (document as Quote).quoteNumber : (document as Invoice).invoiceNumber;
  const clientName = document.clientSnapshot?.contactPerson || document.clientSnapshot?.companyName;
  const clientEmail = document.clientSnapshot?.email || '';

  const defaultSubject = `${companySettings.companyName} - ${isQuote ? 'Quotation' : 'Tax Invoice'} ${docNumber}`;

  const defaultBody = isQuote
    ? `Dear ${clientName},

Thank you for your interest in our premium dragon fruit plant material and agricultural solutions.

Please find our quotation ${docNumber} below:
- Total Amount: ${formatCurrency(document.grandTotal, document.currency)}
- Validity: 14 Days (until ${formatDate((document as Quote).validUntil)})
- Delivery Destination: ${document.shippingDetails || document.clientSnapshot?.country}

Payment terms: ${companySettings.paymentTerms}

Should you wish to proceed with this order, please confirm via return email or WhatsApp so we can schedule your plant material reservation and prepare export phyto documentation.

Warm regards,
${companySettings.ownerName}
${companySettings.companyName}
Tel: ${companySettings.phone}
Email: ${companySettings.email}`
    : `Dear ${clientName},

Please find attached your official Tax Invoice ${docNumber} from ${companySettings.companyName}.

Invoice Summary:
- Invoice Date: ${formatDate((document as Invoice).invoiceDate)}
- Due Date: ${formatDate((document as Invoice).dueDate)}
- Grand Total: ${formatCurrency(document.grandTotal, document.currency)}
- Balance Due: ${formatCurrency((document as Invoice).balanceDue, document.currency)}

Banking Details for EFT:
Bank: ${companySettings.bankName}
Account Name: ${companySettings.accountName}
Account Number: ${companySettings.accountNumber}
Branch Code: ${companySettings.branchCode}
Payment Reference: ${docNumber}

Please email your proof of payment to ${companySettings.email} to expedite delivery dispatch.

Thank you for your business!

Warm regards,
${companySettings.ownerName}
${companySettings.companyName}
Tel: ${companySettings.phone}`;

  const [to, setTo] = useState(clientEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailto = async () => {
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');

    // Auto log communication
    await logCommunication({
      clientId: document.clientId,
      clientName: document.clientSnapshot.companyName,
      channel: 'Email',
      recipient: to,
      subject,
      message: body,
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
            <div className="p-2 bg-[#1B2130] text-cyan-400 border border-[#252D3D] rounded-lg">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-mono">Compose & Dispatch Email</h3>
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
            <label className="block font-semibold text-[#9CA3AF] mb-1">To Email Address *</label>
            <input
              type="email"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#9CA3AF] mb-1">Subject Line *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[#9CA3AF]">Email Body</label>
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
              value={body}
              onChange={(e) => setBody(e.target.value)}
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
              Copy Text
            </button>
            <button
              type="button"
              onClick={handleOpenMailto}
              className="px-4 py-1.5 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch Mail Client</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
