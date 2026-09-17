import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  ArrowLeft,
  Pill,
} from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function HospitalsPage({ onBackToDashboard }) {
  const [hospitals, setHospitals] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const initialForm = {
    hospital_id: '',
    pharmacy_id: '',
    name: '',
    city: '',
    state: '',
    street: '',
    contact: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [hospData, pharmData] = await Promise.all([
        api.get('/hospitals'),
        api.get('/pharmacies'),
      ]);
      setHospitals(hospData);
      setPharmacies(pharmData);
      if (pharmData.length > 0 && !formData.pharmacy_id) {
        setFormData((prev) => ({ ...prev, pharmacy_id: pharmData[0].pharmacy_id.toString() }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load hospitals from database');
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  function handleOpenAdd() {
    setFormData({
      ...initialForm,
      pharmacy_id: pharmacies.length > 0 ? pharmacies[0].pharmacy_id.toString() : '',
    });
    setIsAddModalOpen(true);
  }

  function handleOpenEdit(hosp) {
    setSelectedHospital(hosp);
    setFormData({
      hospital_id: hosp.hospital_id,
      pharmacy_id: hosp.pharmacy_id.toString(),
      name: hosp.name,
      city: hosp.city,
      state: hosp.state,
      street: hosp.street,
      contact: hosp.contact,
    });
    setIsEditModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        pharmacy_id: parseInt(formData.pharmacy_id),
        name: formData.name.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        street: formData.street.trim(),
        contact: formData.contact.trim(),
      };
      if (formData.hospital_id && formData.hospital_id.trim() !== '') {
        payload.hospital_id = parseInt(formData.hospital_id.trim());
      }
      await api.post('/hospitals', payload);
      setIsAddModalOpen(false);
      showSuccess(`Hospital "${formData.name}" added successfully.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to add hospital');
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
        pharmacy_id: parseInt(formData.pharmacy_id),
        name: formData.name.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        street: formData.street.trim(),
        contact: formData.contact.trim(),
      };
      await api.put(`/hospitals/${selectedHospital.hospital_id}`, payload);
      setIsEditModalOpen(false);
      showSuccess(`Hospital "${selectedHospital.name}" updated successfully.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update hospital');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(hospId, hospName) {
    if (!window.confirm(`Delete Hospital "${hospName}" (ID: ${hospId})? Will fail if doctors or records are affiliated with it.`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/hospitals/${hospId}`);
      showSuccess(`Hospital "${hospName}" deleted.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete hospital');
    }
  }

  // Filter list
  const cities = ['ALL', ...Array.from(new Set(hospitals.map((h) => h.city))).filter(Boolean)];

  const filtered = hospitals.filter((h) => {
    const q = search.toLowerCase();
    const matchesSearch =
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.state.toLowerCase().includes(q) ||
      h.street.toLowerCase().includes(q) ||
      h.contact.toLowerCase().includes(q) ||
      h.pharmacy_name?.toLowerCase().includes(q) ||
      h.hospital_id.toString().includes(q);

    const matchesCity = cityFilter === 'ALL' || h.city.toLowerCase() === cityFilter.toLowerCase();
    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Oracle Table:</span>
          <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            HOSPITAL
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Hospitals & Medical Centers</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage clinical facilities, regional clinics, and affiliated pharmacy dispensary branches.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hospital</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-3 shadow-md animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-300">Database Action Notice</p>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-3 shadow-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospitals by name, city, pharmacy..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>City:</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
            Showing <strong className="text-white">{filtered.length}</strong> of {hospitals.length}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading hospital records from Oracle...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">No hospital records found</p>
            <p className="text-slate-500 mt-1">Try clearing filters or click "Add Hospital" to insert one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Hospital Name</th>
                  <th className="py-3.5 px-4">Location / Address</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Affiliated Dispensary</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filtered.map((hosp) => (
                  <tr key={hosp.hospital_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      #{hosp.hospital_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{hosp.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{hosp.street}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-5">
                        {hosp.city}, {hosp.state}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                        <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                        {hosp.contact}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Pill className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{hosp.pharmacy_name || `Pharmacy #${hosp.pharmacy_id}`}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Pharmacy ID: #{hosp.pharmacy_id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(hosp)}
                          title="Edit Hospital"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(hosp.hospital_id, hosp.name)}
                          title="Delete Hospital"
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 hover:text-red-200 transition-colors cursor-pointer"
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
        )}
      </div>

      {/* Modal: Add Hospital */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Hospital Facility"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Hospital ID (Optional - Auto-assigned if blank)
            </label>
            <input
              type="number"
              value={formData.hospital_id}
              onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
              placeholder="e.g. 104"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Hospital Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Metro Specialty Hospital"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Affiliated Pharmacy Dispensary <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.pharmacy_id}
              onChange={(e) => setFormData({ ...formData, pharmacy_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {pharmacies.map((ph) => (
                <option key={ph.pharmacy_id} value={ph.pharmacy_id}>
                  #{ph.pharmacy_id} - {ph.name} ({ph.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. New Delhi"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                State <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Delhi"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Street Address <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="e.g. 15 Healthcare Avenue, Sector 4"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Contact Phone <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="e.g. +91 9876543210"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving to Oracle...' : 'Save Hospital'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Hospital */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Hospital #${formData.hospital_id}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Hospital Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Affiliated Pharmacy Dispensary <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.pharmacy_id}
              onChange={(e) => setFormData({ ...formData, pharmacy_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {pharmacies.map((ph) => (
                <option key={ph.pharmacy_id} value={ph.pharmacy_id}>
                  #{ph.pharmacy_id} - {ph.name} ({ph.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                State <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Street Address <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Contact Phone <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating in Oracle...' : 'Update Hospital'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
