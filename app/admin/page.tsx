import { db } from "@/db";
import { users, inquiries, tasks } from "@/db/schema";
import { desc, count } from "drizzle-orm";
import { Users, FileText, Activity, ShieldCheck, ArrowLeft, History } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  // 1. Production Security Guard
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    redirect("/playground");
  }

  // 2. Data Fetching
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const totalInquiries = await db.select({ value: count() }).from(inquiries);
  
  // Fetching recent tasks with inquiry titles for the activity feed
  const recentTasks = await db.query.tasks.findMany({
    limit: 6,
    orderBy: [desc(tasks.createdAt)],
    with: {
      inquiry: true,
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-2">
              <ShieldCheck size={14} /> Admin Privileges Active
            </div>
            <h1 className="text-3xl font-bold tracking-tight">System Console</h1>
            <p className="text-gray-400 text-sm mt-1">Global monitoring and user management for YouPrompt.</p>
          </div>
          
          <Link 
            href="/playground" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium w-fit"
          >
            <ArrowLeft size={16} /> Back to Playground
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            icon={<Users className="text-blue-500" />} 
            label="Total Registered Users" 
            value={allUsers.length} 
            description="Active accounts in database"
          />
          <StatCard 
            icon={<FileText className="text-purple-500" />} 
            label="Total Vibes Generated" 
            value={totalInquiries[0].value} 
            description="Unique inquiry threads"
          />
          <StatCard 
            icon={<Activity className="text-green-500" />} 
            label="API Gateway" 
            value="Healthy" 
            description="Gemini-2.5-Flash status"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management Table - Larger Section */}
          <div className="lg:col-span-2 bg-[#161617] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">User Registry</h2>
              <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 font-mono">
                {allUsers.length} ENTRIES
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-gray-500 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 font-bold">Identity</th>
                    <th className="p-4 font-bold">Role</th>
                    <th className="p-4 font-bold text-right">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-4">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                          user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs text-right font-mono">
                        {new Date(user.createdAt!).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed - Sidebar Section */}
          <div className="bg-[#161617] rounded-3xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-6">
              <History size={18} className="text-gray-400" />
              <h2 className="text-lg font-semibold">Live Activity</h2>
            </div>
            <div className="space-y-6">
              {recentTasks.map((task) => (
                <div key={task.id} className="relative pl-4 border-l border-white/5">
                  <div className="absolute -left-[1px] top-0 w-[2px] h-4 bg-blue-500"></div>
                  <div className="text-[10px] text-gray-500 font-mono mb-1">
                    {new Date(task.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-sm font-medium truncate mb-1">
                    {task.inquiry?.title || "Unknown Vibe"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400">
                      {task.versionName}
                    </span>
                    <span className="text-[9px] text-gray-600">
                      Updated by ID: {task.inquiry?.userId?.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              View Full Audit Log
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
    <div className="p-6 rounded-3xl bg-[#161617] border border-white/5 group hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl bg-white/5">{icon}</div>
        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Live</div>
      </div>
      <div className="text-gray-400 text-xs mb-1 font-medium">{label}</div>
      <div className="text-3xl font-bold mb-1 tracking-tight">{value}</div>
      <div className="text-[10px] text-gray-600 font-medium">{description}</div>
    </div>
  );
}