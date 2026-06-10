"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Tag as TagIcon, Folder, Save, PlayCircle } from "lucide-react";

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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, mediaList]);

  // Mobile Swipe Handlers
  const touchStartX = React.useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();
    touchStartX.current = null;
  };

  const [description, setDescription] = useState("");
  const [newTag, setNewTag] = useState("");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [localTags, setLocalTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (media) {
      setDescription(media.private_description || "");
      setSelectedAlbumId(media.album?.id || "");
      setLocalTags(media.tags || []);
    }
    fetchAlbums();
  }, [media]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:max-h-[90vh]">
        
        {/* Left Side: Media Viewer */}
        <div 
          className="w-full h-[55%] md:h-full md:w-1/2 bg-black flex items-center justify-center relative group shrink-0"
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
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 md:p-3 rounded-full opacity-0 md:group-hover:opacity-100 transition-all backdrop-blur-md z-10 border border-white/10"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}
          {currentIndex < mediaList.length - 1 && (
            <button 
              onClick={handleNext} 
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 md:p-3 rounded-full opacity-0 md:group-hover:opacity-100 transition-all backdrop-blur-md z-10 border border-white/10"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}

          {media.media_type === "VIDEO" ? (
            <video
              src={media.media_url}
              controls
              className="max-w-full h-full object-contain"
            />
          ) : (
            <img
              src={media.media_url || media.thumbnail_url}
              alt="Memory"
              className="max-w-full h-full object-contain select-none"
              draggable={false}
            />
          )}
        </div>

        {/* Right Side: Annotations */}
        <div className="w-full h-[45%] md:h-full md:w-1/2 p-4 md:p-6 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Memory Details</h2>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 flex-grow">
            {/* Private Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Private Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write down your thoughts, memories, or context..."
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[120px]"
              />
            </div>

            {/* Album Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Folder className="w-4 h-4" /> Add to Album
              </label>
              <select
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
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
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Details"}
            </button>

            <hr className="border-white/10" />

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <TagIcon className="w-4 h-4" /> Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {localTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm border border-pink-500/30 flex items-center gap-2"
                  >
                    #{tag.tag_name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="hover:text-pink-100"
                    >
                      <X className="w-3 h-3" />
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
                  className="flex-grow bg-black/20 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="submit"
                  className="bg-pink-500 hover:bg-pink-400 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Original Caption */}
            {media.caption && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-2">Original Instagram Caption</p>
                <p className="text-slate-300 text-sm">{media.caption}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
