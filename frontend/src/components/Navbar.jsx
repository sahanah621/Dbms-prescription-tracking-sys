import React, { useEffect, useState, useCallback } from 'react';
import {
  Pill,
  Users,
  FileText,
  Activity,
  XCircle,
  LayoutDashboard,
  Stethoscope,
  Building2,
  Receipt,
  Truck,
} from 'lucide-react';
import { api } from '../api/client';

export default function Navbar({ activeTab, setActiveTab }) {
  const [dbStatus, setDbStatus] = useState({ connected: false, loading: true });

  const checkHealth = useCallback(async () => {
    try {
      const data = await api.get('/health');
      setDbStatus({
        connected: data.database?.connected || false,
        container: data.database?.container || 'XEPDB1',
        version: data.database?.oracle_version || '21c',
        loading: false,
      });
    } catch {
      setDbStatus({ connected: false, loading: false });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'medicines', label: 'Medicines', icon: Pill },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'hospitals', label: 'Hospitals', icon: Building2 },
    { id: 'pharmacies', label: 'Pharmacies', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
  ];

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Branding - Clicking returns to Dashboard */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:bg-blue-500 transition-colors">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                  Prescription Tracking System
                </h1>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  DBMS Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Clinical Workflow & Inventory Management
              </p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shadow-inner overflow-x-auto gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile/Compact Module Dropdown (for md and smaller screens) */}
          <div className="flex lg:hidden items-center">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Oracle Status Badge */}
          <div className="flex items-center shrink-0">
            {dbStatus.loading ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></div>
                <span>Checking DB...</span>
              </div>
            ) : dbStatus.connected ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">Oracle:</span>
                <span className="font-mono font-bold text-emerald-300">{dbStatus.container}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-950/70 border border-red-800/60 text-red-400 text-xs font-semibold">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">DB Disconnected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
