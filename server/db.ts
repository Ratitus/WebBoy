import Database from 'better-sqlite3';

const db = new Database('public_roms.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS public_roms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data BLOB NOT NULL,
    dateAdded INTEGER NOT NULL,
    addedBy TEXT NOT NULL
  )
`);

export interface PublicRom {
  id: string;
  name: string;
  data: Buffer;
  dateAdded: number;
  addedBy: string;
}

export const addPublicRom = (rom: PublicRom) => {
  const stmt = db.prepare('INSERT INTO public_roms (id, name, data, dateAdded, addedBy) VALUES (?, ?, ?, ?, ?)');
  stmt.run(rom.id, rom.name, rom.data, rom.dateAdded, rom.addedBy);
};

export const getAllPublicRoms = (): PublicRom[] => {
  const stmt = db.prepare('SELECT * FROM public_roms ORDER BY dateAdded DESC');
  return stmt.all() as PublicRom[];
};

export const deletePublicRom = (id: string) => {
  const stmt = db.prepare('DELETE FROM public_roms WHERE id = ?');
  stmt.run(id);
};
