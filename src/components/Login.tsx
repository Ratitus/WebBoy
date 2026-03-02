import React, { useState } from 'react';
import { User, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-6 text-center mb-8">
          <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Benvingut a JOCS MARC</h1>
            <p className="text-zinc-400">Introdueix el teu nom d'usuari per començar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Usuari</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Joan"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                autoFocus
              />
              {username.toUpperCase() === 'ADMIN' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-amber-500">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Modo Admin</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98]"
          >
            Entrar
          </button>
        </form>

        <p className="mt-8 text-[10px] text-zinc-600 text-center leading-relaxed">
          Avís Legal: Aquesta plataforma és un emulador basat en web. JOCS MARC no allotja ni distribueix fitxers amb copyright.
        </p>
      </div>
    </div>
  );
}
