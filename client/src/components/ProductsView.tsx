import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  X,
  DollarSign,
  LayoutGrid,
  List,
  Download,
  ArrowUpDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { Product } from '../types';
import { formatCurrency } from '../utils/calculator';

export const ProductsView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, companySettings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'sku-asc'>('sku-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => {
      const cat = p.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
    return ['All', ...uniqueCats];
  }, [products]);

  // Filtered and Sorted Products
  const filteredAndSortedProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return a.standardPrice - b.standardPrice;
      if (sortBy === 'price-desc') return b.standardPrice - a.standardPrice;
      if (sortBy === 'sku-asc') return a.sku.localeCompare(b.sku);
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    if (pageSize >= 999) return filteredAndSortedProducts;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedProducts.slice(start, start + pageSize);
  }, [filteredAndSortedProducts, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingProduct({
      sku: `PROD-${String(products.length + 1).padStart(3, '0')}`,
      name: '',
      category: selectedCategory !== 'All' ? selectedCategory : 'Dragon Fruit Cultivars & Cuttings',
      description: '',
      unit: 'unit',
      costPrice: 50.0,
      standardPrice: 150.0,
      wholesalePrice: 120.0,
      retailPrice: 150.0,
      currency: companySettings.defaultCurrency || 'ZAR',
      vatRate: companySettings.defaultVatRate || 15,
      imageUrl: '',
      notes: '',
      isActive: true,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.sku) {
      alert('Product Name and SKU are required.');
      return;
    }

    if (editingProduct.id) {
      await updateProduct(editingProduct.id, editingProduct);
    } else {
      await addProduct(editingProduct as any);
    }
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product from catalog?')) {
      await deleteProduct(id);
    }
  };

  const exportToCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'Unit', 'Standard Price (ZAR)', 'Wholesale Price (ZAR)', 'Cost Price (ZAR)', 'Retail Price (ZAR)', 'Description'];
    const rows = filteredAndSortedProducts.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      `"${p.unit}"`,
      p.standardPrice,
      p.wholesalePrice,
      p.costPrice,
      p.retailPrice,
      `"${(p.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ProAgriSA_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold font-mono text-white tracking-tight uppercase">Product & Material Inventory</h1>
            <span className="text-[10px] bg-yellow-950 text-[#EAB308] border border-yellow-800/40 px-2 py-0.5 rounded font-mono font-semibold">
              {products.length} TOTAL SKUS
            </span>
          </div>
          <p className="text-xs font-mono text-[#9CA3AF] border-t border-[#1F2430] mt-1 pt-1">
            Complete inventory catalog including Dragon Fruit cultivars, nursery plug trays, micro-algae, EM1 soil inputs, probiotic starters, and advisory products.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="products-export-btn"
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#151924] hover:bg-[#1E2536] text-[#E5E7EB] text-xs font-mono rounded-lg border border-[#252D3D] transition-colors"
            title="Export filtered catalog to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#EAB308]" />
            <span>Export CSV</span>
          </button>

          <button
            id="products-add-new-btn"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors border border-yellow-200/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#11141D] border border-[#1F2430] rounded-lg p-2.5">
          <span className="text-[10px] text-[#6B7280] block uppercase">Live Catalog Size</span>
          <span className="text-sm font-bold text-white font-mono">{products.length} Products</span>
        </div>
        <div className="bg-[#11141D] border border-[#1F2430] rounded-lg p-2.5">
          <span className="text-[10px] text-[#6B7280] block uppercase">Filtered View</span>
          <span className="text-sm font-bold text-[#EAB308] font-mono">{filteredAndSortedProducts.length} Items</span>
        </div>
        <div className="bg-[#11141D] border border-[#1F2430] rounded-lg p-2.5">
          <span className="text-[10px] text-[#6B7280] block uppercase">Active Categories</span>
          <span className="text-sm font-bold text-[#E5E7EB] font-mono">{categories.length - 1} Categories</span>
        </div>
        <div className="bg-[#11141D] border border-[#1F2430] rounded-lg p-2.5">
          <span className="text-[10px] text-[#6B7280] block uppercase">Pricing Base Currency</span>
          <span className="text-sm font-bold text-[#EAB308] font-mono">ZAR (Rands) • 15% VAT</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-3 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              id="products-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search SKU, cultivar, culture, bag size..."
              className="w-full pl-8 pr-8 py-1.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#EAB308]/50 focus:border-[#EAB308]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#6B7280] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
            {/* Sort selection */}
            <div className="flex items-center space-x-1.5 bg-[#0A0B0E] border border-[#252D3D] px-2 py-1 rounded-lg text-xs text-[#9CA3AF]">
              <ArrowUpDown className="w-3 h-3 text-[#EAB308]" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-[#E5E7EB] text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value="sku-asc">Sort: SKU Code</option>
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="name-desc">Sort: Name (Z-A)</option>
                <option value="price-asc">Sort: Price (Low-High)</option>
                <option value="price-desc">Sort: Price (High-Low)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0A0B0E] border border-[#252D3D] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-[#EAB308] text-black' : 'text-[#6B7280] hover:text-white'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-[#EAB308] text-black' : 'text-[#6B7280] hover:text-white'
                }`}
                title="Dense Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-md font-mono whitespace-nowrap transition-colors flex items-center space-x-1.5 border ${
                  isSelected
                    ? 'bg-[#EAB308] text-black font-bold border-#EAB308'
                    : 'bg-[#151924] text-[#9CA3AF] hover:text-[#E5E7EB] border-[#252D3D]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded ${
                    isSelected ? 'bg-black/30 text-black font-bold' : 'bg-[#0A0B0E] text-[#6B7280]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Content */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] p-12 text-center text-[#6B7280] font-mono">
          <Package className="w-8 h-8 mx-auto mb-2 text-[#4B5563]" />
          <p className="text-sm text-white font-semibold">No products found</p>
          <p className="text-xs mt-1">Try clearing search filters or selecting a different category.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-3 px-3 py-1.5 bg-[#151924] hover:bg-[#1E2536] text-[#EAB308] text-xs rounded border border-[#252D3D]"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {paginatedProducts.map((prod) => (
            <div
              key={prod.id}
              id={`product-card-${prod.id}`}
              className="bg-[#11141D] rounded-xl border border-[#1F2430] hover:border-[#2E384D] shadow-sm hover:shadow-[0_0_12px_rgba(0,0,0,0.5)] transition-all overflow-hidden flex flex-col justify-between group font-mono"
            >
              <div>
                {/* Product Header / Banner */}
                <div className="p-3.5 border-b border-[#1F2430] flex items-start justify-between bg-[#151924]">
                  <div className="pr-2">
                    <span className="text-[10px] font-mono font-bold bg-[#1B2130] text-[#EAB308] border border-yellow-800/30 px-2 py-0.5 rounded">
                      {prod.sku}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1.5 group-hover:text-[#EAB308] transition-colors leading-snug">
                      {prod.name}
                    </h3>
                    <span className="text-[11px] text-[#6B7280]">{prod.category} • per {prod.unit}</span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1 text-[#9CA3AF] hover:text-[#EAB308] hover:bg-[#1E2536] rounded"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-1 text-[#6B7280] hover:text-rose-400 hover:bg-rose-950/40 rounded"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="p-3.5 space-y-3 text-xs">
                  <p className="text-[#9CA3AF] line-clamp-2 leading-relaxed text-[11px]">
                    {prod.description || 'ProAgriSA official catalog stock item.'}
                  </p>

                  {/* Pricing Tiers Matrix */}
                  <div className="bg-[#0A0B0E] rounded-lg p-2.5 border border-[#1F2430] grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[9px] text-[#6B7280] uppercase font-semibold block">Standard</span>
                      <span className="font-mono font-bold text-[#E5E7EB] text-xs">
                        {formatCurrency(prod.standardPrice, prod.currency)}
                      </span>
                    </div>
                    <div className="border-x border-[#1F2430]">
                      <span className="text-[9px] text-[#EAB308] uppercase font-semibold block">Wholesale</span>
                      <span className="font-mono font-bold text-[#EAB308] text-xs">
                        {formatCurrency(prod.wholesalePrice, prod.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6B7280] uppercase font-semibold block">Retail</span>
                      <span className="font-mono font-bold text-[#9CA3AF] text-xs">
                        {formatCurrency(prod.retailPrice, prod.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="p-2.5 bg-[#0E1118] border-t border-[#1F2430] flex items-center justify-between text-[10px] text-[#6B7280]">
                <span>Cost: <strong className="font-mono text-white">{formatCurrency(prod.costPrice, prod.currency)}</strong></span>
                <span className="flex items-center gap-1">
                  {prod.isActive ? (
                    <span className="text-[#EAB308] font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Active Stock
                    </span>
                  ) : (
                    <span className="text-[#6B7280]">Inactive</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Dense Table View */
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#151924] text-[#6B7280] border-b border-[#1F2430] uppercase text-[10px]">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product / Cultivar Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3 text-right">Standard Price</th>
                  <th className="p-3 text-right">Wholesale</th>
                  <th className="p-3 text-right">Cost Price</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2430] text-[#E5E7EB]">
                {paginatedProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#151924]/60 transition-colors">
                    <td className="p-3 font-bold text-[#EAB308] text-[11px] whitespace-nowrap">
                      {prod.sku}
                    </td>
                    <td className="p-3 font-semibold text-white">
                      <div>{prod.name}</div>
                      <div className="text-[10px] text-[#6B7280] truncate max-w-xs">{prod.description}</div>
                    </td>
                    <td className="p-3 text-[#9CA3AF] whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-[#0A0B0E] border border-[#252D3D] rounded text-[10px]">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-3 text-[#9CA3AF] whitespace-nowrap">{prod.unit}</td>
                    <td className="p-3 text-right font-bold text-white whitespace-nowrap">
                      {formatCurrency(prod.standardPrice, prod.currency)}
                    </td>
                    <td className="p-3 text-right font-bold text-[#EAB308] whitespace-nowrap">
                      {formatCurrency(prod.wholesalePrice, prod.currency)}
                    </td>
                    <td className="p-3 text-right text-[#6B7280] whitespace-nowrap">
                      {formatCurrency(prod.costPrice, prod.currency)}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center text-[10px] text-[#EAB308] font-semibold">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1 text-[#9CA3AF] hover:text-[#EAB308] hover:bg-[#1E2536] rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1 text-[#6B7280] hover:text-rose-400 hover:bg-rose-950/40 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="bg-[#11141D] rounded-xl border border-[#1F2430] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9CA3AF]">
          <div className="flex items-center space-x-2">
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedProducts.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} items
            </span>
            <div className="flex items-center space-x-1 ml-2">
              <span>Per page:</span>
              {[24, 48, 96, 999].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    pageSize === size ? 'bg-[#EAB308] text-black font-bold' : 'bg-[#151924] text-[#9CA3AF]'
                  }`}
                >
                  {size === 999 ? 'All' : size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-[#151924] rounded border border-[#252D3D] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1E2536] text-[#E5E7EB]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-[#151924] rounded border border-[#252D3D] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1E2536] text-[#E5E7EB]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141D] rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#1F2430] text-[#E5E7EB] font-mono">
            <form onSubmit={handleSaveProduct}>
              <div className="p-4 border-b border-[#1F2430] flex items-center justify-between sticky top-0 bg-[#11141D] z-10">
                <h3 className="text-base font-bold text-white font-mono">
                  {editingProduct.id ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E2536]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">SKU / Code *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.sku || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      placeholder="e.g. DFC-ASUNTA-001"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Category</label>
                    <input
                      type="text"
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      placeholder="e.g. Dragon Fruit Cultivars & Cuttings"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#9CA3AF] mb-1">Product / Cultivar Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. Asunta 1 Dragon Fruit Cutting"
                    className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#9CA3AF] mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="Cultivar specifications, root development, brix sugar content..."
                    className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#0A0B0E] p-3 rounded-lg border border-[#1F2430]">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1 text-[10px]">Unit</label>
                    <input
                      type="text"
                      value={editingProduct.unit || 'plant'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                      placeholder="cutting / tray / drum"
                      className="w-full p-1.5 bg-[#151924] border border-[#252D3D] rounded text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1 text-[10px]">Cost Price (R)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.costPrice || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-[#151924] border border-[#252D3D] rounded text-xs font-mono font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1 text-[10px]">Standard (R) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingProduct.standardPrice || 0}
                      onChange={(e) => {
                        const std = parseFloat(e.target.value) || 0;
                        setEditingProduct({
                          ...editingProduct,
                          standardPrice: std,
                          wholesalePrice: Number((std * 0.85).toFixed(2)),
                          retailPrice: std,
                          costPrice: Number((std * 0.45).toFixed(2)),
                        });
                      }}
                      className="w-full p-1.5 bg-[#151924] border border-[#252D3D] rounded text-xs font-mono font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#EAB308] mb-1 text-[10px]">Wholesale (R)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.wholesalePrice || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, wholesalePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-[#151924] border border-[#252D3D] rounded text-xs font-mono font-bold text-[#EAB308]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Retail Price (R)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.retailPrice || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, retailPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">VAT / Tax Rate (%)</label>
                    <input
                      type="number"
                      value={editingProduct.vatRate ?? 15}
                      onChange={(e) => setEditingProduct({ ...editingProduct, vatRate: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 border-t border-[#1F2430] bg-[#151924] flex items-center justify-end space-x-2.5 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-mono text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
