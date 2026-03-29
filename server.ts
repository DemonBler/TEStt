import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import si from "systeminformation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API for Hardware Telemetry
  app.get("/api/telemetry", async (req, res) => {
    try {
      const cpu = await si.cpu();
      const mem = await si.mem();
      const gpu = await si.graphics();
      const load = await si.currentLoad();
      
      res.json({
        cpu: {
          brand: cpu.brand,
          load: load.currentLoad,
          temp: (await si.cpuTemperature()).main
        },
        mem: {
          total: mem.total,
          active: mem.active,
          swaptotal: mem.swaptotal,
          swapused: mem.swapused
        },
        gpu: gpu.controllers.map(g => ({
          model: g.model,
          vram: g.vram,
          utilization: g.utilizationGpu,
          temp: g.temperatureGpu
        }))
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch telemetry" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sovereign Core] Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server for VMC/OSC Bridge
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("[VMC Bridge] Client connected");
    
    ws.on("message", (data) => {
      // Broadcast VMC data to all clients (React frontend)
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });

    ws.on("close", () => console.log("[VMC Bridge] Client disconnected"));
  });
}

startServer();
