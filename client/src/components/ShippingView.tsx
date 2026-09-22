import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { ShippingRate, ShippingRateType } from '../types';
import { formatCurrency } from '../utils/calculator';

export const ShippingView: React.FC = () => {
  const { shippingRates, addShippingRate, updateShippingRate, deleteShippingRate, companySettings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<Partial<ShippingRate> | null>(null);

  const filteredRates = shippingRates.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.destinationCountry.toLowerCase().includes(query) ||
      (r.destinationProvince && r.destinationProvince.toLowerCase().includes(query)) ||
      r.shippingCompany.toLowerCase().includes(query)
    );
  });

  const handleOpenAdd = () => {
    setEditingRate({
      destinationCountry: '',
      destinationProvince: '',
      shippingCompany: '',
      shippingMethod: 'Road Freight & Phyto Logistics',
      cost: 2500.0,
      currency: companySettings.defaultCurrency || 'ZAR',
      deliveryTime: '2 - 3 Days',
      minimumOrder: 100,
      rateType: 'fixed',
      notes: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (rate: ShippingRate) => {
    setEditingRate({ ...rate });
    setIsEditModalOpen(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate || !editingRate.destinationCountry || editingRate.cost === undefined) {
      alert('Destination Country and Cost are required.');
      return;
    }

    if (editingRate.id) {
      await updateShippingRate(editingRate.id, editingRate);
    } else {
      await addShippingRate(editingRate as any);
    }
    setIsEditModalOpen(false);
    setEditingRate(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this shipping rate from the database?')) {
      await deleteShippingRate(id);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold font-mono text-white tracking-tight">Freight & Shipping Logistics</h1>
            <span className="text-[10px] bg-yellow-950 text-[#EAB308] border border-yellow-800/40 px-2 py-0.5 rounded font-mono font-semibold">
              {shippingRates.length} ROUTES
            </span>
          </div>
          <p className="text-xs font-mono text-[#9CA3AF]">
            Cross-border freight routes (Botswana, Namibia, Zimbabwe) and domestic South African courier costs.
          </p>
        </div>

        <button
          id="shipping-add-new-btn"
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#EAB308] hover:bg-#EAB308 text-black text-xs font-mono font-bold rounded-lg shadow-sm transition-colors border border-#EAB308/50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Shipping Route</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#11141D] rounded-xl border border-[#1F2430] shadow-sm p-3 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
          <input
            id="shipping-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search country, province, carrier..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-#EAB308/50 focus:border-[#EAB308]"
          />
        </div>
      </div>

      {/* Shipping Rates Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredRates.map((rate) => (
          <div
            key={rate.id}
            id={`shipping-rate-card-${rate.id}`}
            className="bg-[#11141D] rounded-xl border border-[#1F2430] hover:border-[#2E384D] shadow-sm hover:shadow-[0_0_12px_rgba(0,0,0,0.5)] transition-all p-4 flex flex-col justify-between font-mono"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1B2130] text-[#EAB308] border border-yellow-800/30 px-2 py-0.5 rounded">
                    {rate.rateType} rate
                  </span>
                  <h3 className="font-bold text-sm text-white mt-1.5 flex items-center gap-1.5 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-[#EAB308]" />
                    {rate.destinationCountry}
                  </h3>
                  {rate.destinationProvince && (
                    <p className="text-[11px] text-[#6B7280]">{rate.destinationProvince}</p>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(rate)}
                    className="p-1 text-[#9CA3AF] hover:text-[#EAB308] hover:bg-[#1E2536] rounded"
                    title="Edit Rate"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rate.id)}
                    className="p-1 text-[#6B7280] hover:text-rose-400 hover:bg-rose-950/40 rounded"
                    title="Delete Rate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-[#9CA3AF]">
                <p>
                  <strong className="text-white">Carrier:</strong> {rate.shippingCompany || 'Dedicated Freight'}
                </p>
                <p>
                  <strong className="text-white">Method:</strong> {rate.shippingMethod || 'Climate-Controlled Road Freight'}
                </p>
                <p className="flex items-center gap-1 text-[#6B7280] text-[11px]">
                  <Clock className="w-3 h-3 text-cyan-400" /> Transit: {rate.deliveryTime || '2-4 Days'}
                </p>
                {rate.notes && (
                  <p className="text-[10px] bg-[#0A0B0E] p-2 rounded border border-[#1F2430] text-[#9CA3AF]">
                    {rate.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-[#1F2430] flex items-center justify-between">
              <span className="text-[11px] text-[#6B7280]">Standard Cost:</span>
              <span className="font-mono font-bold text-base text-[#EAB308]">
                {formatCurrency(rate.cost, rate.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Shipping Modal */}
      {isEditModalOpen && editingRate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141D] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#1F2430] text-[#E5E7EB] font-mono">
            <form onSubmit={handleSaveRate}>
              <div className="p-4 border-b border-[#1F2430] flex items-center justify-between sticky top-0 bg-[#11141D] z-10">
                <h3 className="text-base font-bold text-white font-mono">
                  {editingRate.id ? 'Edit Shipping Rate' : 'Add Shipping Route'}
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
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Destination Country *</label>
                    <input
                      type="text"
                      required
                      value={editingRate.destinationCountry || ''}
                      onChange={(e) => setEditingRate({ ...editingRate, destinationCountry: e.target.value })}
                      placeholder="e.g. Botswana"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Province / Region</label>
                    <input
                      type="text"
                      value={editingRate.destinationProvince || ''}
                      onChange={(e) => setEditingRate({ ...editingRate, destinationProvince: e.target.value })}
                      placeholder="e.g. Gaborone District"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Carrier / Courier Company</label>
                    <input
                      type="text"
                      value={editingRate.shippingCompany || ''}
                      onChange={(e) => setEditingRate({ ...editingRate, shippingCompany: e.target.value })}
                      placeholder="e.g. Cross-Border AgriLogistics"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Fixed Cost (R) *</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={editingRate.cost || 0}
                      onChange={(e) => setEditingRate({ ...editingRate, cost: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono font-bold text-[#EAB308] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Estimated Delivery Time</label>
                    <input
                      type="text"
                      value={editingRate.deliveryTime || ''}
                      onChange={(e) => setEditingRate({ ...editingRate, deliveryTime: e.target.value })}
                      placeholder="e.g. 2 - 3 Business Days"
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#9CA3AF] mb-1">Rate Type</label>
                    <select
                      value={editingRate.rateType || 'fixed'}
                      onChange={(e) => setEditingRate({ ...editingRate, rateType: e.target.value as ShippingRateType })}
                      className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
                    >
                      <option value="fixed" className="bg-[#11141D]">Fixed Freight Rate</option>
                      <option value="per_item" className="bg-[#11141D]">Per Item</option>
                      <option value="per_kg" className="bg-[#11141D]">Per Kilogram</option>
                      <option value="manual" className="bg-[#11141D]">Manual Quote</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#9CA3AF] mb-1">Notes & Customs Clearance Info</label>
                  <textarea
                    rows={2}
                    value={editingRate.notes || ''}
                    onChange={(e) => setEditingRate({ ...editingRate, notes: e.target.value })}
                    placeholder="Border crossing requirements, packaging specs, minimum order sizes..."
                    className="w-full p-2 bg-[#0A0B0E] border border-[#252D3D] rounded-lg text-xs font-mono text-white placeholder-[#6B7280] focus:outline-none focus:border-[#EAB308]"
                  />
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
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
