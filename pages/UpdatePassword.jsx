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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <ToastContainer position="top-center" />
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <h2 className="text-2xl font-black text-emerald-900 mb-2">Create New Password</h2>
        <p className="text-slate-500 text-sm mb-6">Secure your H-PAY account with a new password.</p>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <input 
            type="password" placeholder="New Password" required
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all">
            {loading ? "UPDATING..." : "UPDATE & SIGN IN"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default UpdatePassword;