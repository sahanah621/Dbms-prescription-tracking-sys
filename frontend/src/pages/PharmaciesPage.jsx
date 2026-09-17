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
  Star,
  UserCheck,
  Clock,
  Pill,
} from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function PharmaciesPage({ onBackToDashboard }) {
  const [activeSubTab, setActiveSubTab] = useState('pharmacies'); // 'pharmacies' | 'pharmacists'

  // Data
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filters
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [pharmacistSearch, setPharmacistSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');

  // Modals for Pharmacy
  const [isAddPharmacyOpen, setIsAddPharmacyOpen] = useState(false);
  const [isEditPharmacyOpen, setIsEditPharmacyOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  const initialPharmacyForm = {
    pharmacy_id: '',
    name: '',
    rating: 4.5,
    city: '',
    state: '',
    street: '',
    contact_no: '',
  };
  const [pharmacyForm, setPharmacyForm] = useState(initialPharmacyForm);

  // Modals for Pharmacist
  const [isAddPharmacistOpen, setIsAddPharmacistOpen] = useState(false);
  const [isEditPharmacistOpen, setIsEditPharmacistOpen] = useState(false);
  const [selectedPharmacist, setSelectedPharmacist] = useState(null);

  const initialPharmacistForm = {
    pharmacist_id: '',
    pharmacy_id: '',
    name: '',
    shift: 'morning',
  };
  const [pharmacistForm, setPharmacistForm] = useState(initialPharmacistForm);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [pharmData, staffData] = await Promise.all([
        api.get('/pharmacies'),
        api.get('/pharmacists'),
      ]);
      setPharmacies(pharmData);
      setPharmacists(staffData);
      if (pharmData.length > 0 && !pharmacistForm.pharmacy_id) {
        setPharmacistForm((prev) => ({ ...prev, pharmacy_id: pharmData[0].pharmacy_id.toString() }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load pharmacy data from database');
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  // ================= PHARMACY ACTIONS =================
  function handleOpenAddPharmacy() {
    setPharmacyForm(initialPharmacyForm);
    setIsAddPharmacyOpen(true);
  }

  function handleOpenEditPharmacy(ph) {
    setSelectedPharmacy(ph);
    setPharmacyForm({
      pharmacy_id: ph.pharmacy_id,
      name: ph.name,
      rating: ph.rating,
      city: ph.city,
      state: ph.state,
      street: ph.street,
      contact_no: ph.contact_no,
    });
    setIsEditPharmacyOpen(true);
  }

  async function handleCreatePharmacySubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: pharmacyForm.name.trim(),
        rating: parseFloat(pharmacyForm.rating || '0'),
        city: pharmacyForm.city.trim(),
        state: pharmacyForm.state.trim(),
        street: pharmacyForm.street.trim(),
        contact_no: pharmacyForm.contact_no.trim(),
      };
      if (pharmacyForm.pharmacy_id && pharmacyForm.pharmacy_id.trim() !== '') {
        payload.pharmacy_id = parseInt(pharmacyForm.pharmacy_id.trim());
      }
      await api.post('/pharmacies', payload);
      setIsAddPharmacyOpen(false);
      showSuccess(`Pharmacy "${pharmacyForm.name}" registered successfully.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to register pharmacy');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditPharmacySubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: pharmacyForm.name.trim(),
        rating: parseFloat(pharmacyForm.rating || '0'),
        city: pharmacyForm.city.trim(),
        state: pharmacyForm.state.trim(),
        street: pharmacyForm.street.trim(),
        contact_no: pharmacyForm.contact_no.trim(),
      };
      await api.put(`/pharmacies/${selectedPharmacy.pharmacy_id}`, payload);
      setIsEditPharmacyOpen(false);
      showSuccess(`Pharmacy "${selectedPharmacy.name}" updated successfully.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update pharmacy');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePharmacy(phId, phName) {
    if (!window.confirm(`Delete Pharmacy "${phName}" (ID: ${phId})? Fails if hospitals, staff, or bills link to it.`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/pharmacies/${phId}`);
      showSuccess(`Pharmacy "${phName}" deleted.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete pharmacy');
    }
  }

  // ================= PHARMACIST ACTIONS =================
  function handleOpenAddPharmacist() {
    setPharmacistForm({
      ...initialPharmacistForm,
      pharmacy_id: pharmacies.length > 0 ? pharmacies[0].pharmacy_id.toString() : '',
    });
    setIsAddPharmacistOpen(true);
  }

  function handleOpenEditPharmacist(staff) {
    setSelectedPharmacist(staff);
    setPharmacistForm({
      pharmacist_id: staff.pharmacist_id,
      pharmacy_id: staff.pharmacy_id.toString(),
      name: staff.name,
      shift: staff.shift,
    });
    setIsEditPharmacistOpen(true);
  }

  async function handleCreatePharmacistSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        pharmacy_id: parseInt(pharmacistForm.pharmacy_id),
        name: pharmacistForm.name.trim(),
        shift: pharmacistForm.shift.trim().toLowerCase(),
      };
      if (pharmacistForm.pharmacist_id && pharmacistForm.pharmacist_id.trim() !== '') {
        payload.pharmacist_id = parseInt(pharmacistForm.pharmacist_id.trim());
      }
      await api.post('/pharmacists', payload);
      setIsAddPharmacistOpen(false);
      showSuccess(`Pharmacist "${pharmacistForm.name}" registered.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to register pharmacist');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditPharmacistSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        pharmacy_id: parseInt(pharmacistForm.pharmacy_id),
        name: pharmacistForm.name.trim(),
        shift: pharmacistForm.shift.trim().toLowerCase(),
      };
      await api.put(`/pharmacists/${selectedPharmacist.pharmacist_id}`, payload);
      setIsEditPharmacistOpen(false);
      showSuccess(`Pharmacist "${selectedPharmacist.name}" updated.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update pharmacist');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePharmacist(staffId, staffName) {
    if (!window.confirm(`Delete Pharmacist "${staffName}" (ID: ${staffId})?`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/pharmacists/${staffId}`);
      showSuccess(`Pharmacist "${staffName}" removed.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete pharmacist');
    }
  }

  // Filtered lists
  const filteredPharmacies = pharmacies.filter((p) => {
    const q = pharmacySearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.street.toLowerCase().includes(q) ||
      p.contact_no.toLowerCase().includes(q) ||
      p.pharmacy_id.toString().includes(q)
    );
  });

  const filteredPharmacists = pharmacists.filter((staff) => {
    const q = pharmacistSearch.toLowerCase();
    const matchesSearch =
      staff.name.toLowerCase().includes(q) ||
      staff.pharmacy_name?.toLowerCase().includes(q) ||
      staff.shift.toLowerCase().includes(q) ||
      staff.pharmacist_id.toString().includes(q);
    const matchesShift = shiftFilter === 'ALL' || staff.shift.toLowerCase() === shiftFilter.toLowerCase();
    return matchesSearch && matchesShift;
  });

  const getShiftBadge = (shift) => {
    const s = shift.toLowerCase();
    if (s === 'morning') {
      return 'bg-amber-950/70 text-amber-400 border-amber-800/60';
    }
    if (s === 'evening') {
      return 'bg-blue-950/70 text-blue-400 border-blue-800/60';
    }
    return 'bg-purple-950/70 text-purple-400 border-purple-800/60';
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Oracle Tables:</span>
          <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            PHARMACY &bull; PHARMACIST
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Pharmacies & Staff Dispensary</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage retail pharmacies, regional dispensary network, and pharmacist shift duty rosters.
            </p>
          </div>
        </div>

        <button
          onClick={activeSubTab === 'pharmacies' ? handleOpenAddPharmacy : handleOpenAddPharmacist}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{activeSubTab === 'pharmacies' ? 'Add Pharmacy' : 'Register Pharmacist'}</span>
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

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('pharmacies')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'pharmacies'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Pharmacies Network ({pharmacies.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('pharmacists')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'pharmacists'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Pharmacist Staff ({pharmacists.length})</span>
        </button>
      </div>

      {/* ================= PHARMACIES TAB CONTENT ================= */}
      {activeSubTab === 'pharmacies' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pharmacySearch}
                onChange={(e) => setPharmacySearch(e.target.value)}
                placeholder="Search pharmacies by name, city, phone..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <span className="text-xs font-mono text-slate-400">
              Showing <strong className="text-white">{filteredPharmacies.length}</strong> of {pharmacies.length} Pharmacies
            </span>
          </div>

          {/* Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading pharmacies from Oracle...</span>
              </div>
            ) : filteredPharmacies.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">No pharmacy records found</p>
                <p className="text-slate-500 mt-1">Click "Add Pharmacy" above to insert a new branch.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Pharmacy Name</th>
                      <th className="py-3.5 px-4">Rating</th>
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4">Contact Phone</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredPharmacies.map((ph) => (
                      <tr key={ph.pharmacy_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                          #{ph.pharmacy_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{ph.name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 border border-amber-800/60 text-amber-300">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{Number(ph.rating).toFixed(1)} / 5.0</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{ph.street}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 ml-5">
                            {ph.city}, {ph.state}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            {ph.contact_no}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditPharmacy(ph)}
                              title="Edit Pharmacy"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePharmacy(ph.pharmacy_id, ph.name)}
                              title="Delete Pharmacy"
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
        </div>
      )}

      {/* ================= PHARMACISTS TAB CONTENT ================= */}
      {activeSubTab === 'pharmacists' && (
        <div className="space-y-4">
          {/* Search and Shift filter */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pharmacistSearch}
                onChange={(e) => setPharmacistSearch(e.target.value)}
                placeholder="Search staff by name, pharmacy..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Duty Shift:</span>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Shifts</option>
                  <option value="morning">Morning Shift</option>
                  <option value="evening">Evening Shift</option>
                  <option value="night">Night Shift</option>
                </select>
              </div>

              <span className="text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
                Showing <strong className="text-white">{filteredPharmacists.length}</strong> of {pharmacists.length} Staff
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading pharmacists from Oracle...</span>
              </div>
            ) : filteredPharmacists.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">No pharmacist records found</p>
                <p className="text-slate-500 mt-1">Click "Register Pharmacist" to add staff members.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Staff ID</th>
                      <th className="py-3.5 px-4">Pharmacist Name</th>
                      <th className="py-3.5 px-4">Duty Shift</th>
                      <th className="py-3.5 px-4">Assigned Pharmacy</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredPharmacists.map((staff) => (
                      <tr key={staff.pharmacist_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                          #{staff.pharmacist_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{staff.name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${getShiftBadge(staff.shift)}`}>
                            <Clock className="w-3 h-3" />
                            <span>{staff.shift}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-white font-semibold">
                            {staff.pharmacy_name || `Pharmacy #${staff.pharmacy_id}`}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Pharmacy ID: #{staff.pharmacy_id}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditPharmacist(staff)}
                              title="Edit Pharmacist"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePharmacist(staff.pharmacist_id, staff.name)}
                              title="Delete Pharmacist"
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
        </div>
      )}

      {/* ================= MODAL: ADD PHARMACY ================= */}
      <Modal
        isOpen={isAddPharmacyOpen}
        onClose={() => setIsAddPharmacyOpen(false)}
        title="Add New Pharmacy Branch"
      >
        <form onSubmit={handleCreatePharmacySubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Pharmacy ID (Optional - Auto-assigned if blank)
            </label>
            <input
              type="number"
              value={pharmacyForm.pharmacy_id}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, pharmacy_id: e.target.value })}
              placeholder="e.g. 504"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Pharmacy Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={pharmacyForm.name}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
              placeholder="e.g. Apollo Pharmacy Center"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Rating (0.0 to 5.0) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              required
              value={pharmacyForm.rating}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, rating: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={pharmacyForm.city}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, city: e.target.value })}
                placeholder="e.g. Bengaluru"
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
                value={pharmacyForm.state}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, state: e.target.value })}
                placeholder="e.g. Karnataka"
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
              value={pharmacyForm.street}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, street: e.target.value })}
              placeholder="e.g. 104 MG Road, Indiranagar"
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
              value={pharmacyForm.contact_no}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, contact_no: e.target.value })}
              placeholder="e.g. 080-25589999"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddPharmacyOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving to Oracle...' : 'Save Pharmacy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT PHARMACY ================= */}
      <Modal
        isOpen={isEditPharmacyOpen}
        onClose={() => setIsEditPharmacyOpen(false)}
        title={`Edit Pharmacy #${pharmacyForm.pharmacy_id}`}
      >
        <form onSubmit={handleEditPharmacySubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Pharmacy Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={pharmacyForm.name}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Rating (0.0 to 5.0) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              required
              value={pharmacyForm.rating}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, rating: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={pharmacyForm.city}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, city: e.target.value })}
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
                value={pharmacyForm.state}
                onChange={(e) => setPharmacyForm({ ...pharmacyForm, state: e.target.value })}
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
              value={pharmacyForm.street}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, street: e.target.value })}
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
              value={pharmacyForm.contact_no}
              onChange={(e) => setPharmacyForm({ ...pharmacyForm, contact_no: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditPharmacyOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating in Oracle...' : 'Update Pharmacy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: ADD PHARMACIST ================= */}
      <Modal
        isOpen={isAddPharmacistOpen}
        onClose={() => setIsAddPharmacistOpen(false)}
        title="Register New Pharmacist"
      >
        <form onSubmit={handleCreatePharmacistSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Pharmacist Staff ID (Optional - Auto-assigned if blank)
            </label>
            <input
              type="number"
              value={pharmacistForm.pharmacist_id}
              onChange={(e) => setPharmacistForm({ ...pharmacistForm, pharmacist_id: e.target.value })}
              placeholder="e.g. 605"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Pharmacist Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={pharmacistForm.name}
              onChange={(e) => setPharmacistForm({ ...pharmacistForm, name: e.target.value })}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Assigned Pharmacy <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={pharmacistForm.pharmacy_id}
              onChange={(e) => setPharmacistForm({ ...pharmacistForm, pharmacy_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {pharmacies.map((ph) => (
                <option key={ph.pharmacy_id} value={ph.pharmacy_id}>
                  #{ph.pharmacy_id} - {ph.name} ({ph.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Duty Shift <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={pharmacistForm.shift}
              onChange={(e) => setPharmacistForm({ ...pharmacistForm, shift: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="morning">Morning Shift (07:00 - 15:00)</option>
              <option value="evening">Evening Shift (15:00 - 23:00)</option>
              <option value="night">Night Shift (23:00 - 07:00)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddPharmacistOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving to Oracle...' : 'Register Pharmacist'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT PHARMACIST ================= */}
      <Modal
        isOpen={isEditPharmacistOpen}
        onClose={() => setIsEditPharmacistOpen(false)}
        title={`Edit Pharmacist #${pharmacistForm.pharmacist_id}`}
      >
        <form onSubmit={handleEditPharmacistSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Pharmacist Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={pharmacistForm.name}
              onChange={(e) => setPharmacistForm({ ...pharmacistForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Assigned Pharmacy <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={pharmacistForm.pharmacy_id}
              onChange={(e) => setPharmacistForm({ ...pharmacistForm, pharmacy_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {pharmacies.map((ph) => (
                <option key={ph.pharmacy_id} value={ph.pharmacy_id}>
                  #{ph.pharmacy_id} - {ph.name} ({ph.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Duty Shift <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={pharmacistForm.shift}
              onChange={(e) => setPharmacistForm({ ...pharmacistForm, shift: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="morning">Morning Shift (07:00 - 15:00)</option>
              <option value="evening">Evening Shift (15:00 - 23:00)</option>
              <option value="night">Night Shift (23:00 - 07:00)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditPharmacistOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating in Oracle...' : 'Update Pharmacist'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
