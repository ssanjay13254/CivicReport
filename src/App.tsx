/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { CitizenReportForm } from './components/CitizenReportForm';
import { AdminDashboard } from './components/AdminDashboard';
import { MyReports } from './components/MyReports';
import { LoginPage } from './components/LoginPage';
import { IncidentReport, UserRole, IncidentStatus, AuthUser } from './types';
import { INITIAL_INCIDENTS } from './data/mockIncidents';
import { loadGoogleMaps, DEFAULT_MAPS_KEY } from './services/googleMaps';
import { ShieldCheck, MapPin, CheckCircle2, FileText, PlusCircle } from 'lucide-react';

const STORAGE_KEY = 'civic_report_incidents_v2';
const AUTH_STORAGE_KEY = 'civic_report_auth_user_v1';

const DEFAULT_CITIZEN_USER: AuthUser = {
  id: 'CIT-7842',
  name: 'Kavitha Ramaswamy',
  role: 'citizen',
  badgeOrPhone: '+91 98402 11983',
  ward: 'Ward 24 - Central Peelamedu'
};

const DEFAULT_AUTHORITY_USER: AuthUser = {
  id: 'OFFICER-W24-01',
  name: 'Er. Rajesh Kumar',
  role: 'admin',
  badgeOrPhone: 'WARD24-EXECUTIVE',
  department: 'Central Ward Operations & GIS Command',
  ward: 'Ward Sector 24-B'
};

