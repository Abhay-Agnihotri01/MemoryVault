"use client";

import { useState } from "react";
import { Heart, Trash2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export function MediaControls({ mediaId, isFavorite, isDeleted }: { mediaId: string, isFavorite: boolean, isDeleted: boolean }) {
  const router = useRouter();
  const [fav, setFav] = useState(isFavorite);
  const [del, setDel] = useState(isDeleted);

  const toggleFavorite = async () => {
    setFav(!fav);
    await fetch(`/api/media/${mediaId}/favorite`, { method: "PUT" });
    router.refresh();
  };

  const toggleTrash = async () => {
    const newDel = !del;
    setDel(newDel);
    await fetch(`/api/media/${mediaId}/trash`, { method: "PUT" });
    router.refresh();
    
    // Automatically navigate away to Trash or Dashboard
    if (newDel) {
      router.push("/dashboard");
    } else {
      router.push("/dashboard/trash");
    }
  };

  return (
    <div className="flex gap-4">
      <button 
        onClick={toggleFavorite}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
          fav ? "bg-pink-500/20 border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Heart className={`w-5 h-5 ${fav ? "fill-current" : ""}`} />
        {fav ? "Favorited" : "Favorite"}
      </button>

      <button 
        onClick={toggleTrash}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
          del ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30" : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
        }`}
      >
        {del ? (
          <>
            <RotateCcw className="w-5 h-5" />
            Restore
          </>
        ) : (
          <>
            <Trash2 className="w-5 h-5" />
            Delete
          </>
        )}
      </button>
    </div>
  );
}
