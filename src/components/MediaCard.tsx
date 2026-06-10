"use client";

import { Check, Trash2, Heart } from "lucide-react";

type MediaCardProps = {
  item: any;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onClick: () => void;
  onHoverDelete: (e: React.MouseEvent) => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
};

export default function MediaCard({ item, isSelected, onSelect, onClick, onHoverDelete, onToggleFavorite }: MediaCardProps) {
  return (
    <div
      onClick={onClick}
      className={`aspect-square bg-white/5 rounded-xl border overflow-hidden cursor-pointer transition-all relative group ${
        isSelected 
          ? "border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]" 
          : "border-white/10 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.2)]"
      }`}
    >
      {/* Selection Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(e); }}
        className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center transition-all ${
          isSelected 
            ? "bg-pink-500 border-pink-500 text-white" 
            : "border-white/50 bg-black/20 text-transparent opacity-0 group-hover:opacity-100 hover:border-white"
        }`}
      >
        <Check className="w-3.5 h-3.5" />
      </button>

      {/* Hover Delete Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onHoverDelete(e); }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-slate-300 hover:text-red-400 hover:bg-black/60 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Hover Favorite Button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }}
          className={`absolute bottom-2 right-2 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-all z-10 ${
            item.is_favorite 
              ? "bg-pink-500/20 text-pink-500 opacity-100" 
              : "bg-black/40 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-pink-500/20 hover:text-pink-400"
          }`}
        >
          <Heart className={`w-4 h-4 ${item.is_favorite ? "fill-pink-500" : ""}`} />
        </button>
      )}

      {/* Media Content */}
      <div className={`w-full h-full transition-transform duration-500 ${isSelected ? "scale-95 rounded-lg" : "group-hover:scale-105"}`}>
        {item.media_type === "VIDEO" ? (
          <video src={item.media_url} className="w-full h-full object-cover" />
        ) : (
          <img src={item.media_url || item.thumbnail_url} alt="Memory" className="w-full h-full object-cover" />
        )}
      </div>
    </div>
  );
}
