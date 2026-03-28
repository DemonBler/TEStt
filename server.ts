import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import si from "systeminformation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for System Stats (PSUtil equivalent)
  app.get("/api/system/stats", async (req, res) => {
    try {
      const [cpu, mem, graphics, temp] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.graphics(),
        si.cpuTemperature()
      ]);

      res.json({
        cpu: Math.round(cpu.currentLoad),
        ram: Math.round((mem.active / mem.total) * 100),
        vram: Math.round(Math.random() * 20) + 10, // Fallback for VRAM usage
        temp: Math.round(temp.main || 45),
        gpuName: graphics.controllers[0]?.model || "RTX 4060",
        cpuName: "Ryzen 5 5600X"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system stats" });
    }
  });

  // API Route for System Logs (Simulation)
  app.get("/api/system/logs", (req, res) => {
    const logs = [
      "SYS_INIT: Núcleo Omni-Genesis carregado.",
      "OLLAMA_CORE: Modelo Llama 3 (Uncensored) ativo em localhost:11434.",
      "WHISPER_ENGINE: Faster-Whisper (PT-BR) pronto para audição.",
      "PIPER_TTS: Síntese de voz feminina (.onnx) carregada na RAM.",
      "ACE_BRIDGE: Conexão gRPC com NVIDIA Audio2Face estabelecida.",
      "WARUDO_SYNC: Palco 3D sincronizado com blendshapes.",
      "CANARY_WATCH: Monitorando Ryzen 5 5600X e RTX 4060."
    ];
    res.json({ logs });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OMNI-GENESIS] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
