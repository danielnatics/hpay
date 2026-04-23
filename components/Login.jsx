import { useEffect, useState } from "react";
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        toast.error(error.message)
    //   alert(error.message);
    } else {
      // Navigate based on role immediately after login
      const role = data.user.user_metadata.role;
      if (role === 'admin') navigate('/register');
      else navigate('/parentPortal');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <ToastContainer position="top-center" autoClose={2500} />

      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
        <h2 className="text-3xl font-black text-[#064e3b] text-center mb-2">H-PAY</h2>
        <p className="text-center text-slate-500 mb-8 font-medium">Admin & Parent Portal</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Email" 
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => setEmail(e.target.value)} required 
          />
          <input 
            type="password" placeholder="Password" 
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => setPassword(e.target.value)} required 
          />
          <button className="w-full bg-[#064e3b] text-white py-3 rounded-lg font-bold hover:bg-[#065f46]">
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;