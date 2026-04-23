import { useState } from "react";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/update-password", // Change to your domain when you deploy
    });

    if (error) toast.error(error.message);
    else toast.success("Reset link sent! Please check your email.");
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <ToastContainer position="top-center" />
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <h2 className="text-2xl font-black text-emerald-900 mb-2">Reset Password</h2>
        <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a link to get back into your account.</p>
        
        <form onSubmit={handleReset} className="space-y-4">
          <input 
            type="email" placeholder="Parent Email" required
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button disabled={loading} className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-bold">
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default ForgotPassword;