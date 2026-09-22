import { CompanySettings, Client, Product, ShippingRate, Quote, Invoice, Payment, KnowledgeItem, MessageTemplate, CommunicationLog, EmailAccount } from '../types';
import { allProducts } from './productsCatalog';
import { DEFAULT_PRIMARY_LOGO_DATA_URL, DEFAULT_EDU_LOGO_DATA_URL } from './companyLogos';

export const initialCompanySettings: CompanySettings = {
  companyName: 'Healthy Fields Business Hub',
  tradingName: 'ProAgriSA / Healthy Fields Business Hub',
  ownerName: 'Healthy Fields Operations',
  registrationNumber: '2021/847291/07',
  vatNumber: '4820293819',
  physicalAddress: 'Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739, South Africa',
  postalAddress: 'Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739, South Africa',
  phone: '+27 83 447 4639',
  email: 'admin@proagrisa.co.za',
  whatsapp: '+27 83 447 4639',
  educationalEmail: 'info.pocketschoolpro@proagrisa.co.za',
  aiReceptionPhone: '+1 351-777-2848',
  website: 'https://purelyhealthnutra.company/',
  additionalWebsites: 'https://wonderfuldragonfruit.company/, https://livingculturehealth.company/, www.wildcamp360.company, www.dragonfruitafrica.company',
  businessWebsites: [
    'https://purelyhealthnutra.company/',
    'https://wonderfuldragonfruit.company/',
    'https://livingculturehealth.company/',
    'https://www.wildcamp360.company',
    'https://www.dragonfruitafrica.company',
  ],
  educationalWebsites: [
    'https://pocketschoolpro.company',
    'https://www.studentgptpro.com',
    'https://www.mcpyourschool.uk',
  ],
  logoUrl: DEFAULT_PRIMARY_LOGO_DATA_URL,
  educationLogoUrl: DEFAULT_EDU_LOGO_DATA_URL,
  activeLogoType: 'primary',
  bankName: 'Capitec Business Bank',
  accountName: 'Healthy Fields',
  accountNumber: '1052 3916 30',
  accountType: 'Current Account',
  branchCode: '450105',
  swiftCode: 'CBLAZAJJ',
  bankingNotice: '⚠️ IMPORTANT: Please select Capitec Business Bank on your banking app (NOT "Capitec Bank").',
  paymentReferenceHint: '( name and number or quote number or invoice number )',
  paymentInstructions: 'Please make EFT payment to Capitec Business Bank (Account: Healthy Fields, Acc No: 1052 3916 30, Branch: 450105). ⚠️ IMPORTANT: Select Capitec Business Bank (NOT Capitec Bank). Use your invoice or quote number as payment reference. Send proof of payment via WhatsApp to +27 83 447 4639 or email admin@proagrisa.co.za.',
  paymentNextSteps: 'Send through your full delivery address 📍 Share your proof of payment once complete 📲',
  defaultCurrency: 'ZAR',
  defaultVatRate: 15,
  paymentTerms: 'Payment due prior to dispatch / delivery unless approved 30-day credit term.',
  quoteValidityDays: 14,
  invoiceTerms: 'Interest of 2.5% per month charged on overdue accounts. All plant stock, agro-inputs & goods remain property of Healthy Fields / ProAgriSA until settled in full.',
  footerText: 'Healthy Fields Business Hub & ProAgriSA • Agriculture • Technology • Health • Education • E-Commerce • Sustainability',
  description: 'Healthy Fields Business Hub integrates premium agricultural innovations, certified dragon fruit varieties, health nutraceuticals, educational programs, and digital solutions across Southern Africa and internationally.',
  quotePrefix: 'QUO-2026-',
  invoicePrefix: 'INV-2026-',
  // Shipping Integrations
  pudoApiKey: '60750579|dp3ghLCxDC1bymHFoRSDcbsYYxTe5zdaiDyd9wZS43aa9219',
  theCourierGuyApiKey: '6e8660d2451342268e7e97bb96d5c369',
};

export const initialProducts: Product[] = allProducts;

export const initialClients: Client[] = [];

