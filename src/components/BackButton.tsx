"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.back()} 
      className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-6 font-medium"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}
