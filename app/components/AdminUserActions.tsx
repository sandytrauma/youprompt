"use client";

/**
 * Copyright 2026 Sandeep Kumar
 * Admin Authorization Protocol v2.1
 * Patches: Prompt-Injection vulnerabilities, UI Redressing, and Synchronous Thread Blocking.
 */

import { useState } from "react";
import { updateUserDetails } from "@/app/actions/admin";
import { ShieldAlert, Plus, Loader2, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface AdminUserActionsProps {
  userId: string;
  userName: string;
}

export function AdminUserActions({ userId, userName }: AdminUserActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [passkey, setPasskey] = useState<string>("");

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid credit amount.");
      return;
    }

    if (!passkey) {
      toast.error("Admin authorization required.");
      return;
    }

    setLoading(true);
    try {
      // Server Action handles 2FA and Authorization verification
      await updateUserDetails(userId, numAmount, passkey);
      toast.success(`Successfully injected ${numAmount} credits to ${userName}`);
      setIsOpen(false);
      setAmount("");
      setPasskey("");
    } catch (err: any) {
      toast.error(err.message || "Authorization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        disabled={loading}
        title={`Adjust credits for ${userName}`}
        className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors group disabled:opacity-50"
      >
        <Plus size={16} className={loading ? "animate-spin" : "group-hover:scale-110 transition-transform"} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111112] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <ShieldAlert size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Admin Override</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-400 mb-6">
                Injecting manual credits for <span className="text-white font-bold">{userName}</span>. This action is logged for audit purposes.
              </p>

              <form onSubmit={handleUpgrade} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Credit Amount</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50"
                    disabled={loading}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-blue-500/40 text-sm transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Admin Passkey (2FA)</label>
                  <input 
                    type="password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-blue-500/40 text-sm transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Authorize Injection
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}