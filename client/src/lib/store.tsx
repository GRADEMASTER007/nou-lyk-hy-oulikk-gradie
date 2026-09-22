import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CompanySettings,
  Client,
  Product,
  ShippingRate,
  Quote,
  Invoice,
  Payment,
  KnowledgeItem,
  MessageTemplate,
  CommunicationLog,
  ActivityLog,
  EmailAccount,
} from '../types';
import {
  initialCompanySettings,
  initialProducts,
  initialClients,
  initialShippingRates,
  initialQuotes,
  initialInvoices,
  initialPayments,
  initialKnowledge,
  initialMessageTemplates,
  initialCommunications,
  initialEmailAccounts,
} from './initialData';
import { db, auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from './firebase';
import { purgeAccountingData } from './databaseUtils';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { calculateDocumentTotals, generateDocumentNumber } from '../utils/calculator';

interface AppContextType {
  // Data
  companySettings: CompanySettings;
  clients: Client[];
  products: Product[];
  shippingRates: ShippingRate[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  knowledge: KnowledgeItem[];
  templates: MessageTemplate[];
  communications: CommunicationLog[];
  activities: ActivityLog[];
  emailAccounts: EmailAccount[];
  isLoading: boolean;
  user: User | null;
  isFirebaseConnected: boolean;

  // Actions
  updateCompanySettings: (settings: Partial<CompanySettings>) => Promise<void>;
  
  // Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Products
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Shipping
  addShippingRate: (rate: Omit<ShippingRate, 'id' | 'createdAt'>) => Promise<ShippingRate>;
  updateShippingRate: (id: string, rate: Partial<ShippingRate>) => Promise<void>;
  deleteShippingRate: (id: string) => Promise<void>;

  // Quotes
  addQuote: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => Promise<Quote>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  convertQuoteToInvoice: (quoteId: string) => Promise<Invoice>;

  // Invoices
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Payments
  recordPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;

  // Communications
  logCommunication: (log: Omit<CommunicationLog, 'id' | 'sentAt'>) => Promise<CommunicationLog>;

  // Knowledge Base
  addKnowledgeItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<KnowledgeItem>;
  updateKnowledgeItem: (id: string, item: Partial<KnowledgeItem>) => Promise<void>;
  deleteKnowledgeItem: (id: string) => Promise<void>;

  // Message Templates
  updateTemplate: (id: string, template: Partial<MessageTemplate>) => Promise<void>;

  // System Utilities
  purgeSystemData: () => Promise<void>;

  // Email Accounts
  addEmailAccount: (account: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<EmailAccount>;
  updateEmailAccount: (id: string, account: Partial<EmailAccount>) => Promise<void>;
  deleteEmailAccount: (id: string) => Promise<void>;

  // Auth & Sync
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'proagrisa_grademaster_data_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // States initialized from localStorage or initialData
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_company`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.physicalAddress || parsed.physicalAddress.includes('Plot 42 Farm Rietfontein') || parsed.physicalAddress.includes('Pretoria')) {
          parsed.physicalAddress = initialCompanySettings.physicalAddress;
          parsed.postalAddress = initialCompanySettings.postalAddress;
        }
        return { ...initialCompanySettings, ...parsed };
      } catch (e) {}
    }
    return initialCompanySettings;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_clients`);
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_products`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= initialProducts.length) {
          return parsed;
        }
      } catch (e) {}
    }
    return initialProducts;
  });

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_shipping`);
    return saved ? JSON.parse(saved) : initialShippingRates;
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_quotes`);
    return saved ? JSON.parse(saved) : initialQuotes;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_knowledge`);
    return saved ? JSON.parse(saved) : initialKnowledge;
  });

  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_templates`);
    return saved ? JSON.parse(saved) : initialMessageTemplates;
  });

  const [communications, setCommunications] = useState<CommunicationLog[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_communications`);
    return saved ? JSON.parse(saved) : initialCommunications;
  });

  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_emails`);
    return saved ? JSON.parse(saved) : initialEmailAccounts;
  });

  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (authUser) {
        setIsFirebaseConnected(true);
        loadDataFromFirestore();
      } else {
        setIsFirebaseConnected(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_company`, JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_clients`, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_shipping`, JSON.stringify(shippingRates));
  }, [shippingRates]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_quotes`, JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_payments`, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_knowledge`, JSON.stringify(knowledge));
  }, [knowledge]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_templates`, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_communications`, JSON.stringify(communications));
  }, [communications]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_emails`, JSON.stringify(emailAccounts));
  }, [emailAccounts]);

  // Load from Firestore if user is logged in
  const loadDataFromFirestore = async () => {
    try {
      const companySnap = await getDoc(doc(db, 'companies', 'main'));
      if (companySnap.exists()) {
        const loadedCompany = companySnap.data() as CompanySettings;
        setCompanySettings((prev) => ({ ...prev, ...loadedCompany }));
      }

      const clientsSnap = await getDocs(collection(db, 'clients'));
      if (!clientsSnap.empty) {
        const loadedClients: Client[] = [];
        clientsSnap.forEach((doc) => loadedClients.push({ id: doc.id, ...doc.data() } as Client));
        setClients(loadedClients);
      }

      const productsSnap = await getDocs(collection(db, 'products'));
      if (!productsSnap.empty) {
        const loadedProducts: Product[] = [];
        productsSnap.forEach((doc) => loadedProducts.push({ id: doc.id, ...doc.data() } as Product));
        setProducts(loadedProducts);
      }

      const shippingSnap = await getDocs(collection(db, 'shipping'));
      if (!shippingSnap.empty) {
        const loadedShipping: ShippingRate[] = [];
        shippingSnap.forEach((doc) => loadedShipping.push({ id: doc.id, ...doc.data() } as ShippingRate));
        setShippingRates(loadedShipping);
      }

      const quotesSnap = await getDocs(collection(db, 'quotes'));
      if (!quotesSnap.empty) {
        const loadedQuotes: Quote[] = [];
        quotesSnap.forEach((doc) => loadedQuotes.push({ id: doc.id, ...doc.data() } as Quote));
        setQuotes(loadedQuotes);
      }

      const invoicesSnap = await getDocs(collection(db, 'invoices'));
      if (!invoicesSnap.empty) {
        const loadedInvoices: Invoice[] = [];
        invoicesSnap.forEach((doc) => loadedInvoices.push({ id: doc.id, ...doc.data() } as Invoice));
        setInvoices(loadedInvoices);
      }

      const paymentsSnap = await getDocs(collection(db, 'payments'));
      if (!paymentsSnap.empty) {
        const loadedPayments: Payment[] = [];
        paymentsSnap.forEach((doc) => loadedPayments.push({ id: doc.id, ...doc.data() } as Payment));
        setPayments(loadedPayments);
      }

      const knowledgeSnap = await getDocs(collection(db, 'knowledge'));
      if (!knowledgeSnap.empty) {
        const loadedKnowledge: KnowledgeItem[] = [];
        knowledgeSnap.forEach((doc) => loadedKnowledge.push({ id: doc.id, ...doc.data() } as KnowledgeItem));
        setKnowledge(loadedKnowledge);
      }

      const emailsSnap = await getDocs(collection(db, 'email_accounts'));
      if (!emailsSnap.empty) {
        const loadedEmails: EmailAccount[] = [];
        emailsSnap.forEach((doc) => loadedEmails.push({ id: doc.id, ...doc.data() } as EmailAccount));
        setEmailAccounts(loadedEmails);
      }
    } catch (err) {
      console.warn('Firestore sync note:', err);
    }
  };

  const addActivity = (type: ActivityLog['type'], title: string, description: string, entityId?: string) => {
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      entityId,
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 30)]);
  };

  // Actions
  const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
    const updated = { ...companySettings, ...settings };
    setCompanySettings(updated);
    if (user) {
      try {
        await setDoc(doc(db, 'companies', 'main'), updated, { merge: true });
      } catch (e) {
        console.error('Error saving company settings to Firestore:', e);
      }
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
    addActivity('client_added', 'New Client Added', `${newClient.companyName} (${newClient.contactPerson})`, newClient.id);
    
    if (user) {
      try {
        await setDoc(doc(db, 'clients', newClient.id), newClient);
      } catch (e) {
        console.error('Error adding client to Firestore:', e);
      }
    }
    return newClient;
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    const now = new Date().toISOString();
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...clientData, updatedAt: now } : c))
    );
    if (user) {
      try {
        await updateDoc(doc(db, 'clients', id), { ...clientData, updatedAt: now });
      } catch (e) {
        console.error('Error updating client in Firestore:', e);
      }
    }
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'clients', id));
      } catch (e) {
        console.error('Error deleting client from Firestore:', e);
      }
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    addActivity('product_updated', 'Product Added', `${newProduct.name} (${newProduct.sku})`, newProduct.id);

    if (user) {
      try {
        await setDoc(doc(db, 'products', newProduct.id), newProduct);
      } catch (e) {
        console.error('Error adding product to Firestore:', e);
      }
    }
    return newProduct;
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...productData, updatedAt: now } : p))
    );
    if (user) {
      try {
        await updateDoc(doc(db, 'products', id), { ...productData, updatedAt: now });
      } catch (e) {
        console.error('Error updating product in Firestore:', e);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (e) {
        console.error('Error deleting product from Firestore:', e);
      }
    }
  };

  const addShippingRate = async (rateData: Omit<ShippingRate, 'id' | 'createdAt'>): Promise<ShippingRate> => {
    const newRate: ShippingRate = {
      ...rateData,
      id: `ship-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setShippingRates((prev) => [newRate, ...prev]);
    if (user) {
      try {
        await setDoc(doc(db, 'shipping', newRate.id), newRate);
      } catch (e) {
        console.error('Error adding shipping to Firestore:', e);
      }
    }
    return newRate;
  };

  const updateShippingRate = async (id: string, rateData: Partial<ShippingRate>) => {
    setShippingRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...rateData } : r))
    );
    if (user) {
      try {
        await updateDoc(doc(db, 'shipping', id), rateData);
      } catch (e) {
        console.error('Error updating shipping in Firestore:', e);
      }
    }
  };

  const deleteShippingRate = async (id: string) => {
    setShippingRates((prev) => prev.filter((r) => r.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'shipping', id));
      } catch (e) {
        console.error('Error deleting shipping from Firestore:', e);
      }
    }
  };

  const addQuote = async (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>): Promise<Quote> => {
    const quoteNumber = generateDocumentNumber('QUO', quotes.length);
    const newQuote: Quote = {
      ...quoteData,
      id: `quo-${Date.now()}`,
      quoteNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQuotes((prev) => [newQuote, ...prev]);
    addActivity('quote_created', 'Quote Created', `${newQuote.quoteNumber} for ${newQuote.clientSnapshot.companyName}`, newQuote.id);

    if (user) {
      try {
        await setDoc(doc(db, 'quotes', newQuote.id), newQuote);
      } catch (e) {
        console.error('Error adding quote to Firestore:', e);
      }
    }
    return newQuote;
  };

  const updateQuote = async (id: string, quoteData: Partial<Quote>) => {
    const now = new Date().toISOString();
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...quoteData, updatedAt: now } : q))
    );
    if (user) {
      try {
        await updateDoc(doc(db, 'quotes', id), { ...quoteData, updatedAt: now });
      } catch (e) {
        console.error('Error updating quote in Firestore:', e);
      }
    }
  };

  const deleteQuote = async (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'quotes', id));
      } catch (e) {
        console.error('Error deleting quote from Firestore:', e);
      }
    }
  };

  const convertQuoteToInvoice = async (quoteId: string): Promise<Invoice> => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Quote not found');

    const invoiceNumber = generateDocumentNumber('INV', invoices.length);
    const today = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 14);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      quoteId: quote.id,
      clientId: quote.clientId,
      clientSnapshot: quote.clientSnapshot,
      invoiceDate: today,
      dueDate,
      items: quote.items,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      shippingCost: quote.shippingCost,
      shippingDetails: quote.shippingDetails,
      vatRate: quote.vatRate,
      vatAmount: quote.vatAmount,
      grandTotal: quote.grandTotal,
      amountPaid: 0,
      balanceDue: quote.grandTotal,
      currency: quote.currency,
      paymentInstructions: companySettings.paymentInstructions,
      bankingSnapshot: {
        bankName: companySettings.bankName,
        accountName: companySettings.accountName,
        accountNumber: companySettings.accountNumber,
        branchCode: companySettings.branchCode,
        swiftCode: companySettings.swiftCode,
      },
      notes: `Converted from Quotation ${quote.quoteNumber}. ${quote.notes || ''}`,
      terms: companySettings.invoiceTerms || quote.terms,
      status: 'Sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    // Update quote status to Converted
    await updateQuote(quote.id, {
      status: 'Converted',
      convertedInvoiceId: newInvoice.id,
    });

    addActivity(
      'quote_converted',
      'Quote Converted to Invoice',
      `${quote.quoteNumber} converted to ${newInvoice.invoiceNumber} (${quote.clientSnapshot.companyName})`,
      newInvoice.id
    );

    if (user) {
      try {
        await setDoc(doc(db, 'invoices', newInvoice.id), newInvoice);
      } catch (e) {
        console.error('Error converting quote to invoice in Firestore:', e);
      }
    }
    return newInvoice;
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
    const invoiceNumber = generateDocumentNumber('INV', invoices.length);
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    addActivity('invoice_created', 'Invoice Generated', `${newInvoice.invoiceNumber} for ${newInvoice.clientSnapshot.companyName}`, newInvoice.id);

    if (user) {
      try {
        await setDoc(doc(db, 'invoices', newInvoice.id), newInvoice);
      } catch (e) {
        console.error('Error adding invoice to Firestore:', e);
      }
    }
    return newInvoice;
  };

  const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
    const now = new Date().toISOString();
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...invoiceData, updatedAt: now } : inv))
    );
    if (user) {
      try {
        await updateDoc(doc(db, 'invoices', id), { ...invoiceData, updatedAt: now });
      } catch (e) {
        console.error('Error updating invoice in Firestore:', e);
      }
    }
  };

  const deleteInvoice = async (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'invoices', id));
      } catch (e) {
        console.error('Error deleting invoice from Firestore:', e);
      }
    }
  };

  const recordPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // Update invoice balance and status
    const targetInvoice = invoices.find((inv) => inv.id === paymentData.invoiceId);
    if (targetInvoice) {
      const newAmountPaid = Number((targetInvoice.amountPaid + paymentData.amount).toFixed(2));
      const newBalanceDue = Math.max(0, Number((targetInvoice.grandTotal - newAmountPaid).toFixed(2)));
      const newStatus = newBalanceDue <= 0 ? 'Paid' : 'Partially Paid';

      await updateInvoice(targetInvoice.id, {
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
      });
    }

    setPayments((prev) => [newPayment, ...prev]);
    addActivity(
      'payment_received',
      'Payment Logged',
      `Payment of ${paymentData.currency} ${paymentData.amount.toFixed(2)} recorded for ${paymentData.invoiceNumber}`,
      newPayment.id
    );

    if (user) {
      try {
        await setDoc(doc(db, 'payments', newPayment.id), newPayment);
      } catch (e) {
        console.error('Error recording payment in Firestore:', e);
      }
    }
    return newPayment;
  };

  const deletePayment = async (id: string) => {
    const payment = payments.find((p) => p.id === id);
    if (payment) {
      const targetInvoice = invoices.find((inv) => inv.id === payment.invoiceId);
      if (targetInvoice) {
        const newAmountPaid = Math.max(0, Number((targetInvoice.amountPaid - payment.amount).toFixed(2)));
        const newBalanceDue = Math.max(0, Number((targetInvoice.grandTotal - newAmountPaid).toFixed(2)));
        const newStatus = newAmountPaid === 0 ? 'Sent' : newBalanceDue <= 0 ? 'Paid' : 'Partially Paid';
        await updateInvoice(targetInvoice.id, {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newStatus,
        });
      }
    }

    setPayments((prev) => prev.filter((p) => p.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'payments', id));
      } catch (e) {
        console.error('Error deleting payment from Firestore:', e);
      }
    }
  };

  const logCommunication = async (logData: Omit<CommunicationLog, 'id' | 'sentAt'>): Promise<CommunicationLog> => {
    const newLog: CommunicationLog = {
      ...logData,
      id: `comm-${Date.now()}`,
      sentAt: new Date().toISOString(),
    };
    setCommunications((prev) => [newLog, ...prev]);
    if (user) {
      try {
        await setDoc(doc(db, 'communications', newLog.id), newLog);
      } catch (e) {
        console.error('Error saving communication in Firestore:', e);
      }
    }
    return newLog;
  };

  const addKnowledgeItem = async (itemData: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeItem> => {
    const newItem: KnowledgeItem = {
      ...itemData,
      id: `know-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setKnowledge((prev) => [newItem, ...prev]);
    if (user) {
      try {
        await setDoc(doc(db, 'knowledge', newItem.id), newItem);
      } catch (e) {
        console.error('Error saving knowledge in Firestore:', e);
      }
    }
    return newItem;
  };

  const updateKnowledgeItem = async (id: string, itemData: Partial<KnowledgeItem>) => {
    const now = new Date().toISOString();
    setKnowledge((prev) =>
      prev.map((k) => (k.id === id ? { ...k, ...itemData, updatedAt: now } : k))
    );
    if (user) {
      try {
        await updateDoc(doc(db, 'knowledge', id), { ...itemData, updatedAt: now });
      } catch (e) {
        console.error('Error updating knowledge in Firestore:', e);
      }
    }
  };

  const deleteKnowledgeItem = async (id: string) => {
    setKnowledge((prev) => prev.filter((k) => k.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'knowledge', id));
      } catch (e) {
        console.error('Error deleting knowledge from Firestore:', e);
      }
    }
  };

  const updateTemplate = async (id: string, templateData: Partial<MessageTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...templateData } : t))
    );
  };

  const addEmailAccount = async (accountData: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailAccount> => {
    const newAccount: EmailAccount = {
      ...accountData,
      id: `email-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEmailAccounts((prev) => [newAccount, ...prev]);
    if (user) {
      try {
        await setDoc(doc(db, 'email_accounts', newAccount.id), newAccount);
      } catch (e) {
        console.error('Error saving email account to Firestore:', e);
      }
    }
    return newAccount;
  };

  const updateEmailAccount = async (id: string, accountData: Partial<EmailAccount>) => {
    const now = new Date().toISOString();
    setEmailAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...accountData, updatedAt: now } : a))
    );
    if (user) {
      try {
        await updateDoc(doc(db, 'email_accounts', id), { ...accountData, updatedAt: now });
      } catch (e) {
        console.error('Error updating email account in Firestore:', e);
      }
    }
  };

  const deleteEmailAccount = async (id: string) => {
    setEmailAccounts((prev) => prev.filter((a) => a.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'email_accounts', id));
      } catch (e) {
        console.error('Error deleting email account from Firestore:', e);
      }
    }
  };

  const purgeSystemData = async () => {
    if (!user) {
      // If not logged in, just clear local state
      setClients([]);
      setQuotes([]);
      setInvoices([]);
      setPayments([]);
      setCommunications([]);
      setActivities([]);
      return;
    }

    try {
      await purgeAccountingData();
      // Reset local state
      setClients([]);
      setQuotes([]);
      setInvoices([]);
      setPayments([]);
      setCommunications([]);
      setActivities([]);
      // Clear specific local storage keys to force re-init on next load
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_clients`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_quotes`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_invoices`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_payments`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_communications`);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_emails`);
    } catch (err) {
      console.error('Failed to purge system data:', err);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign in error:', err);
      alert(`Sign in error: ${err.message || 'Unable to authenticate with Google'}`);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('Reset all business data (clients, products, quotes, invoices, settings) to initial ProAgriSA defaults?')) {
      setCompanySettings(initialCompanySettings);
      setClients(initialClients);
      setProducts(initialProducts);
      setShippingRates(initialShippingRates);
      setQuotes(initialQuotes);
      setInvoices(initialInvoices);
      setPayments(initialPayments);
      setKnowledge(initialKnowledge);
      setTemplates(initialMessageTemplates);
      setCommunications(initialCommunications);
      localStorage.clear();
    }
  };

  return (
    <AppContext.Provider
      value={{
        companySettings,
        clients,
        products,
        shippingRates,
        quotes,
        invoices,
        payments,
        knowledge,
        templates,
        communications,
        activities,
        emailAccounts,
        isLoading,
        user,
        isFirebaseConnected,
        updateCompanySettings,
        addClient,
        updateClient,
        deleteClient,
        addProduct,
        updateProduct,
        deleteProduct,
        addShippingRate,
        updateShippingRate,
        deleteShippingRate,
        addQuote,
        updateQuote,
        deleteQuote,
        convertQuoteToInvoice,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        recordPayment,
        deletePayment,
        logCommunication,
        addKnowledgeItem,
        updateKnowledgeItem,
        deleteKnowledgeItem,
        updateTemplate,
        purgeSystemData,
        addEmailAccount,
        updateEmailAccount,
        deleteEmailAccount,
        signInWithGoogle,
        logout,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
