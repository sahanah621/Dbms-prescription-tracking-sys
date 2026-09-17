import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  User,
  Stethoscope,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function PrescriptionsPage({ onBackToDashboard, onPrescriptionCountChange }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // New Prescription Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    doctor_id: '',
    patient_id: '',
    prescription_date: new Date().toISOString().split('T')[0],
    items: [
      { medicine_id: '', dosage: '650mg', frequency: 'Twice Daily (BD)', duration: '5 Days' },
    ],
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [rxData, medData, patData, docData] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/medicines'),
        api.get('/patients'),
        api.get('/doctors'),
      ]);
      setPrescriptions(rxData);
      setMedicines(medData);
      setPatients(patData);
      setDoctors(docData);
      if (onPrescriptionCountChange) onPrescriptionCountChange(rxData.length);
    } catch (err) {
      setError(err.message || 'Failed to load prescriptions from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  function handleOpenAdd() {
    setFormData({
      doctor_id: doctors.length > 0 ? doctors[0].doctor_id.toString() : '',
      patient_id: patients.length > 0 ? patients[0].patient_id.toString() : '',
      prescription_date: new Date().toISOString().split('T')[0],
      items: [
        {
          medicine_id: medicines.length > 0 ? medicines[0].medicine_id.toString() : '',
          dosage: '650mg',
          frequency: 'Twice Daily (BD)',
          duration: '5 Days',
        },
      ],
    });
    setIsAddModalOpen(true);
  }

  function handleAddItemRow() {
    const defaultMedId = medicines.length > 0 ? medicines[0].medicine_id.toString() : '';
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { medicine_id: defaultMedId, dosage: '1 tablet', frequency: 'Once Daily (OD)', duration: '7 Days' },
      ],
    }));
  }

  function handleRemoveItemRow(index) {
    if (formData.items.length <= 1) return;
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems.splice(index, 1);
      return { ...prev, items: nextItems };
    });
  }

  function handleItemChange(index, field, value) {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, items: nextItems };
    });
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        doctor_id: parseInt(formData.doctor_id),
        patient_id: parseInt(formData.patient_id),
        prescription_date: formData.prescription_date,
        items: formData.items.map((it) => ({
          medicine_id: parseInt(it.medicine_id),
          dosage: it.dosage.trim(),
          frequency: it.frequency.trim(),
          duration: it.duration.trim(),
        })),
      };

      const newRx = await api.post('/prescriptions', payload);
      setIsAddModalOpen(false);
      showSuccess(`Prescription #${newRx.prescription_id} issued with ${newRx.total_items} medicine items.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(rxId) {
    if (!window.confirm(`Delete Prescription #${rxId} and all associated items?`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/prescriptions/${rxId}`);
      showSuccess(`Prescription #${rxId} deleted.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete prescription');
    }
  }

  const filtered = prescriptions.filter((rx) => {
    const q = search.toLowerCase();
    return (
      rx.patient_name?.toLowerCase().includes(q) ||
      rx.doctor_name?.toLowerCase().includes(q) ||
      rx.prescription_id.toString().includes(q)
    );
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
          Connected Oracle Tables: <strong className="text-slate-400 font-bold">PRESCRIPTION, PRESCRIPTION_ITEM</strong>
        </span>
      </div>

      {/* Module Title Card */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-800/80 text-violet-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">Prescriptions & Regimens</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-violet-950/80 border border-violet-800/80 text-violet-400">
                {prescriptions.length} Issued Rx
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Physician authorizations, medication dosage schedules, durations, and cost estimates
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Write Prescription
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

      {/* Search Filter */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 px-3.5 py-2.5 flex items-center gap-3 shadow-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by patient name, prescribing physician, or prescription ID..."
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

      {/* Prescriptions List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-16 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="inline-flex items-center gap-2 text-sm font-medium">
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              Loading clinical prescriptions from Oracle...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center bg-slate-900 rounded-2xl border border-slate-800">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No prescriptions match your search</p>
            <p className="text-xs text-slate-500 mt-1">Click "Write Prescription" to create a new regimen</p>
          </div>
        ) : (
          filtered.map((rx) => {
            const isExpanded = expandedId === rx.prescription_id;
            return (
              <div
                key={rx.prescription_id}
                className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md hover:border-slate-700 transition-all duration-200 overflow-hidden"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : rx.prescription_id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <button className="text-slate-400 hover:text-slate-200 cursor-pointer">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-400" /> : <ChevronRight className="w-5 h-5" />}
                    </button>

                    {/* Rx Icon */}
                    <div className="w-10 h-10 rounded-xl bg-violet-950/70 text-violet-300 flex items-center justify-center font-serif font-black text-lg shrink-0 border border-violet-800/70">
                      ℞
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-extrabold text-blue-400 text-sm">
                          Prescription #{rx.prescription_id}
                        </span>
                        <span className="text-slate-600">&bull;</span>
                        <span className="text-xs font-semibold text-slate-400">{rx.prescription_date}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {rx.patient_name}
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-medium">(ID: #{rx.patient_id})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 sm:space-x-8">
                    <div className="text-right hidden md:block">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-end gap-1">
                        <Stethoscope className="w-3 h-3 text-slate-500" /> Physician
                      </div>
                      <div className="text-xs font-bold text-slate-300 mt-0.5">Dr. {rx.doctor_name}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Regimen</div>
                      <div className="text-xs font-bold text-slate-300 mt-0.5 bg-slate-800 px-2 py-0.5 rounded-md inline-block border border-slate-700">
                        {rx.total_items} {rx.total_items === 1 ? 'med' : 'meds'}
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Est. Cost</div>
                      <div className="text-sm font-mono font-extrabold text-emerald-400 mt-0.5">
                        ₹{rx.estimated_total_cost?.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(rx.prescription_id);
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                      title="Delete Prescription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/70 p-4 sm:p-5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        Dosage & Medication Schedule
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Oracle Table: <strong className="text-slate-400 font-bold">PRESCRIPTION_ITEM</strong>
                      </span>
                    </div>

                    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3.5">Item #</th>
                            <th className="py-2.5 px-3.5">Medicine Name</th>
                            <th className="py-2.5 px-3.5">Dosage</th>
                            <th className="py-2.5 px-3.5">Frequency</th>
                            <th className="py-2.5 px-3.5">Duration</th>
                            <th className="py-2.5 px-3.5 text-right">Unit Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {rx.items.map((item) => (
                            <tr key={item.item_id} className="hover:bg-slate-800/40">
                              <td className="py-2.5 px-3.5 font-mono text-slate-500 font-semibold">#{item.item_id}</td>
                              <td className="py-2.5 px-3.5 font-bold text-slate-200">{item.medicine_name}</td>
                              <td className="py-2.5 px-3.5">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-950/70 text-blue-300 border border-blue-800/80 font-semibold text-[11px]">
                                  {item.dosage}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-300 font-medium">{item.frequency}</td>
                              <td className="py-2.5 px-3.5 text-slate-400">{item.duration}</td>
                              <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-400">
                                ₹{item.unit_price?.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Prescription Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Issue Medical Prescription"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Select Patient *</label>
              <select
                required
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.first_name} {p.last_name} (#{p.patient_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Prescribing Doctor *</label>
              <select
                required
                value={formData.doctor_id}
                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {doctors.map((d) => (
                  <option key={d.doctor_id} value={d.doctor_id}>
                    Dr. {d.first_name} {d.last_name} (#{d.doctor_id} - {d.qualification})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Prescription Date *</label>
            <input
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              value={formData.prescription_date}
              onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Medicines Section */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Prescribed Medicines ({formData.items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Medication
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {formData.items.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      Medication #{idx + 1}
                    </span>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-0.5">Medicine Catalog</label>
                      <select
                        value={item.medicine_id}
                        onChange={(e) => handleItemChange(idx, 'medicine_id', e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 outline-none focus:border-blue-500 font-medium"
                      >
                        {medicines.map((m) => (
                          <option key={m.medicine_id} value={m.medicine_id}>
                            {m.name} (₹{m.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-0.5">Dosage</label>
                      <input
                        type="text"
                        required
                        value={item.dosage}
                        onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 outline-none focus:border-blue-500"
                        placeholder="e.g. 650mg or 1 tab"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-0.5">Frequency</label>
                      <input
                        type="text"
                        required
                        value={item.frequency}
                        onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 outline-none focus:border-blue-500"
                        placeholder="e.g. Twice Daily (BD)"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-0.5">Duration</label>
                      <input
                        type="text"
                        required
                        value={item.duration}
                        onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 outline-none focus:border-blue-500"
                        placeholder="e.g. 5 Days"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Prescription Total Preview */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-300">Estimated Prescription Total:</span>
              <p className="text-[11px] text-slate-500">
                Sum of {formData.items.length} prescribed medication {formData.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <span className="font-mono font-extrabold text-emerald-400 text-base">
              ₹{formData.items.reduce((sum, item) => {
                const med = medicines.find((m) => m.medicine_id.toString() === item.medicine_id?.toString());
                return sum + (med ? Number(med.price || 0) : 0);
              }, 0).toFixed(2)}
            </span>
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
              {submitting ? 'Issuing...' : 'Issue Prescription'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
