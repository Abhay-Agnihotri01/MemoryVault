import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserSearch, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PersonFacesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const person = await prisma.person.findUnique({
    where: { id: resolvedParams.id },
    include: {
      faces: {
        include: {
          media: true
        }
      }
    }
  });

  if (!person) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center p-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Person Not Found</h1>
        <p className="text-slate-400 mb-6">This profile might have been deleted.</p>
        <Link href="/dashboard/faces" className="bg-white/10 text-white px-6 py-2 rounded-xl hover:bg-white/20 transition-all">
          Go Back
        </Link>
      </div>
    );
  }

  // Extract the unique media objects from the faces (in case the same person's face was detected twice in one photo)
  const mediaMap = new Map();
  person.faces.forEach(face => {
    if (face.media && !face.media.is_deleted) {
      mediaMap.set(face.media.id, face.media);
    }
  });
  const media = Array.from(mediaMap.values());

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <Link href="/dashboard/faces" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-end gap-6 bg-white/5 p-6 rounded-2xl border border-white/10">
          <div className="w-24 h-24 rounded-2xl bg-slate-800 overflow-hidden shrink-0 border border-white/10 shadow-xl">
            {person.cover_image_url ? (
              <img src={person.cover_image_url} alt={person.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500"><UserSearch className="w-8 h-8" /></div>
            )}
          </div>
          <div className="pb-2">
            <h1 className="text-3xl font-bold text-white mb-2">{person.name}</h1>
            <p className="text-slate-400 text-sm">
              The AI found {media.length} {media.length === 1 ? 'photo' : 'photos'} of {person.name} in your vault.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No active photos found for this person.
          </div>
        )}
        {media.map((item: any) => (
          <Link key={item.id} href={`/dashboard/media/${item.id}?collection=person_${person.id}`} className="group relative aspect-square bg-slate-800 rounded-xl overflow-hidden cursor-pointer block border border-white/5 hover:border-indigo-500/50 transition-all">
            <img 
              src={item.thumbnail_url || item.media_url} 
              alt={item.caption || "Memory"} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {item.media_type === "VIDEO" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white ml-1"></div>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
