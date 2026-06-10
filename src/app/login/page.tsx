"use client";

import { signIn } from "next-auth/react";
import { Camera, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0B]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-r from-pink-600 to-orange-500 rounded-full blur-[150px] opacity-30 animate-pulse" style={{ animationDelay: "2s" }}></div>

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-12 mx-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
        
        {/* Logo / Icon Area */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-violet-500 rounded-2xl blur-lg opacity-60"></div>
            <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-pink-500 to-violet-500 rounded-2xl shadow-xl border border-white/20">
              <Camera className="w-8 h-8 text-white drop-shadow-md" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            MediaVault
          </h1>
          <p className="text-slate-300/80 text-sm leading-relaxed px-4">
            Your personal, self-hosted sanctuary for all your Instagram memories.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => signIn("instagram", { callbackUrl: "/dashboard" })}
          className="group relative w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 text-white font-medium py-3.5 px-6 rounded-xl overflow-hidden"
        >
          {/* Button Hover Effect */}
          <div className="absolute inset-0 w-0 bg-gradient-to-r from-pink-500/20 to-violet-500/20 transition-all duration-500 ease-out group-hover:w-full"></div>
          
          <Sparkles className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" />
          <span className="relative z-10">Connect with Instagram</span>
        </button>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Secure, private, and entirely yours.</span>
        </div>
      </div>
    </div>
  );
}
