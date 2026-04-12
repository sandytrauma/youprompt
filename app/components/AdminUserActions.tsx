"use client";
import { useState } from "react";
import { updateUserDetails } from "@/app/actions/admin";
import { ShieldAlert, Plus } from "lucide-react";

export function AdminUserActions({ userId, userName }: { userId: string, userName: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    const amount = prompt(`How many credits to add to ${userName}?`);
    if (!amount || isNaN(Number(amount))) return;

    const passkey = prompt("ENTER ADMIN PASSKEY (2FA REQUIRED):");
    if (!passkey) return;

    setLoading(true);
    try {
      await updateUserDetails(userId, Number(amount), passkey);
      alert("Credits injected successfully.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleUpgrade}
      disabled={loading}
      className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors group"
    >
      <Plus size={16} className={loading ? "animate-spin" : ""} />
    </button>
  );
}