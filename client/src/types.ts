export type Currency = 'ZAR' | 'USD' | 'BWP' | 'NAD' | 'EUR';

export interface EmailAccount {
  id: string;
  email: string;
  password?: string; // Stored securely/entered once
  incomingServer: string;
  imapPort: number;
  pop3Port: number;
  outgoingServer: string;
  smtpPort: number;
  useSsl: boolean;
  aiAutoReply: boolean;
  status: 'active' | 'inactive' | 'error';
  lastChecked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id?: string;
  companyName: string;
  tradingName: string;
  ownerName?: string;
  registrationNumber: string;
  vatNumber: string;
  physicalAddress: string;
  postalAddress: string;
  phone: string;
  email: string;
  whatsapp: string;
  educationalEmail?: string;
  aiReceptionPhone?: string;
  website: string;
  additionalWebsites: string;
  businessWebsites?: string[];
  educationalWebsites?: string[];
  logoUrl: string;
  educationLogoUrl?: string;
  activeLogoType?: 'primary' | 'education' | 'custom';
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType?: string;
  branchCode: string;
  swiftCode: string;
  bankingNotice?: string;
  paymentReferenceHint?: string;
  paymentInstructions: string;
  paymentNextSteps?: string;
  defaultCurrency: Currency;
  defaultVatRate: number; // e.g. 15 for 15%
  paymentTerms: string;
  quoteValidityDays: number;
  invoiceTerms: string;
  footerText: string;
  description: string;
  quotePrefix?: string;
  invoicePrefix?: string;
  // Shipping Integrations
  pudoApiKey?: string;
  theCourierGuyApiKey?: string;
}

export interface ClientSpecialPrice {
  productId: string;
  customPrice: number;
  notes?: string;
}

export type ClientType = 'Standard' | 'Wholesale' | 'Retailer' | 'Distributor' | 'Export' | 'Commercial Farm';

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  whatsapp: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  vatNumber: string;
  website: string;
  currency: Currency;
  paymentTerms: string;
  clientType: ClientType;
  specialPricing: Record<string, number>; // productId -> custom price
  notes: string;
  status: 'Active' | 'Archived';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  unit: string; // e.g. 'plant', 'cutting', 'kg', 'litre', 'bag', 'unit'
  costPrice: number;
  standardPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  currency: Currency;
  vatRate: number; // e.g. 15 for 15%
  imageUrl: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ShippingRateType = 'fixed' | 'per_item' | 'per_kg' | 'manual';

export interface ShippingRate {
  id: string;
  destinationCountry: string;
  destinationProvince: string;
  shippingCompany: string;
  shippingMethod: string;
  cost: number;
  currency: Currency;
  deliveryTime: string;
  minimumOrder: number;
  rateType: ShippingRateType;
  notes: string;
  createdAt: string;
}

export interface DocumentLineItem {
  id?: string;
  productId: string;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
  priceSource: 'client_special' | 'wholesale' | 'standard' | 'retail' | 'manual';
  notes?: string;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';

export interface Quote {
  id: string;
  quoteNumber: string; // e.g. QUO-2026-0001
  clientId: string;
  clientSnapshot: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    whatsapp: string;
    billingAddress: string;
    shippingAddress: string;
    city: string;
    province: string;
    country: string;
    vatNumber: string;
  };
  quoteDate: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  items: DocumentLineItem[];
  subtotal: number;
  discountTotal: number;
  shippingCost: number;
  shippingDetails: string;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  currency: Currency;
  paymentTerms: string;
  notes: string;
  terms: string;
  status: QuoteStatus;
  convertedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  quoteId?: string;
  clientId: string;
  clientSnapshot: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    whatsapp: string;
    billingAddress: string;
    shippingAddress: string;
    city: string;
    province: string;
    country: string;
    vatNumber: string;
  };
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  items: DocumentLineItem[];
  subtotal: number;
  discountTotal: number;
  shippingCost: number;
  shippingDetails: string;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  currency: Currency;
  paymentInstructions: string;
  bankingSnapshot: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    swiftCode: string;
  };
  notes: string;
  terms: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'EFT / Bank Transfer' | 'Cash' | 'Credit Card' | 'SnapScan' | 'Direct Deposit' | 'Other';

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  reference: string;
  notes: string;
  createdAt: string;
}

