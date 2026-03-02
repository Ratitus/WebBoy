import React from 'react';
import { cn } from '../lib/utils';

interface DPadProps {
  onPress: (direction: 'Up' | 'Down' | 'Left' | 'Right', pressed: boolean) => void;
}

export function DPad({ onPress }: DPadProps) {
  // Helper to handle touch/mouse events
  const handleStart = (dir: 'Up' | 'Down' | 'Left' | 'Right') => (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPress(dir, true);
  };

  const handleEnd = (dir: 'Up' | 'Down' | 'Left' | 'Right') => (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPress(dir, false);
  };

  return (
    <div className="relative w-40 h-40 touch-none select-none">
      {/* Up */}
      <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-zinc-800 rounded-t-lg hover:bg-zinc-700 active:bg-zinc-600 transition-colors cursor-pointer shadow-lg active:shadow-inner border-b border-zinc-900/50"
           onMouseDown={handleStart('Up')} onMouseUp={handleEnd('Up')} onMouseLeave={handleEnd('Up')}
           onTouchStart={handleStart('Up')} onTouchEnd={handleEnd('Up')} />
      
      {/* Down */}
      <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-zinc-800 rounded-b-lg hover:bg-zinc-700 active:bg-zinc-600 transition-colors cursor-pointer shadow-lg active:shadow-inner border-t border-zinc-900/50"
           onMouseDown={handleStart('Down')} onMouseUp={handleEnd('Down')} onMouseLeave={handleEnd('Down')}
           onTouchStart={handleStart('Down')} onTouchEnd={handleEnd('Down')} />
      
      {/* Left */}
      <div className="absolute left-0 top-1/3 w-1/3 h-1/3 bg-zinc-800 rounded-l-lg hover:bg-zinc-700 active:bg-zinc-600 transition-colors cursor-pointer shadow-lg active:shadow-inner border-r border-zinc-900/50"
           onMouseDown={handleStart('Left')} onMouseUp={handleEnd('Left')} onMouseLeave={handleEnd('Left')}
           onTouchStart={handleStart('Left')} onTouchEnd={handleEnd('Left')} />
      
      {/* Right */}
      <div className="absolute right-0 top-1/3 w-1/3 h-1/3 bg-zinc-800 rounded-r-lg hover:bg-zinc-700 active:bg-zinc-600 transition-colors cursor-pointer shadow-lg active:shadow-inner border-l border-zinc-900/50"
           onMouseDown={handleStart('Right')} onMouseUp={handleEnd('Right')} onMouseLeave={handleEnd('Right')}
           onTouchStart={handleStart('Right')} onTouchEnd={handleEnd('Right')} />
           
      {/* Center (Decoration) */}
      <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-zinc-800" />
      <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-gradient-to-br from-white/5 to-black/20 pointer-events-none rounded-full" />
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onPress: (pressed: boolean) => void;
  color?: 'red' | 'purple';
  className?: string;
}

export function ActionButton({ label, onPress, color = 'red', className }: ActionButtonProps) {
  const handleStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPress(true);
  };
  const handleEnd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPress(false);
  };

  return (
    <div className={cn("flex flex-col items-center gap-2 touch-none select-none", className)}>
      <button
        className={cn(
          "w-16 h-16 rounded-full shadow-lg active:shadow-inner active:translate-y-1 transition-all border-b-4 active:border-b-0",
          color === 'red' 
            ? "bg-red-600 hover:bg-red-500 border-red-800" 
            : "bg-purple-700 hover:bg-purple-600 border-purple-900"
        )}
        onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd}
        onTouchStart={handleStart} onTouchEnd={handleEnd}
      />
      <span className="font-bold text-zinc-500 text-sm tracking-widest">{label}</span>
    </div>
  );
}

interface OptionButtonProps {
  label: string;
  onPress: (pressed: boolean) => void;
}

export function OptionButton({ label, onPress }: OptionButtonProps) {
  const handleStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPress(true);
  };
  const handleEnd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPress(false);
  };

  return (
    <div className="flex flex-col items-center gap-1 transform rotate-[-15deg] touch-none select-none">
      <button
        className="w-16 h-4 bg-zinc-800 rounded-full shadow-md active:shadow-inner active:translate-y-0.5 transition-all hover:bg-zinc-700 border border-zinc-900"
        onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd}
        onTouchStart={handleStart} onTouchEnd={handleEnd}
      />
      <span className="font-bold text-zinc-500 text-[10px] tracking-widest uppercase">{label}</span>
    </div>
  );
}
