import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Truck,
  Building2,
  Package,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function SuppliersPage({ onBackToDashboard }) {
  const [activeSubTab, setActiveSubTab] = useState('suppliers'); // 'suppliers' | 'manufacturers' | 'wholesale' | 'orders'

  // Data States
  const [suppliers, setSuppliers] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [wholesaleSuppliers, setWholesaleSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Modals: Supplier
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const initialSupplierForm = { supplier_id: '', name: '', contact: '', city: '', state: '', street: '' };
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm);

  // Modals: Manufacturer
  const [isAddManufacturerOpen, setIsAddManufacturerOpen] = useState(false);
  const [isEditManufacturerOpen, setIsEditManufacturerOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const initialManufacturerForm = { manufacturer_id: '', brand_name: '', city: '', state: '', street: '' };
  const [manufacturerForm, setManufacturerForm] = useState(initialManufacturerForm);

  // Modals: Wholesale Supplier
  const [isAddWholesaleOpen, setIsAddWholesaleOpen] = useState(false);
  const [isEditWholesaleOpen, setIsEditWholesaleOpen] = useState(false);
  const [selectedWholesale, setSelectedWholesale] = useState(null);
  const initialWholesaleForm = { gst_no: '', city: '', state: '', street: '' };
  const [wholesaleForm, setWholesaleForm] = useState(initialWholesaleForm);

  // Modals: Medicine Restock Order
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const initialOrderForm = {
    order_id: '',
    supplier_id: '',
    pharmacy_id: '',
    quantity_ordered: 100,
    order_date: new Date().toISOString().split('T')[0],
    arrival_date: '',
    payment_status: 'pending',
    order_status: 'pending',
  };
  const [orderForm, setOrderForm] = useState(initialOrderForm);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [suppData, mfgData, wsData, ordData, pharmData] = await Promise.all([
        api.get('/suppliers'),
        api.get('/manufacturers'),
        api.get('/wholesale-suppliers'),
        api.get('/medicine-orders'),
        api.get('/pharmacies'),
      ]);
      setSuppliers(suppData);
      setManufacturers(mfgData);
      setWholesaleSuppliers(wsData);
      setOrders(ordData);
      setPharmacies(pharmData);

      if (suppData.length > 0 && !orderForm.supplier_id) {
        setOrderForm((prev) => ({
          ...prev,
          supplier_id: suppData[0].supplier_id.toString(),
          pharmacy_id: pharmData.length > 0 ? pharmData[0].pharmacy_id.toString() : '',
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load supply chain data from database');
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  // ================= SUPPLIER ACTIONS =================
  function handleOpenAddSupplier() {
    setSupplierForm(initialSupplierForm);
    setIsAddSupplierOpen(true);
  }

  function handleOpenEditSupplier(s) {
    setSelectedSupplier(s);
    setSupplierForm({
      supplier_id: s.supplier_id,
      name: s.name,
      contact: s.contact,
      city: s.city,
      state: s.state,
      street: s.street,
    });
    setIsEditSupplierOpen(true);
  }

  async function handleCreateSupplierSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: supplierForm.name.trim(),
        contact: supplierForm.contact.trim(),
        city: supplierForm.city.trim(),
        state: supplierForm.state.trim(),
        street: supplierForm.street.trim(),
      };
      if (supplierForm.supplier_id && supplierForm.supplier_id.toString().trim() !== '') {
        payload.supplier_id = parseInt(supplierForm.supplier_id);
      }
      await api.post('/suppliers', payload);
      setIsAddSupplierOpen(false);
      showSuccess(`Supplier "${supplierForm.name}" registered successfully.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to add supplier');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSupplierSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: supplierForm.name.trim(),
        contact: supplierForm.contact.trim(),
        city: supplierForm.city.trim(),
        state: supplierForm.state.trim(),
        street: supplierForm.street.trim(),
      };
      await api.put(`/suppliers/${selectedSupplier.supplier_id}`, payload);
      setIsEditSupplierOpen(false);
      showSuccess(`Supplier "${selectedSupplier.name}" updated successfully.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update supplier');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSupplier(id, name) {
    if (!window.confirm(`Delete Supplier "${name}" (ID: ${id})? Will fail if active orders reference this supplier.`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/suppliers/${id}`);
      showSuccess(`Supplier "${name}" deleted.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete supplier');
    }
  }

  // ================= MANUFACTURER ACTIONS =================
  function handleOpenAddManufacturer() {
    setManufacturerForm(initialManufacturerForm);
    setIsAddManufacturerOpen(true);
  }

  function handleOpenEditManufacturer(m) {
    setSelectedManufacturer(m);
    setManufacturerForm({
      manufacturer_id: m.manufacturer_id,
      brand_name: m.brand_name,
      city: m.city,
      state: m.state,
      street: m.street,
    });
    setIsEditManufacturerOpen(true);
  }

  async function handleCreateManufacturerSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        brand_name: manufacturerForm.brand_name.trim(),
        city: manufacturerForm.city.trim(),
        state: manufacturerForm.state.trim(),
        street: manufacturerForm.street.trim(),
      };
      if (manufacturerForm.manufacturer_id && manufacturerForm.manufacturer_id.toString().trim() !== '') {
        payload.manufacturer_id = parseInt(manufacturerForm.manufacturer_id);
      }
      await api.post('/manufacturers', payload);
      setIsAddManufacturerOpen(false);
      showSuccess(`Manufacturer "${manufacturerForm.brand_name}" added.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to add manufacturer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditManufacturerSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        brand_name: manufacturerForm.brand_name.trim(),
        city: manufacturerForm.city.trim(),
        state: manufacturerForm.state.trim(),
        street: manufacturerForm.street.trim(),
      };
      await api.put(`/manufacturers/${selectedManufacturer.manufacturer_id}`, payload);
      setIsEditManufacturerOpen(false);
      showSuccess(`Manufacturer "${selectedManufacturer.brand_name}" updated.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update manufacturer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteManufacturer(id, name) {
    if (!window.confirm(`Delete Manufacturer "${name}" (ID: ${id})?`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/manufacturers/${id}`);
      showSuccess(`Manufacturer "${name}" deleted.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete manufacturer');
    }
  }

  // ================= WHOLESALE SUPPLIER ACTIONS =================
  function handleOpenAddWholesale() {
    setWholesaleForm(initialWholesaleForm);
    setIsAddWholesaleOpen(true);
  }

  function handleOpenEditWholesale(ws) {
    setSelectedWholesale(ws);
    setWholesaleForm({
      gst_no: ws.gst_no,
      city: ws.city,
      state: ws.state,
      street: ws.street,
    });
    setIsEditWholesaleOpen(true);
  }

  async function handleCreateWholesaleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        gst_no: wholesaleForm.gst_no.trim().toUpperCase(),
        city: wholesaleForm.city.trim(),
        state: wholesaleForm.state.trim(),
        street: wholesaleForm.street.trim(),
      };
      await api.post('/wholesale-suppliers', payload);
      setIsAddWholesaleOpen(false);
      showSuccess(`Wholesale supplier GST "${payload.gst_no}" added.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to add wholesale supplier');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditWholesaleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        city: wholesaleForm.city.trim(),
        state: wholesaleForm.state.trim(),
        street: wholesaleForm.street.trim(),
      };
      await api.put(`/wholesale-suppliers/${selectedWholesale.gst_no}`, payload);
      setIsEditWholesaleOpen(false);
      showSuccess(`Wholesale supplier GST "${selectedWholesale.gst_no}" updated.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update wholesale supplier');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteWholesale(gstNo) {
    if (!window.confirm(`Delete Wholesale Supplier GST "${gstNo}"?`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/wholesale-suppliers/${gstNo}`);
      showSuccess(`Wholesale supplier "${gstNo}" deleted.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete wholesale supplier');
    }
  }

  // ================= MEDICINE ORDER ACTIONS =================
  function handleOpenAddOrder() {
    setOrderForm({
      ...initialOrderForm,
      supplier_id: suppliers.length > 0 ? suppliers[0].supplier_id.toString() : '',
      pharmacy_id: pharmacies.length > 0 ? pharmacies[0].pharmacy_id.toString() : '',
    });
    setIsAddOrderOpen(true);
  }

  function handleOpenEditOrder(o) {
    setSelectedOrder(o);
    setOrderForm({
      order_id: o.order_id,
      supplier_id: o.supplier_id.toString(),
      pharmacy_id: o.pharmacy_id.toString(),
      quantity_ordered: o.quantity_ordered,
      order_date: o.order_date || '',
      arrival_date: o.arrival_date || '',
      payment_status: o.payment_status,
      order_status: o.order_status,
    });
    setIsEditOrderOpen(true);
  }

  async function handleCreateOrderSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        supplier_id: parseInt(orderForm.supplier_id),
        pharmacy_id: parseInt(orderForm.pharmacy_id),
        quantity_ordered: parseInt(orderForm.quantity_ordered),
        order_date: orderForm.order_date || undefined,
        arrival_date: orderForm.arrival_date ? orderForm.arrival_date : undefined,
        payment_status: orderForm.payment_status,
        order_status: orderForm.order_status,
      };
      if (orderForm.order_id && orderForm.order_id.toString().trim() !== '') {
        payload.order_id = parseInt(orderForm.order_id);
      }
      await api.post('/medicine-orders', payload);
      setIsAddOrderOpen(false);
      showSuccess('Procurement order placed successfully.');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditOrderSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        supplier_id: parseInt(orderForm.supplier_id),
        pharmacy_id: parseInt(orderForm.pharmacy_id),
        quantity_ordered: parseInt(orderForm.quantity_ordered),
        arrival_date: orderForm.arrival_date ? orderForm.arrival_date : undefined,
        payment_status: orderForm.payment_status,
        order_status: orderForm.order_status,
      };
      await api.put(`/medicine-orders/${selectedOrder.order_id}`, payload);
      setIsEditOrderOpen(false);
      showSuccess(`Order #${selectedOrder.order_id} updated.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!window.confirm(`Delete Order #${orderId}?`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/medicine-orders/${orderId}`);
      showSuccess(`Order #${orderId} deleted.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete order');
    }
  }

  // Filtered lists
  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.contact.toLowerCase().includes(q) ||
      s.supplier_id.toString().includes(q)
    );
  });

  const filteredManufacturers = manufacturers.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.brand_name.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      m.state.toLowerCase().includes(q) ||
      m.manufacturer_id.toString().includes(q)
    );
  });

  const filteredWholesale = wholesaleSuppliers.filter((ws) => {
    const q = search.toLowerCase();
    return (
      ws.gst_no.toLowerCase().includes(q) ||
      ws.city.toLowerCase().includes(q) ||
      ws.state.toLowerCase().includes(q)
    );
  });

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.supplier_name?.toLowerCase().includes(q) ||
      o.pharmacy_name?.toLowerCase().includes(q) ||
      o.order_id.toString().includes(q) ||
      o.payment_status.toLowerCase().includes(q) ||
      o.order_status.toLowerCase().includes(q);

    const matchesStatus = orderStatusFilter === 'ALL' || o.order_status.toLowerCase() === orderStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60';
    if (s === 'shipped') return 'bg-indigo-950/70 text-indigo-400 border-indigo-800/60';
    if (s === 'processing') return 'bg-blue-950/70 text-blue-400 border-blue-800/60';
    if (s === 'cancelled') return 'bg-red-950/70 text-red-400 border-red-800/60';
    return 'bg-amber-950/70 text-amber-400 border-amber-800/60';
  };

  const getPaymentBadge = (status) => {
    const s = status.toLowerCase();
    if (s === 'paid') return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50';
    if (s === 'partial') return 'bg-blue-950/60 text-blue-400 border-blue-800/50';
    if (s === 'refunded') return 'bg-purple-950/60 text-purple-400 border-purple-800/50';
    return 'bg-amber-950/60 text-amber-400 border-amber-800/50';
  };

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
          <span>Oracle Tables:</span>
          <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            SUPPLIER &bull; MANUFACTURER &bull; WHOLESALE &bull; MEDICINE_ORDER
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Suppliers & Supply Chain</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Wholesale vendor directory, pharmaceutical manufacturers, GST records, and restock order fulfillment.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (activeSubTab === 'suppliers') handleOpenAddSupplier();
            else if (activeSubTab === 'manufacturers') handleOpenAddManufacturer();
            else if (activeSubTab === 'wholesale') handleOpenAddWholesale();
            else handleOpenAddOrder();
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeSubTab === 'suppliers' && 'Add Supplier'}
            {activeSubTab === 'manufacturers' && 'Add Manufacturer'}
            {activeSubTab === 'wholesale' && 'Add Wholesale GST'}
            {activeSubTab === 'orders' && 'Issue Restock Order'}
          </span>
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
      <div className="flex overflow-x-auto border-b border-slate-800">
        <button
          onClick={() => {
            setActiveSubTab('suppliers');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'suppliers'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Suppliers Directory ({suppliers.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('orders');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'orders'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Medicine Orders & Restock ({orders.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('manufacturers');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'manufacturers'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Manufacturers ({manufacturers.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('wholesale');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'wholesale'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Wholesale GST Registry ({wholesaleSuppliers.length})</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeSubTab === 'suppliers'
                ? 'Search suppliers by name, city, phone...'
                : activeSubTab === 'manufacturers'
                ? 'Search brand name, city, state...'
                : activeSubTab === 'wholesale'
                ? 'Search GST number, city...'
                : 'Search orders by supplier, pharmacy, status...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {activeSubTab === 'orders' && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* ================= TAB 1: SUPPLIERS ================= */}
      {activeSubTab === 'suppliers' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading suppliers from Oracle...</span>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No supplier records found</p>
              <p className="text-slate-500 mt-1">Click "Add Supplier" above to register one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Supplier Business Name</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Location Address</th>
                    <th className="py-3.5 px-4">Supply Network</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredSuppliers.map((s) => (
                    <tr key={s.supplier_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        #{s.supplier_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{s.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          {s.contact}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{s.street}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 ml-5">
                          {s.city}, {s.state}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/70 border border-blue-800/60 text-blue-400">
                            {s.linked_manufacturers_count || 0} Brands
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
                            {s.linked_pharmacies_count || 0} Dispensaries
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditSupplier(s)}
                            title="Edit Supplier"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.supplier_id, s.name)}
                            title="Delete Supplier"
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
      )}

      {/* ================= TAB 2: MEDICINE RESTOCK ORDERS ================= */}
      {activeSubTab === 'orders' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading purchase orders from Oracle...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No restock orders found</p>
              <p className="text-slate-500 mt-1">Click "Issue Restock Order" above to create an order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Destination Pharmacy</th>
                    <th className="py-3.5 px-4">Quantity</th>
                    <th className="py-3.5 px-4">Schedule Dates</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredOrders.map((o) => (
                    <tr key={o.order_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        #{o.order_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{o.supplier_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">ID: #{o.supplier_id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">{o.pharmacy_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">ID: #{o.pharmacy_id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {o.quantity_ordered} Units
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Order: {o.order_date || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Arrival: {o.arrival_date || 'Pending'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPaymentBadge(o.payment_status)}`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${getOrderStatusBadge(o.order_status)}`}>
                          {o.order_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditOrder(o)}
                            title="Edit Order"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(o.order_id)}
                            title="Delete Order"
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
      )}

      {/* ================= TAB 3: MANUFACTURERS ================= */}
      {activeSubTab === 'manufacturers' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading manufacturers from Oracle...</span>
            </div>
          ) : filteredManufacturers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No manufacturer records found</p>
              <p className="text-slate-500 mt-1">Click "Add Manufacturer" above to insert one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Manufacturer Brand Name</th>
                    <th className="py-3.5 px-4">Headquarters Location</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredManufacturers.map((m) => (
                    <tr key={m.manufacturer_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        #{m.manufacturer_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{m.brand_name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{m.street}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 ml-5">
                          {m.city}, {m.state}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditManufacturer(m)}
                            title="Edit Manufacturer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteManufacturer(m.manufacturer_id, m.brand_name)}
                            title="Delete Manufacturer"
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
      )}

      {/* ================= TAB 4: WHOLESALE SUPPLIERS ================= */}
      {activeSubTab === 'wholesale' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading wholesale suppliers from Oracle...</span>
            </div>
          ) : filteredWholesale.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <FileCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No wholesale supplier records found</p>
              <p className="text-slate-500 mt-1">Click "Add Wholesale GST" to register a wholesale vendor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">GST Identification Number</th>
                    <th className="py-3.5 px-4">Registered Facility Location</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredWholesale.map((ws) => (
                    <tr key={ws.gst_no} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400 text-sm">
                        {ws.gst_no}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{ws.street}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 ml-5">
                          {ws.city}, {ws.state}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditWholesale(ws)}
                            title="Edit Wholesale Supplier"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWholesale(ws.gst_no)}
                            title="Delete Wholesale Supplier"
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
      )}

      {/* ================= MODALS: SUPPLIER ================= */}
      <Modal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        title="Add New Medical Supplier"
      >
        <form onSubmit={handleCreateSupplierSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supplier ID (Optional - Auto-assigned if blank)
            </label>
            <input
              type="number"
              value={supplierForm.supplier_id}
              onChange={(e) => setSupplierForm({ ...supplierForm, supplier_id: e.target.value })}
              placeholder="e.g. 806"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supplier Business Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="e.g. Bharat MedSupply Logistics"
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
              value={supplierForm.contact}
              onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
              placeholder="e.g. +91 9845012345"
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
                value={supplierForm.city}
                onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                placeholder="e.g. Mumbai"
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
                value={supplierForm.state}
                onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })}
                placeholder="e.g. Maharashtra"
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
              value={supplierForm.street}
              onChange={(e) => setSupplierForm({ ...supplierForm, street: e.target.value })}
              placeholder="e.g. Plot 45, MIDC Industrial Area"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddSupplierOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving to Oracle...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Supplier */}
      <Modal
        isOpen={isEditSupplierOpen}
        onClose={() => setIsEditSupplierOpen(false)}
        title={`Edit Supplier #${supplierForm.supplier_id}`}
      >
        <form onSubmit={handleEditSupplierSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supplier Business Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
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
              value={supplierForm.contact}
              onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
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
                value={supplierForm.city}
                onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
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
                value={supplierForm.state}
                onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })}
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
              value={supplierForm.street}
              onChange={(e) => setSupplierForm({ ...supplierForm, street: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditSupplierOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating in Oracle...' : 'Update Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODALS: MEDICINE ORDER ================= */}
      <Modal
        isOpen={isAddOrderOpen}
        onClose={() => setIsAddOrderOpen(false)}
        title="Issue New Medicine Restock Order"
      >
        <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Order ID (Optional - Auto-assigned if blank)
            </label>
            <input
              type="number"
              value={orderForm.order_id}
              onChange={(e) => setOrderForm({ ...orderForm, order_id: e.target.value })}
              placeholder="e.g. 913"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Fulfilling Supplier <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={orderForm.supplier_id}
              onChange={(e) => setOrderForm({ ...orderForm, supplier_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  #{s.supplier_id} - {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Receiving Pharmacy Branch <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={orderForm.pharmacy_id}
              onChange={(e) => setOrderForm({ ...orderForm, pharmacy_id: e.target.value })}
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
                Quantity Ordered (Units) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={orderForm.quantity_ordered}
                onChange={(e) => setOrderForm({ ...orderForm, quantity_ordered: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Order Date
              </label>
              <input
                type="date"
                value={orderForm.order_date}
                onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Payment Status <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={orderForm.payment_status}
                onChange={(e) => setOrderForm({ ...orderForm, payment_status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Order Status <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={orderForm.order_status}
                onChange={(e) => setOrderForm({ ...orderForm, order_status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Expected / Actual Arrival Date (Optional)
            </label>
            <input
              type="date"
              value={orderForm.arrival_date}
              onChange={(e) => setOrderForm({ ...orderForm, arrival_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOrderOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Placing Order...' : 'Place Restock Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Medicine Order */}
      <Modal
        isOpen={isEditOrderOpen}
        onClose={() => setIsEditOrderOpen(false)}
        title={`Update Restock Order #${orderForm.order_id}`}
      >
        <form onSubmit={handleEditOrderSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Fulfilling Supplier <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={orderForm.supplier_id}
              onChange={(e) => setOrderForm({ ...orderForm, supplier_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  #{s.supplier_id} - {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Receiving Pharmacy Branch <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={orderForm.pharmacy_id}
              onChange={(e) => setOrderForm({ ...orderForm, pharmacy_id: e.target.value })}
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
              Quantity Ordered (Units) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={orderForm.quantity_ordered}
              onChange={(e) => setOrderForm({ ...orderForm, quantity_ordered: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Payment Status <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={orderForm.payment_status}
                onChange={(e) => setOrderForm({ ...orderForm, payment_status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Order Status <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={orderForm.order_status}
                onChange={(e) => setOrderForm({ ...orderForm, order_status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Arrival Date
            </label>
            <input
              type="date"
              value={orderForm.arrival_date}
              onChange={(e) => setOrderForm({ ...orderForm, arrival_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOrderOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating in Oracle...' : 'Update Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODALS: MANUFACTURER ================= */}
      <Modal
        isOpen={isAddManufacturerOpen}
        onClose={() => setIsAddManufacturerOpen(false)}
        title="Add Pharmaceutical Manufacturer"
      >
        <form onSubmit={handleCreateManufacturerSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Manufacturer ID (Optional - Auto-assigned if blank)
            </label>
            <input
              type="number"
              value={manufacturerForm.manufacturer_id}
              onChange={(e) => setManufacturerForm({ ...manufacturerForm, manufacturer_id: e.target.value })}
              placeholder="e.g. 706"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Manufacturer Brand Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={manufacturerForm.brand_name}
              onChange={(e) => setManufacturerForm({ ...manufacturerForm, brand_name: e.target.value })}
              placeholder="e.g. Zydus Lifesciences Ltd"
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
                value={manufacturerForm.city}
                onChange={(e) => setManufacturerForm({ ...manufacturerForm, city: e.target.value })}
                placeholder="e.g. Ahmedabad"
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
                value={manufacturerForm.state}
                onChange={(e) => setManufacturerForm({ ...manufacturerForm, state: e.target.value })}
                placeholder="e.g. Gujarat"
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
              value={manufacturerForm.street}
              onChange={(e) => setManufacturerForm({ ...manufacturerForm, street: e.target.value })}
              placeholder="e.g. Zydus Corporate Park, SG Highway"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddManufacturerOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving to Oracle...' : 'Save Manufacturer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Manufacturer */}
      <Modal
        isOpen={isEditManufacturerOpen}
        onClose={() => setIsEditManufacturerOpen(false)}
        title={`Edit Manufacturer #${manufacturerForm.manufacturer_id}`}
      >
        <form onSubmit={handleEditManufacturerSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Manufacturer Brand Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={manufacturerForm.brand_name}
              onChange={(e) => setManufacturerForm({ ...manufacturerForm, brand_name: e.target.value })}
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
                value={manufacturerForm.city}
                onChange={(e) => setManufacturerForm({ ...manufacturerForm, city: e.target.value })}
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
                value={manufacturerForm.state}
                onChange={(e) => setManufacturerForm({ ...manufacturerForm, state: e.target.value })}
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
              value={manufacturerForm.street}
              onChange={(e) => setManufacturerForm({ ...manufacturerForm, street: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditManufacturerOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating in Oracle...' : 'Update Manufacturer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODALS: WHOLESALE SUPPLIER ================= */}
      <Modal
        isOpen={isAddWholesaleOpen}
        onClose={() => setIsAddWholesaleOpen(false)}
        title="Register Wholesale Supplier (GST)"
      >
        <form onSubmit={handleCreateWholesaleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              GST Number (Primary Key) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={wholesaleForm.gst_no}
              onChange={(e) => setWholesaleForm({ ...wholesaleForm, gst_no: e.target.value })}
              placeholder="e.g. 29AAACK9999P1Z1"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 uppercase focus:outline-none focus:border-blue-500"
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
                value={wholesaleForm.city}
                onChange={(e) => setWholesaleForm({ ...wholesaleForm, city: e.target.value })}
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
                value={wholesaleForm.state}
                onChange={(e) => setWholesaleForm({ ...wholesaleForm, state: e.target.value })}
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
              value={wholesaleForm.street}
              onChange={(e) => setWholesaleForm({ ...wholesaleForm, street: e.target.value })}
              placeholder="e.g. Wholesale Depot 12, Whitefield"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddWholesaleOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving to Oracle...' : 'Save Wholesale Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Wholesale Supplier */}
      <Modal
        isOpen={isEditWholesaleOpen}
        onClose={() => setIsEditWholesaleOpen(false)}
        title={`Edit Wholesale Supplier GST "${wholesaleForm.gst_no}"`}
      >
        <form onSubmit={handleEditWholesaleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={wholesaleForm.city}
                onChange={(e) => setWholesaleForm({ ...wholesaleForm, city: e.target.value })}
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
                value={wholesaleForm.state}
                onChange={(e) => setWholesaleForm({ ...wholesaleForm, state: e.target.value })}
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
              value={wholesaleForm.street}
              onChange={(e) => setWholesaleForm({ ...wholesaleForm, street: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditWholesaleOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating in Oracle...' : 'Update Wholesale Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