export type CommunicationChannel = 'Email' | 'WhatsApp';
export type CommunicationDocType = 'Quote' | 'Invoice' | 'Payment Receipt' | 'Payment Reminder' | 'General';

export interface CommunicationLog {
  id: string;
  clientId: string;
  clientName: string;
  channel: CommunicationChannel;
  documentType: CommunicationDocType;
  documentId?: string;
  documentNumber?: string;
  recipient: string;
  subject: string;
  message: string;
  status: 'Sent' | 'Failed' | 'Draft';
  sentAt: string;
}

export interface KnowledgeItem {
  id: string;
  topic: string;
  category: 'Products & Plants' | 'Farming Guides' | 'Company Policies' | 'Shipping & Logistics' | 'Pricing & Terms' | 'FAQs' | 'General' | 'Pricing Rule' | 'Farming Guideline' | 'Shipping Policy' | 'FAQ';
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  channel: CommunicationChannel;
  documentType: CommunicationDocType;
  subject: string;
  body: string;
}

export interface ActivityLog {
  id: string;
  type: 'quote_created' | 'quote_accepted' | 'quote_converted' | 'invoice_created' | 'invoice_sent' | 'payment_received' | 'client_added' | 'product_updated';
  title: string;
  description: string;
  timestamp: string;
  entityId?: string;
}

export interface AIChatActionDraft {
  type: 'quote_preview' | 'invoice_preview' | 'send_email_preview' | 'send_whatsapp_preview' | 'payment_preview';
  title: string;
  summary: string;
  data: any;
  status: 'pending_confirmation' | 'executed' | 'cancelled';
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: {
    toolName: string;
    input: any;
    output?: any;
  }[];
  actionDraft?: AIChatActionDraft;
}

// WhatsApp Meta API Types
export interface WhatsAppMessage {
  id: string; // The doc ID in Firebase
  conversationId: string; // the thread ID
  clientId?: string; // Link to CRM client if matched
  wamid?: string; // The WhatsApp Message ID from Meta (used for status tracking)
  from: string; // Phone number
  to: string; // Our phone number ID
  text: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'template' | 'interactive' | 'unsupported';
  mediaUrl?: string;
  mediaMimeType?: string;
  filename?: string;
  timestamp: string; // ISO string
  direction: 'inbound' | 'outbound';
  senderType: 'customer' | 'human' | 'ai' | 'system';
  senderName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  failureReason?: string;
  templateId?: string;
  templateName?: string;
  createdAt?: string;
}

export type ConversationStatus = 'New' | 'Open' | 'Waiting' | 'Resolved' | 'Closed';
export type ConversationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface WhatsAppConversation {
  id: string; // Typically the phone number
  clientId?: string; // Matched CRM client
  whatsappPhoneNumber: string;
  contactName: string;
  profileName?: string;
  assignedTo?: string; // Agent ID or Name
  status: ConversationStatus;
  priority: ConversationPriority;
  tags: string[];
  unreadCount: number;
  lastMessage?: WhatsAppMessage;
  lastMessageAt: string;
  lastInboundMessageAt?: string;
  lastOutboundMessageAt?: string;
  aiEnabled: boolean;
  humanTakeover: boolean;
  serviceWindowExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppQuickReply {
  id: string;
  name: string;
  shortcut: string;
  message: string;
  category: string;
}

export interface WhatsAppInternalNote {
  id: string;
  conversationId: string;
  author: string;
  note: string;
  timestamp: string;
}

export interface WhatsAppTemplate {
  name: string;
  category: string;
  language: string;
  status: string;
  id: string;
  components: any[];
}

export interface EmailConversation {
  id: string; // The email address of the client
  contactName: string;
  emailAddress: string;
  status: 'Open' | 'Resolved' | 'Closed' | 'New';
  priority: 'Normal' | 'High' | 'Urgent';
  tags: string[];
  unreadCount: number;
  aiEnabled: boolean;
  humanTakeover: boolean;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  lastMessage?: EmailMessage;
}

export interface EmailMessage {
  id: string;
  conversationId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  body: string;
  htmlBody?: string;
  attachments?: string[];
  timestamp: string;
  direction: 'inbound' | 'outbound';
  senderType: 'human' | 'ai' | 'customer';
  senderName: string;
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  createdAt: string;
}
