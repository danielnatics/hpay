import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Settings = ({role}) => {
    const [userEmail, setUserEmail] = useState("Loading...");
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      // Get the current user from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Clear local storage and redirect to login
      navigate('/login');
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen pb-24">
      <div className="max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-emerald-900">Settings</h1>
          <p className="text-slate-500 font-medium">System configuration & account</p>
        </header>

        {/* Admin Profile Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-2xl font-bold">
             {userEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Daniel</h2>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{role}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <SettingItem icon="📧" title="Email" value={userEmail} />
            <SettingItem icon="🏢" title="Business" value="HezTec HPay" />
          </div>
        </section>

        {/* System Info Section */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm mb-8">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">System Information</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Firmware Version</span>
              <span className="font-mono font-bold text-slate-800">v1.0.4-stable</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Database Status</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-white text-red-600 font-black rounded-2xl border-2 border-red-50 hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          LOGOUT SYSTEM
        </button>

        {/* <footer className="mt-10 text-center">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
            Developed by HezTec Engineering
          </p>
        </footer> */}
      </div>
    </div>
  );
};

// Reusable Small Item Component
const SettingItem = ({ icon, title, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-slate-500">{title}</span>
    </div>
    <span className="text-sm font-bold text-slate-800">{value}</span>
  </div>
);

export default Settings;