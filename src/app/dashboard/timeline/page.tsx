"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import MediaModal from "@/components/MediaModal";
import MediaCard from "@/components/MediaCard";
import BulkActionBar from "@/components/BulkActionBar";
import LoadingSkeleton from "@/components/LoadingSkeleton";

type MediaItem = any;

export default function TimelinePage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/media?is_deleted=false");
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
    fetchMedia();
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
      fetchMedia();
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
      fetchMedia();
    } catch (err) {
      console.error(err);
    }
  };

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (monthYear: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthYear)) newSet.delete(monthYear);
      else newSet.add(monthYear);
      return newSet;
    });
  };

  const [activeMonthList, setActiveMonthList] = useState<MediaItem[] | null>(null);

  const groupedMedia = media.reduce((acc: Record<string, MediaItem[]>, item) => {
    const date = new Date(item.created_at);
    const monthYear = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return <LoadingSkeleton type="timeline" />;
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Timeline
        </h1>
        <p className="text-slate-400">View your memories arranged chronologically.</p>
      </div>

      {media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <CalendarDays className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Timeline is empty</h2>
          <p className="text-slate-400 text-center max-w-md mb-8">
            Once you sync media from Instagram, it will automatically be organized by date here.
          </p>
        </div>
      ) : (
        <div className="space-y-24 relative before:absolute before:inset-0 before:ml-4 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-pink-500/50 before:to-transparent">
          {Object.entries(groupedMedia).map(([monthYear, items]) => {
            // Get up to 3 items for the deck preview
            const previewItems = items.slice(0, 3).reverse(); // Reverse so index 0 (first photo) is on top
            
            return (
              <div key={monthYear} className="relative flex flex-col md:flex-row items-center md:items-start group w-full">
                <div className="flex items-center absolute left-0 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-4 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)] z-10" />
                
                <div className="ml-12 md:ml-0 md:w-1/2 md:pr-16 md:text-right py-4 shrink-0">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{monthYear}</h3>
                  <p className="text-slate-400 font-medium mt-1">{items.length} Memories</p>
                </div>

                <div className="ml-12 md:ml-0 md:w-1/2 md:pl-16 mt-6 md:mt-0 w-full relative">
                  
                  {/* Polaroid Deck */}
                  <div 
                    onClick={() => {
                      setActiveMonthList(items);
                      setSelectedMedia(items[0]);
                    }}
                    className="relative w-48 h-48 sm:w-64 sm:h-64 cursor-pointer group/deck"
                  >
                    {previewItems.map((item, idx) => {
                      const isTop = idx === previewItems.length - 1;
                      const isMiddle = idx === previewItems.length - 2;
                      
                      // Base styles for polaroid
                      let transformStyle = "";
                      let hoverStyle = "";
                      let zIndex = 10 + idx;

                      if (isTop) {
                        transformStyle = "rotate-0 translate-x-0 translate-y-0 scale-100";
                        hoverStyle = "group-hover/deck:-translate-y-4 group-hover/deck:scale-105 group-hover/deck:rotate-2";
                      } else if (isMiddle) {
                        transformStyle = "rotate-[6deg] translate-x-4 translate-y-2 scale-95";
                        hoverStyle = "group-hover/deck:translate-x-12 group-hover/deck:-rotate-6";
                      } else {
                        transformStyle = "-rotate-[8deg] -translate-x-4 translate-y-4 scale-90";
                        hoverStyle = "group-hover/deck:-translate-x-12 group-hover/deck:-rotate-12";
                      }

                      return (
                        <div 
                          key={item.id}
                          className={`absolute inset-0 bg-white p-2 pb-8 rounded-xl shadow-xl transition-all duration-300 ease-out border border-slate-200 ${transformStyle} ${hoverStyle}`}
                          style={{ zIndex }}
                        >
                          <div className="w-full h-full bg-slate-100 overflow-hidden rounded-md relative">
                            {item.media_type === "VIDEO" ? (
                              <video src={item.media_url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={item.media_url || item.thumbnail_url} alt="Memory" className="w-full h-full object-cover" />
                            )}
                            {/* Video Play Icon Overlay */}
                            {item.media_type === "VIDEO" && (
                              <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 backdrop-blur-md">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Hover Hint Overlay */}
                    <div className="absolute inset-0 z-50 flex items-center justify-center opacity-0 group-hover/deck:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/60 backdrop-blur-md text-white font-medium px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover/deck:translate-y-0 transition-transform duration-300">
                        View All {items.length}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      <MediaModal
        mediaList={activeMonthList || []}
        currentMediaId={selectedMedia ? selectedMedia.id : null}
        onNavigate={(newMedia) => setSelectedMedia(newMedia as MediaItem)}
        onClose={() => {
          setSelectedMedia(null);
          setActiveMonthList(null);
        }}
        onUpdate={() => fetchMedia()}
      />

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
