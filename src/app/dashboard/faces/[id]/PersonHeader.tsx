"use client";

import { useState } from "react";
import { UserSearch, Edit2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PersonHeader({ person, mediaCount }: { person: any, mediaCount: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(person.name);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim() || name === person.name) {
      setIsEditing(false);
      setName(person.name);
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/faces/person/${person.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });
      
      const data = await res.json();
      if (data.merged && data.newId) {
        // Redirect to the merged profile
        router.push(`/dashboard/faces/${data.newId}`);
      } else {
        router.refresh();
      }
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-end gap-6 bg-white/5 p-6 rounded-2xl border border-white/10">
      <div className="w-24 h-24 rounded-2xl bg-slate-800 overflow-hidden shrink-0 border border-white/10 shadow-xl">
        {person.cover_image_url ? (
          <img src={person.cover_image_url} alt={person.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <UserSearch className="w-8 h-8" />
          </div>
        )}
      </div>
      <div className="pb-2 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/30 border border-indigo-500/50 rounded-lg px-3 py-1 text-2xl font-bold text-white focus:outline-none focus:border-indigo-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} disabled={isSaving} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors">
              <Check className="w-5 h-5" />
            </button>
            <button onClick={() => { setIsEditing(false); setName(person.name); }} disabled={isSaving} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-2 group">
            <h1 className="text-3xl font-bold text-white">{person.name}</h1>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Edit Name"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
        <p className="text-slate-400 text-sm">
          The AI found {mediaCount} {mediaCount === 1 ? 'photo' : 'photos'} of {person.name} in your vault.
        </p>
      </div>
    </div>
  );
}
