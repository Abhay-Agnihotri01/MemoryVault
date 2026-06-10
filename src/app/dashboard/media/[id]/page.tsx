import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Tag as TagIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MediaControls } from "./MediaControls";
import { KeyboardNavigator } from "./KeyboardNavigator";
import { BackButton } from "@/components/BackButton";

export default async function MediaPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ collection?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const media = await prisma.media.findUnique({
    where: { id: resolvedParams.id },
    include: {
      tags: true,
      faces: { include: { person: true } },
      album: true
    }
  });

  if (!media) return <div className="p-20 text-center text-white">Media not found</div>;

  // Determine surrounding media based on collection context
  const collection = resolvedSearchParams.collection || "all";
  let surroundingMedia: { id: string }[] = [];

  if (collection.startsWith("album_")) {
    surroundingMedia = await prisma.media.findMany({
      where: { album_id: collection.replace("album_", ""), is_deleted: false },
      orderBy: { created_at: "desc" },
      select: { id: true }
    });
  } else if (collection.startsWith("person_")) {
    const faces = await prisma.face.findMany({
      where: { person_id: collection.replace("person_", "") },
      include: { media: { select: { id: true, is_deleted: true, created_at: true } } },
    });
    // Extract valid media and sort
    surroundingMedia = faces
      .filter(f => f.media && !f.media.is_deleted)
      .map(f => ({ id: f.media.id, created_at: f.media.created_at }))
      .sort((a: any, b: any) => b.created_at.getTime() - a.created_at.getTime())
      .map(m => ({ id: m.id }));
  } else {
    surroundingMedia = await prisma.media.findMany({
      where: { is_deleted: false },
      orderBy: { created_at: "desc" },
      select: { id: true }
    });
  }

  // Find next/prev IDs
  const currentIndex = surroundingMedia.findIndex(m => m.id === media.id);
  const prevId = currentIndex > 0 ? surroundingMedia[currentIndex - 1].id : null;
  const nextId = currentIndex >= 0 && currentIndex < surroundingMedia.length - 1 ? surroundingMedia[currentIndex + 1].id : null;

  const prevUrl = prevId ? `/dashboard/media/${prevId}?collection=${collection}` : null;
  const nextUrl = nextId ? `/dashboard/media/${nextId}?collection=${collection}` : null;

  return (
    <div className="max-w-7xl mx-auto pb-20 flex flex-col md:flex-row gap-8">
      <KeyboardNavigator prevUrl={prevUrl} nextUrl={nextUrl} />
      {/* Main Content Area */}
      <div className="flex-1">
        <BackButton />
        <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex items-center justify-center min-h-[60vh] relative group">
          {prevId && (
            <Link href={`/dashboard/media/${prevId}?collection=${collection}`} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 md:p-3 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all backdrop-blur-md z-10 border border-white/10">
              <ChevronLeft className="w-6 h-6" />
            </Link>
          )}
          {nextId && (
            <Link href={`/dashboard/media/${nextId}?collection=${collection}`} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 md:p-3 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all backdrop-blur-md z-10 border border-white/10">
              <ChevronRight className="w-6 h-6" />
            </Link>
          )}
          
          {media.media_type === "VIDEO" ? (
            <video src={media.media_url} controls className="max-h-[80vh] w-auto max-w-full" />
          ) : (
            <img src={media.media_url} alt="Memory" className="max-h-[80vh] w-auto max-w-full object-contain" />
          )}
        </div>
      </div>

      {/* Sidebar Details Area */}
      <div className="w-full md:w-80 shrink-0 space-y-6 pt-12">
        <MediaControls mediaId={media.id} isFavorite={media.is_favorite} isDeleted={media.is_deleted} />

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6">
          <div>
            <h3 className="text-white font-medium mb-1">Date</h3>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar className="w-4 h-4" />
              {new Date(media.created_at).toLocaleDateString()}
            </div>
          </div>

          {(media.caption || media.private_description) && (
            <div>
              <h3 className="text-white font-medium mb-1">Details</h3>
              {media.caption && <p className="text-slate-300 text-sm italic">"{media.caption}"</p>}
              {media.private_description && <p className="text-slate-400 text-sm mt-2">{media.private_description}</p>}
            </div>
          )}

          {media.album && (
            <div>
              <h3 className="text-white font-medium mb-1">Album</h3>
              <Link href={`/dashboard/albums/${media.album.id}`} className="text-indigo-400 text-sm hover:underline">
                {media.album.title}
              </Link>
            </div>
          )}

          {media.tags.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <TagIcon className="w-4 h-4" /> Smart Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {media.tags.map(tag => (
                  <span key={tag.id} className="bg-white/10 text-slate-300 text-xs px-2 py-1 rounded-md">
                    {tag.tag_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {media.faces.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-2">People</h3>
              <div className="flex flex-wrap gap-2">
                {media.faces.map(face => face.person && (
                  <Link key={face.id} href={`/dashboard/faces/${face.person.id}`} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2 py-1 rounded-md hover:bg-indigo-500/40 transition-colors">
                    {face.person.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
