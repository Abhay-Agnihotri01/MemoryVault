import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function usePhotoViewer<T extends { id: string }>(mediaList: T[]) {
  const [selectedMedia, setSelectedMedia] = useState<T | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Handle URL changes (initial load and history navigation)
  const syncStateWithUrl = useCallback(() => {
    if (typeof window === 'undefined' || mediaList.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const photoId = params.get('photo');

    if (photoId) {
      const found = mediaList.find((m) => m.id === photoId);
      if (found) {
        setSelectedMedia(found);
      } else {
        // If photo not in list, clear it to prevent empty modal
        setSelectedMedia(null);
      }
    } else {
      setSelectedMedia(null);
    }
  }, [mediaList]);

  // Initial sync and mediaList updates
  useEffect(() => {
    syncStateWithUrl();
  }, [syncStateWithUrl]);

  // Listen to popstate for browser back/forward buttons
  useEffect(() => {
    window.addEventListener('popstate', syncStateWithUrl);
    return () => window.removeEventListener('popstate', syncStateWithUrl);
  }, [syncStateWithUrl]);

  const openMedia = (mediaItem: T) => {
    setSelectedMedia(mediaItem);
    const params = new URLSearchParams(window.location.search);
    params.set('photo', mediaItem.id);
    window.history.pushState(null, '', `${pathname}?${params.toString()}`);
  };

  const closeMedia = () => {
    setSelectedMedia(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('photo');
    const search = params.toString();
    const newUrl = search ? `${pathname}?${search}` : pathname;
    
    // Replace state so we don't clutter history with open/close toggles,
    // or if we want back button to work naturally, maybe pushState is better.
    // If we are closing via the 'X' button, we should replaceState if we don't want 
    // the user to have to click 'forward' to reopen, or simply pushState.
    // Actually, if we just pushState to open, and back button closes, it's fine.
    // If we click 'X', we might just want to replaceState or pushState back to original.
    // We'll use pushState so closing manually also adds to history.
    window.history.pushState(null, '', newUrl);
  };

  return { selectedMedia, openMedia, closeMedia };
}
