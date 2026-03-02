/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameBoy } from './components/GameBoy';
import { Login } from './components/Login';

export default function App() {
  const [user, setUser] = useState<string | null>(null);

  // Load user from session storage if exists
  useEffect(() => {
    const savedUser = sessionStorage.getItem('gameboy_user');
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const handleLogin = (username: string) => {
    setUser(username);
    sessionStorage.setItem('gameboy_user', username);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <GameBoy user={user} />;
}
