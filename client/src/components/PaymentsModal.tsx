import React, { useState } from 'react';
import { CreditCard, DollarSign, X, Check } from 'lucide-react';
import { Invoice, PaymentMethod } from '../types';
import { useApp } from '../lib/store';
import { formatCurrency, formatDate } from '../utils/calculator';

interface PaymentsModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const PaymentsModal: React.FC<PaymentsModalProps> = ({ invoice, onClose }) => {
  const { recordPayment } = useApp();

  const [amount, setAmount] = useState<number>(invoice ? invoice.balanceDue : 0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFT / Bank Transfer');
  const [reference, setReference] = useState<string>(invoice ? `EFT-${invoice.invoiceNumber}` : '');
  const [notes, setNotes] = useState<string>('');

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    await recordPayment({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      clientName: invoice.clientSnapshot.companyName,
      amount,
      currency: invoice.currency,
      paymentDate,
      paymentMethod,
      reference,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#11141D] rounded-xl max-w-md w-full shadow-2xl border border-[#1F2430] overflow-hidden font-mono text-[#E5E7EB]">
        <form onSubmit={handleSubmit}>
          <div className="p-4 border-b border-[#1F2430] flex items-center justify-between bg-[#11141D]">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-[#1B2130] rounded-lg text-[#EAB308] border border-yellow-800/40">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm font-mono">Record Payment</h3>
                <p className="text-[10px] text-[#6B7280] font-mono">{invoice.invoiceNumber} • {invoice.clientSnapshot?.companyName}</p>
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
            {/* Invoice Summary Box */}
            <div className="bg-[#0A0B0E] rounded-lg p-3 border border-[#1F2430] space-y-1 font-mono">
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Invoice Grand Total:</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-[#EAB308]">
                <span>Already Paid:</span>
                <span className="font-mono font-semibold">{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold pt-1 border-t border-[#1F2430]">
                <span>Current Balance Due:</span>
                <span className="font-mono">{formatCurrency(invoice.balanceDue, invoice.currency)}</span>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Payment Amount (R) *</label>
              <input
                type="number"
                step="0.01"
                required
                max={invoice.balanceDue}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-sm font-mono font-bold text-[#EAB308] focus:outline-none focus:border-[#EAB308]"
              />
              <button
                type="button"
                onClick={() => setAmount(invoice.balanceDue)}
                className="text-[10px] text-[#EAB308] hover:text-yellow-200 font-semibold mt-1"
              >
                Set to Full Balance ({formatCurrency(invoice.balanceDue, invoice.currency)})
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-[#9CA3AF] mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#9CA3AF] mb-1">Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
                >
                  <option value="EFT" className="bg-[#11141D]">EFT / Bank Transfer</option>
                  <option value="Direct Deposit" className="bg-[#11141D]">Direct Cash Deposit</option>
                  <option value="Cash" className="bg-[#11141D]">Cash</option>
                  <option value="Credit Card" className="bg-[#11141D]">Credit Card</option>
                  <option value="Other" className="bg-[#11141D]">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Bank Reference / POP Ref *</label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. FNB-REF-98124"
                className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Internal Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Proof of payment received via WhatsApp"
                className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 border-t border-[#1F2430] bg-[#151924] flex items-center justify-end space-x-2.5 rounded-b-xl font-mono">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono text-[#9CA3AF] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
