import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const UpdatePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! Logging you in...");
      setTimeout(() => navigate("/portal"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070c1a] p-4 text-white">
      <ToastContainer position="top-center" />
      <div className="w-full max-w-md rounded-3xl border border-blue-500/20 bg-[#0d1526]/95 p-8 shadow-2xl shadow-blue-950/40">
        <h2 className="mb-2 text-2xl font-black text-white">Create New Password</h2>
        <p className="mb-6 text-sm text-slate-400">Secure your H-PAY account with a password only you know.</p>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <input 
            type="password" placeholder="New Password (8+ characters)" required minLength={8}
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 font-bold text-white transition-all hover:from-blue-500 hover:to-cyan-400">
            {loading ? "UPDATING..." : "UPDATE & SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default UpdatePassword;