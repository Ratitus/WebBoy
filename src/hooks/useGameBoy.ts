import { useEffect, useRef, useState, useCallback } from 'react';
import { Gameboy } from 'gameboy-emulator';
import GameBoyAdvance from 'gbajs';

// Polyfill SharedArrayBuffer if not available to prevent fatal crashes.
// Note: This may cause audio issues as the emulator expects real SharedArrayBuffer for sync.
if (typeof window !== 'undefined' && typeof (window as any).SharedArrayBuffer === 'undefined') {
  (window as any).SharedArrayBuffer = ArrayBuffer;
}

export function useGameBoy() {
  const gameboyRef = useRef<Gameboy | null>(null);
  const gbaRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [fps, setFps] = useState(0);
  const [romLoaded, setRomLoaded] = useState(false);
  const [systemType, setSystemType] = useState<'gb' | 'gba' | null>(null);
  const [bios, setBios] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    return () => {
      if (gameboyRef.current) {
        // Cleanup
      }
      if (gbaRef.current) {
        // Cleanup
      }
    };
  }, []);

  const loadBios = useCallback(async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      setBios(arrayBuffer);
    } catch (error) {
    }
  }, []);

  const resumeAudio = useCallback(async () => {
    try {
      if (gameboyRef.current) {
        if (gameboyRef.current.apu) {
          const apu = gameboyRef.current.apu;
          if (apu.audioContext && apu.audioContext.state === 'suspended') {
            await apu.audioContext.resume();
          }
          // Ensure sound is enabled in the emulator
          if (typeof SharedArrayBuffer !== 'undefined') {
            apu.enableSound();
          }
        }
      }
      if (gbaRef.current && gbaRef.current.audio) {
        const audio = gbaRef.current.audio;
        if (audio.context && audio.context.state === 'suspended') {
          await audio.context.resume();
        }
      }
    } catch (e) {
      console.error("Audio resume failed:", e);
    }
  }, []);

  const loadRom = useCallback(async (file: File) => {
    const isGBA = file.name.toLowerCase().endsWith('.gba');
    
    setIsRunning(false);
    if (gameboyRef.current) gameboyRef.current = null;
    if (gbaRef.current) {
      gbaRef.current.pause();
      gbaRef.current = null;
    }

    // Try to resume audio context on ROM load as it's a user action
    resumeAudio();

    if (isGBA) {
      setSystemType('gba');
      const gba = new GameBoyAdvance();
      gbaRef.current = gba;
      
      if (canvasRef.current) {
        // Set canvas dimensions for GBA
        canvasRef.current.width = 240;
        canvasRef.current.height = 160;
        gba.setCanvas(canvasRef.current);
        
        if (bios) {
          gba.setBios(bios);
        } else {
          // console.warn("No GBA BIOS loaded. Using dummy BIOS to jump to ROM.");
          // Create a dummy BIOS that jumps to 0x08000000 (ROM Start)
          // We need enough space for the reset vector and some code
          const dummyBios = new ArrayBuffer(0x4000);
          const view = new DataView(dummyBios);
          // ARM instruction: LDR PC, [PC, #24] (Load address from 0x20 into PC)
          // 0xE59FF018
          // Actually, let's just use a simple branch if possible, or LDR.
          // 0xEA000000 is B.
          
          // Let's try the LDR PC, [PC, #0] approach to load immediate 0x08000000
          // Address 0x00: E59FF000 (LDR PC, [PC, #0] -> loads from PC+8 = 0x08)
          // Address 0x04: 00000000 (NOP/Padding)
          // Address 0x08: 08000000 (Target Address)
          
          view.setUint32(0, 0xE59FF000, true); // Little endian
          view.setUint32(4, 0x00000000, true);
          view.setUint32(8, 0x08000000, true);
          
          gba.setBios(dummyBios);
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (result) {
             try {
               gba.setRom(result);
               gba.runStable();
               setRomLoaded(true);
               setIsRunning(true);
             } catch (err) {
             }
          }
        };
        reader.readAsArrayBuffer(file);
      }

    } else {
      setSystemType('gb');
      
      // Check for SharedArrayBuffer support before initializing GB emulator
      if (typeof SharedArrayBuffer === 'undefined') {
        // console.warn("SharedArrayBuffer is not available. Audio might fail.");
        // We can't easily polyfill it for the emulator, but we can try to proceed
        // and catch errors if they happen during initialization.
      }

      try {
        const gb = new Gameboy();
        gameboyRef.current = gb;

        if (canvasRef.current) {
          // Set canvas dimensions for GB
          canvasRef.current.width = 160;
          canvasRef.current.height = 144;
        }

        let lastFpsUpdate = performance.now();
        
        gb.onFrameFinished((imageData: ImageData, currentFps: number) => {
          if (canvasRef.current && systemType !== 'gba') { 
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.putImageData(imageData, 0, 0);
            }
          }
          
          // Throttle state updates to once per second to save RAM/CPU
          const now = performance.now();
          if (now - lastFpsUpdate > 1000) {
            setFps(Math.round(currentFps));
            lastFpsUpdate = now;
          }
        });

        const arrayBuffer = await file.arrayBuffer();
        gb.loadGame(arrayBuffer);
        setRomLoaded(true);
        
        gb.run();
        setIsRunning(true);
        // Only enable sound if context is available/supported
        if (gb.apu && typeof SharedArrayBuffer !== 'undefined') {
           gb.apu.enableSound();
        }
      } catch (error) {
      }
    }
  }, [bios, systemType]);

  const pressButton = useCallback((button: 'A' | 'B' | 'Start' | 'Select' | 'Up' | 'Down' | 'Left' | 'Right', pressed: boolean) => {
    if (pressed) {
      resumeAudio();
    }
    
    if (systemType === 'gba' && gbaRef.current) {
      const gba = gbaRef.current;
      const keypad = gba.keypad;
      let key = -1;
      switch (button) {
        case 'A': key = 0; break;
        case 'B': key = 1; break;
        case 'Select': key = 2; break;
        case 'Start': key = 3; break;
        case 'Right': key = 4; break;
        case 'Left': key = 5; break;
        case 'Up': key = 6; break;
        case 'Down': key = 7; break;
      }
      if (key !== -1) {
        if (pressed) keypad.keydown(key);
        else keypad.keyup(key);
      }
    } else if (gameboyRef.current) {
      const input = gameboyRef.current.input;
      switch (button) {
        case 'A': input.isPressingA = pressed; break;
        case 'B': input.isPressingB = pressed; break;
        case 'Start': input.isPressingStart = pressed; break;
        case 'Select': input.isPressingSelect = pressed; break;
        case 'Up': input.isPressingUp = pressed; break;
        case 'Down': input.isPressingDown = pressed; break;
        case 'Left': input.isPressingLeft = pressed; break;
        case 'Right': input.isPressingRight = pressed; break;
      }
    }
  }, [systemType]);

  const saveGame = useCallback(() => {
    if (!romLoaded) {
      alert("No hi ha cap joc carregat per guardar.");
      return;
    }

    try {
      if (systemType === 'gba' && gbaRef.current) {
        // GBAjs usually handles its own download, but we can try to check if it has data
        if (gbaRef.current.downloadSavedata) {
          gbaRef.current.downloadSavedata();
          // We can't easily check the size here as the library handles the download
        } else {
          alert("L'emulador GBA no suporta la descàrrega directa de partides.");
        }
      } else if (gameboyRef.current) {
        const saveRam = gameboyRef.current.getCartridgeSaveRam();
        
        if (saveRam && saveRam.byteLength > 0) {
          const blob = new Blob([saveRam], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'save.sav';
          a.click();
          URL.revokeObjectURL(url);
          alert("Partida de Game Boy guardada correctament!");
        } else {
          alert("El fitxer de guardat està buit. Recorda que has de guardar la partida DINS del menú del propi joc abans de polsar aquest botó.");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Error al intentar guardar la partida.");
    }
  }, [systemType, romLoaded]);

  const loadSave = useCallback(async (file: File) => {
    if (!romLoaded) {
      alert("Carrega primer un joc abans de carregar una partida.");
      return;
    }

    try {
      if (systemType === 'gba' && gbaRef.current) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && gbaRef.current) {
            try {
              gbaRef.current.loadSavedata(e.target.result);
              alert("Partida GBA carregada correctament!");
            } catch (err) {
              alert("Error al carregar la partida GBA.");
            }
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (gameboyRef.current) {
        const arrayBuffer = await file.arrayBuffer();
        gameboyRef.current.setCartridgeSaveRam(arrayBuffer);
        alert("Partida Game Boy carregada correctament!");
      }
    } catch (error) {
      alert("Error al llegir el fitxer de partida.");
    }
  }, [systemType, romLoaded]);

  return {
    canvasRef,
    loadRom,
    loadBios,
    pressButton,
    saveGame,
    loadSave,
    resumeAudio,
    isRunning,
    fps,
    romLoaded,
    systemType,
    biosLoaded: !!bios
  };
}
