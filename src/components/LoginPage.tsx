import React, { useState } from 'react';
import {
  ShieldAlert,
  User,
  ShieldCheck,
  Building2,
  Phone,
  Lock,
  ArrowRight,
  BadgeAlert,
  CheckCircle2,
  Sparkles,
  MapPin
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');

  // Citizen Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenContact, setCitizenContact] = useState('');
  const [citizenWard, setCitizenWard] = useState('Ward 24 - Central Peelamedu');

  // Authority Form State
  const [officerName, setOfficerName] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [department, setDepartment] = useState('Central Ward Operations & GIS Command');
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle Citizen Login
  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = citizenName.trim() || 'Civic Citizen';
    const contact = citizenContact.trim() || '+91 98765 01234';

    const user: AuthUser = {
      id: `CITIZEN-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      role: 'citizen',
      badgeOrPhone: contact,
      ward: citizenWard
    };

    onLogin(user);
  };

  // Handle Authority Login
  const handleAuthoritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const name = officerName.trim() || 'Officer R. Sharma';
    const badge = badgeId.trim() || 'WARD-24-ADM';

    // Simple validation
    if (passcode.trim() && passcode.trim() !== 'admin123' && passcode.trim() !== '1234') {
      setAuthError('Invalid Access Code. (Use "admin123" or click Quick Demo Login below)');
      return;
    }

    const user: AuthUser = {
      id: badge,
      name,
      role: 'admin',
      badgeOrPhone: badge,
      department,
      ward: 'Ward Sector 24-B'
    };

    onLogin(user);
  };

  // Quick Demo Logins
  const handleQuickCitizenLogin = () => {
    onLogin({
      id: 'CIT-7842',
      name: 'Kavitha Ramaswamy',
      role: 'citizen',
      badgeOrPhone: '+91 98402 11983',
      ward: 'Ward 24 - Central Peelamedu'
    });
  };

  const handleQuickAuthorityLogin = () => {
    onLogin({
      id: 'OFFICER-W24-01',
      name: 'Er. Rajesh Kumar',
      role: 'admin',
      badgeOrPhone: 'WARD24-EXECUTIVE',
      department: 'Central Ward Operations & GIS Command',
      ward: 'Ward Sector 24-B'
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0b0f19] text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* Brand Header */}
      <div className="max-w-md w-full text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 border border-blue-400/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            CivicReport
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">
            Smart City Incident Resolution Portal
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            Please identify your role to access the public incident reporting stream or the municipal GIS operations dashboard.
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Role Selector Tabs */}
        <div className="p-1 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('citizen');
              setAuthError(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              selectedRole === 'citizen'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Citizen Reporter</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setAuthError(null);
            }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              selectedRole === 'admin'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ward Authority</span>
          </button>
        </div>

        {/* Form Content: Citizen Mode */}
        {selectedRole === 'citizen' ? (
          <form onSubmit={handleCitizenSubmit} className="space-y-4">
            
            <div className="bg-blue-950/30 border border-blue-900/50 rounded-2xl p-3 text-xs text-blue-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Report local civic issues (potholes, garbage, lights, leaks) directly to ward authorities on Google Maps.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., Priya Nair"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-blue-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Mobile Number (for SMS & Resolution Alerts)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g., +91 98765 43210"
                  value={citizenContact}
                  onChange={(e) => setCitizenContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-blue-500"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Locality / Ward
              </label>
              <div className="relative">
                <select
                  value={citizenWard}
                  onChange={(e) => setCitizenWard(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="Ward 24 - Central Peelamedu">Ward 24 - Central Peelamedu</option>
                  <option value="Ward 25 - Hope College East">Ward 25 - Hope College East</option>
                  <option value="Ward 18 - Gandhipuram North">Ward 18 - Gandhipuram North</option>
                  <option value="Ward 12 - Race Course District">Ward 12 - Race Course District</option>
                </select>
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold tracking-wide transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <span>Enter as Citizen Reporter</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase">or instant demo</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              type="button"
              onClick={handleQuickCitizenLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>1-Click Citizen Demo Login</span>
            </button>

          </form>
        ) : (
          /* Form Content: Authority / Ward Admin Mode */
          <form onSubmit={handleAuthoritySubmit} className="space-y-4">
            
            <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-3 text-xs text-indigo-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Authorized municipal personnel portal for GIS dispatch, ticket triage, and field team deployment.
              </span>
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Officer / Authority Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., Er. Rajesh Kumar"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-indigo-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Badge / Officer ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., WARD-24-ADM"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-3 uppercase focus:outline-none focus:border-indigo-500 font-mono"
                />
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Department Division
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-3 focus:outline-none focus:border-indigo-500"
              >
                <option value="Central Ward Operations & GIS Command">
                  Central Ward Operations & GIS Command
                </option>
                <option value="Road Works Division 3">Road Works Division 3</option>
                <option value="Sanitation Squad B">Sanitation Squad B</option>
                <option value="Electrical Division 1">Electrical Division 1</option>
                <option value="Water Works & Sewerage Board">Water Works & Sewerage Board</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Access PIN / Passcode
                </label>
                <span className="text-[10px] text-indigo-400 font-medium">Demo: admin123</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-3 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold tracking-wide transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              <span>Authorize & Access GIS Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-bold uppercase">or instant demo</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              type="button"
              onClick={handleQuickAuthorityLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>1-Click Ward Authority Demo Login</span>
            </button>

          </form>
        )}

      </div>

      {/* Security Disclaimer footer */}
      <div className="mt-8 text-center text-[11px] text-slate-500 max-w-sm">
        <p>
          Official Municipal GIS Incident Resolution Framework • Integrated with Google Maps Platform API
        </p>
      </div>

    </div>
  );
};
