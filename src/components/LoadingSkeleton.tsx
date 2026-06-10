"use client";

export default function LoadingSkeleton({ type = "grid" }: { type?: "grid" | "albums" | "timeline" }) {
  if (type === "albums") {
    return (
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-10 w-48 bg-white/10 rounded-xl mb-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-white/10 rounded-xl mb-4"></div>
              <div className="h-6 w-3/4 bg-white/10 rounded mb-2"></div>
              <div className="h-4 w-full bg-white/5 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "timeline") {
    return (
      <div className="max-w-6xl mx-auto pb-20 animate-pulse">
        <div className="h-10 w-48 bg-white/10 rounded-xl mb-10"></div>
        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-4 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-white/5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="relative flex flex-col md:flex-row items-center md:items-start group">
              <div className="flex items-center absolute left-0 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-4 border-white/10 z-10" />
              <div className="ml-12 md:ml-0 md:w-1/2 md:pr-12 md:text-right py-1">
                <div className="h-8 w-32 bg-white/10 rounded-xl ml-auto"></div>
              </div>
              <div className="ml-12 md:ml-0 md:w-1/2 md:pl-12 mt-6 md:mt-0 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="aspect-square bg-white/5 rounded-xl border border-white/5"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-pulse w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="h-10 w-64 bg-white/10 rounded-xl mb-3"></div>
          <div className="h-4 w-96 bg-white/5 rounded"></div>
        </div>
        <div className="h-12 w-32 bg-white/10 rounded-xl hidden md:block"></div>
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="aspect-square bg-white/5 rounded-xl border border-white/5"></div>
        ))}
      </div>
    </div>
  );
}
