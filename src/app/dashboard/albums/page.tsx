"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderHeart, Plus, Loader2 } from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";

type Album = {
  id: string;
  title: string;
  description: string;
  _count: { media: number };
};

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.albums || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });
      setNewTitle("");
      setNewDesc("");
      setIsCreating(false);
      fetchAlbums();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton type="albums" />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Virtual Albums
        </h1>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-pink-500/25"
        >
          {isCreating ? <FolderHeart className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isCreating ? "Cancel" : "Create Album"}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-4">Create a new Album</h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Album Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Summer Vacation 2026"
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
              <textarea 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="A short description of these memories..."
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[80px]"
              />
            </div>
            <button type="submit" className="bg-pink-500 hover:bg-pink-400 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
              Save Album
            </button>
          </form>
        </div>
      )}

      {albums.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <FolderHeart className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No albums yet</h2>
          <p className="text-slate-400 text-center max-w-md mb-8">
            Group your memories into virtual albums without duplicating the actual files.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {albums.map(album => (
            <Link href={`/dashboard/albums/${album.id}`} key={album.id}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer group h-full flex flex-col">
                <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FolderHeart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{album.title}</h3>
                {album.description && <p className="text-slate-400 text-sm mb-4 line-clamp-2">{album.description}</p>}
                <div className="mt-auto pt-4 border-t border-white/10">
                  <p className="text-sm font-medium text-pink-400">{album._count.media} Memories</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
