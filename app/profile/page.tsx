"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { updateProfile } from "@/app/actions/profile";
import { User, Shield, CreditCard, Save, Camera, Zap } from "lucide-react";

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sawyer",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jameson",
];

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(session?.user?.image || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({ name, image: selectedAvatar });
      await update(); // Updates the NextAuth session client-side
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar Selection */}
          <div className="bg-[#161617] p-6 rounded-3xl border border-white/5 shadow-xl">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Camera size={14} /> Identity
            </h2>
            <div className="flex flex-col items-center">
              <img 
                src={selectedAvatar || "/default-avatar.png"} 
                className="w-24 h-24 rounded-full border-2 border-blue-500 mb-6 p-1" 
                alt="Profile" 
              />
              <div className="grid grid-cols-2 gap-3">
                {AVATARS.map((url) => (
                  <button 
                    key={url}
                    onClick={() => setSelectedAvatar(url)}
                    className={`rounded-xl overflow-hidden border-2 transition-all ${selectedAvatar === url ? 'border-blue-500 scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={url} className="w-12 h-12" alt="avatar-option" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#161617] p-8 rounded-3xl border border-white/5">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User size={14} /> Personal Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Full Name</label>
                  <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-1 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Email (Read-only)</label>
                  <input 
                    value={session?.user?.email || ""} 
                    disabled 
                    className="w-full bg-white/[0.02] border border-white/5 text-gray-600 rounded-xl p-3 mt-1 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Credit Management Status */}
            <div className="bg-gradient-to-br from-blue-600/10 to-transparent p-8 rounded-3xl border border-blue-500/10 flex items-center justify-between">
              <div>
                <h3 className="text-blue-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-1">
                  <Zap size={14} /> Current Balance
                </h3>
                <p className="text-3xl font-black">{session?.user?.credits || 0} Credits</p>
              </div>
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold transition-all">
                Buy More
              </button>
            </div>

            <button 
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              {isUpdating ? "Syncing..." : <><Save size={18}/> Update Profile</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}