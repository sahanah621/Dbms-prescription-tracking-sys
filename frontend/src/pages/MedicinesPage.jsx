import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Pill,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Package,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function MedicinesPage({ onBackToDashboard, onMedicineCountChange, onLowStockCountChange }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);

  const initialForm = {
    medicine_id: '',
    name: '',
    price: '',
    available_quantity: '',
    manu_date: '',
    exp_date: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  async function fetchMedicines() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/medicines');
      setMedicines(data);
      if (onMedicineCountChange) onMedicineCountChange(data.length);
      const alerts = data.filter((m) => m.available_quantity < 50 || m.is_expired).length;
      if (onLowStockCountChange) onLowStockCountChange(alerts);
    } catch (err) {
      setError(err.message || 'Failed to load medicines from database');
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  function handleOpenAdd() {
    setFormData(initialForm);
    setIsAddModalOpen(true);
  }

  function handleOpenEdit(med) {
    setSelectedMed(med);
    setFormData({
      medicine_id: med.medicine_id,
      name: med.name,
      price: med.price,
      available_quantity: med.available_quantity,
      manu_date: med.manu_date,
      exp_date: med.exp_date,
    });
    setIsEditModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        available_quantity: parseInt(formData.available_quantity || '0'),
        manu_date: formData.manu_date,
        exp_date: formData.exp_date,
      };
      if (formData.medicine_id) {
        payload.medicine_id = parseInt(formData.medicine_id);
      }
      const newMed = await api.post('/medicines', payload);
      setIsAddModalOpen(false);
      showSuccess(`Medicine "${newMed.name}" added to inventory (ID: ${newMed.medicine_id}).`);
      fetchMedicines();
    } catch (err) {
      setError(err.message || 'Failed to add medicine');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        available_quantity: parseInt(formData.available_quantity),
        manu_date: formData.manu_date,
        exp_date: formData.exp_date,
      };
      await api.put(`/medicines/${selectedMed.medicine_id}`, payload);
      setIsEditModalOpen(false);
      showSuccess(`Medicine ID ${selectedMed.medicine_id} updated.`);
      fetchMedicines();
    } catch (err) {
      setError(err.message || 'Failed to update medicine');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(medId, medName) {
    if (!window.confirm(`Delete "${medName}" (ID: ${medId})? Will fail if prescribed in existing prescriptions.`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/medicines/${medId}`);
      showSuccess(`Medicine ID ${medId} deleted.`);
      fetchMedicines();
    } catch (err) {
      setError(err.message || 'Failed to delete medicine');
    }
  }

  const filtered = medicines.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch = m.name.toLowerCase().includes(q) || m.medicine_id.toString().includes(q);
    if (statusFilter === 'LOW_STOCK') return matchesSearch && m.available_quantity < 50 && !m.is_expired;
    if (statusFilter === 'EXPIRED') return matchesSearch && m.is_expired;
    if (statusFilter === 'AVAILABLE') return matchesSearch && m.available_quantity > 0 && !m.is_expired;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
        <span className="text-xs font-mono text-slate-500">
          Connected Oracle Table: <strong className="text-slate-400 font-bold">MEDICINE</strong>
        </span>
      </div>

      {/* Module Title Card */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">Medicine Inventory</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
                {medicines.length} Formulations
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Drug catalog, pricing, batch manufacturing, expiry tracking, and stock units
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Medicine
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-sm flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 font-bold cursor-pointer">×</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-sm flex items-center gap-3 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 font-semibold">{successMsg}</div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="bg-slate-900 rounded-xl border border-slate-800 px-3.5 py-2.5 flex items-center gap-3 shadow-sm flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by drug name or medicine ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none placeholder:text-slate-500 bg-transparent text-slate-100"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 shrink-0">
          {[
            { id: 'ALL', label: 'All Drugs' },
            { id: 'AVAILABLE', label: 'In Stock' },
            { id: 'LOW_STOCK', label: 'Low Stock (<50)' },
            { id: 'EXPIRED', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Medicine Name</th>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-4">Stock Units</th>
                <th className="py-3.5 px-4">Mfg Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-sm font-medium">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading medicine inventory from Oracle...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No matching medicines found</p>
                    <p className="text-xs text-slate-500 mt-1">Try modifying your search or filter</p>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const isLowStock = m.available_quantity < 50 && m.available_quantity > 0;
                  const isZeroStock = m.available_quantity === 0;
                  return (
                    <tr key={m.medicine_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-100">{m.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">ID: #{m.medicine_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-300">
                        #{m.medicine_id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold text-sm">
                        ₹{m.price.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                            isZeroStock
                              ? 'bg-rose-950/70 text-rose-300 border-rose-800/80'
                              : isLowStock
                              ? 'bg-amber-950/70 text-amber-300 border-amber-800/80'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          {m.available_quantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs font-medium">
                        {m.manu_date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 text-xs font-semibold">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{m.exp_date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {m.is_expired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/70 text-rose-300 border border-rose-800/80">
                            <AlertTriangle className="w-3 h-3 text-rose-400" /> Expired
                          </span>
                        ) : isZeroStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/70 text-rose-300 border border-rose-800/80">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/70 text-amber-300 border border-amber-800/80">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="inline-flex items-center p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                          title="Edit Medicine"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.medicine_id, m.name)}
                          className="inline-flex items-center p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                          title="Delete Medicine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
          <span>
            Showing <strong className="text-white">{filtered.length}</strong> of {medicines.length} medicines
          </span>
          <span className="font-mono text-slate-500">
            Oracle 21c Table: <strong className="text-slate-300">MEDICINE</strong>
          </span>
        </div>
      </div>

      {/* Add Medicine Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Medicine to Inventory">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Medicine Name & Formulation *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Paracetamol 650mg / Dolo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="32.50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Available Stock Units *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.available_quantity}
                onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Manufacturing Date *</label>
              <input
                type="date"
                required
                value={formData.manu_date}
                onChange={(e) => setFormData({ ...formData, manu_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.exp_date}
                min={formData.manu_date || undefined}
                onChange={(e) => setFormData({ ...formData, exp_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Medicine ID <span className="text-slate-500 font-normal">(Optional &mdash; auto-assigned by Oracle)</span>
            </label>
            <input
              type="number"
              value={formData.medicine_id}
              onChange={(e) => setFormData({ ...formData, medicine_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Auto-incremented (e.g. 513)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/30 cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Adding...' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Medicine #${selectedMed?.medicine_id}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Medicine Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Available Stock Units *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.available_quantity}
                onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Manufacturing Date *</label>
              <input
                type="date"
                required
                value={formData.manu_date}
                onChange={(e) => setFormData({ ...formData, manu_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.exp_date}
                onChange={(e) => setFormData({ ...formData, exp_date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/30 cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
