"use client";

import { useEffect, useState } from "react";
import { X, Trash2, FolderPlus, Loader2 } from "lucide-react";

type BulkActionBarProps = {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  onAssignAlbum: (albumId: string) => void;
  isTrashView?: boolean;
  onRestore?: () => void;
  isProcessing?: boolean;
};

export default function BulkActionBar({ 
  selectedCount, 
  onClear, 
  onDelete, 
  onAssignAlbum, 
  isTrashView, 
  onRestore,
  isProcessing 
}: BulkActionBarProps) {
  const [albums, setAlbums] = useState<any[]>([]);
  const [showAlbumMenu, setShowAlbumMenu] = useState(false);

  useEffect(() => {
    if (selectedCount > 0 && !isTrashView) {
      fetch("/api/albums")
        .then(res => res.json())
        .then(data => setAlbums(data.albums || []));
    }
  }, [selectedCount, isTrashView]);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-slate-900 border border-white/20 shadow-2xl shadow-black/50 rounded-2xl p-2 flex items-center gap-2 backdrop-blur-xl bg-opacity-90">
        
        {/* Count & Clear */}
        <div className="flex items-center gap-3 pl-4 pr-2 py-1 border-r border-white/10">
          <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-white hidden sm:inline">Selected</span>
          <button 
            onClick={onClear}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-2 relative">
          {!isTrashView ? (
            <>
              <button 
                disabled={isProcessing}
                onClick={() => setShowAlbumMenu(!showAlbumMenu)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium text-slate-200"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add to Album</span>
              </button>

              {showAlbumMenu && (
                <div className="absolute bottom-full mb-4 left-0 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                  {albums.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-400">No albums exist.</div>
                  ) : (
                    albums.map(album => (
                      <button
                        key={album.id}
                        onClick={() => {
                          onAssignAlbum(album.id);
                          setShowAlbumMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-pink-400 transition-colors truncate"
                      >
                        {album.title}
                      </button>
                    ))
                  )}
                </div>
              )}

              <button 
                disabled={isProcessing}
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 rounded-xl transition-colors text-sm font-medium text-red-400"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span className="hidden sm:inline">Move to Trash</span>
              </button>
            </>
          ) : (
            <>
              <button 
                disabled={isProcessing}
                onClick={onRestore}
                className="flex items-center gap-2 px-4 py-2 hover:bg-green-500/20 rounded-xl transition-colors text-sm font-medium text-green-400"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Restore</span>
              </button>

              <button 
                disabled={isProcessing}
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 rounded-xl transition-colors text-sm font-medium text-red-400"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span className="hidden sm:inline">Delete Permanently</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
