import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = ({ adminOnly = false }) => {
  const [identifier, setIdentifier] = useState(""); // Can be email or phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const activeTab = adminOnly ? "admin" : "parent";
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let loginEmail = identifier.trim();

      // --- LOGIC: If a parent is using a phone number instead of email ---
      if (activeTab === "parent" && !identifier.includes("@")) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("phone", identifier.trim())
          .maybeSingle();

        if (profileError || !profile) {
          throw new Error("No account found with this phone number.");
        }
        loginEmail = profile.email;
      }

      // --- AUTHENTICATION ---
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;

      // --- ROLE VALIDATION ---
      const userRole = data.user.user_metadata.role || "parent";

      if (activeTab === "admin" && userRole !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Access Denied: You are not an Admin.");
      }

      // --- NAVIGATION ---
      if (userRole === "admin") navigate("/admin");
      else navigate("/portal");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070c1a] p-4 text-white">
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      <ToastContainer position="top-center" autoClose={2500} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-blue-500/20 bg-[#0d1526]/95 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />
        {/* Tab Switcher */}
        <div className="mx-6 mt-6 flex rounded-2xl border border-white/10 bg-white/5 p-1">
          {!adminOnly && (
            <div className="flex-1 rounded-xl bg-blue-500/15 py-3 text-center font-bold text-blue-200 shadow-sm">
              Parent Portal
            </div>
          )}
          {adminOnly && (
            <div className="flex-1 rounded-xl bg-white/10 py-3 text-center font-bold text-white shadow-sm">
              Staff Console
            </div>
          )}
        </div>

        <div className="px-8 pb-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-2xl font-black shadow-lg shadow-blue-500/25">
              H
            </div>
            <h2 className="text-3xl font-black italic tracking-tight text-white">
              H<span className="text-blue-400">-Pay</span>
            </h2>
            <p className="mt-2 text-sm font-medium tracking-tight text-slate-400">
              {adminOnly
                ? "authorized personnel only"
                : "secure access for parents and guardians"}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Identifier Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={adminOnly ? "Staff Email" : "Email or Phone Number"}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 font-medium text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            {/* Password Input with Toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 font-medium text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-cyan-300"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 014.13-5.247M9.88 9.88l4.24 4.24m1.83-1.83l3.09 3.09M1 1l22 22"
                    />
                  </svg>
                )}
              </button>
            </div>
           {!adminOnly && <div className="flex justify-end pr-2">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="cursor-pointer text-xs font-bold text-blue-300 hover:text-cyan-300 hover:underline"
              >
                Forgot Password?
              </button>
            </div>}
            <button
              disabled={loading}
              className={`w-full rounded-2xl py-4 font-black text-white shadow-lg transition-all active:scale-[0.98] ${loading ? "bg-slate-600 shadow-none" : "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-900/40 hover:from-blue-500 hover:to-cyan-400"}`}
            >
              {loading
                ? "VERIFYING..."
                : adminOnly
                  ? "SIGN IN TO STAFF CONSOLE"
                  : "SIGN IN TO PARENT PORTAL"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
