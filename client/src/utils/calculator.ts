import { Client, Product, ShippingRate, DocumentLineItem, Currency } from '../types';

export interface PricingResolution {
  unitPrice: number;
  priceSource: 'client_special' | 'wholesale' | 'standard' | 'retail' | 'manual';
  explanation: string;
}

/**
 * Resolves the unit price for a specific product and client deterministically.
 * Rule order:
 * 1. Client-specific price
 * 2. Client pricing tier (Wholesale/Commercial Farm/Distributor -> wholesale price)
 * 3. Standard selling price
 */
export function resolveClientProductPrice(client: Client | null | undefined, product: Product): PricingResolution {
  if (client && client.specialPricing && typeof client.specialPricing[product.id] === 'number' && client.specialPricing[product.id] > 0) {
    return {
      unitPrice: client.specialPricing[product.id],
      priceSource: 'client_special',
      explanation: `Special client price of ${formatCurrency(client.specialPricing[product.id], product.currency)} configured for ${client.companyName}`,
    };
  }

  if (client && (client.clientType === 'Wholesale' || client.clientType === 'Distributor' || client.clientType === 'Commercial Farm') && product.wholesalePrice > 0) {
    return {
      unitPrice: product.wholesalePrice,
      priceSource: 'wholesale',
      explanation: `Wholesale tier price of ${formatCurrency(product.wholesalePrice, product.currency)} based on client type (${client.clientType})`,
    };
  }

  if (client && client.clientType === 'Retailer' && product.retailPrice > 0) {
    return {
      unitPrice: product.retailPrice,
      priceSource: 'retail',
      explanation: `Retail tier price of ${formatCurrency(product.retailPrice, product.currency)}`,
    };
  }

  return {
    unitPrice: product.standardPrice,
    priceSource: 'standard',
    explanation: `Standard selling price of ${formatCurrency(product.standardPrice, product.currency)}`,
  };
}

/**
 * Calculate single line item
 */
export function calculateLineItem(item: Partial<DocumentLineItem> & { quantity: number; unitPrice: number; discountPercent?: number }): {
  discountAmount: number;
  lineTotal: number;
} {
  const quantity = Math.max(0, item.quantity || 0);
  const unitPrice = Math.max(0, item.unitPrice || 0);
  const discountPercent = Math.min(100, Math.max(0, item.discountPercent || 0));

  const grossTotal = quantity * unitPrice;
  const discountAmount = Number(((grossTotal * discountPercent) / 100).toFixed(2));
  const lineTotal = Number((grossTotal - discountAmount).toFixed(2));

  return {
    discountAmount,
    lineTotal,
  };
}

/**
 * Calculate totals for quote or invoice
 */
export function calculateDocumentTotals(
  items: DocumentLineItem[],
  shippingCost: number = 0,
  vatRate: number = 15,
  amountPaid: number = 0
) {
  const subtotal = Number(items.reduce((sum, item) => sum + (item.lineTotal || 0), 0).toFixed(2));
  const discountTotal = Number(items.reduce((sum, item) => sum + (item.discountAmount || 0), 0).toFixed(2));
  const cleanShipping = Math.max(0, Number(shippingCost) || 0);
  const cleanVatRate = Math.max(0, Number(vatRate) || 0);

  // In South Africa & Southern Africa standard invoicing, VAT is applied to (Subtotal + Shipping)
  const taxableBase = subtotal + cleanShipping;
  const vatAmount = Number(((taxableBase * cleanVatRate) / 100).toFixed(2));
  const grandTotal = Number((subtotal + cleanShipping + vatAmount).toFixed(2));
  const cleanAmountPaid = Math.max(0, Number(amountPaid) || 0);
  const balanceDue = Math.max(0, Number((grandTotal - cleanAmountPaid).toFixed(2)));

  return {
    subtotal,
    discountTotal,
    shippingCost: cleanShipping,
    vatRate: cleanVatRate,
    vatAmount,
    grandTotal,
    amountPaid: cleanAmountPaid,
    balanceDue,
  };
}

/**
 * Formats currency (default ZAR / R)
 */
export function formatCurrency(amount: number | undefined | null, currency: Currency | string = 'ZAR'): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  if (currency === 'ZAR') {
    return `R ${num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'USD') {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'BWP') {
    return `P ${num.toLocaleString('en-BW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'NAD') {
    return `N$ ${num.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'EUR') {
    return `€${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generates document numbers like QUO-2026-0001 or INV-2026-0001
 */
export function generateDocumentNumber(prefix: 'QUO' | 'INV', count: number): string {
  const year = new Date().getFullYear();
  const index = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${year}-${index}`;
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}
