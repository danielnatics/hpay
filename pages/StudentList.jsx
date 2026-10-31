import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch students from Supabase
  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("name", { ascending: true }); // Sort by name A-Z

    if (error) {
      toast.error("Could not load students");
    } else {
      setStudents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(fetchStudents);
    const channel = supabase
    .channel('list-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students' },
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          setStudents((prev) =>
            prev.map((student) =>
              student.student_id === payload.new.student_id
                ? payload.new
                : student,
            ),
          );
        } else if (payload.eventType === 'INSERT') {
          setStudents(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setStudents((prev) =>
            prev.filter(
              (student) => student.student_id !== payload.old.student_id,
            ),
          );
        }
      },
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);

// --- 1. BLOCK CARD LOGIC ---
  const handleBlockCard = async (student) => {
    if (student.rfid_uid.startsWith("BLOCKED_")) {
      toast.info("This card is already blocked.");
      return;
    }

    const confirm = window.confirm(`Block card for ${student.name}? The card will be permanently disabled.`);
    if (!confirm) return;

    // We prefix the current UID with "BLOCKED_" so it no longer matches scans
    // and can't be accidentally re-registered easily.
    const blockedUid = `BLOCKED_${student.rfid_uid}_${Date.now()}`;

    const { data, error } = await supabase
      .from('students')
      .update({ rfid_uid: blockedUid })
      .eq('rfid_uid', student.rfid_uid)
      .select();

    if (error) {
      toast.error("Error blocking card: " + error.message);
    } else if (!data || data.length === 0) {
      toast.error("Card could not be found or was not changed.");
    } else {
      toast.warn(`Card for ${student.name} has been deactivated.`);
      fetchStudents();
    }
  };

  // --- 2. REPLACE/ISSUE NEW CARD LOGIC ---
  const handleReplaceCard = async (student) => {
    const newRfid = prompt(`Scan/Enter NEW RFID UID for ${student.name}:`);
    
    if (!newRfid || newRfid.trim() === "") return;
    const normalizedRfid = newRfid.trim().toUpperCase();
    if (normalizedRfid.startsWith("BLOCKED_")) {
      toast.error("Enter an active RFID UID, not a blocked card marker.");
      return;
    }
    if (normalizedRfid === student.rfid_uid) {
      toast.info("Enter a different RFID UID.");
      return;
    }

    // Check if this new card is already assigned to someone else
    const { data: duplicate } = await supabase
      .from('students')
      .select('name')
      .eq('rfid_uid', normalizedRfid)
      .maybeSingle();

    if (duplicate) {
      toast.error(`Error: This card is already assigned to ${duplicate.name}`);
      return;
    }

    const { error } = await supabase
      .from('students')
      .update({ rfid_uid: normalizedRfid })
      .eq('rfid_uid', student.rfid_uid);

    if (error) {
      toast.error("Replacement failed: " + error.message);
    } else {
      toast.success(`New card issued to ${student.name}. Balance of ₦${student.balance} preserved.`);
      fetchStudents();
    }
  };

  const handleAdjustBalance = async (student) => {
    const amountInput = prompt(
      `Enter the new balance for ${student.name} (current: ₦${Number(student.balance || 0).toLocaleString()}):`,
    );
    if (amountInput === null || amountInput.trim() === "") return;

    const newBalance = Number(amountInput);
    if (!Number.isFinite(newBalance) || newBalance < 0) {
      toast.error("Enter a valid balance of zero or more.");
      return;
    }

    const previousBalance = Number(student.balance || 0);
    if (newBalance === previousBalance) {
      toast.info("The balance is unchanged.");
      return;
    }

    const { data: updateResult, error: updateError } = await supabase
      .from("students")
      .update({ balance: newBalance })
      .eq("rfid_uid", student.rfid_uid)
      .select("rfid_uid, balance");

    if (updateError) {
      toast.error("Balance update failed: " + updateError.message);
      return;
    }

    if (!updateResult || updateResult.length === 0) {
      toast.error(
        "Balance update was blocked or the student was not found. Check the admin UPDATE policy in Supabase.",
      );
      return;
    }

    const savedBalance = Number(updateResult[0].balance);
    if (!Number.isFinite(savedBalance) || savedBalance !== newBalance) {
      toast.error(
        "Supabase returned a different balance than requested. Check the balance column type and constraints.",
      );
      return;
    }

    const { error: transactionError } = await supabase
      .from("transactions")
      .insert([
        {
          rfid_uid: student.rfid_uid,
          amount: Math.abs(newBalance - previousBalance),
          transaction_type: "DEPOSIT",
          source: "WEB",
        },
      ]);

    if (transactionError) {
      console.error("Manual balance transaction log failed:", transactionError);
      toast.error(
        `Balance updated, but the adjustment was not logged: ${transactionError.message}`,
      );
    } else {
      toast.success(`Balance updated for ${student.name}.`);
    }
    fetchStudents();
  };

  // Filter students based on search input
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rfid_uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteStudent = async (studentRfid, studentName) => {
    // 1. Ask for confirmation so you don't delete by accident
    if (
      !window.confirm(
        `Are you sure you want to delete ${studentName}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setLoading(true);

    // 2. Perform the delete in Supabase
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("rfid_uid", studentRfid);

    if (error) {
      toast.error("Error deleting student: " + error.message);
    } else {
      toast.success(`${studentName} has been removed from the cloud.`);
      // 3. Refresh the list so the student disappears from the table
    }
    setLoading(false);
    if (!error) fetchStudents();
  };

return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />

      <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          {/* Header & Search */}
          <div className="bg-white p-6 rounded-t-3xl border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Student Directory</h2>
              <p className="text-sm text-slate-500 font-medium">Manage cards, balances, and security</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Search students..." 
                className="flex-1 md:w-64 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={fetchStudents}
                disabled={loading}
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              >
                <svg className={`w-5 h-5 text-slate-600 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-b-3xl shadow-xl shadow-slate-200/50 overflow-x-auto">
            {loading && students.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-slate-500 font-bold">Synchronizing Database...</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400">ID</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400">Name / Class</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400">RFID Status</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400">Balance</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase text-slate-400 text-center">Security Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((student) => (
                    <tr key={student.student_id || student.rfid_uid} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-400">{student.student_id}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{student.name}</p>
                        <p className="text-[10px] font-black text-blue-600 uppercase">{student.class}</p>
                      </td>
                      <td className="px-6 py-4">
                        {student.rfid_uid.includes("BLOCKED") ? (
                          <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-black border border-red-100">🚫 BLOCKED</span>
                        ) : (
                          <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{student.rfid_uid}</code>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600">
                        ₦{parseFloat(student.balance).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleAdjustBalance(student)}
                          className="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-50"
                          title="Adjust Balance"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m6-4a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleReplaceCard(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Replace Card"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </button>
                        <button 
                          onClick={() => handleBlockCard(student)}
                          disabled={student.rfid_uid.includes("BLOCKED")}
                          className={`p-2 rounded-lg transition-colors ${student.rfid_uid.includes("BLOCKED") ? 'text-slate-200' : 'text-orange-600 hover:bg-orange-50'}`}
                          title="Block Card"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </button>
                        <button 
                          onClick={() => deleteStudent(student.rfid_uid, student.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Student"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && filteredStudents.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <p className="font-bold">No students found.</p>
                <p className="text-xs">Try a different search term or register a new student.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const cellStyle = { padding: "12px", borderBottom: "1px solid #ececec" };

export default StudentList;
