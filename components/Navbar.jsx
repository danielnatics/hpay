import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";

const Navbar = ({ connectStatus, onReconnect, role }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed: " + error.message);
    } else {
      toast.success("Logged out successfully");
      navigate("/"); // Redirect to landing page
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 hidden w-full border-b border-white/10 bg-[#07111f]/90 p-2 text-white shadow-xl shadow-black/10 backdrop-blur-xl md:flex">
        <div className="w-full px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 p-2 shadow-lg shadow-blue-500/20">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight">
                HPAY
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                  {role || "Guest"}
                </span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden items-center space-x-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1 md:flex">
              <Link
                to="/"
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Home
              </Link>
              {role === "admin" && (
                <>
                  <Link
                    to="/admin"
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-cyan-300"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium hover:text-emerald-300 transition-colors"
                  >
                    Register
                  </Link>
                  <Link
                    to="/studentLists"
                    className="text-sm font-medium hover:text-emerald-300 transition-colors"
                  >
                    Student List
                  </Link>
                  <Link
                    to="/transactions"
                    className="text-sm font-medium hover:text-emerald-300 transition-colors"
                  >
                    Logs
                  </Link>
                  <Link
                    to="/attendance"
                    className="text-sm font-medium hover:text-emerald-300 transition-colors"
                  >
                    Attendance
                  </Link>
                </>
              )}
              {role === "parent" && (
                <Link
                  to="/portal"
                  className="text-sm font-medium hover:text-emerald-300 transition-colors"
                >
                  My Children
                </Link>
              )}
              {/* <Link
                to="/register"
                className="text-sm font-medium hover:text-indigo-400"
              >
                Register
              </Link>
              <Link
                to="/studentLists"
                className="text-sm font-medium hover:text-indigo-400"
              >
                Student List
              </Link>
              <Link
                to="/parentPortal"
                className="text-sm font-medium hover:text-indigo-400"
              >
                Parents Portal
              </Link> */}
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-3">
              <button
                onClick={onReconnect} // Trigger the reconnect function
                disabled={connectStatus === "Connected"} // Disable if already online
                className="group flex cursor-pointer flex-col items-end transition-opacity hover:opacity-80 disabled:cursor-default"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-cyan-300">
                  {connectStatus === "Connected"
                    ? "System Live"
                    : "Click to Reconnect"}
                </span>

                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        connectStatus === "Connected"
                          ? "bg-green-400"
                          : "bg-red-400"
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        connectStatus === "Connected"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      connectStatus === "Connected"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {connectStatus}
                  </span>
                </div>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
