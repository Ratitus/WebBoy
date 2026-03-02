import React, { useEffect, useState, useRef } from 'react';
import { Trash2, Upload, Play, Library, Globe, Share2, ShieldAlert, Eraser } from 'lucide-react';
import { getLibraryRoms, saveRomToLibrary, deleteRomFromLibrary, clearLibrary, SavedRom } from '../services/romDatabase';
import { clsx } from 'clsx';

interface GameLibraryProps {
  isOpen: boolean;
  user: string;
  onClose: () => void;
  onLoadRom: (file: File) => void;
}

interface PublicRom {
  id: string;
  name: string;
  data?: string; // base64 (optional, fetched on demand)
  dateAdded: number;
  addedBy: string;
}

export function GameLibrary({ isOpen, user, onClose, onLoadRom }: GameLibraryProps) {
  const [activeTab, setActiveTab] = useState<'local' | 'public'>('local');
  const [localRoms, setLocalRoms] = useState<SavedRom[]>([]);
  const [publicRoms, setPublicRoms] = useState<PublicRom[]>([]);
  const publicRomsRef = useRef<PublicRom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isAdmin = user.toUpperCase() === 'ADMIN';

  useEffect(() => {
    if (isOpen) {
      loadLocalLibrary();
      connectWebSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isOpen]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}`);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connected");
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WS Message:", data.type);
          
          if (data.type === 'init') {
            setPublicRoms(data.roms);
            publicRomsRef.current = data.roms;
          } else if (data.type === 'rom-added') {
            setPublicRoms(prev => {
              const next = [data.rom, ...prev];
              publicRomsRef.current = next;
              return next;
            });
          } else if (data.type === 'rom-deleted') {
            setPublicRoms(prev => {
              const next = prev.filter(r => r.id !== data.id);
              publicRomsRef.current = next;
              return next;
            });
          } else if (data.type === 'rom-data') {
            const rom = publicRomsRef.current.find(r => r.id === data.id);
            if (rom) {
              const binaryString = atob(data.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              onLoadRom(new File([bytes.buffer], rom.name));
            }
            setLoading(false);
          }
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      socket.onerror = (e) => {
        console.error("WebSocket error:", e);
        setError("Error de connexió amb la Public Room. Reintentant...");
      };

      socket.onclose = () => {
        console.log("WebSocket closed");
        // Optional: auto-reconnect logic could go here
      };
    } catch (e) {
      console.error("WebSocket connection error:", e);
    }
  };

  const loadLocalLibrary = async () => {
    setLoading(true);
    try {
      const savedRoms = await getLibraryRoms();
      setLocalRoms(savedRoms);
    } catch (err) {
      setError("Error al carregar la biblioteca local.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      await saveRomToLibrary(file);
      await loadLocalLibrary();
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError') {
        setError("Error: L'emmagatzematge del navegador està ple. Esborra algun joc per continuar.");
      } else {
        setError("Error al desar la ROM. És possible que no hi hagi espai suficient.");
      }
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLibrary = async () => {
    if (!confirm("Segur que vols esborrar TOTS els jocs de la teva biblioteca local? Aquesta acció no es pot desfer.")) return;
    
    setLoading(true);
    try {
      await clearLibrary();
      await loadLocalLibrary();
      alert("Biblioteca neta!");
    } catch (err) {
      setError("Error al netejar la biblioteca.");
    } finally {
      setLoading(false);
    }
  };

  const handleNuclearReset = async () => {
    if (!confirm("ALERTA: Això esborrarà TOTA la base de dades del navegador i recarregarà la pàgina. Estàs segur?")) return;
    
    try {
      const DB_NAME = 'GameBoyLibrary';
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      deleteRequest.onsuccess = () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.reload();
      };
      deleteRequest.onerror = () => {
        setError("No s'ha pogut esborrar la base de dades. Prova de tancar pestanyes.");
      };
    } catch (e) {
      window.location.reload();
    }
  };

  const handleDeleteLocal = async (id: string) => {
    console.log("handleDeleteLocal called for ID:", id);
    if (!id) {
      setError("Error: ID de ROM no trobat.");
      return;
    }
    
    if (!confirm("Segur que vols esborrar aquesta ROM de la teva biblioteca?")) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log("Calling deleteRomFromLibrary...");
      await deleteRomFromLibrary(id);
      console.log("Delete successful, reloading library...");
      await loadLocalLibrary();
    } catch (err: any) {
      console.error("Delete local error:", err);
      setError(`Error al esborrar la ROM: ${err?.message || 'Error desconegut'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToPublic = async (rom: SavedRom) => {
    if (!isAdmin) return;
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("No hi ha connexió amb el servidor.");
      return;
    }

    const base64Data = btoa(
      new Uint8Array(rom.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    socketRef.current.send(JSON.stringify({
      type: 'add-rom',
      name: rom.name,
      data: base64Data,
      addedBy: user
    }));
    
    alert("ROM publicada a la Public Room!");
  };

  const handleDeletePublic = (id: string) => {
    console.log("Attempting to delete public ROM:", id);
    if (!isAdmin) return;
    if (!confirm("Segur que vols esborrar aquesta ROM de la Public Room?")) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'delete-rom',
        id
      }));
    } else {
      setError("No hi ha connexió amb el servidor per esborrar.");
    }
  };

  const handleLoadPublicRom = (rom: PublicRom) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError("No hi ha connexió amb el servidor.");
      return;
    }

    setLoading(true);
    socketRef.current.send(JSON.stringify({
      type: 'fetch-rom',
      id: rom.id
    }));
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleTabSwitch = (tab: 'local' | 'public') => {
    setError(null);
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Library className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">Biblioteca de Jocs</h2>
            </div>
            <button 
              onClick={handleClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Tancar
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              onClick={() => handleTabSwitch('local')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'local' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Library className="w-4 h-4" /> La meva Biblioteca
            </button>
            <button
              onClick={() => handleTabSwitch('public')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'public' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Globe className="w-4 h-4" /> Public Room
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {activeTab === 'local' ? (
            <div className="space-y-4">
              {loading && localRoms.length === 0 ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : localRoms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-4">
                  <Library className="w-16 h-16 opacity-20" />
                  <p>La teva biblioteca està buida.</p>
                  <label className="cursor-pointer px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-full transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Pujar ROM
                    <input type="file" className="hidden" accept=".gb,.gbc,.gba" onChange={handleFileUpload} />
                  </label>
                </div>
              ) : (
                <div className="grid gap-3">
                  {localRoms.map((rom) => (
                    <div key={rom.id} className="group flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 transition-all">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-purple-400">GB</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-white truncate">{rom.name}</h3>
                          <p className="text-[10px] text-zinc-500">{(rom.data.byteLength / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onLoadRom(new File([rom.data], rom.name))} className="p-2 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors" title="Jugar">
                          <Play className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => handlePublishToPublic(rom)} className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors" title="Publicar a Public Room">
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteLocal(rom.id)} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors" title="Esborrar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {publicRoms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-4">
                  <Globe className="w-16 h-16 opacity-20" />
                  <p>No hi ha jocs a la Public Room.</p>
                  {isAdmin && <p className="text-xs text-zinc-600">Com a ADMIN, pots publicar jocs des de la teva biblioteca.</p>}
                </div>
              ) : (
                <div className="grid gap-3">
                  {publicRoms.map((rom) => (
                    <div key={rom.id} className="group flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700/50 transition-all">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Globe className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-white truncate">{rom.name}</h3>
                          <p className="text-[10px] text-zinc-500">Publicat per: {rom.addedBy}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleLoadPublicRom(rom)} className="p-2 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded-lg transition-colors" title="Jugar">
                          <Play className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => handleDeletePublic(rom.id)} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors" title="Esborrar de Public Room">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
              <ShieldAlert className="w-3 h-3" />
              <span>Usuari: <span className="text-zinc-300 font-bold">{user}</span></span>
              {isAdmin && <span className="text-amber-500 font-bold uppercase ml-2">[ADMIN]</span>}
            </div>
            {activeTab === 'local' && (
              <div className="flex gap-2">
                <button 
                  onClick={handleNuclearReset}
                  className="px-3 py-2 bg-zinc-950 hover:bg-red-900/20 text-zinc-600 hover:text-red-500 text-[10px] font-bold uppercase rounded-lg transition-all border border-zinc-800 hover:border-red-900/30"
                  title="Reset Nuclear (Si res funciona)"
                >
                  Reset Total
                </button>
                <button 
                  onClick={handleClearLibrary}
                  className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-red-500/20"
                  title="Netejar tota la biblioteca"
                >
                  <Eraser className="w-4 h-4" />
                  Netejar
                </button>
                <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-zinc-700">
                  <Upload className="w-4 h-4" /> Pujar ROM
                  <input type="file" className="hidden" accept=".gb,.gbc,.gba" onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
