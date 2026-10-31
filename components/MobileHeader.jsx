import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";


const MobileHeader = ({ connectStatus, onReconnect, role }) => {
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

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

  if (!session) return null;

  const isAdmin = role === "admin";
  const links = isAdmin
    ? [
        ["Dashboard", "/admin"],
        ["Register Student", "/register"],
        ["Student List", "/studentLists"],
        ["Transactions", "/transactions"],
        ["Attendance", "/attendance"],
        ["Settings", "/settings"],
      ]
    : [
        ["My Wallet", "/portal"],
        ["Settings", "/settings"],
      ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed: " + error.message);
      return;
    }
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/95 text-white shadow-xl shadow-black/10 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
            <span className="text-sm font-black text-white">H</span>
          </div>
          <div>
            <span className="block font-black tracking-tight text-white">HPAY</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300">
              {role || "Guest"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReconnect}
            disabled={connectStatus === "Connected"}
            className={`h-2.5 w-2.5 rounded-full ${
              connectStatus === "Connected" ? "bg-emerald-400" : "bg-rose-400"
            }`}
            aria-label={`Connection status: ${connectStatus}`}
          />
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-white/10 bg-[#0d1526] px-4 pb-4 pt-2">
          {links.map(([label, path]) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-cyan-300"
            >
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded-xl border border-rose-400/20 px-4 py-3 text-left text-sm font-bold text-rose-300 transition hover:bg-rose-500/10"
          >
            Sign Out
          </button>
        </nav>
      )}
    </header>
  );
};
export default MobileHeader;
