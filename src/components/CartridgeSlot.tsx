import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface CartridgeSlotProps {
  onLoadRom: (file: File) => void;
  romLoaded: boolean;
}

export function CartridgeSlot({ onLoadRom, romLoaded }: CartridgeSlotProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onLoadRom(acceptedFiles[0]);
    }
  }, [onLoadRom]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/octet-stream': ['.gb', '.gbc', '.rom', '.gba'],
    },
    multiple: false
  } as any);

  if (romLoaded) return null;

  return (
    <div 
      {...getRootProps()} 
      className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 text-white p-4 text-center cursor-pointer hover:bg-black/70 transition-colors"
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <Upload className="w-8 h-8 animate-bounce" />
        {isDragActive ? (
          <p className="font-pixel text-xs">Drop ROM here...</p>
        ) : (
          <p className="font-pixel text-xs">Drag & drop .gb file or click to load</p>
        )}
      </div>
    </div>
  );
}
