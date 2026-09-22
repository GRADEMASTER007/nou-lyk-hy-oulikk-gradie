import React, { useState } from 'react';
import {
  Building,
  Save,
  Check,
  CreditCard,
  FileText,
  DollarSign,
  BookOpen,
  Plus,
  Trash2,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  Bot,
  Image as ImageIcon,
  AlertTriangle,
  ExternalLink,
  Upload,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Settings,
  Truck,
  Key,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { CompanySettings, KnowledgeItem, EmailAccount } from '../types';
import {
  DEFAULT_PRIMARY_LOGO_DATA_URL,
  DEFAULT_EDU_LOGO_DATA_URL,
  HEALTHY_FIELDS_LOGO_SVG,
  PROAGRISA_EDU_LOGO_SVG,
} from '../lib/companyLogos';

export const CompanySettingsView: React.FC = () => {
  const { 
    companySettings, 
    updateCompanySettings, 
    knowledge, 
    addKnowledgeItem, 
    deleteKnowledgeItem,
    emailAccounts,
    updateEmailAccount,
    addEmailAccount,
    deleteEmailAccount,
    purgeSystemData
  } = useApp();

  const [settings, setSettings] = useState<CompanySettings>({ ...companySettings });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // New website inputs
  const [newBizWebsite, setNewBizWebsite] = useState('');
  const [newEduWebsite, setNewEduWebsite] = useState('');

  // New knowledge item state
  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState<'Pricing Rule' | 'Farming Guideline' | 'Shipping Policy' | 'FAQ'>('Pricing Rule');
  const [newContent, setNewContent] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCompanySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving company profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBusinessWebsite = () => {
    if (!newBizWebsite.trim()) return;
    const url = newBizWebsite.trim();
    const current = settings.businessWebsites || [];
    if (!current.includes(url)) {
      setSettings({
        ...settings,
        businessWebsites: [...current, url],
      });
    }
    setNewBizWebsite('');
  };

  const handleRemoveBusinessWebsite = (urlToRemove: string) => {
    const current = settings.businessWebsites || [];
    setSettings({
      ...settings,
      businessWebsites: current.filter((u) => u !== urlToRemove),
    });
  };

  const handleAddEduWebsite = () => {
    if (!newEduWebsite.trim()) return;
    const url = newEduWebsite.trim();
    const current = settings.educationalWebsites || [];
    if (!current.includes(url)) {
      setSettings({
        ...settings,
        educationalWebsites: [...current, url],
      });
    }
    setNewEduWebsite('');
  };

  const handleRemoveEduWebsite = (urlToRemove: string) => {
    const current = settings.educationalWebsites || [];
    setSettings({
      ...settings,
      educationalWebsites: current.filter((u) => u !== urlToRemove),
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'primary' | 'education') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (target === 'primary') {
          setSettings({ ...settings, logoUrl: result });
        } else {
          setSettings({ ...settings, educationLogoUrl: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddKnowledgeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic || !newContent) return;
    await addKnowledgeItem({
      topic: newTopic,
      category: newCategory as any,
      content: newContent,
      tags: [],
    });
    setNewTopic('');
    setNewContent('');
  };

  const handleSystemPurge = async () => {
    try {
      setIsPurging(true);
      await purgeSystemData();
      setShowPurgeConfirm(false);
      alert('System Zeroed Successfully. All transactions, quotes, and communications have been purged.');
    } catch (err) {
      alert('Failed to zero system. Please try again.');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-[#111622] via-[#0E131E] to-[#0A0E17] border border-[#1F293D] shadow-lg">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-950 flex items-center justify-center border border-#EAB308/40">
              <Building className="w-4 h-4 text-[#EAB308]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight flex items-center gap-2">
                Company Profile & Document Settings
                <span className="text-[9px] bg-yellow-950 text-[#EAB308] border border-yellow-800/50 px-2 py-0.5 rounded font-mono font-semibold">
                  LIVE CLOUD PERSISTENCE
                </span>
              </h1>
              <p className="text-xs font-mono text-[#9CA3AF]">
                Configure registered business entities, multi-channel contacts, Capitec banking for invoices, and document logos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-950 border border-yellow-700 text-yellow-200 text-xs font-bold rounded-lg animate-fade-in font-mono shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Check className="w-4 h-4 text-[#EAB308]" />
              <span>Settings Saved & Synced!</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-md transition-all border border-#EAB308/60 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 font-mono">
        {/* Section 1: Business Identity & Legal Information */}
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 sm:p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#EAB308]" />
              <h2 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
                1. Business Identity & Registration
              </h2>
            </div>
            <span className="text-[10px] text-[#9CA3AF]">Appears on Invoices & Quotations Header</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs font-mono">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Registered Company Name *
              </label>
              <input
                type="text"
                required
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="e.g. Healthy Fields Business Hub / ProAgriSA"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Trading As / Secondary Name
              </label>
              <input
                type="text"
                value={settings.tradingName}
                onChange={(e) => setSettings({ ...settings, tradingName: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="e.g. ProAgriSA Agricultural Innovations"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Company Registration No.
              </label>
              <input
                type="text"
                value={settings.registrationNumber || ''}
                onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="e.g. 2021/847291/07"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                VAT / Tax Registration Number
              </label>
              <input
                type="text"
                value={settings.vatNumber || ''}
                onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-[#EAB308] font-bold focus:outline-none focus:border-[#EAB308]"
                placeholder="e.g. 4820293819"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Management / Primary Contact
              </label>
              <input
                type="text"
                value={settings.ownerName || ''}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="e.g. Healthy Fields Management"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Physical Business Address / Location *
              </label>
              <input
                type="text"
                value={settings.physicalAddress}
                onChange={(e) => setSettings({ ...settings, physicalAddress: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="e.g. Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Postal Address & Area Code</label>
              <input
                type="text"
                value={settings.postalAddress || ''}
                onChange={(e) => setSettings({ ...settings, postalAddress: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="e.g. Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Numbers & Communication Channels */}
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 sm:p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-[#EAB308]" />
              <h2 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
                2. Contact Channels & AI Voice Reception
              </h2>
            </div>
            <span className="text-[10px] text-[#9CA3AF]">Direct messaging, invoicing & automated reception</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs font-mono">
            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#EAB308]" />
                Personal WhatsApp (Quotes & Proof of Payment) *
              </label>
              <input
                type="text"
                required
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-yellow-200 font-bold focus:outline-none focus:border-[#EAB308]"
                placeholder="+27 83 447 4639"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                General Business Email (Standard Operations) *
              </label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="admin@proagrisa.co.za"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                Educational Program Email (PocketSchool Pro)
              </label>
              <input
                type="email"
                value={settings.educationalEmail || ''}
                onChange={(e) => setSettings({ ...settings, educationalEmail: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-purple-200 focus:outline-none focus:border-[#EAB308]"
                placeholder="info.pocketschoolpro@proagrisa.co.za"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                AI Reception (All Companies 24/7 Voice)
              </label>
              <input
                type="text"
                value={settings.aiReceptionPhone || ''}
                onChange={(e) => setSettings({ ...settings, aiReceptionPhone: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-[#EAB308]"
                placeholder="+1 351-777-2848"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                Primary Business Phone
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="+27 83 447 4639"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Primary Storefront URL
              </label>
              <input
                type="text"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="https://purelyhealthnutra.company/"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Official Banking Details & Invoice Instructions */}
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 sm:p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-[#EAB308]" />
              <h2 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
                3. Official Banking & Invoice EFT Details
              </h2>
            </div>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
              MANDATORY ON TAX INVOICES
            </span>
          </div>

          {/* Critical Capitec Warning Banner */}
          <div className="bg-[#1A1608] border border-amber-600/60 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1 text-xs font-mono">
              <span className="font-bold text-amber-300 block">
                IMPORTANT BANKING APP NOTIFICATION:
              </span>
              <p className="text-amber-200/90 leading-relaxed">
                {settings.bankingNotice || '⚠️ IMPORTANT: Please select Capitec Business Bank on your banking app (NOT "Capitec Bank").'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono">
            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Bank Name *</label>
              <input
                type="text"
                required
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="Capitec Business Bank"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Account Holder Name *</label>
              <input
                type="text"
                required
                value={settings.accountName}
                onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="Healthy Fields"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Account Number *</label>
              <input
                type="text"
                required
                value={settings.accountNumber}
                onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono font-bold text-[#EAB308] tracking-wider focus:outline-none focus:border-[#EAB308]"
                placeholder="1052 3916 30"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Branch Code</label>
              <input
                type="text"
                value={settings.branchCode}
                onChange={(e) => setSettings({ ...settings, branchCode: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="450105"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Account Type</label>
              <input
                type="text"
                value={settings.accountType || 'Current Account'}
                onChange={(e) => setSettings({ ...settings, accountType: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="Current Account"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">SWIFT / International Code</label>
              <input
                type="text"
                value={settings.swiftCode || ''}
                onChange={(e) => setSettings({ ...settings, swiftCode: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="CBLAZAJJ"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Banking Notice / Selection Warning (Rendered on Invoices & Quotes)
              </label>
              <input
                type="text"
                value={settings.bankingNotice || ''}
                onChange={(e) => setSettings({ ...settings, bankingNotice: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                placeholder='⚠️ IMPORTANT: Please select Capitec Business Bank on your banking app (NOT "Capitec Bank").'
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Next Steps Guidance for Customers
              </label>
              <input
                type="text"
                value={settings.paymentNextSteps || ''}
                onChange={(e) => setSettings({ ...settings, paymentNextSteps: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-yellow-200 focus:outline-none focus:border-[#EAB308]"
                placeholder="Send through your full delivery address 📍 Share your proof of payment once complete 📲"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Full EFT Payment Instructions Text
              </label>
              <textarea
                rows={2}
                value={settings.paymentInstructions}
                onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                className="w-full p-2.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                placeholder="Please make EFT payment to Capitec Business Bank..."
              />
            </div>
          </div>
        </div>

        {/* Section 4: Company Logos & Document Branding */}
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 sm:p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-[#EAB308]" />
              <h2 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
                4. Company Logos & Document Header Branding
              </h2>
            </div>
            <span className="text-[10px] text-[#EAB308] font-semibold bg-yellow-950 px-2 py-0.5 rounded border border-yellow-800/40">
              VECTOR HD RENDER
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Primary Business Logo: Healthy Fields */}
            <div className="p-4 bg-[#0A0B0E] rounded-xl border border-[#1F2430] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
                  Primary Company Logo (Healthy Fields Business Hub)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-yellow-950 text-[#EAB308] border border-yellow-800/40 rounded">
                  All Invoices & Quotations
                </span>
              </div>

              <div className="flex items-center gap-4 bg-[#11141D] p-3 rounded-lg border border-[#1F2430]">
                <div className="w-20 h-20 shrink-0 bg-white rounded-lg p-1 flex items-center justify-center border border-slate-200 overflow-hidden shadow-sm">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Healthy Fields Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: HEALTHY_FIELDS_LOGO_SVG }}
                    />
                  )}
                </div>
                <div className="space-y-1.5 text-xs text-[#9CA3AF] flex-1">
                  <p className="font-bold text-white text-[11px]">Healthy Fields Business Hub</p>
                  <p className="text-[10px] text-[#6B7280]">
                    Innovate • Integrate • Grow (Agriculture, Tech, Health, Edu, E-Com)
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logoUrl: DEFAULT_PRIMARY_LOGO_DATA_URL })}
                      className="text-[10px] px-2 py-1 bg-[#1A2234] hover:bg-[#25324D] text-yellow-200 rounded border border-yellow-800/40 font-mono transition-colors"
                    >
                      Reset to Original Logo
                    </button>
                    <label className="text-[10px] px-2 py-1 bg-[#1A202C] hover:bg-[#252D3D] text-[#D1D5DB] rounded border border-[#2D3748] font-mono cursor-pointer transition-colors flex items-center gap-1">
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload New</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLogoUpload(e, 'primary')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] mb-1">
                  Custom Logo URL / Image Source
                </label>
                <input
                  type="text"
                  value={settings.logoUrl}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  placeholder="https://... or data:image/..."
                  className="w-full p-2 bg-[#11141D] border border-[#252D3D] rounded-lg text-xs font-mono text-[#D1D5DB] focus:outline-none focus:border-[#EAB308]"
                />
              </div>
            </div>

            {/* Educational Program Logo: ProAgriSA Education */}
            <div className="p-4 bg-[#0A0B0E] rounded-xl border border-[#1F2430] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                  Educational Program Logo (ProAgriSA Education)
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded">
                  PocketSchool Pro / Education
                </span>
              </div>

              <div className="flex items-center gap-4 bg-[#11141D] p-3 rounded-lg border border-[#1F2430]">
                <div className="w-20 h-20 shrink-0 bg-[#0F3A3A] rounded-lg p-1 flex items-center justify-center border border-teal-600/40 overflow-hidden shadow-sm">
                  {settings.educationLogoUrl ? (
                    <img
                      src={settings.educationLogoUrl}
                      alt="ProAgriSA Education Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: PROAGRISA_EDU_LOGO_SVG }}
                    />
                  )}
                </div>
                <div className="space-y-1.5 text-xs text-[#9CA3AF] flex-1">
                  <p className="font-bold text-white text-[11px]">ProAgriSA Education</p>
                  <p className="text-[10px] text-[#6B7280]">
                    PocketSchool Pro, StudentGPT Pro & Agricultural Knowledge Base
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, educationLogoUrl: DEFAULT_EDU_LOGO_DATA_URL })}
                      className="text-[10px] px-2 py-1 bg-[#1A2234] hover:bg-[#25324D] text-cyan-300 rounded border border-cyan-800/40 font-mono transition-colors"
                    >
                      Reset to Original Logo
                    </button>
                    <label className="text-[10px] px-2 py-1 bg-[#1A202C] hover:bg-[#252D3D] text-[#D1D5DB] rounded border border-[#2D3748] font-mono cursor-pointer transition-colors flex items-center gap-1">
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload New</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleLogoUpload(e, 'education')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] mb-1">
                  Education Logo URL / Image Source
                </label>
                <input
                  type="text"
                  value={settings.educationLogoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, educationLogoUrl: e.target.value })}
                  placeholder="https://... or data:image/..."
                  className="w-full p-2 bg-[#11141D] border border-[#252D3D] rounded-lg text-xs font-mono text-[#D1D5DB] focus:outline-none focus:border-[#EAB308]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Websites & E-Commerce Network */}
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 sm:p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-[#EAB308]" />
              <h2 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
                5. E-Commerce, Business & Educational Websites Matrix
              </h2>
            </div>
            <span className="text-[10px] text-[#9CA3AF]">Official company digital footprint</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* General Business & E-Commerce Websites */}
            <div className="p-4 bg-[#0A0B0E] rounded-xl border border-[#1F2430] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#EAB308]" />
                  General Business & E-Commerce Websites
                </span>
                <span className="text-[10px] text-[#EAB308] font-bold">
                  {(settings.businessWebsites || []).length} Sites
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(settings.businessWebsites || []).map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-[#11141D] rounded border border-[#1F2430] text-xs hover:border-yellow-800/40"
                  >
                    <a
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-200 hover:text-yellow-200 flex items-center gap-1.5 truncate max-w-[280px]"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{url}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveBusinessWebsite(url)}
                      className="text-[#6B7280] hover:text-rose-400 p-1"
                      title="Remove URL"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add website input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBizWebsite}
                  onChange={(e) => setNewBizWebsite(e.target.value)}
                  placeholder="e.g. https://www.dragonfruitafrica.company"
                  className="flex-1 p-2 bg-[#11141D] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBusinessWebsite();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddBusinessWebsite}
                  className="px-3 py-1.5 bg-[#1A2234] hover:bg-[#25324D] text-yellow-200 border border-yellow-800/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Educational Program Websites */}
            <div className="p-4 bg-[#0A0B0E] rounded-xl border border-[#1F2430] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                  Educational Program Websites
                </span>
                <span className="text-[10px] text-purple-300 font-bold">
                  {(settings.educationalWebsites || []).length} Programs
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(settings.educationalWebsites || []).map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-[#11141D] rounded border border-[#1F2430] text-xs hover:border-purple-800/40"
                  >
                    <a
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-purple-200 flex items-center gap-1.5 truncate max-w-[280px]"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{url}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveEduWebsite(url)}
                      className="text-[#6B7280] hover:text-rose-400 p-1"
                      title="Remove URL"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add education website input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEduWebsite}
                  onChange={(e) => setNewEduWebsite(e.target.value)}
                  placeholder="e.g. https://pocketschoolpro.company"
                  className="flex-1 p-2 bg-[#11141D] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEduWebsite();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddEduWebsite}
                  className="px-3 py-1.5 bg-[#251A34] hover:bg-[#382650] text-purple-300 border border-purple-800/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Document Numbering, VAT & Terms */}
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 sm:p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#EAB308]" />
              <h2 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
                6. Numbering & Quotation / Invoicing Terms
              </h2>
            </div>
            <span className="text-[10px] text-[#9CA3AF]">Default document rules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono">
            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Quote Number Prefix</label>
              <input
                type="text"
                value={settings.quotePrefix || 'QUO-2026-'}
                onChange={(e) => setSettings({ ...settings, quotePrefix: e.target.value })}
                className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={settings.invoicePrefix || 'INV-2026-'}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#9CA3AF] mb-1">Default VAT Rate (%)</label>
              <input
                type="number"
                value={settings.defaultVatRate}
                onChange={(e) => setSettings({ ...settings, defaultVatRate: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Default Quotation Payment Terms
              </label>
              <input
                type="text"
                value={settings.paymentTerms}
                onChange={(e) => setSettings({ ...settings, paymentTerms: e.target.value })}
                className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-[#9CA3AF] mb-1">
                Document Footer & Tagline
              </label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Integrations (Mail & Shipping) */}
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 sm:p-5 space-y-6 font-mono">
          <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-[#EAB308]" />
              <h2 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
                7. Mail & Shipping Integrations
              </h2>
            </div>
            <span className="text-[10px] text-[#9CA3AF]">External server configurations & API keys</span>
          </div>

          <div className="space-y-6">
            {/* Shipping Keys */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-tighter">
                <Truck className="w-3.5 h-3.5 text-[#EAB308]" />
                Logistics & Courier API Keys
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#9CA3AF]">
                    PUDO Shipping API Key
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4B5563]" />
                    <input
                      type="password"
                      value={settings.pudoApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, pudoApiKey: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-yellow-200 focus:outline-none focus:border-[#EAB308]"
                      placeholder="Enter PUDO Key..."
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#9CA3AF]">
                    The Courier Guy (TCG) API Key
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4B5563]" />
                    <input
                      type="password"
                      value={settings.theCourierGuyApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, theCourierGuyApiKey: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-yellow-200 focus:outline-none focus:border-[#EAB308]"
                      placeholder="Enter TCG Key..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mail Accounts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-tighter">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Mail Server Accounts (IMAP/SMTP)
                </div>
                <span className="text-[10px] text-[#9CA3AF]">
                  Total: {emailAccounts.length} accounts
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {emailAccounts.map((account) => (
                  <div 
                    key={account.id}
                    className="p-4 bg-[#0A0B0E] rounded-xl border border-[#1F2430] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${account.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-white">{account.email}</p>
                        <p className="text-[10px] text-[#9CA3AF]">
                          {account.incomingServer} (IMAP: {account.imapPort}) | {account.outgoingServer} (SMTP: {account.smtpPort})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#9CA3AF]">AI AUTO-REPLY</span>
                        <button
                          type="button"
                          onClick={() => updateEmailAccount(account.id, { aiAutoReply: !account.aiAutoReply })}
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                            account.aiAutoReply ? 'bg-[#EAB308]' : 'bg-[#252D3D]'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              account.aiAutoReply ? 'translate-x-5.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => deleteEmailAccount(account.id)}
                        className="p-1.5 hover:bg-rose-950/30 text-[#6B7280] hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {emailAccounts.length === 0 && (
                  <div className="p-8 text-center bg-[#0A0B0E] rounded-xl border border-dashed border-[#1F2430]">
                    <Mail className="w-8 h-8 text-[#252D3D] mx-auto mb-2" />
                    <p className="text-xs text-[#9CA3AF]">No custom mail server accounts configured.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2.5 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-lg transition-all border border-#EAB308/60 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving to Database...' : 'Save Company Details to Database'}</span>
          </button>
        </div>
      </form>

      {/* Section 7: Business Knowledge Base for AI */}
      <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-4 sm:p-5 space-y-4 font-mono">
        <div className="flex items-center space-x-2 border-b border-[#1F2430] pb-3">
          <BookOpen className="w-4 h-4 text-[#EAB308]" />
          <div>
            <h2 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
              7. Business Knowledge & Rules for AI
            </h2>
            <p className="text-[10px] font-mono text-[#9CA3AF]">
              The AI assistant references these rules when calculating quotes, verifying shipping, or answering customer questions.
            </p>
          </div>
        </div>

        {/* List of Knowledge Items */}
        <div className="space-y-2 font-mono">
          {knowledge.map((k) => (
            <div
              key={k.id}
              className="p-3 bg-[#151924] rounded-lg border border-[#1F2430] text-xs flex items-start justify-between gap-3 font-mono"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">{k.topic}</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#1B2130] text-[#EAB308] border border-yellow-800/30 rounded font-semibold">
                    {k.category}
                  </span>
                </div>
                <p className="text-[#9CA3AF] leading-relaxed text-[11px]">{k.content}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteKnowledgeItem(k.id)}
                className="text-[#6B7280] hover:text-rose-400 p-1"
                title="Delete rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Rule */}
        <form
          onSubmit={handleAddKnowledgeItem}
          className="bg-[#0A0B0E] p-3.5 rounded-xl border border-[#1F2430] space-y-2.5 text-xs font-mono"
        >
          <span className="font-bold text-[#EAB308] block text-xs">Add Custom Business Rule or Guideline</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[#9CA3AF] font-semibold mb-1">Topic / Title</label>
              <input
                type="text"
                required
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Export Phyto Certification Protocol"
                className="w-full p-2 bg-[#11141D] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#9CA3AF] font-semibold mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full p-2 bg-[#11141D] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
              >
                <option value="Pricing Rule" className="bg-[#11141D]">Pricing Rule</option>
                <option value="Farming Guideline" className="bg-[#11141D]">Farming Guideline</option>
                <option value="Shipping Policy" className="bg-[#11141D]">Shipping Policy</option>
                <option value="FAQ" className="bg-[#11141D]">FAQ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#9CA3AF] font-semibold mb-1">Rule Content</label>
            <textarea
              rows={2}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. For orders above 500 plants to Botswana, apply 5% discount on shipping."
              className="w-full p-2 bg-[#11141D] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#EAB308] hover:bg-#EAB308 text-black font-bold rounded-lg shadow-sm text-xs font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Business Rule</span>
          </button>
        </form>
      </div>

      {/* Section 8: System Maintenance */}
      <div className="bg-[#11141D] rounded-xl border border-rose-950 shadow-sm p-4 sm:p-5 space-y-4 font-mono">
        <div className="flex items-center space-x-2 border-b border-rose-950 pb-3">
          <RefreshCw className="w-4 h-4 text-rose-500" />
          <div>
            <h2 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
              8. System Maintenance
            </h2>
            <p className="text-[10px] font-mono text-[#9CA3AF]">
              Dangerous operations. These actions cannot be undone.
            </p>
          </div>
        </div>

        <div className="bg-[#0A0B0E] p-4 rounded-xl border border-rose-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-tighter">Zero Accounting System</h3>
            <p className="text-[10px] text-[#9CA3AF] max-w-md">
              This will permanently delete all invoices, quotes, payments, and communication logs from the database. 
              Products, pricing, and company settings will be preserved.
            </p>
          </div>

          {!showPurgeConfirm ? (
            <button
              type="button"
              onClick={() => setShowPurgeConfirm(true)}
              className="px-4 py-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 text-[10px] font-bold rounded-lg border border-rose-900/50 transition-all uppercase tracking-widest"
            >
              Zero All Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPurging}
                onClick={handleSystemPurge}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest flex items-center gap-2"
              >
                {isPurging ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                Confirm Purge
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setShowPurgeConfirm(false)}
                className="px-4 py-2 bg-[#1F2430] hover:bg-[#2D3446] text-white text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
