import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Tag,
  Edit2,
  Trash2,
  Sparkles,
  Bot,
  Layers,
  CheckCircle2,
  X,
  Copy,
  Check,
  FileText,
  HelpCircle,
  Truck,
  DollarSign,
  Sprout,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { KnowledgeItem } from '../types';

export const KnowledgeBaseView: React.FC = () => {
  const { knowledge: knowledgeBase, addKnowledgeItem: addKnowledge, updateKnowledgeItem: updateKnowledge, deleteKnowledgeItem: deleteKnowledge, companySettings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(knowledgeBase[0] || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<KnowledgeItem> | null>(null);

  const categories = ['All', 'Pricing Rule', 'Farming Guideline', 'Shipping Policy', 'FAQ', 'General'];

  const categoryIcons: Record<string, any> = {
    'Pricing Rule': DollarSign,
    'Farming Guideline': Sprout,
    'Shipping Policy': Truck,
    'FAQ': HelpCircle,
    'General': FileText,
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return knowledgeBase.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.topic.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));
      return matchesCat && matchesSearch;
    });
  }, [knowledgeBase, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingItem({
      topic: '',
      category: (selectedCategory !== 'All' ? selectedCategory : 'Pricing Rule') as any,
      content: '',
      tags: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KnowledgeItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.topic?.trim() || !editingItem.content?.trim()) {
      alert('Topic and Content are required.');
      return;
    }

    if (editingItem.id) {
      await updateKnowledge(editingItem.id, editingItem);
      if (selectedItem?.id === editingItem.id) {
        setSelectedItem(editingItem as KnowledgeItem);
      }
    } else {
      const created = await addKnowledge({
        topic: editingItem.topic,
        category: editingItem.category || 'General',
        content: editingItem.content,
        tags: editingItem.tags || [],
      } as any);
      setSelectedItem(created);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this knowledge entry? The AI Assistant will no longer reference it.')) {
      await deleteKnowledge(id);
      if (selectedItem?.id === id) {
        setSelectedItem(knowledgeBase.find((k) => k.id !== id) || null);
      }
    }
  };

  const handleCopyContent = (item: KnowledgeItem) => {
    navigator.clipboard.writeText(`${item.topic}\n\n${item.content}`);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#11141D] via-[#141B2B] to-[#0D1C18] p-4 sm:p-5 rounded-xl border border-[#1F293D] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#EAB308] text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-[#EAB308]" />
            <span>ENTERPRISE KNOWLEDGE BASE & AI CONTEXT</span>
            <span className="text-[9px] bg-yellow-950 text-yellow-200 border border-yellow-700/50 px-1.5 py-0.5 rounded font-mono font-bold">
              {knowledgeBase.length} ARTICLES
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            Knowledge Base & Operational Rules
          </h1>
          <p className="text-xs font-mono text-[#9CA3AF] mt-1 max-w-2xl">
            Master repository for dragon fruit cultivation practices, special wholesale rules, cross-border road logistics, and company policies automatically utilized by the AI Copilot.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="add-knowledge-article-btn"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Article / Rule</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#11141D] p-3 rounded-xl border border-[#1F2430] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat] || Layers;
            const count = cat === 'All' ? knowledgeBase.length : knowledgeBase.filter((k) => k.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-yellow-950 text-yellow-200 border-yellow-700/60 font-bold shadow-sm'
                    : 'bg-[#151924] text-[#9CA3AF] hover:text-white border-[#222938] hover:bg-[#1C2230]'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-[#EAB308]' : 'text-[#6B7280]'}`} />
                <span>{cat}</span>
                <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-yellow-950/60 text-yellow-200' : 'bg-[#0D1017] text-[#6B7280]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            id="knowledge-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, tags, cultivars..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Article List */}
        <div className="lg:col-span-5 space-y-2 max-h-[680px] overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <div className="bg-[#11141D] p-8 rounded-xl border border-[#1F2430] text-center text-xs font-mono text-[#6B7280]">
              <BookOpen className="w-8 h-8 text-[#374151] mx-auto mb-2" />
              <p className="text-white font-bold">No knowledge articles found</p>
              <p className="text-[11px] mt-1">Try changing your search terms or category filter.</p>
              <button
                onClick={handleOpenAdd}
                className="mt-3 px-3 py-1.5 bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/40 rounded text-xs font-semibold hover:bg-#EAB308/30"
              >
                + Create New Rule
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const Icon = categoryIcons[item.category] || FileText;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#151B27] border-[#EAB308]/80 shadow-md shadow-yellow-950/30'
                      : 'bg-[#11141D] border-[#1F2430] hover:border-[#2F3B52] hover:bg-[#141824]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded bg-[#1A202C] text-[#EAB308] border border-[#2D3748]">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="font-mono text-xs font-bold text-white line-clamp-1">{item.topic}</h3>
                        <span className="text-[10px] font-mono text-[#9CA3AF]">{item.category}</span>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0A0B0E] text-[#EAB308] border border-[#1F2430]">
                      AI ACTIVE
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-[#9CA3AF] line-clamp-2 font-mono leading-relaxed">
                    {item.content}
                  </p>

                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-1.5 py-0.2 bg-[#0E1118] text-[#9CA3AF] border border-[#222938] rounded font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[9px] text-[#6B7280] font-mono">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Viewer / Editor */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="bg-[#11141D] rounded-xl border border-[#1F2430] p-5 space-y-4 shadow-xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2430] pb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-yellow-950 text-yellow-200 border border-yellow-700/50 rounded">
                      {selectedItem.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#6B7280]">
                      ID: {selectedItem.id}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold font-mono text-white tracking-tight">{selectedItem.topic}</h2>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleCopyContent(selectedItem)}
                    className="p-1.5 bg-[#1A202C] hover:bg-[#252D3D] text-[#D1D5DB] border border-[#2D3748] rounded text-xs transition-colors flex items-center space-x-1 font-mono"
                    title="Copy Article Content"
                  >
                    {copiedId === selectedItem.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#EAB308]" />
                        <span className="text-[#EAB308] text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(selectedItem)}
                    className="p-1.5 bg-[#1A202C] hover:bg-[#252D3D] text-amber-300 border border-amber-800/40 rounded text-xs transition-colors flex items-center space-x-1 font-mono"
                    title="Edit Knowledge Article"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(selectedItem.id)}
                    className="p-1.5 bg-[#1A202C] hover:bg-rose-950/80 text-rose-300 border border-rose-800/40 rounded text-xs transition-colors"
                    title="Delete Article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="bg-[#0A0B0E] p-4 rounded-lg border border-[#1F2430] font-mono text-xs text-[#E5E7EB] whitespace-pre-wrap leading-relaxed min-h-[220px]">
                {selectedItem.content}
              </div>

              {/* Tags & AI Context Banner */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Tag className="w-3.5 h-3.5 text-[#EAB308]" />
                  <span className="text-xs font-mono font-bold text-white">Indexed Tags & Keywords:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.tags && selectedItem.tags.length > 0 ? (
                    selectedItem.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#151924] text-yellow-200 border border-yellow-800/40 rounded text-xs font-mono"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-mono text-[#6B7280]">No tags specified</span>
                  )}
                </div>
              </div>

              {/* AI Copilot Sync Banner */}
              <div className="bg-[#151B27] p-3 rounded-lg border border-yellow-800/40 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-[#EAB308] animate-pulse" />
                  <span className="text-[#D1D5DB]">
                    This rule is actively indexed by the <strong>AI Assistant</strong> for quote generation and client queries.
                  </span>
                </div>
                <span className="text-[10px] text-[#EAB308] font-bold uppercase">Sync Live</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#11141D] rounded-xl border border-[#1F2430] p-12 text-center text-xs font-mono text-[#6B7280]">
              <BookOpen className="w-10 h-10 text-[#374151] mx-auto mb-3" />
              <p className="text-white font-bold text-sm">Select an article to view details</p>
              <p className="mt-1">Or click "+ Add Article / Rule" to create a new operational policy.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Article Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#11141D] border border-[#252D3D] rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-[#1F2430] pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#EAB308]" />
                <h3 className="font-bold text-sm text-white">
                  {editingItem.id ? 'Edit Knowledge Article / Rule' : 'New Knowledge Article / Rule'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white p-1 rounded hover:bg-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#9CA3AF] mb-1">Article Topic / Policy Title *</label>
                <input
                  type="text"
                  required
                  value={editingItem.topic || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, topic: e.target.value })}
                  placeholder="e.g., Dragon Fruit Pollination & Trellis Specs or Botswana Cross-Border SADC Clearance"
                  className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#9CA3AF] mb-1">Category</label>
                  <select
                    value={editingItem.category || 'Pricing Rule'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                  >
                    {categories.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#9CA3AF] mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={editingItem.tags?.join(', ') || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="dragon fruit, logistics, botswana, wholesale"
                    className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#9CA3AF] mb-1">Detailed Content & Guidelines *</label>
                <textarea
                  rows={8}
                  required
                  value={editingItem.content || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                  placeholder="Enter detailed farming requirements, special pricing tiers, shipping lead times, banking instructions, or crop specifications..."
                  className="w-full p-3 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1F2430]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-bold rounded shadow-sm transition-colors"
                >
                  {editingItem.id ? 'Update Article' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
