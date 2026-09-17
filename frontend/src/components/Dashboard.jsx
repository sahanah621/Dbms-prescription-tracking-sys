import React from 'react';
import {
  Users,
  Pill,
  FileText,
  Stethoscope,
  Building2,
  Receipt,
  Truck,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';

export default function Dashboard({ stats, onSelectModule }) {
  const activeModules = [
    {
      id: 'patients',
      title: 'Patients Management',
      tableName: 'PATIENT, PATIENT_CONTACT',
      description: 'Register patients, update demographic records, view clinical histories, and manage multiple phone contacts.',
      icon: Users,
      count: `${stats.patientsCount || 10} Records`,
      badgeColor: 'bg-blue-950/80 text-blue-400 border-blue-800/80',
    },
    {
      id: 'medicines',
      title: 'Medicine Inventory',
      tableName: 'MEDICINE',
      description: 'Catalog drug formulations, set pricing, adjust inventory stock levels, and monitor batch expirations.',
      icon: Pill,
      count: `${stats.medicinesCount || 12} Drugs`,
      badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80',
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions & Regimens',
      tableName: 'PRESCRIPTION, PRESCRIPTION_ITEM',
      description: 'Issue doctor prescriptions, configure multi-item dosage schedules, and preview total estimated costs.',
      icon: FileText,
      count: `${stats.prescriptionsCount || 12} Issued Rx`,
      badgeColor: 'bg-violet-950/80 text-violet-400 border-violet-800/80',
    },
    {
      id: 'doctors',
      title: 'Doctors & Specialists',
      tableName: 'DOCTOR',
      description: 'Manage clinical doctors, medical qualifications, hospital affiliations, and years of experience.',
      icon: Stethoscope,
      count: `${stats.doctorsCount || 8} Doctors`,
      badgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80',
    },
    {
      id: 'hospitals',
      title: 'Hospitals & Clinics',
      tableName: 'HOSPITAL',
      description: 'Medical facilities directory linked to regional branches, addresses, and affiliated dispensaries.',
      icon: Building2,
      count: `${stats.hospitalsCount || 3} Facilities`,
      badgeColor: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/80',
    },
    {
      id: 'pharmacies',
      title: 'Pharmacies & Staff',
      tableName: 'PHARMACY, PHARMACIST',
      description: 'Dispensary network branches, customer ratings, and pharmacist duty shift rosters.',
      icon: Building2,
      count: `${stats.pharmaciesCount || 3} Dispensaries`,
      badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-800/80',
    },
    {
      id: 'billing',
      title: 'Billing & Invoicing',
      tableName: 'BILL',
      description: 'Patient billing statements, payment tracking, and automated calculation via Oracle PL/SQL function.',
      icon: Receipt,
      count: `${stats.billsCount || 12} Invoices`,
      badgeColor: 'bg-rose-950/80 text-rose-400 border-rose-800/80',
    },
    {
      id: 'suppliers',
      title: 'Suppliers & Supply Chain',
      tableName: 'SUPPLIER, MANUFACTURER, WHOLESALE, ORDERS',
      description: 'Pharmaceutical vendors, brand manufacturers, wholesale GST registry, and purchase restock orders.',
      icon: Truck,
      count: `${stats.suppliersCount || 5} Suppliers`,
      badgeColor: 'bg-teal-950/80 text-teal-400 border-teal-800/80',
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-semibold">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Oracle Database 21c XE &bull; Container: XEPDB1 &bull; Schema: PDBADMIN</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Prescription Tracking System
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Centralized clinical DBMS management portal. Select any module below to inspect live records,
            issue new entries, modify clinical details, or delete records directly in the Oracle database.
          </p>
        </div>

        {/* Subtle Background Glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-72 h-72 bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Active Modules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Clinical & Administrative Modules</h3>
            <p className="text-xs text-slate-400">Connected to FastAPI REST backend with real-time Oracle 21c CRUD</p>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> 8 Modules &bull; 17 Tables Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeModules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className="group bg-slate-900/90 hover:bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-200 border border-slate-700/60">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${m.badgeColor}`}>
                      {m.count}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {m.title}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate" title={m.tableName}>
                      {m.tableName}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-2">
                      {m.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
                  <span>Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
