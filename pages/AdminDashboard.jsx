import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    transactions: 0,
    totalLiquidity: 0,
    totalRevenue: 0,
  });

  //   useEffect(() => {
  const fetchStats = async () => {
    // 1. Fetch Students count and Total Liquidity (Sum of balances)
    const { data: studentData, count: studentCount } = await supabase
      .from("students")
      .select("balance", { count: "exact" });

    const totalLiq =
      studentData?.reduce((sum, s) => sum + (s.balance || 0), 0) || 0;

    // 2. Fetch Transactions count and Total Revenue (Sum of debit/purchase amounts)
    // Adjust 'type' to match your DB (e.g., 'debit' or 'PURCHASE')
    const { data: transData, count: transCount } = await supabase
      .from("transactions")
      .select("amount, transaction_type", { count: "exact" });

    const totalRev =
      transData
        ?.filter((t) => t.transaction_type === "PURCHASE")
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    setStats({
      students: studentCount || 0,
      transactions: transCount || 0,
      totalLiquidity: totalLiq,
      totalRevenue: totalRev,
    });
  };

  // fetchStats();
  //   }, []);

  useEffect(() => {
    // 2. Run initial fetch when page loads
    fetchStats();

    // 3. Set up the Realtime Subscription
    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchStats(), // Re-fetch stats when a transaction is added
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        () => fetchStats(), // Re-fetch stats when a student balance changes
      )
      .subscribe();

    // 4. Cleanup: This stops the listener when you leave the page
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-emerald-900">
            HPay Control Center
          </h1>
          <p className="text-slate-500 font-medium">
            Welcome back, Admin. Manage your HPAY ecosystem below.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Total Students"
            value={stats.students}
            icon="👥"
            color="bg-blue-500"
          />
          <StatCard
            title="System Liquidity"
            value={`₦${stats.totalLiquidity.toLocaleString()}`}
            icon="💰"
            color="bg-violet-500"
          />
          <StatCard
            title="Total Revenue"
            value={`₦${stats.totalRevenue.toLocaleString()}`}
            icon="📈"
            color="bg-emerald-500"
          />
          <StatCard
            title="Total Transactions"
            value={stats.transactions}
            icon="📊"
            color="bg-emerald-500"
          />
          <StatCard
            title="System Status"
            value="Online"
            icon="⚡"
            color="bg-amber-500"
          />
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionLink
            to="/register"
            title="Enroll New Student"
            subtitle="Link RFID Card to Profile"
            icon="➕"
          />
          <ActionLink
            to="/studentLists"
            title="Manage Students"
            subtitle="View & Edit Balances"
            icon="📝"
          />
          <ActionLink
            to="/transactions"
            title="Financial Logs"
            subtitle="Audit all school sales"
            icon="💰"
          />
          <ActionLink
            to="/settings"
            title="System Settings"
            subtitle="MQTT & Security Config"
            icon="⚙️"
          />
        </div>
      </div>
    </div>
  );
};

// Reusable Stat Card
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`${color} text-white p-4 rounded-xl text-2xl`}>{icon}</div>
    <div>
      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
        {title}
      </p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

// Reusable Action Link
const ActionLink = ({ to, title, subtitle, icon }) => (
  <Link
    to={to}
    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
  >
    <div className="text-2xl mb-2">{icon}</div>
    <h3 className="font-bold text-slate-800 group-hover:text-emerald-700">
      {title}
    </h3>
    <p className="text-xs text-slate-500">{subtitle}</p>
  </Link>
);

export default AdminDashboard;
