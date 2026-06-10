"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import MediaModal from "@/components/MediaModal";
import MediaCard from "@/components/MediaCard";
import BulkActionBar from "@/components/BulkActionBar";
import LoadingSkeleton from "@/components/LoadingSkeleton";

type MediaItem = any;

export default function FavoritesPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/media?is_deleted=false&is_favorite=true");
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleBulkAction = async (action: string, albumId?: string) => {
    if (selectedMediaIds.size === 0) return;
    setIsProcessingBulk(true);
    try {
      await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaIds: Array.from(selectedMediaIds),
          action,
          album_id: albumId
        })
      });
      setSelectedMediaIds(new Set());
      fetchFavorites();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleHoverDelete = async (id: string) => {
    try {
      await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds: [id], action: "soft_delete" })
      });
      fetchFavorites();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (id: string, currentlyFavorited: boolean) => {
    try {
      setMedia(prev => prev.filter(m => m.id !== id)); // Remove from view optimistically
      await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mediaIds: [id], 
          action: currentlyFavorited ? "unfavorite" : "favorite" 
        })
      });
      fetchFavorites();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="grid" />;
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Favorites <Heart className="w-6 h-6 fill-pink-500 text-pink-500" />
        </h1>
        <p className="text-slate-400">
          Your most loved memories, all in one place.
        </p>
      </div>

      {media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No favorites yet</h2>
          <p className="text-slate-400 text-center max-w-md">
            Click the heart icon on any photo in your galleries to add it to your favorites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              isSelected={selectedMediaIds.has(item.id)}
              onSelect={() => toggleSelection(item.id)}
              onClick={() => setSelectedMedia(item)}
              onHoverDelete={() => handleHoverDelete(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id, item.is_favorite)}
            />
          ))}
        </div>
      )}

      {selectedMedia && (
        <MediaModal
        mediaList={media}
        currentMediaId={selectedMedia ? selectedMedia.id : null}
        onNavigate={(newMedia) => setSelectedMedia(newMedia as MediaItem)}
        onClose={() => setSelectedMedia(null)}
        onUpdate={() => fetchFavorites()}
      />
      )}

      <BulkActionBar
        selectedCount={selectedMediaIds.size}
        onClear={() => setSelectedMediaIds(new Set())}
        onDelete={() => handleBulkAction("soft_delete")}
        onAssignAlbum={(albumId) => handleBulkAction("assign_album", albumId)}
        isProcessing={isProcessingBulk}
      />
    </div>
  );
}