export const initialShippingRates: ShippingRate[] = [
  {
    id: 'ship-1',
    destinationCountry: 'Botswana',
    destinationProvince: 'All Districts (Gaborone / Francistown)',
    shippingCompany: 'Cross-Border AgriLogistics Express',
    shippingMethod: 'Climate-controlled Road Freight & Customs Clearance',
    cost: 2500.0,
    currency: 'ZAR',
    deliveryTime: '2 - 3 Business Days',
    minimumOrder: 100,
    rateType: 'fixed',
    notes: 'Includes phytosanitary clearance handover at Tlokweng / Kopfontein border post.',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'ship-2',
    destinationCountry: 'Namibia',
    destinationProvince: 'Khomas / Windhoek / Swakopmund',
    shippingCompany: 'Trans-Kalahari Freight Corridor',
    shippingMethod: 'Express Refrigerated Dedicated Transit',
    cost: 3000.0,
    currency: 'ZAR',
    deliveryTime: '3 - 4 Business Days',
    minimumOrder: 150,
    rateType: 'fixed',
    notes: 'Route via Buitepos / Trans-Kalahari Border with export phyto certification.',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'ship-3',
    destinationCountry: 'Zimbabwe',
    destinationProvince: 'Harare / Bulawayo / Mazowe',
    shippingCompany: 'Beitbridge Agri Courier Services',
    shippingMethod: 'Expedited Cross-Border Freight',
    cost: 3500.0,
    currency: 'ZAR',
    deliveryTime: '3 - 5 Business Days',
    minimumOrder: 200,
    rateType: 'fixed',
    notes: 'Includes Beitbridge expedited commercial clearance protocol.',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'ship-4',
    destinationCountry: 'South Africa',
    destinationProvince: 'Gauteng',
    shippingCompany: 'ProAgriSA Local Fleet / Courier Guy',
    shippingMethod: 'Same Day / Next Morning Direct Delivery',
    cost: 350.0,
    currency: 'ZAR',
    deliveryTime: '24 Hours',
    minimumOrder: 0,
    rateType: 'fixed',
    notes: 'Door-to-door courier or local delivery van.',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'ship-5',
    destinationCountry: 'South Africa',
    destinationProvince: 'Limpopo / Mpumalanga / North West',
    shippingCompany: 'Agrilogistics SA Regional Express',
    shippingMethod: 'Overnight Road Freight',
    cost: 650.0,
    currency: 'ZAR',
    deliveryTime: '1 - 2 Business Days',
    minimumOrder: 0,
    rateType: 'fixed',
    notes: 'Delivered directly to farm gate or nearest depot.',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'ship-6',
    destinationCountry: 'South Africa',
    destinationProvince: 'Western Cape / Eastern Cape / KZN',
    shippingCompany: 'Time Freight / Triton Express Agri Pallets',
    shippingMethod: 'Depot-to-Door Heavy Freight',
    cost: 950.0,
    currency: 'ZAR',
    deliveryTime: '2 - 3 Business Days',
    minimumOrder: 0,
    rateType: 'fixed',
    notes: 'Carefully crated and strapped for nursery stock safety.',
    createdAt: '2026-01-10T08:00:00Z',
  },
];

export const initialQuotes: Quote[] = [];

export const initialInvoices: Invoice[] = [];

export const initialPayments: Payment[] = [];


