"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2, RefreshCcw } from "lucide-react";
import MediaModal from "@/components/MediaModal";
import MediaCard from "@/components/MediaCard";
import BulkActionBar from "@/components/BulkActionBar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { usePhotoViewer } from "@/hooks/usePhotoViewer";

type MediaItem = any;

export default function TrashPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedMedia, openMedia, closeMedia } = usePhotoViewer(media);

  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const fetchTrashMedia = async () => {
    try {
      const res = await fetch("/api/media?is_deleted=true");
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
    fetchTrashMedia();
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleBulkAction = async (action: string) => {
    if (selectedMediaIds.size === 0) return;
    setIsProcessingBulk(true);
    try {
      await fetch("/api/media/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaIds: Array.from(selectedMediaIds),
          action,
        })
      });
      setSelectedMediaIds(new Set());
      fetchTrashMedia();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="grid" />;
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Trash Bin <Trash2 className="w-6 h-6 text-red-400" />
        </h1>
        <p className="text-slate-400">
          Photos here are hidden from your galleries. If you've manually deleted them from your Instagram, you can permanently erase them here to free up space.
        </p>
      </div>

      {media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Trash2 className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Trash is empty</h2>
          <p className="text-slate-400 text-center max-w-md">
            Any photos you delete will appear here safely.
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
              onClick={() => openMedia(item)}
              onHoverDelete={async () => {
                try {
                  await fetch("/api/media/bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mediaIds: [item.id], action: "permanent_delete" })
                  });
                  fetchTrashMedia();
                } catch (err) {
                  console.error(err);
                }
              }}
            />
          ))}
        </div>
      )}

      {selectedMedia && (
        <MediaModal
        mediaList={media}
        currentMediaId={selectedMedia ? selectedMedia.id : null}
        onNavigate={(newMedia) => openMedia(newMedia as MediaItem)}
        onClose={closeMedia}
        onUpdate={fetchTrashMedia}
      />
      )}

      <BulkActionBar
        isTrashView={true}
        selectedCount={selectedMediaIds.size}
        onClear={() => setSelectedMediaIds(new Set())}
        onRestore={() => handleBulkAction("restore")}
        onDelete={() => handleBulkAction("permanent_delete")}
        onAssignAlbum={() => {}}
        isProcessing={isProcessingBulk}
      />
    </div>
  );
}
