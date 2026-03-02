import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { getAllPublicRoms, addPublicRom, deletePublicRom, PublicRom } from "./server/db.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // Set headers for SharedArrayBuffer support
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    next();
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // WebSocket handling
  wss.on("connection", (ws) => {
    console.log("Client connected");

    // Send initial library metadata (NO DATA)
    const roms = getAllPublicRoms().map(r => ({
      id: r.id,
      name: r.name,
      dateAdded: r.dateAdded,
      addedBy: r.addedBy
    }));
    ws.send(JSON.stringify({ type: "init", roms }));

    ws.on("message", (message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        if (payload.type === "add-rom") {
          const newRom: PublicRom = {
            id: Math.random().toString(36).substring(2, 15),
            name: payload.name,
            data: Buffer.from(payload.data, 'base64'),
            dateAdded: Date.now(),
            addedBy: payload.addedBy || "Anonymous"
          };
          addPublicRom(newRom);
          
          // Broadcast metadata only
          const broadcastMsg = JSON.stringify({ 
            type: "rom-added", 
            rom: { 
              id: newRom.id,
              name: newRom.name,
              dateAdded: newRom.dateAdded,
              addedBy: newRom.addedBy
            } 
          });
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastMsg);
            }
          });
        }

        if (payload.type === "fetch-rom") {
          const roms = getAllPublicRoms();
          const rom = roms.find(r => r.id === payload.id);
          if (rom) {
            ws.send(JSON.stringify({ 
              type: "rom-data", 
              id: rom.id,
              data: rom.data.toString('base64') 
            }));
          }
        }

        if (payload.type === "delete-rom") {
          deletePublicRom(payload.id);
          // Broadcast to all
          const broadcastMsg = JSON.stringify({ type: "rom-deleted", id: payload.id });
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastMsg);
            }
          });
        }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist
    app.use(express.static(path.join(__dirname, "dist")));
    
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
