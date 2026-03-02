import React, { useEffect, useRef, useState } from 'react';
import { useGameBoy } from '../hooks/useGameBoy';
import { CartridgeSlot } from './CartridgeSlot';
import { DPad, ActionButton, OptionButton } from './Controls';
import { clsx } from 'clsx';
import { Maximize, Minimize, Save, Upload, Gamepad2, Library, Volume2 } from 'lucide-react';
import { GameLibrary } from './GameLibrary';

interface GameBoyProps {
  user: string;
}

export function GameBoy({ user }: GameBoyProps) {
  const { canvasRef, loadRom, loadBios, pressButton, saveGame, loadSave, resumeAudio, isRunning, fps, romLoaded, biosLoaded } = useGameBoy();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const biosInputRef = useRef<HTMLInputElement>(null);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard events if library modal is open
      if (showLibrary) return;

      switch (e.key) {
        case 'ArrowUp': pressButton('Up', true); break;
        case 'ArrowDown': pressButton('Down', true); break;
        case 'ArrowLeft': pressButton('Left', true); break;
        case 'ArrowRight': pressButton('Right', true); break;
        case 'z': case 'Z': pressButton('A', true); break;
        case 'x': case 'X': pressButton('B', true); break;
        case 'Enter': pressButton('Start', true); break;
        case 'Shift': pressButton('Select', true); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (showLibrary) return;
      
      switch (e.key) {
        case 'ArrowUp': pressButton('Up', false); break;
        case 'ArrowDown': pressButton('Down', false); break;
        case 'ArrowLeft': pressButton('Left', false); break;
        case 'ArrowRight': pressButton('Right', false); break;
        case 'z': case 'Z': pressButton('A', false); break;
        case 'x': case 'X': pressButton('B', false); break;
        case 'Enter': pressButton('Start', false); break;
        case 'Shift': pressButton('Select', false); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pressButton, showLibrary]);

  return (
    <div className="relative w-full h-screen bg-zinc-950 flex items-center justify-center overflow-hidden">
      
      <GameLibrary 
        isOpen={showLibrary} 
        user={user}
        onClose={() => setShowLibrary(false)} 
        onLoadRom={(file) => {
          loadRom(file);
          setShowLibrary(false);
        }} 
      />

      {/* Game Boy Chassis */}
      {/* Mobile/Tablet: Full screen. Desktop: Centered device card */}
      <div className={clsx(
        "flex flex-col bg-zinc-900 shadow-2xl overflow-hidden transition-all duration-500 ease-in-out",
        "w-full h-full", // Mobile/Tablet default
        "lg:w-auto lg:h-auto lg:max-h-[90vh] lg:aspect-[9/16] lg:rounded-[40px] lg:border-8 lg:border-zinc-800", // Desktop overrides
        !showControls && "lg:aspect-video lg:max-h-[80vh] lg:rounded-2xl lg:border-4" // Desktop overrides when controls hidden (Landscape mode)
      )}>
        
        {/* Screen Area (Top Half) */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden border-b-4 border-zinc-950/50 group">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full object-contain rendering-pixelated"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Controls Toggle Button */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            {isRunning && (
              <button 
                onClick={resumeAudio}
                className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full backdrop-blur-md shadow-lg border border-white/10 transition-all hover:scale-110 active:scale-95"
                title="Fix Sound"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            )}
            <button 
              onClick={() => setShowControls(!showControls)}
              className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full backdrop-blur-md shadow-lg border border-white/10 transition-all hover:scale-110 active:scale-95"
              title={showControls ? "Hide Controls" : "Show Controls"}
            >
              {showControls ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
          </div>
          
          {!isRunning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white pointer-events-none p-6 text-center">
               {!romLoaded && (
                 <div className="flex flex-col items-center gap-4 animate-pulse">
                   <Gamepad2 className="w-12 h-12 text-zinc-600" />
                   <div className="text-xl font-mono text-zinc-400">Waiting for ROM...</div>
                 </div>
               )}
            </div>
          )}

          {/* Cartridge Slot Overlay - Visible when no ROM */}
          <div className={clsx("absolute inset-0 flex items-center justify-center pointer-events-none", romLoaded && "hidden")}>
             <div className="pointer-events-auto">
                <CartridgeSlot onLoadRom={loadRom} romLoaded={romLoaded} />
             </div>
          </div>
        </div>

        {/* Controls Area (Bottom Half) */}
        <div className={clsx(
          "shrink-0 bg-zinc-900 relative transition-all duration-500 ease-in-out overflow-hidden",
          showControls ? "p-6 pb-12 lg:p-8 lg:pb-10 max-h-[500px] opacity-100" : "max-h-0 p-0 opacity-0"
        )}>
          
          {/* Decorative Speaker Grille */}
          <div className="absolute bottom-8 right-8 flex gap-1 transform -rotate-12 opacity-20 pointer-events-none">
            <div className="w-1.5 h-12 bg-black rounded-full"></div>
            <div className="w-1.5 h-12 bg-black rounded-full"></div>
            <div className="w-1.5 h-12 bg-black rounded-full"></div>
            <div className="w-1.5 h-12 bg-black rounded-full"></div>
            <div className="w-1.5 h-12 bg-black rounded-full"></div>
            <div className="w-1.5 h-12 bg-black rounded-full"></div>
          </div>

          <div className="max-w-sm mx-auto">
            {/* Top Row: D-Pad and A/B */}
            <div className="flex justify-between items-end gap-4 mb-8">
              <DPad onPress={(dir, pressed) => pressButton(dir, pressed)} />
              
              <div className="flex gap-4 items-end transform -rotate-12 translate-y-2">
                 <ActionButton label="B" onPress={(pressed) => pressButton('B', pressed)} color="purple" className="mt-8" />
                 <ActionButton label="A" onPress={(pressed) => pressButton('A', pressed)} color="red" className="-mt-4" />
              </div>
            </div>

            {/* Bottom Row: Start/Select and Menu Actions */}
            <div className="flex flex-col items-center gap-6">
              <div className="flex gap-6">
                 <OptionButton label="Select" onPress={(pressed) => pressButton('Select', pressed)} />
                 <OptionButton label="Start" onPress={(pressed) => pressButton('Start', pressed)} />
              </div>
              
              {/* Menu Actions (Load/Save) */}
              <div className="flex gap-2 flex-wrap justify-center z-10">
                {!romLoaded && (
                  <>
                    <button 
                      onClick={() => setShowLibrary(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wide rounded-full transition-colors shadow-lg active:scale-95"
                    >
                      <Library className="w-3 h-3" /> Library
                    </button>

                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wide rounded-full transition-colors shadow-lg active:scale-95"
                    >
                      <Upload className="w-3 h-3" /> Load ROM
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      accept=".gb,.gbc,.gba" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) loadRom(e.target.files[0]);
                      }} 
                    />

                    <button 
                      onClick={() => biosInputRef.current?.click()}
                      className={clsx(
                        "flex items-center gap-2 px-4 py-2 text-white text-xs font-bold uppercase tracking-wide rounded-full transition-colors shadow-lg active:scale-95",
                        biosLoaded ? "bg-green-600 hover:bg-green-500" : "bg-zinc-800 hover:bg-zinc-700"
                      )}
                    >
                      <Upload className="w-3 h-3" /> {biosLoaded ? "BIOS Ready" : "Load BIOS"}
                    </button>
                    <input 
                      ref={biosInputRef}
                      type="file" 
                      className="hidden" 
                      accept=".bin,.bios" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) loadBios(e.target.files[0]);
                      }} 
                    />
                  </>
                )}

                {romLoaded && (
                  <>
                    <button 
                      onClick={saveGame}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wide rounded-full transition-colors active:scale-95 border border-zinc-700"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wide rounded-full transition-colors cursor-pointer active:scale-95 border border-zinc-700">
                      <Upload className="w-3 h-3" /> Load Save
                      <input type="file" className="hidden" accept=".sav" onChange={(e) => {
                        if (e.target.files?.[0]) loadSave(e.target.files[0]);
                      }} />
                    </label>
                    <button 
                      onClick={() => setShowLibrary(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wide rounded-full transition-colors shadow-lg active:scale-95"
                    >
                      <Library className="w-3 h-3" /> Library
                    </button>
                  </>
                )}
              </div>
              
              {fps > 0 && <span className="text-zinc-600 text-[10px] font-mono tracking-widest">FPS: {fps}</span>}
            </div>
          </div>
        </div>
      </div>
      
      {/* Legal Notice */}
      <div className="absolute bottom-4 left-0 right-0 px-6 text-center pointer-events-none">
        <p className="text-[10px] text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          Avís Legal: Aquesta plataforma és un emulador basat en web. JOCS MARC no allotja ni distribueix fitxers amb copyright. L'usuari és l'únic responsable dels fitxers que pugi a la Public Room o al Local Storage mitjançant la funció de 'Drag and drop'
        </p>
      </div>
    </div>
  );
}
