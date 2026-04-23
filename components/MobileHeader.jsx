import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import { useEffect, useState } from 'react';


const MobileHeader = ({ connectStatus, onReconnect, role }) => {
   const [session, setSession] = useState(null);
 
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


  return (
    <header className="md:hidden bg-emerald-800 backdrop-blur-md border-b border-emerald-50 p-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-600 h-8 w-8 rounded flex items-center justify-center">
          <span className="text-white font-black text-xs">H</span>
        </div>
        <span className="font-bold text-emerald-100 tracking-tight">HPAY <span className="text-emerald-400 font-bold text-[12px] uppercase tracking-widest">
                  {role || "Guest"}
                </span></span>
      </div>

      {/* Mini Connection Dot */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full">
        {/* <span
          className={`h-2 w-2 rounded-full animate-pulse ${connectStatus === "Connected" ? "bg-green-500" : "bg-red-500"}`}
        ></span>
        <span className="text-[10px] font-bold text-emerald-800 uppercase">
          {connectStatus}
        </span> */}
         <button 
                onClick={onReconnect} // Trigger the reconnect function
                disabled={connectStatus === "Connected"} // Disable if already online
                className="flex flex-col items-end group hover:opacity-80 transition-opacity cursor-pointer disabled:cursor-default"
              >
                <span className="text-[10px] uppercase tracking-widest text-emerald-200/50 font-bold group-hover:text-emerald-200">
                  {connectStatus === "Connected" ? "System Live" : "Click to Reconnect"}
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        connectStatus === "Connected" ? "bg-green-400" : "bg-red-400"
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        connectStatus === "Connected" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      connectStatus === "Connected" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {connectStatus}
                  </span>
                </div>
              </button>
      </div>
    </header>
  );
};
export default MobileHeader;
