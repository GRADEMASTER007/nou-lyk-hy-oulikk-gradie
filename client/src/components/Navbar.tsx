import React, { useState } from 'react';
import { Sprout, LayoutDashboard, Users, Package, FileText, Receipt, Truck, Sparkles, BookOpen, Settings, Search, LogIn, LogOut, RotateCcw, MessageSquare, Mail, Menu, HelpCircle, Bell, ChevronDown } from 'lucide-react';
import { useApp } from '../lib/store';
export type NavSection = 'dashboard' | 'clients' | 'products' | 'quotes' | 'invoices' | 'shipping' | 'ai-assistant' | 'whatsapp-inbox' | 'email-inbox' | 'knowledge' | 'company-settings' | 'settings';
interface NavbarProps { activeSection: NavSection; onSelectSection?: (section: NavSection) => void; onNavigate?: (section: NavSection) => void; onOpenSearch?: () => void; }
export const Navbar: React.FC<NavbarProps> = ({ activeSection, onSelectSection, onNavigate, onOpenSearch }) => {
  const { companySettings, user, signInWithGoogle, logout, resetToDefaults, clients, products, quotes, invoices, shippingRates } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleNavigate = (section: NavSection) => { const target = section === 'settings' ? 'company-settings' : section; onNavigate?.(target); onSelectSection?.(target); setMobileOpen(false); };
  const navItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as NavSection, label: 'Clients & leads', icon: Users, count: clients.length },
    { id: 'products' as NavSection, label: 'Products', icon: Package, count: products.length },
    { id: 'quotes' as NavSection, label: 'Quotes', icon: FileText, count: quotes.length },
    { id: 'invoices' as NavSection, label: 'Invoices', icon: Receipt, count: invoices.length },
    { id: 'shipping' as NavSection, label: 'Shipping', icon: Truck, count: shippingRates.length },
    { id: 'ai-assistant' as NavSection, label: 'AI assistant', icon: Sparkles, highlight: true },
    { id: 'whatsapp-inbox' as NavSection, label: 'WhatsApp inbox', icon: MessageSquare },
    { id: 'email-inbox' as NavSection, label: 'Email inbox', icon: Mail },
    { id: 'knowledge' as NavSection, label: 'Knowledge base', icon: BookOpen },
    { id: 'company-settings' as NavSection, label: 'Company settings', icon: Settings },
  ];
  const isActive = (id: NavSection) => id === 'company-settings' ? activeSection === 'company-settings' || activeSection === 'settings' : activeSection === id;
  const Sidebar = () => (
    <aside className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}>
      <div className="sidebar-brand" onClick={() => handleNavigate('dashboard')} role="button" tabIndex={0}>
        <div className="brand-mark">{companySettings.logoUrl ? <img src={companySettings.logoUrl} alt="Company logo" /> : <Sprout size={22} />}</div>
        <div className="brand-copy"><strong>ProAgriSA</strong><span>Grade Master</span></div>
      </div>
      <button className="new-action" onClick={() => handleNavigate('quotes')}><span>＋</span> New transaction</button>
      <div className="sidebar-section-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map(({ id, label, icon: Icon, count, highlight }) => <button key={id} id={`nav-item-${id}`} onClick={() => handleNavigate(id)} className={`sidebar-link ${isActive(id) ? 'active' : ''} ${highlight ? 'ai-link' : ''}`}><Icon size={17} strokeWidth={isActive(id) ? 2.2 : 1.8} /><span>{label}</span>{count !== undefined && <small>{count}</small>}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-section-label">Account</div>
        {user ? <div className="account-card"><div className="account-avatar">{(user.email || 'O').charAt(0).toUpperCase()}</div><div className="account-copy"><strong>{user.email || 'Owner'}</strong><span>Cloud synced</span></div><button onClick={logout} title="Sign out"><LogOut size={15} /></button></div> : <button className="sidebar-link" onClick={signInWithGoogle}><LogIn size={17} /><span>Sync cloud data</span></button>}
        <button className="sidebar-link muted-link" onClick={resetToDefaults}><RotateCcw size={16} /><span>Reset demo data</span></button>
      </div>
    </aside>
  );
  return <><Sidebar /><header className="workspace-header"><div className="header-left"><button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu"><Menu size={21} /></button><div><div className="breadcrumb">ProAgriSA / <strong>{navItems.find(item => isActive(item.id))?.label || 'Workspace'}</strong></div><h1>{companySettings.companyName || 'Healthy Fields Business Hub'}</h1></div></div><div className="header-actions"><button className="icon-action" onClick={onOpenSearch} title="Search"><Search size={18} /></button><button className="icon-action" title="Help"><HelpCircle size={18} /></button><button className="icon-action" title="Notifications"><Bell size={18} /></button><button className="profile-chip" onClick={() => handleNavigate('company-settings')}><span className="profile-dot">{(companySettings.companyName || 'P').charAt(0)}</span><span className="profile-name">{companySettings.companyName || 'ProAgriSA'}</span><ChevronDown size={14} /></button></div></header>{mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}</>;
};
