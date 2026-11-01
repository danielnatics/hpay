import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // State: 'ALL', 'PURCHASE', 'DEPOSIT'

  // Use this variable in your .map() instead of the raw transactions list
  // const filteredTransactions = transactions.filter((t) => {
  //   if (filter === "ALL") return true;
  //   return t.transaction_type === filter;
  // });

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel("live-transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            fetchTransactions();
          } else if (payload.eventType === "UPDATE") {
            fetchTransactions();
          } else if (payload.eventType === "DELETE") {
            setTransactions((prev) =>
              prev.filter((transaction) => transaction.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    // setLoading(true);
    // This query joins the transactions table with the students table
    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        amount,
        transaction_type,
        created_at,
        students (
          name,
          rfid_uid
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching logs: " + error.message);
    } else {
      setTransactions(data);
    }
    setLoading(false);
  };

  // Filter Logic
  const filteredData = transactions.filter((t) =>
    filter === "ALL" ? true : t.transaction_type === filter,
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-emerald-900">
              Financial Logs
            </h1>
            <p className="text-slate-500">History of all H-PAY activity</p>
            {/* Filter Buttons */}
            <div className="mt-4 flex w-full max-w-full overflow-x-auto bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              {["ALL", "DEPOSIT", "PURCHASE"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filter === type
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={fetchTransactions}
            className="self-start whitespace-nowrap bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold hover:bg-emerald-200 transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {/* {loading ? (
          <div className="text-center py-10">Loading transactions...</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredData.map((tx) => {
                const isPurchase = tx.transaction_type === "PURCHASE";
                return (
                  <article key={tx.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-slate-800">
                          {tx.students?.name || "Unknown Student"}
                        </h2>
                        <p className="truncate font-mono text-[10px] uppercase text-slate-400">
                          {tx.students?.rfid_uid || "No card ID"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          isPurchase
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <time className="text-xs text-slate-500">
                        {new Date(tx.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </time>
                      <span
                        className={`shrink-0 text-base font-black ${
                          isPurchase ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {isPurchase ? "-" : "+"} ₦
                        {Number(tx.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-black">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {tx.students?.name || "Unknown Student"}
                      <div className="text-[10px] text-slate-400 font-mono uppercase">
                        {tx.students?.rfid_uid}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                          tx.transaction_type === "PURCHASE"
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-black ${
                        tx.transaction_type === "PURCHASE"
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {tx.transaction_type === "PURCHASE" ? "-" : "+"} ₦
                      {tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {transactions.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                No transactions recorded yet.
              </div>
            )}
          </div>
        )} */}
        {loading ? (
          <div className="text-center py-10 font-medium text-slate-400">
            Loading transactions...
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredData.map((tx) => {
                const isPurchase = tx.transaction_type === "PURCHASE";
                return (
                  <article key={tx.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-slate-800">
                          {tx.students?.name || "Unknown Student"}
                        </h2>
                        <p className="truncate font-mono text-[10px] uppercase text-slate-400">
                          {tx.students?.rfid_uid || "No card ID"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          isPurchase
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <time className="text-xs text-slate-500">
                        {new Date(tx.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </time>
                      <span
                        className={`shrink-0 text-base font-black ${
                          isPurchase ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {isPurchase ? "-" : "+"} ₦
                        {Number(tx.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-black">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {/* --- MAPPING OVER FILTERED DATA INSTEAD OF TRANSACTIONS --- */}
                {filteredData.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-500">
                      {/* {new Date(tx.created_at).toLocaleString()} */}
                      {new Date(tx.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {tx.students?.name || "Unknown Student"}
                      <div className="text-[10px] text-slate-400 font-mono uppercase">
                        {tx.students?.rfid_uid}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                          tx.transaction_type === "PURCHASE"
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-black ${
                        tx.transaction_type === "PURCHASE"
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {tx.transaction_type === "PURCHASE" ? "-" : "+"} ₦
                      {Number(tx.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {filteredData.length === 0 && (
              <div className="p-10 text-center text-slate-400 font-medium">
                No {filter.toLowerCase()} records found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
