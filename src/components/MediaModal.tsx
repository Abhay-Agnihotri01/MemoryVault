"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Tag as TagIcon, Folder, Save, Info } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type Tag = { id: string; tag_name: string };
type Album = { id: string; title: string };

type MediaItem = {
  id: string;
  media_url: string;
  thumbnail_url: string;
  caption: string;
  private_description?: string;
  media_type: string;
  created_at: string;
  tags: Tag[];
  album?: Album;
};

export default function MediaModal({
  mediaList,
  currentMediaId,
  onNavigate,
  onClose,
  onUpdate,
}: {
  mediaList: MediaItem[];
  currentMediaId: string | null;
  onNavigate: (newMedia: MediaItem) => void;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const currentIndex = mediaList.findIndex(m => m.id === currentMediaId);
  const media = currentIndex !== -1 ? mediaList[currentIndex] : null;

  const [showEditPanel, setShowEditPanel] = useState(false);
  const [description, setDescription] = useState("");
  const [newTag, setNewTag] = useState("");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [localTags, setLocalTags] = useState<Tag[]>([]);
  
  // Track zoom state to prevent swiping when zoomed in, and prevent panning when zoomed out
  const [isZoomed, setIsZoomed] = useState(false);

  const handleNext = () => {
    if (currentIndex < mediaList.length - 1) onNavigate(mediaList[currentIndex + 1]);
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) onNavigate(mediaList[currentIndex - 1]);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") {
        if (showEditPanel) setShowEditPanel(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, mediaList, showEditPanel, onClose]);

  // Mobile Swipe Handlers
  const touchStartX = React.useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return; // Do not intercept swipe if zoomed in
    if (e.touches.length > 1) return; // Ignore multi-touch (e.g. pinch to zoom)
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isZoomed) return; // Do not intercept swipe if zoomed in
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();
    touchStartX.current = null;
  };

  useEffect(() => {
    if (media) {
      setDescription(media.private_description || "");
      setSelectedAlbumId(media.album?.id || "");
      setLocalTags(media.tags || []);
      setIsZoomed(false); // Reset zoom state when media changes
    }
  }, [media]);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    const res = await fetch("/api/albums");
    if (res.ok) {
      const data = await res.json();
      setAlbums(data.albums || []);
    }
  };

  if (!media) return null;

  const handleSaveDescriptionAndAlbum = async () => {
    setIsSaving(true);
    await fetch(`/api/media/${media.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        private_description: description,
        album_id: selectedAlbumId || null,
        tags: localTags.map(t => t.tag_name),
      }),
    });
    setIsSaving(false);
    onUpdate();
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    
    const newTagObj = { id: `temp-${Date.now()}`, tag_name: newTag.trim() };
    setLocalTags([...localTags, newTagObj]);
    setNewTag("");
  };

  const handleRemoveTag = (tagId: string) => {
    setLocalTags(localTags.filter(t => t.id !== tagId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
      {/* Fullscreen Viewer Area */}
      <div 
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {media.media_type === "VIDEO" ? (
          <video
            src={media.media_url}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        ) : (
          <TransformWrapper
            key={media.id} // Forces fresh mount for new media to reset zoom completely
            initialScale={1}
            minScale={1}
            maxScale={4}
            centerOnInit
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
            doubleClick={{ disabled: false, step: 1, mode: "toggle" }}
            panning={{ disabled: !isZoomed }} // Only allow dragging image around if we are actually zoomed in
            onTransformed={(ref) => setIsZoomed(ref.state.scale > 1.05)} // Update zoom state
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <TransformComponent wrapperClass="w-full h-full !flex items-center justify-center" contentClass="w-full h-full flex items-center justify-center">
                <img
                  src={media.media_url || media.thumbnail_url}
                  alt="Memory"
                  className="max-w-full max-h-[100dvh] object-contain select-none"
                  draggable={false}
                />
              </TransformComponent>
            )}
          </TransformWrapper>
        )}

        {/* Mobile swipe hint overlay (fades out) */}
        <div className="md:hidden absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white/70 text-xs px-3 py-1 rounded-full backdrop-blur-md opacity-0 animate-[fadeOut_2s_ease-out_1s_forwards] pointer-events-none z-20">
          Swipe to navigate
        </div>

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button 
            onClick={handlePrev} 
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 md:p-4 rounded-full transition-all backdrop-blur-md z-30 border border-white/10 hidden md:flex"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}
        {currentIndex < mediaList.length - 1 && (
          <button 
            onClick={handleNext} 
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 md:p-4 rounded-full transition-all backdrop-blur-md z-30 border border-white/10 hidden md:flex"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}
      </div>

      {/* Top Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={onClose}
            className="p-3 bg-black/50 hover:bg-black/80 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="pointer-events-auto">
          <button
            onClick={() => setShowEditPanel(!showEditPanel)}
            className={`p-3 rounded-full text-white transition-all backdrop-blur-md border ${
              showEditPanel 
                ? "bg-pink-500 hover:bg-pink-600 border-pink-400" 
                : "bg-black/50 hover:bg-black/80 border-white/10"
            }`}
            title="Edit Memory Details"
          >
            <Info className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Slide-out Edit Panel */}
      <div 
        className={`absolute top-0 right-0 bottom-0 w-full md:w-[450px] bg-slate-900/95 backdrop-blur-3xl border-l border-white/10 z-40 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
          showEditPanel ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 flex-grow overflow-y-auto mt-16 md:mt-20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Memory Details</h2>
            <p className="text-slate-400 text-sm">Add context, tags, or add to an album.</p>
          </div>

          <div className="space-y-6">
            {/* Private Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Private Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write down your thoughts, memories, or context..."
                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[120px] resize-none"
              />
            </div>

            {/* Album Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Folder className="w-4 h-4 text-pink-400" /> Add to Album
              </label>
              <select
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none"
              >
                <option value="">No Album</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSaveDescriptionAndAlbum}
              disabled={isSaving}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Saving..." : "Save Details"}
            </button>

            <hr className="border-white/10 my-8" />

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-violet-400" /> Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {localTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-white/5 text-slate-200 px-3 py-1.5 rounded-lg text-sm border border-white/10 flex items-center gap-2"
                  >
                    #{tag.tag_name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="hover:text-pink-400 text-slate-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag (e.g. vacation)"
                  className="flex-grow bg-black/30 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl font-medium transition-colors"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Original Caption */}
            {media.caption && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-8">
                <p className="text-xs text-pink-400 uppercase font-semibold tracking-wider mb-3">Original Instagram Caption</p>
                <p className="text-slate-300 text-sm leading-relaxed">{media.caption}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
