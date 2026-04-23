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
    fetchStudents();const channel = supabase
    .channel('list-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students' },
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          // Update only the specific student in your local state
          setStudents(prev => prev.map(student => 
            student.id === payload.new.id ? payload.new : student
          ));
        } else if (payload.eventType === 'INSERT') {
          // Add the new student to the top of the list
          setStudents(prev => [payload.new, ...prev]);
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);

// --- 1. BLOCK CARD LOGIC ---
  const handleBlockCard = async (student) => {
    const confirm = window.confirm(`Block card for ${student.name}? The card will be permanently disabled.`);
    if (!confirm) return;

    // We prefix the current UID with "BLOCKED_" so it no longer matches scans
    // and can't be accidentally re-registered easily.
    const blockedUid = `BLOCKED_${student.rfid_uid}_${Date.now()}`;

    const {data, error } = await supabase
      .from('students')
      .update({ rfid_uid: blockedUid })
      .eq('rfid_uid', student.rfid_uid)
      .select();

    if (error) {
      toast.error("Error blocking card: " + error.message);
    } else if(data.length === 0){
      // This is the "Ghost" success - Supabase didn't find the ID
    toast.error(`Card not found in the database`);
    console.log("Looking for:", student.student_id);
    }else {
      toast.warn(`Card for ${student.name} has been deactivated.`);
      fetchStudents();
    }
  };

  // --- 2. REPLACE/ISSUE NEW CARD LOGIC ---
  const handleReplaceCard = async (student) => {
    const newRfid = prompt(`Scan/Enter NEW RFID UID for ${student.name}:`);
    
    if (!newRfid || newRfid.trim() === "") return;

    // Check if this new card is already assigned to someone else
    const { data: duplicate } = await supabase
      .from('students')
      .select('name')
      .eq('rfid_uid', newRfid.trim())
      .maybeSingle();

    if (duplicate) {
      toast.error(`Error: This card is already assigned to ${duplicate.name}`);
      return;
    }

    const { error } = await supabase
      .from('students')
      .update({ rfid_uid: newRfid.trim() })
      .eq('id', student.id);

    if (error) {
      toast.error("Replacement failed: " + error.message);
    } else {
      toast.success(`New card issued to ${student.name}. Balance of ₦${student.balance} preserved.`);
      fetchStudents();
    }
  };

  // Filter students based on search input
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rfid_uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteStudent = async (rfid, studentName) => {
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
      .eq("rfid_uid", rfid);

    if (error) {
      toast.error("Error deleting student: " + error.message);
    } else {
      toast.success(`${studentName} has been removed from the cloud.`);
      // 3. Refresh the list so the student disappears from the table
      fetchStudents();
    }
    setLoading(false);
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
                    <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
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
                          onClick={() => deleteStudent(student.student_id, student.name)}
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

