import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Phone,
  Building2,
  Award,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function DoctorsPage({ onBackToDashboard }) {
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const initialForm = {
    doctor_id: '',
    hospital_id: '',
    first_name: '',
    last_name: '',
    qualification: '',
    experience: 0,
    contact_no: '',
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
      const [docData, hospData] = await Promise.all([
        api.get('/doctors'),
        api.get('/hospitals'),
      ]);
      setDoctors(docData);
      setHospitals(hospData);
      if (hospData.length > 0 && !formData.hospital_id) {
        setFormData((prev) => ({ ...prev, hospital_id: hospData[0].hospital_id.toString() }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load doctors from database');
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
      hospital_id: hospitals.length > 0 ? hospitals[0].hospital_id.toString() : '',
    });
    setIsAddModalOpen(true);
  }

  function handleOpenEdit(doc) {
    setSelectedDoctor(doc);
    setFormData({
      doctor_id: doc.doctor_id,
      hospital_id: doc.hospital_id.toString(),
      first_name: doc.first_name,
      last_name: doc.last_name,
      qualification: doc.qualification,
      experience: doc.experience,
      contact_no: doc.contact_no,
    });
    setIsEditModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        hospital_id: parseInt(formData.hospital_id),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        qualification: formData.qualification.trim(),
        experience: parseInt(formData.experience || '0'),
        contact_no: formData.contact_no.trim(),
      };
      if (formData.doctor_id) {
        payload.doctor_id = parseInt(formData.doctor_id);
      }
      const newDoc = await api.post('/doctors', payload);
      setIsAddModalOpen(false);
      showSuccess(`Dr. ${newDoc.first_name} ${newDoc.last_name} (ID: ${newDoc.doctor_id}) registered successfully.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to register doctor');
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
        hospital_id: parseInt(formData.hospital_id),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        qualification: formData.qualification.trim(),
        experience: parseInt(formData.experience || '0'),
        contact_no: formData.contact_no.trim(),
      };
      await api.put(`/doctors/${selectedDoctor.doctor_id}`, payload);
      setIsEditModalOpen(false);
      showSuccess(`Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name} updated successfully.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update doctor');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(docId, docName) {
    if (!window.confirm(`Delete Dr. ${docName} (ID: ${docId})? Will fail if prescriptions are linked to this doctor.`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/doctors/${docId}`);
      showSuccess(`Dr. ${docName} deleted.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete doctor');
    }
  }

  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase();
    const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();
    return (
      fullName.includes(q) ||
      d.qualification.toLowerCase().includes(q) ||
      d.hospital_name?.toLowerCase().includes(q) ||
      d.doctor_id.toString().includes(q)
    );
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
        <span className="text-xs font-mono text-slate-500">
          Connected Oracle Table: <strong className="text-slate-400 font-bold">DOCTOR</strong>
        </span>
      </div>

      {/* Title Card */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">Doctors & Medical Specialists</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950/80 border border-blue-800/80 text-blue-400">
                {doctors.length} Registered
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Physician registry, hospital affiliations, credentials, and medical practice experience
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Doctor
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

      {/* Search Controls */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 px-3.5 py-2.5 flex items-center gap-3 shadow-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by physician name, qualification, or affiliated hospital..."
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

      {/* Doctors Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Doctor Name</th>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Qualification / Degrees</th>
                <th className="py-3.5 px-4">Affiliated Hospital</th>
                <th className="py-3.5 px-4">Experience</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-sm font-medium">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading doctor records from Oracle...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-500">
                    No doctor records found.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.doctor_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-800/70 text-blue-300 flex items-center justify-center font-bold text-xs">
                          Dr
                        </div>
                        <div>
                          <div>Dr. {d.first_name} {d.last_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono font-normal">#{d.doctor_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-300">
                      #{d.doctor_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{d.qualification}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-200">{d.hospital_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {d.experience} years
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{d.contact_no}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="inline-flex items-center p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        title="Edit Doctor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.doctor_id, `${d.first_name} ${d.last_name}`)}
                        className="inline-flex items-center p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
          <span>Showing <strong className="text-white">{filtered.length}</strong> of {doctors.length} doctors</span>
          <span className="font-mono text-slate-500">Oracle Table: <strong className="text-slate-300">DOCTOR</strong></span>
        </div>
      </div>

      {/* Add Doctor Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Doctor">
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
                placeholder="e.g. Rajesh"
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
                placeholder="e.g. Kulkarni"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Affiliated Hospital *</label>
            <select
              required
              value={formData.hospital_id}
              onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>
                  {h.name} ({h.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Qualification & Specialization *</label>
            <input
              type="text"
              required
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. MBBS, MD (General Medicine)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Experience (Years) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Contact Number *</label>
              <input
                type="text"
                required
                value={formData.contact_no}
                onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="+919820144552"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Doctor ID <span className="text-slate-500 font-normal">(Optional &mdash; auto-assigned by Oracle)</span>
            </label>
            <input
              type="number"
              value={formData.doctor_id}
              onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Auto-incremented (e.g. 309)"
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
              {submitting ? 'Registering...' : 'Register Doctor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Doctor #${selectedDoctor?.doctor_id}`}>
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

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Affiliated Hospital *</label>
            <select
              required
              value={formData.hospital_id}
              onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>
                  {h.name} ({h.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Qualification *</label>
            <input
              type="text"
              required
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Experience (Years) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Contact Number *</label>
              <input
                type="text"
                required
                value={formData.contact_no}
                onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
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
