import React from 'react';
import { ShieldAlert, User, ShieldCheck, LogOut, PlusCircle, FileText } from 'lucide-react';
import { UserRole, AuthUser } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeCitizenView: 'report' | 'my-reports';
  onCitizenViewChange: (view: 'report' | 'my-reports') => void;
  myReportsCount: number;
  pendingCount: number;
  totalCount: number;
  isMapLoaded: boolean;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeCitizenView,
  onCitizenViewChange,
  myReportsCount,
  pendingCount,
  totalCount,
  isMapLoaded,
  currentUser,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">CivicReport</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                GIS City Portal
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Rapid Smart City Incident Resolution Grid
            </p>
          </div>
        </div>

        {/* Center: Citizen Sub-Navigation (Report vs My Reports) */}
        {currentRole === 'citizen' && (
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
            <button
              id="nav-report-issue-btn"
              onClick={() => onCitizenViewChange('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCitizenView === 'report'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
            <button
              id="nav-my-reports-btn"
              onClick={() => onCitizenViewChange('my-reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCitizenView === 'my-reports'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>My Reports</span>
              {myReportsCount > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeCitizenView === 'my-reports'
                      ? 'bg-white text-blue-700'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {myReportsCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Status indicator & User Session */}
        <div className="flex items-center gap-3">
          
          <div className="hidden xl:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isMapLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-medium">
              {isMapLoaded ? 'Google Maps Live' : 'Connecting Maps...'}
            </span>
          </div>

          {/* User Profile Pill */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[11px] ${
                  currentUser.role === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'
                }`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="font-bold text-slate-200 block text-[11px] leading-tight max-w-[110px] truncate">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase ${
                    currentUser.role === 'admin' ? 'text-indigo-400' : 'text-blue-400'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Ward Authority' : 'Citizen'}
                </span>
              </div>
            </div>
          )}

          {/* Role Switcher Pill */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl shadow-inner">
            <button
              id="citizen-tab-btn"
              onClick={() => onRoleChange('citizen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'citizen'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Citizen</span>
            </button>
            <button
              id="admin-tab-btn"
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Authority</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            title="Switch User / Sign Out"
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};
