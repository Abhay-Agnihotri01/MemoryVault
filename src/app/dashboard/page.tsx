"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ImagePlus, Images, Sparkles, Loader2 } from "lucide-react";
import MediaModal from "@/components/MediaModal";
import MediaCard from "@/components/MediaCard";
import BulkActionBar from "@/components/BulkActionBar";
import SearchBar from "@/components/SearchBar";
import LoadingSkeleton from "@/components/LoadingSkeleton";

type Tag = { id: string; tag_name: string };
type Album = { id: string; title: string };

type MediaItem = {
  id: string;
  instagram_media_id: string;
  media_url: string;
  thumbnail_url: string;
  caption: string;
  private_description?: string;
  media_type: string;
  created_at: string;
  tags: Tag[];
  album?: Album;
  is_favorite: boolean;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Bulk Action State
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const fetchLocalMedia = async (query: string = searchQuery) => {
    try {
      // only fetch non-deleted media
      const url = query 
        ? `/api/media?is_deleted=false&search=${encodeURIComponent(query)}`
        : `/api/media?is_deleted=false`;
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
        
        if (selectedMedia) {
          const updated = data.media.find((m: MediaItem) => m.id === selectedMedia.id);
          if (updated) setSelectedMedia(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch local media:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchLocalMedia(query);
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (res.ok) {
        await fetchLocalMedia();
      }
    } catch (err) {
      console.error("Failed to sync:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (window.location.hash === '#_=_') {
      window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }

    if (status === "authenticated") {
      fetchLocalMedia().then(() => triggerSync());
    }
  }, [status]);

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
      fetchLocalMedia();
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
      fetchLocalMedia();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (id: string, currentlyFavorited: boolean) => {
    try {
      // Optimistically update UI
      setMedia(prev => prev.map(m => m.id === id ? { ...m, is_favorite: !currentlyFavorited } : m));
      
      await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mediaIds: [id], 
          action: currentlyFavorited ? "unfavorite" : "favorite" 
        })
      });
      fetchLocalMedia();
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || isLoading) {
    return <LoadingSkeleton type="grid" />;
  }

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Your Media <Sparkles className="w-6 h-6 text-pink-400" />
          </h1>
          <p className="text-slate-400">
            Welcome back, {session?.user?.name || "Explorer"}! All your synced memories will appear here.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          <div className="w-full sm:w-auto flex-1">
            <SearchBar onSearch={handleSearch} />
          </div>
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 text-white px-5 py-3 rounded-2xl font-medium transition-all shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            {isSyncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Total Photos", value: media.length.toString(), color: "from-blue-500/20 to-cyan-500/20", text: "text-cyan-400" },
          { label: "Albums", value: new Set(media.map(m => m.album?.id).filter(Boolean)).size.toString(), color: "from-pink-500/20 to-rose-500/20", text: "text-pink-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <p className="text-slate-400 font-medium mb-2">{stat.label}</p>
            <h3 className={`text-4xl font-bold ${stat.text}`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {media.length === 0 && !isSyncing ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Images className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No media synced yet</h2>
          <p className="text-slate-400 text-center max-w-md mb-8">
            We are trying to pull your photos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
          currentMediaId={selectedMedia.id}
          onNavigate={(newMedia) => setSelectedMedia(newMedia as MediaItem)}
          onClose={() => setSelectedMedia(null)}
          onUpdate={fetchLocalMedia}
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
