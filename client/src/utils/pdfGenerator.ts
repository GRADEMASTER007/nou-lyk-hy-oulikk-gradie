import jsPDF from 'jspdf';
import { Quote, Invoice, CompanySettings } from '../types';
import { formatCurrency, formatDate } from './calculator';

// Color Palette Constants for High-Density Technical/Financial PDFs
const COLOR_HEADER_BG = [15, 23, 42]; // Slate-900 / Obsidian Luxury
const COLOR_YELLOW_ACCENT = [234, 179, 8]; // Amber / Vivid Gold Yellow (#EAB308)
const COLOR_YELLOW_LIGHT = [254, 240, 138]; // Yellow-200 / Highlight (#FEF08A)
const COLOR_WHITE = [255, 255, 255]; // Pure White
const COLOR_DARK_TEXT = [30, 41, 59]; // Slate-800
const COLOR_MUTED_TEXT = [100, 116, 139]; // Slate-500
const COLOR_LIGHT_BG = [248, 250, 252]; // Slate-50

// Credit & Debit Color Indicators
const COLOR_CREDIT_GREEN = [22, 163, 74]; // Emerald / Green-600 (Credit, Paid, Settled)
const COLOR_CREDIT_BG = [240, 253, 244]; // Green-50
const COLOR_DEBIT_RED = [220, 38, 38]; // Red-600 (Debit, Balance Due, Payable)
const COLOR_DEBIT_BG = [254, 242, 242]; // Red-50

/**
 * Generates a High-Density, Professional TAX INVOICE PDF
 * with Yellow accent lines, White/Yellow text styling, and Green/Red Credit & Debit indicators.
 */