export const initialKnowledge: KnowledgeItem[] = [
  {
    id: 'know-1',
    topic: 'Dragon Fruit (Pitaya) Commercial Cultivation Specs & Spacing',
    category: 'Farming Guides',
    content: `Optimal Planting Parameters for Southern Africa:
- Trellis System: 4-post concrete/hardwood T-bar or Single Post Pyramid. Spacing 3m between rows, 2m between posts (approx. 1,600 to 2,000 plants per hectare).
- Climate: Sub-tropical to semi-arid. Tolerates temperatures from 0°C to 45°C. Full sun exposure required.
- Soil & pH: Well-drained sandy-loam with high organic matter. pH optimal range: 5.5 to 6.8.
- Water Requirements: Drip irrigation 15-25 Litres per post per week during active summer growth and flowering. Avoid waterlogged root zones.
- ProAgriSA Plant Guarantee: All cuttings provided with developed root ball in peat/perlite plug, pre-treated with organic antifungal bio-wash.`,
    tags: ['Dragon Fruit', 'Planting Guide', 'Cultivation', 'Spacing', 'Horticulture'],
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'know-2',
    topic: 'Cross-Border Agricultural Shipping & Phyto Regulations',
    category: 'Shipping & Logistics',
    content: `Logistics & Customs Procedures for SADC Countries:
1. Botswana: Phyto permits issued through Department of Agricultural Research (DAR). Tlokweng border clearance takes 24h. Plants must be free of soil/sand (shipped in sterile coco-peat medium).
2. Namibia: Import permit required from MAWLR (Ministry of Agriculture, Water and Land Reform). Border transit via Trans-Kalahari Highway.
3. Zimbabwe: SADC Phyto Certificate required via Plant Quarantine Services Mazowe.
4. Packaging: All plant orders boxed in ventilated 5-ply cartons with foam separators to prevent spine and root damage during transit.`,
    tags: ['Shipping', 'Botswana', 'Namibia', 'Zimbabwe', 'Phytosanitary', 'Export'],
    createdAt: '2026-01-12T12:00:00Z',
    updatedAt: '2026-01-12T12:00:00Z',
  },
  {
    id: 'know-3',
    topic: 'Client Pricing Tiers, Volume Discounts & Special Contracts',
    category: 'Pricing & Terms',
    content: `Pricing Architecture Overview:
- Standard Price: Single nursery retail orders (<100 plants).
- Wholesale Price: Minimum 500 plants or verified commercial farm accounts (approx 15-20% discount).
- Client-Specific Special Prices: Negotiated on long-term supplier agreements. (E.g. John Smith Ruby Rose is locked at R15.00/plant).
- Shipping Rules: Calculated strictly based on destination database rates; never estimated randomly.
- Quotation Validity: All quotes valid for 14 calendar days from date of issue.`,
    tags: ['Pricing', 'Discounts', 'Tiers', 'Contracts', 'Policies'],
    createdAt: '2026-01-15T12:00:00Z',
    updatedAt: '2026-01-15T12:00:00Z',
  },
  {
    id: 'know-4',
    topic: 'Spirulina & Chlorella Bio-Stimulant Application Rates',
    category: 'Products & Plants',
    content: `Application Guidelines for Bio-Inputs:
- Organic Super Spirulina Extract: Apply as foliar spray every 14 days at 2ml per 1 Litre of clean water (1:500) during pre-bloom and fruit expansion. Enhances micronutrient uptake and sugar translocation (Brix level).
- Chlorella Pure Bio-Fertilizer: Apply via fertigation at 5L per hectare once per month. Stimulates beneficial mycorrhizae and soil bacterial diversity.`,
    tags: ['Spirulina', 'Chlorella', 'Bio-Fertilizer', 'Dosage', 'Organic'],
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-01-20T12:00:00Z',
  },
];

