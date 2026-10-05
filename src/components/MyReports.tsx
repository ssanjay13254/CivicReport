import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  X,
  Sparkles,
  Camera,
  ArrowUpRight
} from 'lucide-react';
import { IncidentReport, IncidentStatus, AuthUser } from '../types';
import { CATEGORY_DETAILS } from '../data/mockIncidents';

interface MyReportsProps {
  incidents: IncidentReport[];
  currentUser: AuthUser;
  onFileNewReport: () => void;
  onViewOnAdminMap?: (ticket: IncidentReport) => void;
}

export const MyReports: React.FC<MyReportsProps> = ({
  incidents,
  currentUser,
  onFileNewReport,
  onViewOnAdminMap
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [scopeFilter, setScopeFilter] = useState<'my' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);

  // Filter reports
  const filteredReports = useMemo(() => {
    return incidents.filter((item) => {
      // Scope filter:
      if (scopeFilter === 'my') {
        const isAuthor =
          (item.reporterId && item.reporterId === currentUser.id) ||
          (item.reporterName &&
            currentUser.name &&
            item.reporterName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
          (item.reporterContact &&
            currentUser.badgeOrPhone &&
            item.reporterContact === currentUser.badgeOrPhone);

        // If no strict author matches, show all for demonstration if user is anonymous or hasn't filed yet
        if (!isAuthor && incidents.filter((i) => i.reporterId === currentUser.id).length > 0) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.id.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.address && item.address.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [incidents, currentUser, scopeFilter, statusFilter, searchQuery]);

  // Statistics for user
  const userReports = incidents.filter(
    (i) =>
      i.reporterId === currentUser.id ||
      (i.reporterName && i.reporterName.toLowerCase().includes(currentUser.name.toLowerCase()))
  );
  const totalUserReports = userReports.length > 0 ? userReports.length : incidents.length;
  const pendingCount = (userReports.length > 0 ? userReports : incidents).filter(
    (i) => i.status === 'Pending'
  ).length;
  const inProgressCount = (userReports.length > 0 ? userReports : incidents).filter(
    (i) => i.status === 'In Progress'
  ).length;
  const resolvedCount = (userReports.length > 0 ? userReports : incidents).filter(
    (i) => i.status === 'Resolved'
  ).length;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                My Incident Reports
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Track live municipal progress, assigned response teams, and resolution verification for your tickets.
            </p>
          </div>

          <button
            onClick={onFileNewReport}
            className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-lg shadow-blue-600/25 flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Issue</span>
          </button>
        </div>

        {/* Quick Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Reports</span>
            <span className="text-lg font-black text-white">{totalUserReports}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Under Triage</span>
            <span className="text-lg font-black text-rose-400">{pendingCount}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Crew Dispatched</span>
            <span className="text-lg font-black text-amber-400">{inProgressCount}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Resolved</span>
            <span className="text-lg font-black text-emerald-400">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        
        {/* Scope Toggle (My Reports vs All Area Reports) */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            onClick={() => setScopeFilter('my')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              scopeFilter === 'my'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Reports ({userReports.length})
          </button>
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              scopeFilter === 'all'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Ward Incidents ({incidents.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by ticket ID or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">🔴 Pending Triage</option>
          <option value="In Progress">🟡 In Progress</option>
          <option value="Resolved">🟢 Resolved</option>
        </select>

      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-200">No Reports Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {scopeFilter === 'my'
                  ? "You haven't filed any civic incident reports matching these filters yet."
                  : 'No public reports match your current search criteria.'}
              </p>
            </div>
            <button
              onClick={onFileNewReport}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/25"
            >
              Report a Civic Issue
            </button>
          </div>
        ) : (
          filteredReports.map((report) => {
            const catDetails = CATEGORY_DETAILS[report.category];
            const isResolved = report.status === 'Resolved';
            const isInProgress = report.status === 'In Progress';
            const isPending = report.status === 'Pending';

            return (
              <div
                key={report.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl hover:border-slate-700 transition space-y-4"
              >
                
                {/* Top Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                      {report.id}
                    </span>
                    <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>{catDetails?.icon || '⚠️'}</span>
                      <span>{report.category}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        report.priority === 'Urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : report.priority === 'High'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {report.priority}
                    </span>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                        isPending
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isInProgress
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isPending
                            ? 'bg-rose-400 animate-ping'
                            : isInProgress
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-emerald-400'
                        }`}
                      />
                      {report.status}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper Timeline */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4">
                  <div className="grid grid-cols-3 gap-2 text-center relative">
                    
                    {/* Step 1: Logged */}
                    <div className="space-y-1">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-md shadow-blue-600/30">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 block">Report Filed</span>
                      <span className="text-[10px] text-slate-500 block">{report.date}</span>
                    </div>

                    {/* Step 2: Dispatched */}
                    <div className="space-y-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                          isInProgress || isResolved
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isInProgress || isResolved ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <span>2</span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold block ${
                          isInProgress || isResolved ? 'text-amber-300' : 'text-slate-500'
                        }`}
                      >
                        Crew Dispatched
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {report.assignedTo}
                      </span>
                    </div>

                    {/* Step 3: Resolved */}
                    <div className="space-y-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                          isResolved
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isResolved ? <CheckCircle2 className="w-4 h-4" /> : <span>3</span>}
                      </div>
                      <span
                        className={`text-[11px] font-bold block ${
                          isResolved ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        Work Verified
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isResolved ? 'Issue Closed' : 'Pending Verification'}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Content Details: Image & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                  <div
                    onClick={() => setSelectedReport(report)}
                    className="cursor-pointer group relative rounded-2xl overflow-hidden border border-slate-800 h-32 w-full bg-slate-950"
                  >
                    <img
                      src={report.photoUrl}
                      alt={report.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Camera className="w-4 h-4" />
                      <span>View Full Photo</span>
                    </div>
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80">
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="font-medium truncate max-w-sm">{report.address}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          Assigned: <strong className="text-blue-400">{report.assignedTo}</strong>
                        </span>
                        {onViewOnAdminMap && (
                          <button
                            onClick={() => onViewOnAdminMap(report)}
                            className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition"
                          >
                            <span>Inspect on GIS</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Latest update note */}
                    {report.updates && report.updates.length > 0 && (
                      <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-2.5 text-[11px] text-slate-400 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                        <div>
                          <strong className="text-slate-200">Latest Activity:</strong>{' '}
                          {report.updates[0].action}
                          <span className="text-slate-500 ml-1.5">
                            ({report.updates[0].timestamp} by {report.updates[0].actor})
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Photo Enlarge Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-blue-400 font-mono">
                {selectedReport.id} - Photo Proof
              </span>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={selectedReport.photoUrl}
              alt="Evidence"
              className="w-full h-64 object-cover rounded-2xl border border-slate-800"
            />
            <div className="text-xs text-slate-400">
              <strong className="text-slate-200 block mb-1">
                {selectedReport.category}
              </strong>
              <p>{selectedReport.address}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
