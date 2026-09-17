import React from 'react';
import { Users, Pill, FileText, AlertTriangle } from 'lucide-react';

export default function StatsOverview({ patientsCount, medicinesCount, prescriptionsCount, lowStockCount }) {
  const stats = [
    {
      label: 'Registered Patients',
      value: patientsCount,
      subtext: 'Active clinical records',
      icon: Users,
      color: 'blue',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Medicine Inventory',
      value: medicinesCount,
      subtext: 'Catalogued formulations',
      icon: Pill,
      color: 'emerald',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'Prescriptions Issued',
      value: prescriptionsCount,
      subtext: 'Doctor authorized Rx',
      icon: FileText,
      color: 'violet',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-700',
      iconColor: 'text-violet-600',
      borderColor: 'border-violet-100',
    },
    {
      label: 'Inventory Alerts',
      value: lowStockCount,
      subtext: lowStockCount > 0 ? 'Low stock / expired items' : 'All stock healthy',
      icon: AlertTriangle,
      color: lowStockCount > 0 ? 'amber' : 'slate',
      bgLight: lowStockCount > 0 ? 'bg-amber-50' : 'bg-slate-50',
      textColor: lowStockCount > 0 ? 'text-amber-700' : 'text-slate-600',
      iconColor: lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400',
      borderColor: lowStockCount > 0 ? 'border-amber-200' : 'border-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((st, i) => {
        const Icon = st.icon;
        return (
          <div
            key={i}
            className={`bg-white rounded-2xl p-4 sm:p-5 border ${st.borderColor} shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{st.label}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{st.value}</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">{st.subtext}</p>
            </div>
            <div className={`w-11 h-11 rounded-xl ${st.bgLight} flex items-center justify-center ${st.iconColor} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
