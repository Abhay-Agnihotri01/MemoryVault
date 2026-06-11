"use client";

import { useEffect, useState, use } from "react";
import { FolderHeart, Loader2, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type MediaItem = any;

export default function SharedAlbumPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const [album, setAlbum] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read-only modal state
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const fetchSharedAlbum = async () => {
      try {
        const res = await fetch(`/api/shared/${resolvedParams.token}`);
        if (res.ok) {
          const data = await res.json();
          setAlbum(data.album);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSharedAlbum();
  }, [resolvedParams.token]);

  // Keyboard navigation for Modal
  useEffect(() => {
    if (!selectedMedia || !album) return;
    const currentIndex = album.media.findIndex((m: any) => m.id === selectedMedia.id);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentIndex < album.media.length - 1) {
        setSelectedMedia(album.media[currentIndex + 1]);
      }
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setSelectedMedia(album.media[currentIndex - 1]);
      }
      if (e.key === "Escape") {
        setSelectedMedia(null);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMedia, album]);

  // Reset zoom when photo changes
  useEffect(() => {
    setIsZoomed(false);
  }, [selectedMedia]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <h2 className="text-2xl font-bold text-white mb-2">Album not found</h2>
        <p className="text-slate-400">This link may have expired or is invalid.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-10">
      <div className="max-w-6xl mx-auto pb-20">
        
        {/* Public Header */}
        <div className="mb-12 flex flex-col md:flex-row items-center gap-6 text-center md:text-left bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="w-24 h-24 bg-gradient-to-tr from-pink-500 to-violet-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
            <FolderHeart className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{album.title}</h1>
            <p className="text-slate-300 text-lg mb-4">{album.description || "No description provided."}</p>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <img 
                src={album.user.profile_picture || "https://ui-avatars.com/api/?name=" + album.user.username} 
                alt={album.user.username} 
                className="w-8 h-8 rounded-full"
              />
              <span className="text-slate-400 text-sm">
                Shared by <span className="text-white font-medium">@{album.user.username}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Gallery */}
        {album.media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
            <FolderHeart className="w-12 h-12 text-slate-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">This album is empty</h2>
            <p className="text-slate-400">There are no photos here yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {album.media.map((item: any) => (
              <div
                key={item.id}
                onClick={() => setSelectedMedia(item)}
                className="aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] transition-all relative group"
              >
                <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
                  {item.media_type === "VIDEO" ? (
                    <div className="relative w-full h-full">
                      <video src={item.media_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-80" />
                      </div>
                    </div>
                  ) : (
                    <img src={item.media_url || item.thumbnail_url} alt="Memory" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Read-Only Lightbox Modal */}
      {selectedMedia && (() => {
        const currentIndex = album.media.findIndex((m: any) => m.id === selectedMedia.id);
        
        const handleNext = () => {
          if (currentIndex < album.media.length - 1) setSelectedMedia(album.media[currentIndex + 1]);
        };
        
        const handlePrev = () => {
          if (currentIndex > 0) setSelectedMedia(album.media[currentIndex - 1]);
        };

        const handleTouchStart = (e: React.TouchEvent) => {
          if (isZoomed) return;
          if (e.touches.length > 1) return; // Ignore multi-touch (e.g. pinch to zoom)
          (window as any).sharedTouchStartX = e.targetTouches[0].clientX;
        };

        const handleTouchEnd = (e: React.TouchEvent) => {
          if (isZoomed) return;
          const startX = (window as any).sharedTouchStartX;
          if (startX === undefined || startX === null) return;
          const endX = e.changedTouches[0].clientX;
          const diff = startX - endX;
          if (diff > 50) handleNext();
          if (diff < -50) handlePrev();
          (window as any).sharedTouchStartX = null;
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={() => setSelectedMedia(null)}>
            <div className="relative w-full h-[90vh] md:max-h-[90vh] flex flex-col md:flex-row bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
              
              {/* Media Area */}
              <div 
                className="flex-1 w-full h-[55%] md:h-full md:w-[60%] bg-black flex items-center justify-center relative min-h-[50vh] group shrink-0 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Mobile swipe hint overlay (fades out) */}
                <div className="md:hidden absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white/70 text-xs px-3 py-1 rounded-full backdrop-blur-md opacity-0 animate-[fadeOut_2s_ease-out_1s_forwards] pointer-events-none z-20">
                  Swipe to navigate
                </div>

                {currentIndex > 0 && (
                  <button 
                    onClick={handlePrev} 
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 md:p-3 rounded-full opacity-0 md:group-hover:opacity-100 transition-all backdrop-blur-md z-30 border border-white/10"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                )}
                {currentIndex < album.media.length - 1 && (
                  <button 
                    onClick={handleNext} 
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 md:p-3 rounded-full opacity-0 md:group-hover:opacity-100 transition-all backdrop-blur-md z-30 border border-white/10"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                )}

                {selectedMedia.media_type === "VIDEO" ? (
                  <video src={selectedMedia.media_url} controls autoPlay className="max-w-full h-full object-contain" />
                ) : (
                  <TransformWrapper
                    key={selectedMedia.id}
                    initialScale={1}
                    minScale={1}
                    maxScale={4}
                    centerOnInit
                    wheel={{ step: 0.1 }}
                    pinch={{ step: 5 }}
                    doubleClick={{ disabled: false, step: 1, mode: "toggle" }}
                    panning={{ disabled: !isZoomed }}
                    onTransformed={(ref) => setIsZoomed(ref.state.scale > 1.05)}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <TransformComponent wrapperClass="w-full h-full !flex items-center justify-center" contentClass="w-full h-full flex items-center justify-center">
                        <img
                          src={selectedMedia.media_url || selectedMedia.thumbnail_url}
                          alt="Memory"
                          className="max-w-full max-h-[100dvh] object-contain select-none"
                          draggable={false}
                        />
                      </TransformComponent>
                    )}
                  </TransformWrapper>
                )}
              </div>

              {/* Read-Only Details Area */}
              <div className="w-full h-[45%] md:h-full md:w-[400px] bg-slate-900 flex flex-col p-4 md:p-6 overflow-y-auto border-l border-white/10">
                <button 
                  onClick={() => setSelectedMedia(null)}
                  className="absolute top-4 right-4 md:hidden w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center z-50 border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <img src={album.user.profile_picture} className="w-10 h-10 rounded-full border border-white/20" />
                  <div>
                    <div className="font-semibold text-white">@{album.user.username}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(selectedMedia.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {selectedMedia.caption && (
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedMedia.caption}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
