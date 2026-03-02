import { SavedRom } from "./romDatabase";

type Message = 
  | { type: 'init', roms: any[] }
  | { type: 'rom-added', rom: any }
  | { type: 'rom-deleted', id: string };

export class PublicLibraryService {
  private ws: WebSocket | null = null;
  private onUpdate: (roms: SavedRom[]) => void;
  private roms: SavedRom[] = [];

  constructor(onUpdate: (roms: SavedRom[]) => void) {
    this.onUpdate = onUpdate;
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.ws = new WebSocket(`${protocol}//${host}`);

    this.ws.onmessage = (event) => {
      const data: Message = JSON.parse(event.data);
      
      switch (data.type) {
        case 'init':
          this.roms = data.roms.map(this.mapRom);
          this.onUpdate([...this.roms]);
          break;
        case 'rom-added':
          this.roms.push(this.mapRom(data.rom));
          this.onUpdate([...this.roms]);
          break;
        case 'rom-deleted':
          this.roms = this.roms.filter(r => r.id !== data.id);
          this.onUpdate([...this.roms]);
          break;
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 3000);
    };
  }

  private mapRom(rom: any): SavedRom {
    // Convert base64 back to ArrayBuffer
    const binaryString = window.atob(rom.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return {
      id: rom.id,
      name: rom.name,
      data: bytes.buffer,
      dateAdded: rom.dateAdded,
      addedBy: rom.addedBy
    };
  }

  public async addRom(file: File) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);

    this.ws.send(JSON.stringify({
      type: 'add-rom',
      name: file.name,
      data: base64,
      addedBy: 'User' // Could be dynamic if we had auth
    }));
  }

  public deleteRom(id: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'delete-rom', id }));
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
