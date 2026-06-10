"use client";

import { useEffect, useState, use } from "react";
import { FolderHeart, Loader2, ArrowLeft, Share2, Copy, Edit2, Check, X } from "lucide-react";
import Link from "next/link";
import MediaModal from "@/components/MediaModal";
import MediaCard from "@/components/MediaCard";
import BulkActionBar from "@/components/BulkActionBar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import MediaPickerModal from "@/components/MediaPickerModal";
import { Plus } from "lucide-react";

type MediaItem = any;

export default function AlbumDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [album, setAlbum] = useState<any>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const albumRes = await fetch(`/api/albums/${resolvedParams.id}`);
      if (albumRes.ok) {
        const albumData = await albumRes.json();
        setAlbum(albumData.album);
      }

      const mediaRes = await fetch(`/api/media?album_id=${resolvedParams.id}&is_deleted=false`);
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setMedia(mediaData.media || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resolvedParams.id]);

  const toggleShare = async () => {
    try {
      const res = await fetch(`/api/albums/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: !album.is_public })
      });
      if (res.ok) {
        const data = await res.json();
        setAlbum({ ...album, is_public: data.album.is_public, share_token: data.album.share_token });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/albums/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDesc })
      });
      if (res.ok) {
        const data = await res.json();
        setAlbum({ ...album, title: data.album.title, description: data.album.description });
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyLink = () => {
    if (album?.share_token) {
      navigator.clipboard.writeText(`${window.location.origin}/shared/${album.share_token}`);
      alert("Public link copied to clipboard!");
    }
  };

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
      fetchData();
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
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="grid" />;
  }

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-white mb-2">Album not found</h2>
        <Link href="/dashboard/albums" className="text-pink-400 hover:text-pink-300">
          Return to Albums
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <Link href="/dashboard/albums" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Albums
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center shrink-0">
              <FolderHeart className="w-8 h-8" />
            </div>
            {isEditing ? (
              <div className="flex-1 max-w-md">
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xl font-bold text-white mb-2 focus:outline-none focus:border-pink-500"
                  autoFocus
                />
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-pink-500 resize-none min-h-[80px]"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveEdit} className="bg-pink-500 hover:bg-pink-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                    <Check className="w-4 h-4" /> Save
                  </button>
                  <button onClick={() => setIsEditing(false)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold text-white mb-1 tracking-tight flex items-center gap-3">
                  {album.title}
                  <button 
                    onClick={() => {
                      setEditTitle(album.title);
                      setEditDesc(album.description || "");
                      setIsEditing(true);
                    }}
                    className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </h1>
                <p className="text-slate-400">{album.description || "No description provided."}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Share & Add Controls */}
        <div className="flex flex-col sm:flex-row items-stretch md:items-start gap-4">
          <button
            onClick={() => setShowPicker(true)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 transition-colors text-white font-medium"
          >
            <Plus className="w-5 h-5 text-pink-400" />
            Add Photos
          </button>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-end gap-3 min-w-[250px]">
            <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-white font-medium">
              <Share2 className="w-4 h-4 text-pink-400" /> Share Album
            </div>
            <button 
              onClick={toggleShare}
              className={`w-12 h-6 rounded-full transition-colors relative ${album.is_public ? "bg-pink-500" : "bg-slate-600"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${album.is_public ? "right-1" : "left-1"}`} />
            </button>
          </div>
          {album.is_public && album.share_token && (
            <button 
              onClick={copyLink}
              className="flex items-center gap-2 w-full justify-center bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-colors text-sm font-medium"
            >
              <Copy className="w-4 h-4" /> Copy Public Link
            </button>
          )}
        </div>
      </div>
      </div>

      {media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <FolderHeart className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">This album is empty</h2>
          <p className="text-slate-400 text-center max-w-md mb-8">
            Click the button below to pick photos from your vault and add them directly to this album.
          </p>
          <button 
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-pink-500/25"
          >
            <Plus className="w-5 h-5" /> Add Photos
          </button>
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
            />
          ))}
        </div>
      )}

      <MediaModal
        mediaList={media}
        currentMediaId={selectedMedia ? selectedMedia.id : null}
        onNavigate={(newMedia) => setSelectedMedia(newMedia as MediaItem)}
        onClose={() => setSelectedMedia(null)}
        onUpdate={() => fetchData()}
      />

      <BulkActionBar
        selectedCount={selectedMediaIds.size}
        onClear={() => setSelectedMediaIds(new Set())}
        onDelete={() => handleBulkAction("soft_delete")}
        onAssignAlbum={(albumId) => handleBulkAction("assign_album", albumId)}
        isProcessing={isProcessingBulk}
      />

      {showPicker && (
        <MediaPickerModal 
          albumId={album.id}
          onClose={() => setShowPicker(false)}
          onSave={fetchData}
        />
      )}
    </div>
  );
}
