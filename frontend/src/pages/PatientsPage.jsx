import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function PatientsPage({ onBackToDashboard, onPatientCountChange }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const initialFormState = {
    patient_id: '',
    first_name: '',
    last_name: '',
    dob: '',
    sex: 'M',
    city: '',
    state: '',
    street: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/patients');
      setPatients(data);
      if (onPatientCountChange) onPatientCountChange(data.length);
    } catch (err) {
      setError(err.message || 'Failed to load patients from database');
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  function handleOpenAdd() {
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  }

  function handleOpenEdit(patient) {
    setSelectedPatient(patient);
    setFormData({
      patient_id: patient.patient_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      dob: patient.dob,
      sex: patient.sex,
      city: patient.city,
      state: patient.state,
      street: patient.street,
    });
    setIsEditModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        dob: formData.dob,
        sex: formData.sex,
        city: formData.city.trim(),
        state: formData.state.trim(),
        street: formData.street.trim(),
      };
      if (formData.patient_id) {
        payload.patient_id = parseInt(formData.patient_id);
      }
      const newPatient = await api.post('/patients', payload);
      setIsAddModalOpen(false);
      showSuccess(`Patient ${newPatient.first_name} ${newPatient.last_name} (#${newPatient.patient_id}) created successfully.`);
      fetchPatients();
    } catch (err) {
      setError(err.message || 'Failed to create patient');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setFormSubmitting(true);
    setError(null);
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        dob: formData.dob,
        sex: formData.sex,
        city: formData.city.trim(),
        state: formData.state.trim(),
        street: formData.street.trim(),
      };
      await api.put(`/patients/${selectedPatient.patient_id}`, payload);
      setIsEditModalOpen(false);
      showSuccess(`Patient ID ${selectedPatient.patient_id} updated successfully.`);
      fetchPatients();
    } catch (err) {
      setError(err.message || 'Failed to update patient');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(patientId, patientName) {
    if (!window.confirm(`Delete record for ${patientName} (ID: ${patientId})? This will fail if prescriptions or bills exist for this patient.`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/patients/${patientId}`);
      showSuccess(`Patient ID ${patientId} deleted.`);
      fetchPatients();
    } catch (err) {
      setError(err.message || 'Failed to delete patient');
    }
  }

  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase();
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.patient_id.toString().includes(q);
    const matchesGender = genderFilter === 'ALL' || p.sex === genderFilter;
    return matchesSearch && matchesGender;
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
          Connected Oracle Table: <strong className="text-slate-400 font-bold">PATIENT</strong>
        </span>
      </div>

      {/* Module Title Card */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">Patients Management</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950/80 border border-blue-800/80 text-blue-400">
                {patients.length} Registered
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Clinical patient directory &bull; Demographics, date of birth, gender, and addresses
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Patient
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
            placeholder="Search patients by name, city, state, or ID..."
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

        {/* Gender Filter Chips */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 shrink-0">
          {['ALL', 'M', 'F'].map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                genderFilter === g
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {g === 'ALL' ? 'All Genders' : g === 'M' ? 'Male (M)' : 'Female (F)'}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Data Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Date of Birth</th>
                <th className="py-3.5 px-4">Sex</th>
                <th className="py-3.5 px-4">City / State</th>
                <th className="py-3.5 px-4">Street Address</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-sm font-medium">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading patient records from Oracle...
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No matching patient records found</p>
                    <p className="text-xs text-slate-500 mt-1">Try modifying your search filter</p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const initials = `${p.first_name[0] || ''}${p.last_name[0] || ''}`.toUpperCase();
                  const isMale = p.sex === 'M';
                  return (
                    <tr key={p.patient_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              isMale
                                ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                                : 'bg-pink-950/60 text-pink-300 border-pink-800/60'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100">
                              {p.first_name} {p.last_name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">ID: #{p.patient_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-300">
                        #{p.patient_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{p.dob}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isMale
                              ? 'bg-blue-950/70 text-blue-300 border-blue-800/80'
                              : 'bg-pink-950/70 text-pink-300 border-pink-800/80'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isMale ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                          {isMale ? 'Male' : 'Female'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{p.city}</span>
                          <span className="text-slate-500 font-normal">({p.state})</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs max-w-xs truncate" title={p.street}>
                        {p.street}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="inline-flex items-center p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                          title="Edit Patient"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.patient_id, `${p.first_name} ${p.last_name}`)}
                          className="inline-flex items-center p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                          title="Delete Patient"
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

        {/* Footer info */}
        <div className="px-5 py-3.5 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
          <span>
            Showing <strong className="text-white">{filteredPatients.length}</strong> of {patients.length} records
          </span>
          <span className="font-mono text-slate-500">
            Oracle 21c Table: <strong className="text-slate-300">PATIENT</strong>
          </span>
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Patient">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Ramesh"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Gowda"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dob}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Sex *</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
                <option value="O">Other (O)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Bengaluru"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Karnataka"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Street Address *</label>
            <input
              type="text"
              required
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 108 Brigade Gateway, Malleshwaram"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Patient ID <span className="text-slate-500 font-normal">(Optional &mdash; auto-assigned by Oracle)</span>
            </label>
            <input
              type="number"
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Auto-incremented (e.g. 411)"
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
              disabled={formSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/30 cursor-pointer disabled:opacity-60"
            >
              {formSubmitting ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Patient Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Patient #${selectedPatient?.patient_id}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dob}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Sex *</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
                <option value="O">Other (O)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Street Address *</label>
            <input
              type="text"
              required
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
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
              disabled={formSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/30 cursor-pointer disabled:opacity-60"
            >
              {formSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
