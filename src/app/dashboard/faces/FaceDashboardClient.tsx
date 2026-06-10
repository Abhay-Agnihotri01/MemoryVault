"use client";

import { useState, useEffect, useRef } from "react";
import { ScanFace, UserSearch, AlertCircle, CheckCircle2 } from "lucide-react";
import * as faceapi from "@vladmandic/face-api";

export default function FacesPage() {
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [namedPeople, setNamedPeople] = useState<any[]>([]);
  const [unassignedClusters, setUnassignedClusters] = useState<any[]>([]);
  const [nameInput, setNameInput] = useState<{ [key: string]: string }>({});

  const addLog = (msg: string) => setLogs(prev => [...prev, msg].slice(-5));

  const fetchPeople = async () => {
    try {
      const res = await fetch("/api/faces/people");
      const data = await res.json();
      if (!data.error) {
        setNamedPeople(data.namedPeople || []);
        setUnassignedClusters(data.unassignedClusters || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        addLog("Loading Neural Networks...");
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setIsModelsLoaded(true);
        addLog("Neural Networks ready.");
      } catch (e: any) {
        console.error(e);
        addLog(`Model load error: ${e.message}`);
      }
    };
    loadModels();
  }, []);

  const runScanner = async () => {
    if (!isModelsLoaded) return;
    setIsScanning(true);
    addLog("Fetching unscanned photos...");

    try {
      const res = await fetch("/api/faces/unscanned");
      const { media } = await res.json();

      if (!media || media.length === 0) {
        addLog("No new photos to scan!");
        setProgress({ current: 0, total: 0 });
        setIsScanning(false);
        return;
      }

      setProgress({ current: 0, total: media.length });

      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        addLog(`Analyzing ${i + 1}/${media.length}...`);
        
        // Load image onto invisible img element
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = item.thumbnail_url || item.media_url;
        
        await new Promise((resolve) => {
          img.onload = async () => {
            try {
              const detections = await faceapi.detectAllFaces(img)
                .withFaceLandmarks()
                .withFaceDescriptors();

              const faces = detections.map(d => ({
                descriptor: Array.from(d.descriptor),
                box: {
                  x: d.detection.box.x,
                  y: d.detection.box.y,
                  width: d.detection.box.width,
                  height: d.detection.box.height
                }
              }));

              await fetch("/api/faces/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mediaId: item.id, faces })
              });

              addLog(`Found ${faces.length} faces.`);
            } catch (err) {
              console.error("Face detection error:", err);
              addLog("Error detecting faces.");
            }
            resolve(true);
          };
          img.onerror = () => {
            // Ignore broken images, mark as scanned anyway
            fetch("/api/faces/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mediaId: item.id, faces: [] })
            });
            resolve(true);
          }
        });

        setProgress({ current: i + 1, total: media.length });
      }

      addLog("Scanner finished!");
      await fetchPeople();
    } catch (e: any) {
      console.error(e);
      addLog(`Scanner error: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleNamePerson = async (cluster: any) => {
    const name = nameInput[cluster.id];
    if (!name) return;

    try {
      const res = await fetch("/api/faces/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          faceIds: cluster.faces.map((f: any) => f.id),
          coverImageUrl: cluster.cover_image_url
        })
      });

      if (res.ok) {
        await fetchPeople();
        setNameInput(prev => ({ ...prev, [cluster.id]: "" }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <UserSearch className="w-8 h-8 text-indigo-400" />
          People & Faces
        </h1>
        <p className="text-slate-400">Scan your library to automatically detect and group faces using local GPU processing.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">GPU Face Scanner</h2>
            <p className="text-slate-400 text-sm max-w-md">
              The scanner runs securely inside your web browser. It will only scan photos that haven't been processed yet.
            </p>
            <div className="mt-4 space-y-2">
              {logs.map((log, idx) => (
                <div key={idx} className="text-xs text-indigo-300 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> {log}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full md:w-auto">
            {isScanning && progress.total > 0 && (
              <div className="w-full md:w-48 bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
            
            <button
              onClick={runScanner}
              disabled={!isModelsLoaded || isScanning}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all w-full md:w-auto justify-center
                ${!isModelsLoaded 
                  ? "bg-white/5 text-slate-500 cursor-not-allowed" 
                  : isScanning 
                    ? "bg-indigo-500/50 text-indigo-200 cursor-wait"
                    : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                }`}
            >
              <ScanFace className={`w-5 h-5 ${isScanning ? "animate-pulse" : ""}`} />
              {!isModelsLoaded ? "Loading AI..." : isScanning ? `Scanning ${progress.current}/${progress.total}` : "Run Scanner"}
            </button>
          </div>
        </div>
      </div>
      
      {namedPeople.length === 0 && unassignedClusters.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Profiles Created</h3>
          <p className="text-slate-400 text-center max-w-md text-sm">
            Once the scanner finishes processing your library, you will be able to group faces and assign names here.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {namedPeople.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Named Profiles</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {namedPeople.map(person => (
                  <div 
                    key={person.id} 
                    onClick={() => window.location.href = `/dashboard/faces/${person.id}`}
                    className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all cursor-pointer group"
                  >
                    <div className="aspect-square bg-slate-800 relative overflow-hidden">
                      {person.cover_image_url ? (
                        <img src={person.cover_image_url} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500"><UserSearch /></div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold truncate">{person.name}</h3>
                      <p className="text-slate-400 text-xs mt-1">{person._count?.faces} photos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unassignedClusters.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Who are these people?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {unassignedClusters.map(cluster => (
                  <div key={cluster.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                    <div className="aspect-square bg-slate-800">
                      {cluster.cover_image_url && (
                        <img src={cluster.cover_image_url} alt="Unknown" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-slate-400 text-xs">{cluster.faces.length} matching faces found</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Name..."
                          value={nameInput[cluster.id] || ""}
                          onChange={e => setNameInput(prev => ({ ...prev, [cluster.id]: e.target.value }))}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleNamePerson(cluster)}
                          disabled={!nameInput[cluster.id]}
                          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm transition-all"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
