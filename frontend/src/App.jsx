import React, { useEffect, useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PatientsPage from './pages/PatientsPage';
import MedicinesPage from './pages/MedicinesPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import DoctorsPage from './pages/DoctorsPage';
import HospitalsPage from './pages/HospitalsPage';
import PharmaciesPage from './pages/PharmaciesPage';
import BillingPage from './pages/BillingPage';
import SuppliersPage from './pages/SuppliersPage';
import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    patientsCount: 10,
    medicinesCount: 12,
    prescriptionsCount: 12,
    doctorsCount: 8,
    hospitalsCount: 3,
    pharmaciesCount: 3,
    billsCount: 12,
    suppliersCount: 5,
    ordersCount: 12,
  });

  const fetchGlobalStats = useCallback(async () => {
    try {
      const [patients, medicines, prescriptions, doctors, hospitals, pharmacies, bills, suppliers, orders] = await Promise.all([
        api.get('/patients'),
        api.get('/medicines'),
        api.get('/prescriptions'),
        api.get('/doctors'),
        api.get('/hospitals'),
        api.get('/pharmacies'),
        api.get('/bills'),
        api.get('/suppliers'),
        api.get('/medicine-orders'),
      ]);
      setStats({
        patientsCount: patients.length,
        medicinesCount: medicines.length,
        prescriptionsCount: prescriptions.length,
        doctorsCount: doctors.length,
        hospitalsCount: hospitals.length,
        pharmaciesCount: pharmacies.length,
        billsCount: bills.length,
        suppliersCount: suppliers.length,
        ordersCount: orders.length,
      });
    } catch {
      // Graceful fallback if offline
    }
  }, []);

  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            onSelectModule={(moduleId) => setActiveTab(moduleId)}
          />
        )}

        {activeTab === 'patients' && (
          <PatientsPage
            onBackToDashboard={() => setActiveTab('dashboard')}
            onPatientCountChange={(count) => setStats((prev) => ({ ...prev, patientsCount: count }))}
          />
        )}

        {activeTab === 'medicines' && (
          <MedicinesPage
            onBackToDashboard={() => setActiveTab('dashboard')}
            onMedicineCountChange={(count) => setStats((prev) => ({ ...prev, medicinesCount: count }))}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionsPage
            onBackToDashboard={() => setActiveTab('dashboard')}
            onPrescriptionCountChange={(count) => setStats((prev) => ({ ...prev, prescriptionsCount: count }))}
          />
        )}

        {activeTab === 'doctors' && (
          <DoctorsPage
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'hospitals' && (
          <HospitalsPage
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'pharmacies' && (
          <PharmaciesPage
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'billing' && (
          <BillingPage
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersPage
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4.5 text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Prescription Tracking System &bull; Database Management Systems (DBMS)</span>
          <span className="font-mono text-slate-400">Oracle Database 21c XE &bull; FastAPI &bull; React Vite</span>
        </div>
      </footer>
    </div>
  );
}
