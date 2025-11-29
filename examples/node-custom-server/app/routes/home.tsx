import type { Route } from "./+types/home";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard | Acme Inc" },
    { name: "description", content: "Analytics Dashboard" },
  ];
}

interface Stats {
  revenue: string;
  users: string;
  orders: string;
  conversion: string;
}

function StatCard({ 
  title, 
  value, 
  prefix = "", 
  suffix = "",
  trend,
}: { 
  title: string; 
  value: number; 
  prefix?: string; 
  suffix?: string;
  trend?: { value: number; up: boolean };
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</span>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.up 
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" 
              : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
          }`}>
            {trend.up ? "↑" : "↓"} {trend.value}%
          </span>
        )}
      </div>
      <div className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">
        {prefix}{value}{suffix}
      </div>
    </div>
  );
}

function MiniChart() {
  const bars = [40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95];
  return (
    <div className="flex items-end gap-1 h-16">
      {bars.map((height, i) => (
        <div 
          key={i}
          className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-sm hover:bg-zinc-900 dark:hover:bg-white transition-colors"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  // BUG: Number() can't parse comma-formatted strings like "12,345.67"
  const revenue = Number(stats?.revenue);
  const users = Number(stats?.users);
  const orders = Number(stats?.orders);
  const conversion = Number(stats?.conversion);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-full" />
            <span className="font-semibold text-zinc-900 dark:text-white">Acme Inc</span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-zinc-500">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Docs
            </button>
            <button className="text-sm bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-md hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors">
              Deploy
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">Analytics Overview</h1>
          <p className="text-zinc-500">Track your key metrics and performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Revenue" 
            value={revenue} 
            prefix="$" 
            trend={{ value: 12.5, up: true }}
          />
          <StatCard 
            title="Active Users" 
            value={users} 
            trend={{ value: 8.2, up: true }}
          />
          <StatCard 
            title="Total Orders" 
            value={orders} 
            trend={{ value: 3.1, up: false }}
          />
          <StatCard 
            title="Conversion Rate" 
            value={conversion} 
            suffix="%" 
            trend={{ value: 0.5, up: true }}
          />
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-medium text-zinc-900 dark:text-white">Revenue Trend</h2>
              <div className="flex gap-2">
                <button className="text-xs px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">7D</button>
                <button className="text-xs px-3 py-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">30D</button>
                <button className="text-xs px-3 py-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">90D</button>
              </div>
            </div>
            <MiniChart />
          </div>
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="font-medium text-zinc-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: "New order", time: "2m ago", icon: "📦" },
                { action: "User signup", time: "5m ago", icon: "👤" },
                { action: "Payment received", time: "12m ago", icon: "💳" },
                { action: "Review submitted", time: "1h ago", icon: "⭐" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span>{item.icon}</span>
                  <span className="text-zinc-900 dark:text-white flex-1">{item.action}</span>
                  <span className="text-zinc-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