export function generateInvoicePDF(invoice: Invoice, company: CompanySettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = 0;

  // 1. TOP HEADER BANNER (Obsidian Slate with Yellow Accent Line)
  const headerHeight = 36;
  doc.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Vivid Yellow Accent Line along the bottom of the header
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(0, headerHeight - 1.5, pageWidth, 1.5, 'F');

  // Company Name in White & Yellow Accent
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company.companyName || 'Healthy Fields Business Hub', margin, 12);

  if (company.tradingName && company.tradingName !== company.companyName) {
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
    doc.text(`Trading as: ${company.tradingName}`, margin, 17);
  }

  // Company Address & Contacts in White/Muted
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(
    company.physicalAddress ||
      'Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739',
    margin,
    22
  );
  doc.text(
    `WhatsApp: ${company.whatsapp || company.phone || '+27 83 447 4639'}  |  Email: ${company.email || 'admin@proagrisa.co.za'}`,
    margin,
    26.5
  );
  doc.text(
    `VAT Reg: ${company.vatNumber || '4820293819'}  |  Co Reg: ${company.registrationNumber || '2021/847291/07'}  |  Web: ${company.website || 'proagrisa.co.za'}`,
    margin,
    31
  );

  // Top Right Document Type Badge Box
  const badgeWidth = 64;
  const badgeHeight = 24;
  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = 6;

  doc.setFillColor(26, 34, 52); // Darker Slate
  doc.setDrawColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setLineWidth(0.7);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

  // "TAX INVOICE" in bold Yellow
  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TAX INVOICE', badgeX + badgeWidth / 2, badgeY + 6.5, { align: 'center' });

  // Invoice Number in White
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber, badgeX + badgeWidth / 2, badgeY + 12, { align: 'center' });

  // Dates in Muted White
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, badgeX + 4, badgeY + 17.5);
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, badgeX + 4, badgeY + 22);

  // Status Indicator Badge inside Header
  const isPaid = invoice.status === 'Paid' || invoice.balanceDue <= 0;
  const isPartial = invoice.status === 'Partially Paid' || (invoice.amountPaid > 0 && invoice.balanceDue > 0);

  if (isPaid) {
    doc.setFillColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
    doc.rect(badgeX + badgeWidth - 24, badgeY + 16, 20, 5.5, 'F');
    doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('PAID [CR]', badgeX + badgeWidth - 14, badgeY + 20, { align: 'center' });
  } else {
    doc.setFillColor(COLOR_DEBIT_RED[0], COLOR_DEBIT_RED[1], COLOR_DEBIT_RED[2]);
    doc.rect(badgeX + badgeWidth - 24, badgeY + 16, 20, 5.5, 'F');
    doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(isPartial ? 'PARTIAL [DR]' : 'UNPAID [DR]', badgeX + badgeWidth - 14, badgeY + 20, { align: 'center' });
  }

  // 2. CLIENT & BILLING INFORMATION (High Density Dual Column)
  y = headerHeight + 5;

  // Left Box: Billed To (Client)
  const colWidth = (pageWidth - margin * 2 - 4) / 2;
  
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, colWidth, 26, 1, 1, 'FD');

  // Small Yellow side accent line on client card
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, y, 1.5, 26, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text('BILLED TO (CLIENT DETAILS):', margin + 4, y + 4.5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.text(invoice.clientSnapshot?.companyName || 'Valued Client', margin + 4, y + 9.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  let clientY = y + 14;
  if (invoice.clientSnapshot?.contactPerson) {
    doc.text(`Attn: ${invoice.clientSnapshot.contactPerson}`, margin + 4, clientY);
    clientY += 3.8;
  }
  if (invoice.clientSnapshot?.phone || invoice.clientSnapshot?.whatsapp) {
    doc.text(`Tel: ${invoice.clientSnapshot.phone || invoice.clientSnapshot.whatsapp} | ${invoice.clientSnapshot.email || ''}`, margin + 4, clientY);
    clientY += 3.8;
  }
  if (invoice.clientSnapshot?.billingAddress) {
    doc.text(`Address: ${invoice.clientSnapshot.billingAddress}, ${invoice.clientSnapshot.city || ''} ${invoice.clientSnapshot.country || ''}`, margin + 4, clientY);
  }

  // Right Box: Transaction & Accounting Summary
  const rightX = margin + colWidth + 4;
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.roundedRect(rightX, y, colWidth, 26, 1, 1, 'FD');

  // Small Yellow side accent line on accounting card
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(rightX, y, 1.5, 26, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text('ACCOUNTING & DELIVERY SPECIFICATIONS:', rightX + 4, y + 4.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Terms: ${company.paymentTerms || 'EFT prior to dispatch'}`, rightX + 4, y + 9.5);
  doc.text(`Currency: ${invoice.currency || 'ZAR (R)'}`, rightX + 4, y + 13.5);
  doc.text(`Shipping Method: ${invoice.shippingDetails || 'Direct Road Freight Dispatch'}`, rightX + 4, y + 17.5);
  doc.text(`Client Tax/VAT: ${invoice.clientSnapshot?.vatNumber || 'Standard Private / Zero-Rated Export'}`, rightX + 4, y + 21.5);

  // 3. HIGH-DENSITY LINE ITEMS TABLE
  y += 30;
  const tableY = y;
  const tableWidth = pageWidth - margin * 2;

  // Table Header Background (Obsidian Slate with Yellow Border)
  doc.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  doc.rect(margin, tableY, tableWidth, 6.5, 'F');

  // Yellow line below table header
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, tableY + 6.5, tableWidth, 0.8, 'F');

  // Column Headers (White & Yellow)
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('ITEM CODE & AGRICULTURAL DESCRIPTION', margin + 3, tableY + 4.5);
  doc.text('QTY / UNIT', margin + 86, tableY + 4.5, { align: 'right' });
  doc.text('UNIT PRICE', margin + 116, tableY + 4.5, { align: 'right' });
  doc.text('DISC [CR]', margin + 138, tableY + 4.5, { align: 'right' });
  
  // Highlight "LINE TOTAL [DR]" in Yellow
  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.text('LINE TOTAL [DR]', pageWidth - margin - 3, tableY + 4.5, { align: 'right' });

  y = tableY + 7.3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  // Render Table Rows with High Density & Subtle Striping
  invoice.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, y, tableWidth, 6, 'F');

    // Item Name and SKU
    doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
    const nameText = `${item.name}${item.sku ? ` (${item.sku})` : ''}`;
    doc.text(nameText.substring(0, 48), margin + 3, y + 4.2);

    // Quantity
    doc.text(`${item.quantity} ${item.unit || ''}`, margin + 86, y + 4.2, { align: 'right' });

    // Unit Price
    doc.text(formatCurrency(item.unitPrice, invoice.currency), margin + 116, y + 4.2, { align: 'right' });

    // Discount Column (Green if discount applied)
    if (item.discountPercent && item.discountPercent > 0) {
      doc.setTextColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`-${item.discountPercent}%`, margin + 138, y + 4.2, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    } else {
      doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
      doc.text('—', margin + 138, y + 4.2, { align: 'right' });
    }

    // Line Total [DR]
    doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
    doc.text(formatCurrency(item.lineTotal, invoice.currency), pageWidth - margin - 3, y + 4.2, { align: 'right' });

    // Light row separator line
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);

    y += 6;
  });

  // Table bottom border (Yellow Accent)
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, y, tableWidth, 0.5, 'F');

  // 4. FINANCIAL TOTALS & DEBIT / CREDIT SUMMARY (Right Column)
  y += 4;
  const totalsBoxWidth = 82;
  const totalsX = pageWidth - margin - totalsBoxWidth;

  // Subtotal
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text('Subtotal (Excl. VAT):', totalsX, y + 4);
  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - margin - 3, y + 4, { align: 'right' });

  if (invoice.discountTotal > 0) {
    y += 4.5;
    doc.setTextColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Discount Applied [CR]:', totalsX, y + 4);
    doc.text(`-${formatCurrency(invoice.discountTotal, invoice.currency)}`, pageWidth - margin - 3, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }

  if (invoice.shippingCost > 0 || invoice.shippingDetails) {
    y += 4.5;
    doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
    doc.text(`Freight & Logistics:`, totalsX, y + 4);
    doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
    doc.text(formatCurrency(invoice.shippingCost, invoice.currency), pageWidth - margin - 3, y + 4, { align: 'right' });
  }

  y += 4.5;
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text(`Value Added Tax (${invoice.vatRate || 0}% VAT):`, totalsX, y + 4);
  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.text(formatCurrency(invoice.vatAmount, invoice.currency), pageWidth - margin - 3, y + 4, { align: 'right' });

  // TOTAL INVOICE / DEBIT AMOUNT (Highlighted in Obsidian Slate with Yellow Frame)
  y += 6;
  doc.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  doc.setDrawColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(totalsX - 2, y, totalsBoxWidth + 2, 7.5, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.text('TOTAL INVOICED [DR]:', totalsX, y + 5.2);
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.text(formatCurrency(invoice.grandTotal, invoice.currency), pageWidth - margin - 3, y + 5.2, { align: 'right' });

  // CREDIT & DEBIT INDICATORS BREAKDOWN
  y += 9.5;

  // Amount Paid [CREDIT INDICATOR]
  if (invoice.amountPaid > 0) {
    doc.setFillColor(COLOR_CREDIT_BG[0], COLOR_CREDIT_BG[1], COLOR_CREDIT_BG[2]);
    doc.setDrawColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(totalsX - 2, y, totalsBoxWidth + 2, 6.5, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
    doc.text('LESS PAYMENTS RECEIVED [CR]:', totalsX, y + 4.5);
    doc.text(`-${formatCurrency(invoice.amountPaid, invoice.currency)}`, pageWidth - margin - 3, y + 4.5, { align: 'right' });
    y += 7.5;
  }

  // Final Balance Due [DEBIT INDICATOR]
  if (invoice.balanceDue > 0) {
    doc.setFillColor(COLOR_DEBIT_BG[0], COLOR_DEBIT_BG[1], COLOR_DEBIT_BG[2]);
    doc.setDrawColor(COLOR_DEBIT_RED[0], COLOR_DEBIT_RED[1], COLOR_DEBIT_RED[2]);
    doc.setLineWidth(0.6);
    doc.roundedRect(totalsX - 2, y, totalsBoxWidth + 2, 8, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_DEBIT_RED[0], COLOR_DEBIT_RED[1], COLOR_DEBIT_RED[2]);
    doc.text('BALANCE DUE [DR]:', totalsX, y + 5.5);
    doc.text(formatCurrency(invoice.balanceDue, invoice.currency), pageWidth - margin - 3, y + 5.5, { align: 'right' });
  } else {
    doc.setFillColor(COLOR_CREDIT_BG[0], COLOR_CREDIT_BG[1], COLOR_CREDIT_BG[2]);
    doc.setDrawColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
    doc.setLineWidth(0.6);
    doc.roundedRect(totalsX - 2, y, totalsBoxWidth + 2, 7.5, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
    doc.text('ACCOUNT FULLY SETTLED [CR]', totalsX + totalsBoxWidth / 2 - 1, y + 5.2, { align: 'center' });
  }

  // 5. OFFICIAL BANKING INSTRUCTIONS & EFT CLEARANCE BOX (Bottom Area)
  const bankBoxY = pageHeight - 56;
  const bankBoxHeight = 44;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, bankBoxY, pageWidth - margin * 2, bankBoxHeight, 1.5, 1.5, 'FD');

  // Yellow Banner bar across top of banking box
  doc.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  doc.rect(margin, bankBoxY, pageWidth - margin * 2, 6, 'F');
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, bankBoxY + 5.6, pageWidth - margin * 2, 0.6, 'F');

  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL EFT BANKING DETAILS & PAYMENT CLEARANCE', margin + 3.5, bankBoxY + 4.2);

  const bank = invoice.bankingSnapshot?.bankName ? invoice.bankingSnapshot : company;

  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bank Name:`, margin + 3.5, bankBoxY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bank.bankName || 'Capitec Business Bank'}`, margin + 24, bankBoxY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Account Name:`, margin + 70, bankBoxY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bank.accountName || 'Healthy Fields'} (${company.accountType || 'Current Account'})`, margin + 92, bankBoxY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Account Number:`, margin + 3.5, bankBoxY + 14.5);
  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`${bank.accountNumber || '1052 3916 30'}`, margin + 28, bankBoxY + 14.5);

  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Branch Code:`, margin + 70, bankBoxY + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bank.branchCode || '450105'}  |  SWIFT: ${bank.swiftCode || 'CBLAZAJJ'}`, margin + 92, bankBoxY + 14.5);

  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Reference:`, margin + 3.5, bankBoxY + 19);
  doc.setTextColor(COLOR_DEBIT_RED[0], COLOR_DEBIT_RED[1], COLOR_DEBIT_RED[2]);
  doc.text(`Please quote "${invoice.invoiceNumber}" or Client Name as EFT Reference`, margin + 32, bankBoxY + 19);

  // Warning Notice (Capitec Business Bank Warning)
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.setDrawColor(245, 158, 11); // Amber-500
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 2.5, bankBoxY + 22.5, pageWidth - margin * 2 - 5, 7.5, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9); // Amber-800
  doc.text(
    company.bankingNotice ||
      '⚠️ CRITICAL: Please select "Capitec Business Bank" on your banking app (NOT "Capitec Bank").',
    margin + 4.5,
    bankBoxY + 27
  );

  // Next Steps
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(21, 128, 61); // Emerald-700
  doc.text(
    `Next Steps: ${company.paymentNextSteps || 'Send delivery address 📍 and share Proof of Payment (POP) via WhatsApp to +27 83 447 4639 or email admin@proagrisa.co.za 📲'}`,
    margin + 3.5,
    bankBoxY + 34
  );

  // Legal & Agricultural Compliance Subtext
  doc.setFontSize(6.2);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text(
    `Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739 • ProAgriSA Agricultural Matrix`,
    margin + 3.5,
    bankBoxY + 39.5
  );

  // 6. FOOTER WITH YELLOW SEPARATOR
  const footerY = pageHeight - 6;
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, footerY - 2, pageWidth - margin * 2, 0.4, 'F');

  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    company.footerText || `${company.companyName} • Agricultural Innovation & Elite Plant Material`,
    pageWidth / 2,
    footerY + 1.5,
    { align: 'center' }
  );

  return doc;
}

/**
 * Generates a High-Density, Professional QUOTATION PDF
 * with Yellow accent lines, White/Yellow text styling, and Credit/Debit indicators.
 */
export function generateQuotePDF(quote: Quote, company: CompanySettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = 0;

  // 1. TOP HEADER BANNER (Obsidian Slate with Yellow Accent Line)
  const headerHeight = 36;
  doc.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Vivid Yellow Accent Line
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(0, headerHeight - 1.5, pageWidth, 1.5, 'F');

  // Company Name in White & Yellow Accent
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company.companyName || 'Healthy Fields Business Hub', margin, 12);

  if (company.tradingName && company.tradingName !== company.companyName) {
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
    doc.text(`Trading as: ${company.tradingName}`, margin, 17);
  }

  // Company Address & Contacts
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(
    company.physicalAddress ||
      'Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739',
    margin,
    22
  );
  doc.text(
    `WhatsApp: ${company.whatsapp || company.phone || '+27 83 447 4639'}  |  Email: ${company.email || 'admin@proagrisa.co.za'}`,
    margin,
    26.5
  );
  doc.text(
    `VAT Reg: ${company.vatNumber || '4820293819'}  |  Co Reg: ${company.registrationNumber || '2021/847291/07'}  |  Web: ${company.website || 'proagrisa.co.za'}`,
    margin,
    31
  );

  // Top Right Document Type Badge Box
  const badgeWidth = 64;
  const badgeHeight = 24;
  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = 6;

  doc.setFillColor(26, 34, 52); // Darker Slate
  doc.setDrawColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setLineWidth(0.7);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

  // "FORMAL QUOTATION" in bold Yellow
  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('QUOTATION', badgeX + badgeWidth / 2, badgeY + 6.5, { align: 'center' });

  // Quote Number in White
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.quoteNumber, badgeX + badgeWidth / 2, badgeY + 12, { align: 'center' });

  // Dates
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Date: ${formatDate(quote.quoteDate)}`, badgeX + 4, badgeY + 17.5);
  doc.text(`Valid Until: ${formatDate(quote.validUntil)}`, badgeX + 4, badgeY + 22);

  // Status Badge
  doc.setFillColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
  doc.rect(badgeX + badgeWidth - 24, badgeY + 16, 20, 5.5, 'F');
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(quote.status.toUpperCase(), badgeX + badgeWidth - 14, badgeY + 20, { align: 'center' });

  // 2. CLIENT & QUOTATION SPECIFICATIONS
  y = headerHeight + 5;
  const colWidth = (pageWidth - margin * 2 - 4) / 2;

  // Left Box: Quote For (Client)
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, colWidth, 26, 1, 1, 'FD');

  // Yellow side accent
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, y, 1.5, 26, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text('QUOTATION PREPARED FOR:', margin + 4, y + 4.5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.text(quote.clientSnapshot?.companyName || 'Valued Client', margin + 4, y + 9.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  let clientY = y + 14;
  if (quote.clientSnapshot?.contactPerson) {
    doc.text(`Attn: ${quote.clientSnapshot.contactPerson}`, margin + 4, clientY);
    clientY += 3.8;
  }
  if (quote.clientSnapshot?.phone || quote.clientSnapshot?.whatsapp) {
    doc.text(`Tel: ${quote.clientSnapshot.phone || quote.clientSnapshot.whatsapp} | ${quote.clientSnapshot.email || ''}`, margin + 4, clientY);
    clientY += 3.8;
  }
  if (quote.clientSnapshot?.billingAddress) {
    doc.text(`Address: ${quote.clientSnapshot.billingAddress}, ${quote.clientSnapshot.city || ''} ${quote.clientSnapshot.country || ''}`, margin + 4, clientY);
  }

  // Right Box: Logistics & Terms
  const rightX = margin + colWidth + 4;
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.roundedRect(rightX, y, colWidth, 26, 1, 1, 'FD');

  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(rightX, y, 1.5, 26, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text('TERMS & LOGISTICS SUMMARY:', rightX + 4, y + 4.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Terms: ${quote.paymentTerms || company.paymentTerms || 'EFT on Order Confirmation'}`, rightX + 4, y + 9.5);
  doc.text(`Currency: ${quote.currency || 'ZAR (R)'}`, rightX + 4, y + 13.5);
  doc.text(`Logistics: ${quote.shippingDetails || 'Direct Road Freight / Collection'}`, rightX + 4, y + 17.5);
  doc.text(`Validity: Valid for 14 calendar days from quotation date`, rightX + 4, y + 21.5);

  // 3. HIGH-DENSITY LINE ITEMS TABLE
  y += 30;
  const tableY = y;
  const tableWidth = pageWidth - margin * 2;

  // Header background (Obsidian Slate with Yellow Border)
  doc.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  doc.rect(margin, tableY, tableWidth, 6.5, 'F');

  // Yellow accent line
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, tableY + 6.5, tableWidth, 0.8, 'F');

  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('ITEM CODE & AGRICULTURAL DESCRIPTION', margin + 3, tableY + 4.5);
  doc.text('QTY / UNIT', margin + 86, tableY + 4.5, { align: 'right' });
  doc.text('UNIT PRICE', margin + 116, tableY + 4.5, { align: 'right' });
  doc.text('DISC [CR]', margin + 138, tableY + 4.5, { align: 'right' });

  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.text('EST. TOTAL [DR]', pageWidth - margin - 3, tableY + 4.5, { align: 'right' });

  y = tableY + 7.3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  quote.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, y, tableWidth, 6, 'F');

    doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
    const nameText = `${item.name}${item.sku ? ` (${item.sku})` : ''}`;
    doc.text(nameText.substring(0, 48), margin + 3, y + 4.2);

    doc.text(`${item.quantity} ${item.unit || ''}`, margin + 86, y + 4.2, { align: 'right' });
    doc.text(formatCurrency(item.unitPrice, quote.currency), margin + 116, y + 4.2, { align: 'right' });

    if (item.discountPercent && item.discountPercent > 0) {
      doc.setTextColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`-${item.discountPercent}%`, margin + 138, y + 4.2, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    } else {
      doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
      doc.text('—', margin + 138, y + 4.2, { align: 'right' });
    }

    doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
    doc.text(formatCurrency(item.lineTotal, quote.currency), pageWidth - margin - 3, y + 4.2, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);

    y += 6;
  });

  // Table bottom yellow border
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, y, tableWidth, 0.5, 'F');

  // 4. TOTALS (Right Column)
  y += 4;
  const totalsBoxWidth = 82;
  const totalsX = pageWidth - margin - totalsBoxWidth;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text('Subtotal (Excl. VAT):', totalsX, y + 4);
  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.text(formatCurrency(quote.subtotal, quote.currency), pageWidth - margin - 3, y + 4, { align: 'right' });

  if (quote.discountTotal > 0) {
    y += 4.5;
    doc.setTextColor(COLOR_CREDIT_GREEN[0], COLOR_CREDIT_GREEN[1], COLOR_CREDIT_GREEN[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Special Discount [CR]:', totalsX, y + 4);
    doc.text(`-${formatCurrency(quote.discountTotal, quote.currency)}`, pageWidth - margin - 3, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }

  if (quote.shippingCost > 0 || quote.shippingDetails) {
    y += 4.5;
    doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
    doc.text(`Freight & Shipping:`, totalsX, y + 4);
    doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
    doc.text(formatCurrency(quote.shippingCost, quote.currency), pageWidth - margin - 3, y + 4, { align: 'right' });
  }

  y += 4.5;
  doc.setTextColor(COLOR_MUTED_TEXT[0], COLOR_MUTED_TEXT[1], COLOR_MUTED_TEXT[2]);
  doc.text(`VAT (${quote.vatRate || 0}%):`, totalsX, y + 4);
  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.text(formatCurrency(quote.vatAmount, quote.currency), pageWidth - margin - 3, y + 4, { align: 'right' });

  // GRAND TOTAL QUOTED (Obsidian Slate with Yellow Border)
  y += 6;
  doc.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  doc.setDrawColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(totalsX - 2, y, totalsBoxWidth + 2, 7.5, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.text('ESTIMATED TOTAL [DR]:', totalsX, y + 5.2);
  doc.setTextColor(COLOR_WHITE[0], COLOR_WHITE[1], COLOR_WHITE[2]);
  doc.text(formatCurrency(quote.grandTotal, quote.currency), pageWidth - margin - 3, y + 5.2, { align: 'right' });

  // 5. OFFICIAL BANKING INSTRUCTIONS & ACCEPTANCE
  const bankBoxY = pageHeight - 56;
  const bankBoxHeight = 44;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, bankBoxY, pageWidth - margin * 2, bankBoxHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(COLOR_HEADER_BG[0], COLOR_HEADER_BG[1], COLOR_HEADER_BG[2]);
  doc.rect(margin, bankBoxY, pageWidth - margin * 2, 6, 'F');
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, bankBoxY + 5.6, pageWidth - margin * 2, 0.6, 'F');

  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL EFT BANKING DETAILS & QUOTE ACCEPTANCE', margin + 3.5, bankBoxY + 4.2);

  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bank Name:`, margin + 3.5, bankBoxY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.bankName || 'Capitec Business Bank'}`, margin + 24, bankBoxY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Account Name:`, margin + 70, bankBoxY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.accountName || 'Healthy Fields'} (${company.accountType || 'Current Account'})`, margin + 92, bankBoxY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Account Number:`, margin + 3.5, bankBoxY + 14.5);
  doc.setTextColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`${company.accountNumber || '1052 3916 30'}`, margin + 28, bankBoxY + 14.5);

  doc.setTextColor(COLOR_DARK_TEXT[0], COLOR_DARK_TEXT[1], COLOR_DARK_TEXT[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Branch Code:`, margin + 70, bankBoxY + 14.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.branchCode || '450105'}  |  SWIFT: ${company.swiftCode || 'CBLAZAJJ'}`, margin + 92, bankBoxY + 14.5);

  doc.setFont('helvetica', 'bold');
  doc.text(`Quote Reference:`, margin + 3.5, bankBoxY + 19);
  doc.setTextColor(COLOR_DEBIT_RED[0], COLOR_DEBIT_RED[1], COLOR_DEBIT_RED[2]);
  doc.text(`Use "${quote.quoteNumber}" or Client Name upon accepting`, margin + 28, bankBoxY + 19);

  // Warning Notice
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 2.5, bankBoxY + 22.5, pageWidth - margin * 2 - 5, 7.5, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.text(
    company.bankingNotice ||
      '⚠️ CRITICAL: Please select "Capitec Business Bank" on your banking app (NOT "Capitec Bank").',
    margin + 4.5,
    bankBoxY + 27
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(21, 128, 61);
  doc.text(
    `To accept this quote: Send confirmation & delivery address via WhatsApp to +27 83 447 4639 or email admin@proagrisa.co.za 📲`,
    margin + 3.5,
    bankBoxY + 34
  );

  doc.setFontSize(6.2);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739 • ProAgriSA Agricultural Matrix`,
    margin + 3.5,
    bankBoxY + 39.5
  );

  // 6. FOOTER
  const footerY = pageHeight - 6;
  doc.setFillColor(COLOR_YELLOW_ACCENT[0], COLOR_YELLOW_ACCENT[1], COLOR_YELLOW_ACCENT[2]);
  doc.rect(margin, footerY - 2, pageWidth - margin * 2, 0.4, 'F');

  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    company.footerText || `${company.companyName} • Agricultural Innovation & Elite Plant Material`,
    pageWidth / 2,
    footerY + 1.5,
    { align: 'center' }
  );

  return doc;
}
