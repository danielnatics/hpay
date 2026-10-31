import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";

const Attendance = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [filterType, setFilterType] = useState("ALL"); // 'ALL', 'CHECK_IN', 'CHECK_OUT'
  const [filterClass, setFilterClass] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchAttendance();

    // Realtime listener for incoming taps from ESP32
    const channel = supabase
      .channel("live-attendance")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        (payload) => {
          const newEntry = payload.new;
          // If the entry matches today/selected date, prepend it live
          const entryDate = newEntry.date || (newEntry.timestamp ? newEntry.timestamp.split("T")[0] : "");
          if (!selectedDate || entryDate === selectedDate) {
            setAttendanceLogs((prev) => [newEntry, ...prev]);
            toast.info(
              `🔔 ${newEntry.student_name || "Student"} - ${
                newEntry.type === "CHECK_IN" ? "Checked In" : "Checked Out"
              }`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("id, name, class, student_id, rfid_uid");
    if (data) setStudents(data);
  };

  const fetchAttendance = async () => {
    setLoading(true);
    let query = supabase
      .from("attendance")
      .select("*")
      .order("timestamp", { ascending: false });

    if (selectedDate) {
      query = query.eq("date", selectedDate);
    }

    const { data, error } = await query;
    if (error) {
      // If table not created yet, show friendly notice
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        toast.warning("Attendance table not yet created in Supabase. Run the SQL script.");
      } else {
        toast.error("Error fetching attendance: " + error.message);
      }
      setAttendanceLogs([]);
    } else {
      setAttendanceLogs(data || []);
    }
    setLoading(false);
  };

  // Get unique classes for filter dropdown
  const classesList = Array.from(
    new Set(students.map((s) => s.class).filter(Boolean))
  );

  // Filter logs
  const filteredLogs = attendanceLogs.filter((log) => {
    const matchesType = filterType === "ALL" || log.type === filterType;
    const matchesClass = filterClass === "ALL" || log.class === filterClass;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (log.student_name && log.student_name.toLowerCase().includes(query)) ||
      (log.student_id && log.student_id.toLowerCase().includes(query)) ||
      (log.rfid_uid && log.rfid_uid.toLowerCase().includes(query));

    return matchesType && matchesClass && matchesSearch;
  });

  // Calculate Metrics for Selected Date
  const totalCheckIns = attendanceLogs.filter((l) => l.type === "CHECK_IN").length;
  const totalCheckOuts = attendanceLogs.filter((l) => l.type === "CHECK_OUT").length;
  const uniqueStudentsToday = new Set(
    attendanceLogs.filter((l) => l.type === "CHECK_IN").map((l) => l.rfid_uid)
  ).size;
  const onCampusCount = Math.max(0, totalCheckIns - totalCheckOuts);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      toast.info("No records to export.");
      return;
    }
    const headers = ["Student Name", "Student ID", "Class", "Type", "Status", "Date", "Time", "RFID UID", "Source"];
    const rows = filteredLogs.map((log) => {
      const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "";
      return [
        `"${log.student_name || ""}"`,
        `"${log.student_id || ""}"`,
        `"${log.class || ""}"`,
        `"${log.type || ""}"`,
        `"${log.status || ""}"`,
        `"${log.date || ""}"`,
        `"${timeStr}"`,
        `"${log.rfid_uid || ""}"`,
        `"${log.source || ""}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${selectedDate || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance report downloaded!");
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-emerald-950">Daily Attendance</h1>
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ESP32 Live Sync
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Real-time student arrival and departure logs from POS terminal
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={fetchAttendance}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 shadow-sm"
              title="Refresh logs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Present Today</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">✅</span>
            </div>
            <div className="text-3xl font-black text-slate-800">{uniqueStudentsToday}</div>
            <p className="text-xs text-slate-400 mt-1">Unique student arrivals</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">On Campus Now</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">🏫</span>
            </div>
            <div className="text-3xl font-black text-blue-600">{onCampusCount}</div>
            <p className="text-xs text-slate-400 mt-1">Active within school</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Check-Ins</span>
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-lg">📥</span>
            </div>
            <div className="text-3xl font-black text-slate-800">{totalCheckIns}</div>
            <p className="text-xs text-slate-400 mt-1">Morning & gate scans</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Departures</span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-lg">📤</span>
            </div>
            <div className="text-3xl font-black text-slate-800">{totalCheckOuts}</div>
            <p className="text-xs text-slate-400 mt-1">Check-outs recorded</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by student name, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Class Filter */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Classes</option>
              {classesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterType === "ALL"
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("CHECK_IN")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterType === "CHECK_IN"
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                In
              </button>
              <button
                onClick={() => setFilterType("CHECK_OUT")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  filterType === "CHECK_OUT"
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Out
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Terminal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      <div className="text-3xl mb-2">📋</div>
                      No attendance scans recorded for {selectedDate || "this date"}.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isCheckIn = log.type === "CHECK_IN";
                    const time = log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "N/A";

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                              {log.student_name ? log.student_name.charAt(0).toUpperCase() : "S"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {log.student_name || "Unknown Student"}
                              </div>
                              <div className="text-xs text-slate-400">
                                ID: {log.student_id || log.rfid_uid}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-700">
                            {log.class || "General"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              isCheckIn
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            <span>{isCheckIn ? "📥" : "📤"}</span>
                            {isCheckIn ? "CHECK-IN" : "CHECK-OUT"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{time}</div>
                          <div className="text-xs text-slate-400">{log.date}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-mono px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                            {log.source || "ESP32_POS"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Attendance;
