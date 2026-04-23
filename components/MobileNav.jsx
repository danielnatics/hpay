import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const MobileNav = ({role}) => {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Listen for auth changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- THE FIX: If no user is logged in, return nothing ---
  if (!session) return null;
  const isAdmin = role === 'admin';
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-emerald-950/90 backdrop-blur-lg border border-emerald-800 rounded-2xl px-6 py-2 shadow-2xl flex justify-between items-center">
        {/* Home */}
        <NavLink to="/" icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" label="Home" active={isActive('/')} />
        {/* <Link to="/" className="flex flex-col items-center gap-1">
          <div className={`p-2 rounded-xl transition-all ${isActive('/') ? 'bg-emerald-500 text-white' : 'text-emerald-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-emerald-100/50 uppercase tracking-tighter">Home</span>
        </Link>
 */}
        {isAdmin && (
          <>
          
          <NavLink to="/register" icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" label="Reg" active={isActive('/register')} />
          <NavLink to="/studentLists" icon="M4 6h16M4 10h16M4 14h16M4 18h16" label="List" active={isActive('/list')} />
          </>
        )}
        

        {/* Parent Portal */}
        <NavLink to="/transactions" icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" label="Logs" active={isActive('/transactions')} />
        {/* NEW: Settings / Sign Out */}
        <NavLink to="/settings" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" label="Set" active={isActive('/settings')} />

      </div>
    </nav>
  );
};
// Helper component to keep the code clean
const NavLink = ({ to, icon, label, active }) => (
  <Link to={to} className="flex flex-col items-center gap-1">
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-emerald-500 text-white' : 'text-emerald-400'}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
      </svg>
    </div>
    <span className="text-[10px] font-bold text-emerald-100/50 uppercase tracking-tighter">{label}</span>
  </Link>
);
export default MobileNav;