import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Receipt,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Calculator,
  User,
  Building2,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function BillingPage({ onBackToDashboard }) {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Patient Bill Total Summary (calling Oracle PL/SQL function get_patient_bill_total)
  const [summaryPatientId, setSummaryPatientId] = useState('');
  const [patientSummary, setPatientSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const initialForm = {
    bill_id: '',
    patient_id: '',
    pharmacy_id: '',
    amount: '',
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
      const [billsData, patientsData, pharmaciesData] = await Promise.all([
        api.get('/bills'),
        api.get('/patients'),
        api.get('/pharmacies'),
      ]);
      setBills(billsData);
      setPatients(patientsData);
      setPharmacies(pharmaciesData);

      if (patientsData.length > 0 && !summaryPatientId) {
        setSummaryPatientId(patientsData[0].patient_id.toString());
        loadPatientSummary(patientsData[0].patient_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load billing records from database');
    } finally {
      setLoading(false);
    }
  }

  async function loadPatientSummary(patientId) {
    if (!patientId) return;
    try {
      setSummaryLoading(true);
      const summary = await api.get(`/bills/summary/${patientId}`);
      setPatientSummary(summary);
    } catch (err) {
      setPatientSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  function handleOpenAdd() {
    setFormData({
      ...initialForm,
      patient_id: patients.length > 0 ? patients[0].patient_id.toString() : '',
      pharmacy_id: pharmacies.length > 0 ? pharmacies[0].pharmacy_id.toString() : '',
    });
    setIsAddModalOpen(true);
  }

  function handleOpenEdit(b) {
    setSelectedBill(b);
    setFormData({
      bill_id: b.bill_id,
      patient_id: b.patient_id.toString(),
      pharmacy_id: b.pharmacy_id.toString(),
      amount: b.amount.toString(),
    });
    setIsEditModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        patient_id: parseInt(formData.patient_id),
        pharmacy_id: parseInt(formData.pharmacy_id),
        amount: parseFloat(formData.amount),
      };
      if (formData.bill_id && formData.bill_id.trim() !== '') {
        payload.bill_id = parseInt(formData.bill_id.trim());
      }
      await api.post('/bills', payload);
      setIsAddModalOpen(false);
      showSuccess(`Bill created successfully for Patient #${payload.patient_id}.`);
      fetchData();
      if (summaryPatientId === formData.patient_id) {
        loadPatientSummary(parseInt(formData.patient_id));
      }
    } catch (err) {
      setError(err.message || 'Failed to create bill');
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
        patient_id: parseInt(formData.patient_id),
        pharmacy_id: parseInt(formData.pharmacy_id),
        amount: parseFloat(formData.amount),
      };
      await api.put(`/bills/${selectedBill.bill_id}`, payload);
      setIsEditModalOpen(false);
      showSuccess(`Bill #${selectedBill.bill_id} updated.`);
      fetchData();
      if (summaryPatientId === formData.patient_id) {
        loadPatientSummary(parseInt(formData.patient_id));
      }
    } catch (err) {
      setError(err.message || 'Failed to update bill');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(billId) {
    if (!window.confirm(`Delete Bill invoice #${billId}?`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/bills/${billId}`);
      showSuccess(`Bill #${billId} deleted.`);
      fetchData();
      if (summaryPatientId) {
        loadPatientSummary(parseInt(summaryPatientId));
      }
    } catch (err) {
      setError(err.message || 'Failed to delete bill');
    }
  }

  const filteredBills = bills.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.patient_name?.toLowerCase().includes(q) ||
      b.pharmacy_name?.toLowerCase().includes(q) ||
      b.bill_id.toString().includes(q) ||
      b.patient_id.toString().includes(q)
    );
  });

  const totalRevenue = bills.reduce((acc, b) => acc + (b.amount || 0), 0);

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
            BILL
          </span>
          <span className="text-slate-500">&bull;</span>
          <span>PL/SQL Function:</span>
          <span className="text-blue-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            get_patient_bill_total
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Billing & Patient Invoices</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Issue pharmacy statements, review patient expenditure, and calculate cumulative billing totals via Oracle PL/SQL.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Bill</span>
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

      {/* Interactive Oracle PL/SQL Function Section: Patient Bill Total */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Live Oracle PL/SQL Function: <code className="text-blue-400 font-mono">get_patient_bill_total()</code>
              </h3>
              <p className="text-[11px] text-slate-400">
                Executes the compiled Oracle PL/SQL function directly in XEPDB1 to compute total billed amount.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Select Patient:</span>
            <select
              value={summaryPatientId}
              onChange={(e) => {
                setSummaryPatientId(e.target.value);
                loadPatientSummary(parseInt(e.target.value));
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  #{p.patient_id} - {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {summaryLoading ? (
          <div className="py-4 text-xs text-slate-400 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Executing Oracle PL/SQL function...</span>
          </div>
        ) : patientSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Patient Profile</span>
                <p className="text-sm font-bold text-white">{patientSummary.patient_name}</p>
                <p className="text-[10px] font-mono text-slate-500">ID: #{patientSummary.patient_id}</p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400">PL/SQL Total Sum</span>
                <p className="text-lg font-mono font-extrabold text-emerald-400">
                  ₹{Number(patientSummary.total_billed_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-500">Returned by get_patient_bill_total</p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Invoices Linked</span>
                <p className="text-sm font-bold text-white">
                  {patientSummary.total_bills_count} {patientSummary.total_bills_count === 1 ? 'Invoice' : 'Invoices'}
                </p>
                <p className="text-[10px] text-slate-500">Recorded in BILL table</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bills by patient, pharmacy, or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            System Total:{' '}
            <strong className="text-emerald-400 font-bold">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
          <span className="border-l border-slate-800 pl-4">
            Showing <strong className="text-white">{filteredBills.length}</strong> of {bills.length} Invoices
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading billing invoices from Oracle...</span>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">No billing records found</p>
            <p className="text-slate-500 mt-1">Click "Issue New Bill" above to create an invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Billed Patient</th>
                  <th className="py-3.5 px-4">Dispensing Pharmacy</th>
                  <th className="py-3.5 px-4">Amount (INR)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredBills.map((b) => (
                  <tr key={b.bill_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      #{b.bill_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">
                        {b.patient_name || `Patient #${b.patient_id}`}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Patient ID: #{b.patient_id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{b.pharmacy_name || `Pharmacy #${b.pharmacy_id}`}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Dispensary ID: #{b.pharmacy_id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-extrabold text-sm text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/50 inline-block">
                        ₹{Number(b.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          title="Edit Bill"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.bill_id)}
                          title="Delete Bill"
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

      {/* Modal: Add Bill */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Issue New Medication Bill"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Bill ID (Optional - Auto-assigned if blank)
            </label>
            <input
              type="number"
              value={formData.bill_id}
              onChange={(e) => setFormData({ ...formData, bill_id: e.target.value })}
              placeholder="e.g. 705"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Patient <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  #{p.patient_id} - {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Dispensing Pharmacy <span className="text-red-400">*</span>
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

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Bill Amount (INR ₹) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 450.00"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
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
              {submitting ? 'Creating in Oracle...' : 'Issue Bill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Bill */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Bill Invoice #${formData.bill_id}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Patient <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  #{p.patient_id} - {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Dispensing Pharmacy <span className="text-red-400">*</span>
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

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Bill Amount (INR ₹) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
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
              {submitting ? 'Updating in Oracle...' : 'Update Bill'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
