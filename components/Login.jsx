import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [identifier, setIdentifier] = useState(""); // Can be email or phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("parent"); // 'parent' or 'admin'
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let loginEmail = identifier.trim();

      // --- LOGIC: If Parent is using a Phone Number instead of Email ---
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
      if (userRole === "admin") navigate("/register");
      else navigate("/parentPortal");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-90 p-4">
      <ToastContainer position="top-center" autoClose={2500} />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 m-6 rounded-2xl">
          <button
            onClick={() => setActiveTab("parent")}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === "parent" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-500"}`}
          >
            Parent
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === "admin" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-500"}`}
          >
            Admin
          </button>
        </div>

        <div className="px-8 pb-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-emerald-900 italic">
              H-PAY
            </h2>
            <p className="text-slate-500 font-medium lowercase tracking-tight">
              {activeTab === "admin"
                ? "authorized personnel only"
                : "manage your childs card"}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Identifier Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={
                  activeTab === "admin"
                    ? "Admin Email"
                    : "Email or Phone Number"
                }
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            {/* Password Input with Toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
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
           {activeTab ==='parent'&& <div className="flex justify-end pr-2">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>}
            <button
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-[0.98] ${loading ? "bg-slate-400 shadow-none" : "bg-emerald-900 hover:bg-emerald-800 shadow-emerald-100"}`}
            >
              {loading ? "VERIFYING..." : "SIGN IN TO PORTAL"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
