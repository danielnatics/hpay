import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

const ParentPortal = () => {
  const [children, setChildren] = useState([]);
  const [transactions, setTransactions] = useState({});
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  async function fetchMyChildren() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Fetch only students linked to this parent's UUID
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', user.id);

    if (error) {
      toast.error("Error loading profiles");
    } else if (studentsData && studentsData.length > 0) {
      // Fetch today's attendance for these children
      const today = new Date().toISOString().split("T")[0];
      const rfids = studentsData.map(s => s.rfid_uid).filter(Boolean);
      
      const { data: attnData, error: attendanceError } = await supabase
        .from('attendance')
        .select('rfid_uid, type, timestamp')
        .in('rfid_uid', rfids)
        .eq('date', today)
        .order('timestamp', { ascending: false });

      if (attendanceError) {
        toast.error("Error loading attendance: " + attendanceError.message);
      }

      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("id, rfid_uid, amount, transaction_type, source, created_at")
        .in("rfid_uid", rfids)
        .order("created_at", { ascending: false })
        .limit(100);

      if (transactionError) {
        toast.error("Error loading transaction history: " + transactionError.message);
      }

      const transactionsByRfid = (transactionData || []).reduce((groups, transaction) => {
        if (!groups[transaction.rfid_uid]) groups[transaction.rfid_uid] = [];
        groups[transaction.rfid_uid].push(transaction);
        return groups;
      }, {});
      setTransactions(transactionsByRfid);

      const enriched = studentsData.map(s => {
        const latest = attnData?.find(a => a.rfid_uid === s.rfid_uid);
        return {
          ...s,
          todayAttendance: latest || null
        }
      });
      setChildren(enriched);
    } else {
      setChildren([]);
      setTransactions({});
    }
    setLoading(false);
  };

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
      refreshTimer.current = setTimeout(() => {
        fetchMyChildren();
      }, 250);
    };

    Promise.resolve().then(fetchMyChildren);

    const channel = supabase
      .channel("parent-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => scheduleRefresh(),
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          toast.error(
            `Live updates unavailable${error?.message ? `: ${error.message}` : "."}`,
          );
        }
      });

    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#07111f] px-4 py-8 text-white md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            H-Pay family account
          </p>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-white">Parent Portal</h1>
          <p className="font-medium text-slate-400">View your children's school wallets, payments, and attendance</p>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading family data...</p>
        ) : (
          <div className="grid gap-6">
            {children.map(student => (
              <div key={student.id} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/10 backdrop-blur-md">
                <div>
                  <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                  <h2 className="text-xl font-bold text-white">{student.name}</h2>
                  <p className="text-sm text-slate-400">Class: {student.class || "General"} | ID: {student.student_id || student.rfid_uid}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-2xl font-black text-cyan-300">₦{Number(student.balance || 0).toLocaleString()}</p>
                    {student.todayAttendance ? (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        student.todayAttendance.type === 'CHECK_IN'
                          ?                           'bg-emerald-400/10 text-emerald-300 border border-emerald-400/30'
                          : 'bg-blue-400/10 text-blue-300 border border-blue-400/30'
                      }`}>
                        <span>{student.todayAttendance.type === 'CHECK_IN' ? '🏫 In School' : '👋 Departed'}</span>
                        <span className="font-mono opacity-75">
                          ({new Date(student.todayAttendance.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-400">
                        No scan today
                      </span>
                    )}
                  </div>
                </div>
                </div>
                </div>
                <div className="mt-6 border-t border-white/10 pt-5">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Recent transactions
                  </h3>
                  {(transactions[student.rfid_uid] || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No transactions recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(transactions[student.rfid_uid] || []).slice(0, 5).map((transaction) => {
                        const isPurchase = transaction.transaction_type === "PURCHASE";
                        return (
                          <div key={transaction.id} className="flex items-start justify-between gap-3 rounded-xl bg-black/10 px-3 py-2 text-sm">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-200">{isPurchase ? "School purchase" : "Wallet deposit"}</p>
                              <p className="truncate text-xs text-slate-500">
                                {new Date(transaction.created_at).toLocaleString()}
                              </p>
                            </div>
                            <span className={`shrink-0 font-black ${isPurchase ? "text-rose-300" : "text-emerald-300"}`}>
                              {isPurchase ? "-" : "+"}₦{Number(transaction.amount || 0).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {children.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.04] py-20 text-center text-slate-400">
                No students linked to this account. Please contact the school admin.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;