"use client";

import { useEffect, useState } from "react";
import { X, Check, Loader2, Save } from "lucide-react";

type MediaItem = any;

type MediaPickerModalProps = {
  albumId: string;
  onClose: () => void;
  onSave: () => void;
};

export default function MediaPickerModal({ albumId, onClose, onSave }: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch all available media
    fetch("/api/media?is_deleted=false")
      .then(res => res.json())
      .then(data => {
        // Filter out media that is ALREADY in this album
        const availableMedia = (data.media || []).filter((m: MediaItem) => m.album_id !== albumId);
        setMedia(availableMedia);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [albumId]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);
    try {
      await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaIds: Array.from(selectedIds),
          action: "assign_album",
          album_id: albumId
        })
      });
      onSave(); // Trigger parent refresh
      onClose(); // Close modal
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-white/10 shrink-0 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Add Photos to Album</h2>
            <p className="text-slate-400 text-sm mt-1">Select photos from your vault to add them directly to this album.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (selectedIds.size === media.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(media.map(m => m.id)));
                }
              }}
              className="text-sm font-medium text-pink-400 hover:text-pink-300 transition-colors bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1.5 rounded-lg"
            >
              {selectedIds.size === media.length && media.length > 0 ? "Deselect All" : "Select All"}
            </button>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-black/20">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p>No available photos found.</p>
              <p className="text-sm mt-2 text-slate-500">All of your photos might already be in this album!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {media.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer group transition-all ${
                      isSelected ? "border-2 border-pink-500 scale-95 opacity-100" : "border border-white/10 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {item.media_type === "VIDEO" ? (
                      <video src={item.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.media_url || item.thumbnail_url} alt="Media" className="w-full h-full object-cover" />
                    )}
                    
                    {/* Checkbox Overlay */}
                    <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-pink-500 border-pink-500 text-white" : "bg-black/40 border-white/50 text-transparent opacity-0 group-hover:opacity-100"
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="text-slate-300 font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? 'photo' : 'photos'} selected
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={selectedIds.size === 0 || isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/25"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to Album
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
