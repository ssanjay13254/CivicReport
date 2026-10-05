import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { IncidentReport } from '../types';

interface StatsBarProps {
  incidents: IncidentReport[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ incidents }) => {
  const total = incidents.length;
  const pending = incidents.filter((i) => i.status === 'Pending').length;
  const inProgress = incidents.filter((i) => i.status === 'In Progress').length;
  const resolved = incidents.filter((i) => i.status === 'Resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      
      {/* Total Incidents */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Total Tickets
          </span>
          <span className="text-xl font-black text-white">{total}</span>
        </div>
      </div>

      {/* Pending Triage */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Pending Triage
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-rose-400">{pending}</span>
            {pending > 0 && (
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded">
                Action Req.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* In Progress */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            In Progress
          </span>
          <span className="text-xl font-black text-amber-400">{inProgress}</span>
        </div>
      </div>

      {/* Resolved Rate */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Resolved ({resolutionRate}%)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-emerald-400">{resolved}</span>
            <span className="text-[10px] text-slate-400">closed</span>
          </div>
        </div>
      </div>

    </div>
  );
};
