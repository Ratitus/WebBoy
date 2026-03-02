const DB_NAME = 'GameBoyLibrary';
const STORE_NAME = 'roms';
const DB_VERSION = 1;

export interface SavedRom {
  id: string;
  name: string;
  data: ArrayBuffer;
  dateAdded: number;
  addedBy?: string;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveRomToLibrary = async (file: File): Promise<SavedRom> => {
  const db = await openDB();
  const arrayBuffer = await file.arrayBuffer();
  
  const rom: SavedRom = {
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
    name: file.name,
    data: arrayBuffer,
    dateAdded: Date.now(),
  };

  console.log("Saving ROM to IndexedDB:", rom.id, rom.name);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(rom);

    request.onsuccess = () => resolve(rom);
    request.onerror = () => reject(request.error);
  });
};

export const getLibraryRoms = async (): Promise<SavedRom[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by date added (newest first)
      const roms = request.result as SavedRom[];
      console.log("Loaded ROMs from IndexedDB:", roms.length);
      resolve(roms.sort((a, b) => b.dateAdded - a.dateAdded));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteRomFromLibrary = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearLibrary = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
