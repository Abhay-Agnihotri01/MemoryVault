"use client";

import { useEffect, useState } from "react";
import { Settings, RefreshCw, Trash2, Bot, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [untaggedCount, setUntaggedCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/ai/status");
      if (res.ok) {
        const data = await res.json();
        setUntaggedCount(data.untaggedCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const runBatch = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/ai/tag-batch", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert(`Successfully tagged ${data.processedCount} photos!`);
      }
      fetchStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Settings
        </h1>
        <p className="text-slate-400">Manage your MemoryVault preferences and connections.</p>
      </div>

      <div className="space-y-6">
        
        {/* AI Engine */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            Gemini AI Tagging Engine
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 gap-4">
            <div>
              <div className="flex items-center gap-2 text-white font-medium">
                Batch Processing Queue
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                  Auto-Worker Active
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1 max-w-md">
                A background worker is silently tagging 5 photos every 10 minutes to respect API rate limits. You can also force a batch manually.
              </p>
              {untaggedCount !== null && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  {untaggedCount} photos waiting in queue
                </div>
              )}
            </div>
            
            <button 
              onClick={runBatch}
              disabled={isProcessing || untaggedCount === 0}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all shadow-lg whitespace-nowrap
                ${untaggedCount === 0 
                  ? "bg-white/5 text-slate-500 cursor-not-allowed" 
                  : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20"
                }`}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {untaggedCount === 0 ? "Queue Empty" : isProcessing ? "Analyzing..." : "Process Next Batch (5)"}
            </button>
          </div>
        </div>

        {/* Instagram Connection */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Instagram Connection</h2>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div>
              <p className="text-white font-medium">Connected Account</p>
              <p className="text-slate-400 text-sm">Your media is currently syncing from this account.</p>
            </div>
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-all">
              <RefreshCw className="w-4 h-4" />
              Re-authorize
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
            <div>
              <p className="text-white font-medium">Delete Account & Data</p>
              <p className="text-red-300/70 text-sm">Permanently remove all synced media and virtual albums.</p>
            </div>
            <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-red-500/20">
              <Trash2 className="w-4 h-4" />
              Delete Everything
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
