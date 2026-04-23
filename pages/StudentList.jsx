import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

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

      <div className="p-1 sm:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto bg-white overflow-hidden">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-6 bg-white gap-4">
            <div>
              <h2 className="md:text-2xl font-bold text-slate-800">
                Registered Students
              </h2>
              <p className="text-sm text-slate-500">
                Manage and view all student cloud balances
              </p>
            </div>

            <button
              onClick={fetchStudents}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {loading ? "Refreshing..." : "Refresh List"}
            </button>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">
                  Loading students...
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      ID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Name
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      RFID UID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Balance
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Reg. Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student) => (
                    <tr
                      key={student.rfid_uid}
                      className="hover:bg-blue-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800 font-semibold">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">
                          {student.rfid_uid}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">
                        ₦{student.balance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {student.registration_date}
                      </td>
                      <td style={cellStyle}>
                        <button
                          onClick={() =>
                            deleteStudent(student.rfid_uid, student.name)
                          }
                          style={{
                            backgroundColor: "#ff4d4d",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Empty State */}
            {students.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📁</span>
                </div>
                <p className="text-slate-500 font-medium">
                  No students registered yet.
                </p>
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

// <div className="list-container" style={{ padding: '20px' }}>
//   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//     <h2>Registered Students</h2>
//     <button onClick={fetchStudents} disabled={loading}>Refresh List</button>
//   </div>

//   {loading ? (
//     <p>Loading students...</p>
//   ) : (
//     <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
//       <thead>
//         <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
//           <th style={cellStyle}>ID</th>
//           <th style={cellStyle}>Name</th>
//           <th style={cellStyle}>RFID UID</th>
//           <th style={cellStyle}>Balance</th>
//           <th style={cellStyle}>Reg. Date</th>
//         </tr>
//       </thead>
//       <tbody>
//         {students.map((student) => (
//           <tr key={student.rfid_uid} style={{ borderBottom: '1px solid #ddd' }}>
//             <td style={cellStyle}>{student.student_id}</td>
//             <td style={cellStyle}>{student.name}</td>
//             <td style={cellStyle}><code>{student.rfid_uid}</code></td>
//             <td style={cellStyle}>₦{student.balance}</td>
//             <td style={cellStyle}>{student.registration_date}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   )}
//   {students.length === 0 && !loading && <p>No students registered yet.</p>}
// </div>
