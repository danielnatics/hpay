import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

const ParentPortal = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyChildren();
  }, []);

  const fetchMyChildren = async () => {
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
      
      const { data: attnData } = await supabase
        .from('attendance')
        .select('rfid_uid, type, timestamp')
        .in('rfid_uid', rfids)
        .eq('date', today)
        .order('timestamp', { ascending: false });

      const enriched = studentsData.map(s => {
        const latest = attnData?.find(a => a.rfid_uid === s.rfid_uid);
        return {
          ...s,
          todayAttendance: latest || null
        };
      });
      setChildren(enriched);
    } else {
      setChildren([]);
    }
    setLoading(false);
  };

  const handleTopUp = async (studentRfid, currentBalance) => {
  const amount = prompt("Enter amount to add (₦):");
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

  const topUpAmount = parseFloat(amount);
  const newBalance = parseFloat(currentBalance) + topUpAmount;

  // 1. Update Student Balance using the RFID
  const { error: updateError } = await supabase
    .from('students')
    .update({ balance: newBalance })
    .eq('rfid_uid', studentRfid); // This now matches the RFID passed from the button

  if (updateError) {
    toast.error("Top-up failed: " + updateError.message);
    return;
  }

  // 2. Log the Transaction
  const { error: txError } = await supabase.from('transactions').insert([
    { 
      rfid_uid: studentRfid, // Ensure this column in 'transactions' table is TEXT type
      amount: topUpAmount, 
      transaction_type: 'DEPOSIT', 
      source: 'WEB' 
    }
  ]);

  if (txError) {
    console.error("Log error:", txError);
    // We don't return here because the money was already added, 
    // but we should warn the user/admin.
    toast.warning("Balance updated, but transaction log failed.");
  } else {
    toast.success(`₦${topUpAmount} added successfully!`);
  }

  fetchMyChildren(); // Refresh the UI
};

  // const handleTopUp = async (studentId, currentBalance) => {
  //   const amount = prompt("Enter amount to add (₦):");
  //   if (!amount || isNaN(amount)) return;

  //   const newBalance = parseFloat(currentBalance) + parseFloat(amount);

  //   // 1. Update Student Balance
  //   const { error: updateError } = await supabase
  //     .from('students')
  //     .update({ balance: newBalance })
  //     .eq('rfid_uid', studentId);

  //   if (updateError) {
  //     toast.error("Top-up failed: " + updateError.message);
  //     return;
  //   }

  //   // 2. Log the Transaction
  //   await supabase.from('transactions').insert([
  //     { 
  //       student_id: studentId, 
  //       amount: parseFloat(amount), 
  //       type: 'credit', 
  //       description: 'Parent Top-up' 
  //     }
  //   ]);

  //   toast.success(`₦${amount} added successfully!`);
  //   fetchMyChildren(); // Refresh the UI
  // };

  return (
    <div className="p-6 bg-emerald-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-emerald-900 mb-2">Parent Portal</h1>
        <p className="text-emerald-700 mb-8 font-medium">Manage your children's school wallets</p>

        {loading ? (
          <p>Loading family data...</p>
        ) : (
          <div className="grid gap-6">
            {children.map(student => (
              <div key={student.id} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
                  <p className="text-sm text-slate-500">Class: {student.class || "General"} | ID: {student.student_id || student.rfid_uid}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-2xl font-black text-emerald-600">₦{student.balance}</p>
                    {student.todayAttendance ? (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        student.todayAttendance.type === 'CHECK_IN'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        <span>{student.todayAttendance.type === 'CHECK_IN' ? '🏫 In School' : '👋 Departed'}</span>
                        <span className="font-mono opacity-75">
                          ({new Date(student.todayAttendance.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                        No scan today
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleTopUp(student.rfid_uid, student.balance)}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md self-end md:self-auto"
                >
                  + Add Money
                </button>
              </div>
            ))}
            {children.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-emerald-200 text-emerald-600">
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