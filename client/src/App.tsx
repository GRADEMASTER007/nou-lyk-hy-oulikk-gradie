import React, { useState } from 'react';
import { AppProvider, useApp } from './lib/store';
import { Navbar, NavSection } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ProductsView } from './components/ProductsView';
import { QuotesView } from './components/QuotesView';
import { InvoicesView } from './components/InvoicesView';
import { ShippingView } from './components/ShippingView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { AIAssistantView } from './components/AIAssistantView';
import { WhatsAppInboxView } from './components/WhatsAppInboxView';
import { EmailInboxView } from './components/EmailInboxView';
import { PaymentsModal } from './components/PaymentsModal';
import { EmailModal } from './components/EmailModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { SearchModal } from './components/SearchModal';
import { Client, Invoice, Quote } from './types';

const MainContent: React.FC = () => {
  const { invoices } = useApp();
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modals state
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [emailDocument, setEmailDocument] = useState<{ doc: Quote | Invoice; type: 'Quote' | 'Invoice' } | null>(null);
  const [whatsAppDocument, setWhatsAppDocument] = useState<{ doc: Quote | Invoice; type: 'Quote' | 'Invoice' } | null>(null);

  // Preselection state when creating from other tabs
  const [initialQuoteClient, setInitialQuoteClient] = useState<Client | null>(null);
  const [initialInvoiceClient, setInitialInvoiceClient] = useState<Client | null>(null);

  const handleOpenPaymentForInvoiceId = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      setPaymentInvoice(inv);
    }
  };

  const handleNavigate = (section: NavSection) => {
    if (section === 'settings') {
      setActiveSection('company-settings');
    } else {
      setActiveSection(section);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col font-sans text-[#52606d] antialiased selection:bg-[#dff2da] selection:text-[#1f2933]">
      {/* Top Navigation */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onSelectSection={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="app-main flex-1 w-full transition-all duration-150">
        {activeSection === 'dashboard' && (
          <DashboardView
            onNavigate={handleNavigate}
            onOpenNewClient={() => handleNavigate('clients')}
            onOpenNewProduct={() => handleNavigate('products')}
            onOpenNewQuote={() => handleNavigate('quotes')}
            onOpenNewInvoice={() => handleNavigate('invoices')}
            onOpenPaymentForInvoice={handleOpenPaymentForInvoiceId}
          />
        )}

        {activeSection === 'clients' && (
          <ClientsView
            onOpenNewQuoteForClient={(client) => {
              setInitialQuoteClient(client);
              handleNavigate('quotes');
            }}
            onOpenNewInvoiceForClient={(client) => {
              setInitialInvoiceClient(client);
              handleNavigate('invoices');
            }}
          />
        )}

        {activeSection === 'products' && <ProductsView />}

        {activeSection === 'quotes' && (
          <QuotesView
            onOpenEmailModal={(quote) => setEmailDocument({ doc: quote, type: 'Quote' })}
            onOpenWhatsAppModal={(quote) => setWhatsAppDocument({ doc: quote, type: 'Quote' })}
            initialNewQuoteClient={initialQuoteClient}
            onClearInitialClient={() => setInitialQuoteClient(null)}
          />
        )}

        {activeSection === 'invoices' && (
          <InvoicesView
            onOpenEmailModal={(invoice) => setEmailDocument({ doc: invoice, type: 'Invoice' })}
            onOpenWhatsAppModal={(invoice) => setWhatsAppDocument({ doc: invoice, type: 'Invoice' })}
            onOpenPaymentModal={(invoice) => setPaymentInvoice(invoice)}
            initialNewInvoiceClient={initialInvoiceClient}
            onClearInitialClient={() => setInitialInvoiceClient(null)}
          />
        )}

        {activeSection === 'shipping' && <ShippingView />}

        {activeSection === 'whatsapp-inbox' && <WhatsAppInboxView />}
        {activeSection === 'email-inbox' && <EmailInboxView />}

        {activeSection === 'knowledge' && <KnowledgeBaseView />}

        {(activeSection === 'company-settings' || activeSection === 'settings') && (
          <CompanySettingsView />
        )}

        {activeSection === 'ai-assistant' && (
          <AIAssistantView
            onNavigate={handleNavigate}
            onOpenEmailModal={(doc, type) => setEmailDocument({ doc, type })}
            onOpenWhatsAppModal={(doc, type) => setWhatsAppDocument({ doc, type })}
          />
        )}
      </main>

      {/* High Density Footer */}
      <footer className="app-footer text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#EAB308] animate-pulse"></span>
            <p className="font-mono text-[11px] text-[#9CA3AF]">
              PROAGRISA GRADE MASTER & HEALTHY FIELDS v2.5 • ENTERPRISE SUITE
            </p>
          </div>
          <p className="font-mono text-[11px] text-[#6B7280]">
            EFT Billing • Special Pricing Matrix • Multi-Currency Ledger • Cross-Border Road Logistics
          </p>
        </div>
      </footer>

      {/* Global Spotlight Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Modals */}
      {paymentInvoice && (
        <PaymentsModal invoice={paymentInvoice} onClose={() => setPaymentInvoice(null)} />
      )}

      {emailDocument && (
        <EmailModal
          document={emailDocument.doc}
          type={emailDocument.type}
          onClose={() => setEmailDocument(null)}
        />
      )}

      {whatsAppDocument && (
        <WhatsAppModal
          document={whatsAppDocument.doc}
          type={whatsAppDocument.type}
          onClose={() => setWhatsAppDocument(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
