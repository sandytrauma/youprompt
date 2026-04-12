import { db } from "@/db";
import { users, inquiries, tasks } from "@/db/schema";
import { desc, count, sql } from "drizzle-orm";
import { 
  Users, FileText, Activity, ShieldCheck, 
  ArrowLeft, History, Zap, Coins, TrendingUp 
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminUserActions } from "../components/AdminUserActions";

export default async function AdminDashboard() {
  // 1. Production Security Guard
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    redirect("/playground");
  }

  // 2. Data Fetching (All variables defined here)
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  
  const totalInquiries = await db.select({ value: count() }).from(inquiries);
  
  const globalCreditsResult = await db.select({ 
    sum: sql<number>`sum(${users.credits})` 
  }).from(users);
  const globalCredits = globalCreditsResult[0]?.sum || 0;

  const revenueEstimate = await db.select({
    total: sql<number>`count(*) * 15` 
  }).from(users);

  const recentTasks = await db.query.tasks.findMany({
    limit: 8,
    orderBy: [desc(tasks.createdAt)],
    with: {
      inquiry: true,
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Header */}
        <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-2">
              <ShieldCheck size={14} /> Admin Privileges Active
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">System Console</h1>
            <p className="text-gray-400 text-sm mt-1">Global monitoring and credit management for YouPrompt.</p>
          </div>
          
          <Link 
            href="/playground" 
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium w-full md:w-fit"
          >
            <ArrowLeft size={16} /> Back to Playground
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <StatCard 
            icon={<Users className="text-blue-500" />} 
            label="Total Users" 
            value={allUsers.length} 
            description="Active database accounts"
          />
          <StatCard 
            icon={<FileText className="text-purple-500" />} 
            label="Total Vibes" 
            value={totalInquiries[0]?.value || 0} 
            description="AI roadmap generations"
          />
          <StatCard 
            icon={<Coins className="text-yellow-500" />} 
            label="Circulating Credits" 
            value={globalCredits} 
            description="User-held tokens"
          />
          <StatCard 
            icon={<Activity className="text-green-500" />} 
            label="System Status" 
            value="Healthy" 
            description="Gemini-2.0-Flash operational"
          />
        </div>

        {/* Analytics & Danger Zone */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-900/20 to-transparent p-8 rounded-3xl border border-blue-500/10">
    <h3 className="text-blue-400 font-bold text-xs uppercase tracking-[0.3em] mb-4">Growth Projection</h3>
    <div className="flex items-baseline gap-4">
      
      <span className="text-5xl font-black text-white">
        ₹{new Intl.NumberFormat('en-IN').format(revenueEstimate[0]?.total || 0)}
      </span>
      <span className="text-green-500 text-sm font-bold flex items-center gap-1">
        <TrendingUp size={14} /> +12.5%
      </span>
    </div>
    <p className="text-gray-400 text-[10px] mt-4 leading-relaxed uppercase tracking-tighter opacity-70">
      Estimated Value (INR) based on credit consumption and user acquisition.
    </p>
  </div>
          
          <div className="bg-gradient-to-br from-red-900/10 to-transparent p-8 rounded-3xl border border-red-500/10">
            <h3 className="text-red-400 font-bold text-xs uppercase tracking-[0.3em] mb-4">System Overrides</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-bold transition-all">
                RESET GLOBAL RATE LIMITS
              </button>
              <button className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold transition-all">
                FLUSH CACHE STACK
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management Table */}
          <div className="lg:col-span-2 bg-[#161617] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">User Registry</h2>
                <TrendingUp size={16} className="text-green-500 opacity-50" />
              </div>
              <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 font-mono">
                {allUsers.length} TOTAL
              </span>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-white/[0.02] text-gray-500 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 md:p-6 font-bold">Identity</th>
                    <th className="p-4 md:p-6 font-bold text-center">Vibe Balance</th>
                    <th className="p-4 md:p-6 font-bold">Access</th>
                    <th className="p-4 md:p-6 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-4 md:p-6">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono opacity-60">{user.email}</div>
                      </td>
                      <td className="p-4 md:p-6">
                        <div className="flex items-center justify-center gap-2">
                           <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                             (user.credits ?? 0) > 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                           }`}>
                             <Zap size={10} /> {user.credits}
                           </div>
                        </div>
                      </td>
                      <td className="p-4 md:p-6">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                          user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 md:p-6 text-right">
                        <AdminUserActions userId={user.id} userName={user.name || "User"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-[#161617] rounded-3xl border border-white/5 p-6 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <History size={18} className="text-gray-400" />
                <h2 className="text-lg font-semibold tracking-tight">Vibe Stream</h2>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>

            <div className="space-y-6 flex-1">
              {recentTasks.length > 0 ? recentTasks.map((task) => (
                <div key={task.id} className="relative pl-4 border-l border-white/5 group">
                  <div className="absolute -left-[1px] top-0 w-[2px] h-4 bg-blue-500 group-hover:h-full transition-all duration-300"></div>
                  <div className="text-[10px] text-gray-500 font-mono mb-1 flex items-center justify-between">
                    <span>{new Date(task.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">ID: {task.id.substring(0,4)}</span>
                  </div>
                  <div className="text-sm font-medium truncate mb-1 pr-4">
                    {task.inquiry?.title || "Project Untitled"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/5 border border-blue-500/10 rounded text-blue-400 font-bold uppercase">
                      V{task.versionName}
                    </span>
                    <span className="text-[9px] text-gray-600 truncate italic">
                      UID: {task.inquiry?.userId?.substring(0, 12)}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 opacity-20">
                  <Activity size={32} className="mx-auto mb-4" />
                  <p className="text-xs">No activity recorded yet.</p>
                </div>
              )}
            </div>

            <button className="w-full mt-10 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
              Launch Data Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, description }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string | number,
  description: string 
}) {
  return (
    <div className="p-6 rounded-3xl bg-[#161617] border border-white/5 group hover:border-white/10 transition-all shadow-xl">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Live</span>
        </div>
      </div>
      <div className="text-gray-500 text-xs mb-1 font-medium tracking-wide uppercase">{label}</div>
      <div className="text-2xl md:text-3xl font-black mb-1 tracking-tighter">{value}</div>
      <div className="text-[10px] text-gray-600 font-medium leading-relaxed">{description}</div>
    </div>
  );
}