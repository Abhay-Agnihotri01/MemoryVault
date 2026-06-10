"use client";

import { useState, useRef } from "react";
import { Send, UploadCloud, X, LayoutGrid } from "lucide-react";
import { uploadFiles } from "@/utils/uploadthing";

export default function PublishPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const urls = files.map(file => URL.createObjectURL(file));
      setSelectedFiles(prev => [...prev, ...files].slice(0, 10));
      setPreviewUrls(prev => [...prev, ...urls].slice(0, 10));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCaption("");
    setProgress(0);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setStatus("loading");
    setErrorMessage("");
    setProgress(10); // started

    try {
      // 1. Upload to Uploadthing
      const utRes = await uploadFiles("imageUploader", {
        files: selectedFiles,
      });

      if (!utRes || utRes.length === 0) {
        throw new Error("Failed to upload image(s) to the cloud.");
      }

      setProgress(40); // cloud upload done

      // 2. Publish to Instagram sequentially (Bulk Upload Option A)
      const step = 60 / utRes.length;
      for (let i = 0; i < utRes.length; i++) {
        const uploadedFile = utRes[i];
        
        const res = await fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            imageUrl: uploadedFile.ufsUrl || uploadedFile.url, 
            imageKey: uploadedFile.key, 
            caption 
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(`Error on photo ${i + 1}: ${data.error}`);
        }

        setProgress(prev => prev + step);
      }

      setStatus("success");
      clearAll();
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
          <Send className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bulk Publish to Instagram</h1>
          <p className="text-slate-400 text-sm mt-1">Upload up to 10 photos. They will be published as separate posts sequentially.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-8">
        {/* Form Side */}
        <div className="flex-1 space-y-6">
          <form onSubmit={handlePublish} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Photo Upload (Max 10)
              </label>
              
              <div 
                onClick={() => selectedFiles.length < 10 && fileInputRef.current?.click()}
                className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all group ${
                  selectedFiles.length >= 10 
                    ? "border-red-500/20 bg-red-500/5 cursor-not-allowed" 
                    : "border-white/20 hover:bg-white/5 hover:border-pink-500/50 cursor-pointer"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-pink-500/20 group-hover:text-pink-400 transition-colors">
                  <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-pink-400" />
                </div>
                <span className="text-sm font-medium text-white">
                  {selectedFiles.length >= 10 ? "Maximum files reached" : "Click to upload photos"}
                </span>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden" 
                  disabled={selectedFiles.length >= 10}
                />
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-black/20 border border-white/10 p-3 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-white/5 overflow-hidden flex-shrink-0">
                          <img src={previewUrls[index]} alt="Thumb" className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveFile(index)}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-red-400 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Caption (Applied to all)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={4}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              />
            </div>

            {status === "error" && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 text-sm">
                {errorMessage}
              </div>
            )}

            {status === "success" && (
              <div className="bg-green-500/10 text-green-400 p-4 rounded-xl border border-green-500/20 text-sm">
                All selected posts published successfully! 
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || selectedFiles.length === 0}
              className="w-full relative overflow-hidden bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              )}
              <span className="relative z-10">
                {status === "loading" ? `Publishing... (${Math.round(progress)}%)` : `Publish ${selectedFiles.length > 0 ? selectedFiles.length : ''} Post(s)`}
              </span>
            </button>
          </form>
        </div>

        {/* Preview Gallery Side */}
        <div className="flex-1 hidden md:flex flex-col">
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Gallery Preview
          </label>
          <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-y-auto">
            {previewUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {previewUrls.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                    <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                      Post {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2 min-h-[300px]">
                <LayoutGrid className="w-12 h-12 opacity-50" />
                <span className="text-sm">Add photos to see preview</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