export const initialMessageTemplates: MessageTemplate[] = [
  {
    id: 'tmpl-1',
    title: 'Quotation Email Template',
    channel: 'Email',
    documentType: 'Quote',
    subject: 'ProAgriSA Quotation {{quoteNumber}} for {{companyName}}',
    body: `Dear {{contactPerson}},

Thank you for your inquiry with ProAgriSA Grade Master. 

Please find attached your official Quotation {{quoteNumber}} amounting to {{grandTotal}}.

This quotation is valid until {{validUntil}}. Should you wish to accept or require any adjustments to plant varieties or delivery schedules, please reply directly to this email or contact us via WhatsApp on {{companyWhatsapp}}.

Warm regards,
{{companyName}} Sales & Accounts Team
{{companyPhone}} | {{companyWebsite}}`,
  },
  {
    id: 'tmpl-2',
    title: 'Tax Invoice Email Template',
    channel: 'Email',
    documentType: 'Invoice',
    subject: 'Tax Invoice {{invoiceNumber}} from ProAgriSA Grade Master',
    body: `Dear {{contactPerson}},

Please find attached your official Tax Invoice {{invoiceNumber}} from ProAgriSA Grade Master.

Total Amount: {{grandTotal}}
Balance Due: {{balanceDue}}
Payment Due Date: {{dueDate}}

Payment Details:
Bank: {{bankName}}
Account Name: {{accountName}}
Account Number: {{accountNumber}}
Branch Code: {{branchCode}}
Reference: {{invoiceNumber}}

Please send proof of payment once processed. Thank you for your valued business.

Warm regards,
{{companyName}} Accounts Team
{{companyEmail}} | {{companyPhone}}`,
  },
  {
    id: 'tmpl-3',
    title: 'Quotation WhatsApp Template',
    channel: 'WhatsApp',
    documentType: 'Quote',
    subject: 'WhatsApp Quote',
    body: `Hello {{contactPerson}} 👋

Here is your ProAgriSA Quotation *{{quoteNumber}}* for *{{grandTotal}}*.
Valid until: {{validUntil}}

We have prepared your order for {{itemSummary}}. 
Please review the attached PDF quote. Let us know if you'd like to confirm the order! 🌿`,
  },
  {
    id: 'tmpl-4',
    title: 'Tax Invoice WhatsApp Template',
    channel: 'WhatsApp',
    documentType: 'Invoice',
    subject: 'WhatsApp Invoice',
    body: `Hello {{contactPerson}} 👋

Please find your ProAgriSA Tax Invoice *{{invoiceNumber}}*.

• Total Amount: *{{grandTotal}}*
• Balance Due: *{{balanceDue}}*
• Due Date: {{dueDate}}

EFT Banking Details:
🏦 {{bankName}}
Acc: {{accountNumber}} | Branch: {{branchCode}}
Ref: *{{invoiceNumber}}*

Thank you for choosing ProAgriSA Grade Master! 🌱`,
  },
  {
    id: 'tmpl-5',
    title: 'Payment Reminder Template',
    channel: 'Email',
    documentType: 'Payment Reminder',
    subject: 'Payment Reminder: Invoice {{invoiceNumber}} (Balance Due: {{balanceDue}})',
    body: `Dear {{contactPerson}},

This is a friendly reminder that Invoice {{invoiceNumber}} has an outstanding balance of {{balanceDue}} which was due on {{dueDate}}.

Kindly arrange for settlement at your earliest convenience using reference {{invoiceNumber}}.

If payment has already been made, please disregard this notice and email your proof of payment to {{companyEmail}}.

Thank you for your ongoing partnership.

Warm regards,
{{companyName}} Accounts`,
  },
];

export const initialCommunications: CommunicationLog[] = [];

export const initialEmailAccounts: EmailAccount[] = [
  {
    id: 'email-admin',
    email: 'admin@proagrisa.co.za',
    password: 'Kyknet.03',
    incomingServer: 'mail.proagrisa.co.za',
    imapPort: 993,
    pop3Port: 995,
    outgoingServer: 'mail.proagrisa.co.za',
    smtpPort: 465,
    useSsl: true,
    aiAutoReply: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'email-orders',
    email: 'orders@proagrisa.co.za',
    password: 'Kyknet.03',
    incomingServer: 'mail.proagrisa.co.za',
    imapPort: 993,
    pop3Port: 995,
    outgoingServer: 'mail.proagrisa.co.za',
    smtpPort: 465,
    useSsl: true,
    aiAutoReply: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'email-info',
    email: 'info@proagrisa.co.za',
    password: 'Kyknet.03',
    incomingServer: 'croatoan.aserv.co.za',
    imapPort: 993,
    pop3Port: 995,
    outgoingServer: 'croatoan.aserv.co.za',
    smtpPort: 465,
    useSsl: true,
    aiAutoReply: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'email-edu',
    email: 'info.pocketschoolpro@proagrisa.co.za',
    password: 'Kyknet.03',
    incomingServer: 'mail.proagrisa.co.za',
    imapPort: 993,
    pop3Port: 995,
    outgoingServer: 'mail.proagrisa.co.za',
    smtpPort: 465,
    useSsl: true,
    aiAutoReply: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