export default function App() {
  // Current authenticated user session (defaults to Citizen for immediate access)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth) {
        return JSON.parse(savedAuth);
      }
    } catch {
      // LocalStorage access error
    }
    return DEFAULT_CITIZEN_USER;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(
    currentUser?.role || 'citizen'
  );

  // Active view for citizen role: 'report' or 'my-reports'
  const [activeCitizenView, setActiveCitizenView] = useState<'report' | 'my-reports'>('report');

  const [incidents, setIncidents] = useState<IncidentReport[]>(() => {
    try {
      // Clear legacy storage with previous mock reports
      localStorage.removeItem('civic_report_incidents_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // LocalStorage access error
    }
    return INITIAL_INCIDENTS;
  });

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize role change with user persona
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'admin' && currentUser?.role !== 'admin') {
      setCurrentUser(DEFAULT_AUTHORITY_USER);
      showToast('Switched to Ward Operations Authority Console');
    } else if (newRole === 'citizen' && currentUser?.role !== 'citizen') {
      setCurrentUser(DEFAULT_CITIZEN_USER);
      showToast('Switched to Citizen Incident Reporting Portal');
    }
  };

  // Sync session to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
        setCurrentRole(currentUser.role);
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save auth state to localStorage:', e);
    }
  }, [currentUser]);

  // Sync incidents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    } catch (e) {
      console.warn('Failed to save incidents to localStorage:', e);
    }
  }, [incidents]);

  // Check Google Maps SDK loading on mount
  useEffect(() => {
    loadGoogleMaps()
      .then(() => setIsMapLoaded(true))
      .catch((err) => {
        console.warn('Google Maps auto-loader note:', err);
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Login handler
  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setActiveCitizenView('report');
    showToast(`Welcome, ${user.name}! Logged in as ${user.role === 'admin' ? 'Ward Authority' : 'Citizen Reporter'}.`);
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Signed out of CivicReport portal.');
  };

  // Add new incident report
  const handleReportSubmitted = (newReport: IncidentReport) => {
    setIncidents((prev) => [newReport, ...prev]);
    showToast(`Ticket ${newReport.id} registered on Google Maps GIS grid!`);
  };

  // Update status (from Admin)
  const handleUpdateStatus = (id: string, newStatus: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const now = new Date();
          const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}`;
          const newUpdate = {
            timestamp,
            action: `Status marked as "${newStatus}"`,
            actor: currentUser?.name || 'Ward Operations Admin'
          };
          return {
            ...item,
            status: newStatus,
            updates: [newUpdate, ...(item.updates || [])]
          };
        }
        return item;
      })
    );
    showToast(`Ticket ${id} status updated to "${newStatus}"`);
  };

  // Update assigned municipal department
  const handleUpdateAssignee = (id: string, newAssignee: string) => {
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const now = new Date();
          const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}`;
          const newUpdate = {
            timestamp,
            action: `Assigned unit updated to: ${newAssignee}`,
            actor: currentUser?.name || 'Dispatch Operations'
          };
          return {
            ...item,
            assignedTo: newAssignee,
            updates: [newUpdate, ...(item.updates || [])]
          };
        }
        return item;
      })
    );
    showToast(`Ticket ${id} assigned to ${newAssignee}`);
  };

  // Clear all reports handler
  const handleClearAllReports = () => {
    setIncidents([]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.removeItem('civic_report_incidents_v1');
    } catch (e) {
      console.warn('Failed to clear incident storage:', e);
    }
    showToast('All reports have been removed and the list is cleared.');
  };

  // Calculate count of reports filed by this citizen
  const myReportsCount = useMemo(() => {
    if (!currentUser) return 0;
    return incidents.filter(
      (i) =>
        i.reporterId === currentUser.id ||
        (i.reporterName &&
          currentUser.name &&
          i.reporterName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
        (i.reporterContact && currentUser.badgeOrPhone && i.reporterContact === currentUser.badgeOrPhone)
    ).length;
  }, [incidents, currentUser]);

  // If user is not logged in, show the Login Page
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const pendingCount = incidents.filter((i) => i.status === 'Pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeCitizenView={activeCitizenView}
        onCitizenViewChange={setActiveCitizenView}
        myReportsCount={myReportsCount}
        pendingCount={pendingCount}
        totalCount={incidents.length}
        isMapLoaded={isMapLoaded}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Civic Grid Header Sub-Banner */}
        <div className="border-b border-slate-800/80 bg-slate-900/40 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-300">
                {currentUser.ward || 'Coimbatore Metropolitan Ward Sector 24-B'}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                User: <strong className="text-slate-300">{currentUser.name}</strong> ({currentUser.role === 'admin' ? 'Authorized Municipal Authority' : 'Citizen Reporter'})
              </span>
            </div>

            <div className="flex items-center gap-3">
              {currentRole === 'citizen' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCitizenView(activeCitizenView === 'report' ? 'my-reports' : 'report')}
                    className="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1"
                  >
                    {activeCitizenView === 'report' ? (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Go to My Reports ({myReportsCount}) ➔</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Report New Issue ➔</span>
                      </>
                    )}
                  </button>
                  <span className="text-slate-600 hidden md:inline">|</span>
                </div>
              )}

              <button
                onClick={() =>
                  handleRoleChange(currentRole === 'citizen' ? 'admin' : 'citizen')
                }
                className="text-slate-400 hover:text-slate-200 font-semibold transition hidden sm:inline"
              >
                Switch to {currentRole === 'citizen' ? 'Ward Authority Console' : 'Citizen Portal'}
              </button>
            </div>
          </div>
        </div>

        {/* Global Stats Overview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <StatsBar incidents={incidents} />
        </div>

        {/* Active Role View */}
        {currentRole === 'citizen' ? (
          activeCitizenView === 'report' ? (
            <CitizenReportForm
              onReportSubmitted={handleReportSubmitted}
              onSwitchToAdmin={() => setCurrentRole('admin')}
              onViewMyReports={() => setActiveCitizenView('my-reports')}
              currentUser={currentUser}
            />
          ) : (
            <MyReports
              incidents={incidents}
              currentUser={currentUser}
              onFileNewReport={() => setActiveCitizenView('report')}
              onViewOnAdminMap={(ticket) => {
                setCurrentRole('admin');
              }}
            />
          )
        ) : (
          <AdminDashboard
            incidents={incidents}
            onUpdateStatus={handleUpdateStatus}
            onUpdateAssignee={handleUpdateAssignee}
            onClearAllReports={handleClearAllReports}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-blue-600/40 border border-blue-400/30 flex items-center gap-2.5 animate-bounce text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">
          CivicReport • Smart City GIS Incident Resolution Infrastructure
        </p>
        <p className="text-[11px]">
          Powered by Google Maps Platform (JavaScript API, Places, Geocoding & Marker Clustering)
        </p>
      </footer>

    </div>
  );
}
