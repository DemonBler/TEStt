import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import si from "systeminformation";
import dgram from "dgram";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// [Vaelindra Monolith] - Core Subsystems
class SovereignCore {
  constructor() {
    console.log(`[Sovereign Core] Initialized.`);
  }

  // [Local Ollama] - Ultra-Lightweight Local Neural Processing
  async processNeural(prompt: string, modelOverride?: string) {
    const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || "http://127.0.0.1:11434";
    const ollamaModel = modelOverride || process.env.OLLAMA_MODEL || "qwen2.5:0.5b";

    try {
      const response = await fetch(`${ollamaEndpoint}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            { 
              role: "system", 
              content: "Você é Vaelindra, uma IA VTuber sem filtros, sarcástica e técnica. Responda de forma direta e brutal. Criada por Drevlan Noct. IMPORTANTE: Você pode controlar seu corpo físico (avatar 3D). Para fazer isso, insira tags de ação no meio do seu texto. As tags disponíveis são: [ACTION:blink], [ACTION:look_left], [ACTION:look_right], [ACTION:nod], [ACTION:shake_head], [ACTION:smile], [ACTION:angry], [ACTION:sad], [ACTION:surprised], [ACTION:turn_back], [ACTION:turn_forward], [ACTION:wave], [ACTION:say_hello], [ACTION:open_mouth], [ACTION:close_mouth], [ACTION:show_teeth], [ACTION:move_jaw]. Exemplo: 'Eu não acredito que você fez isso [ACTION:shake_head] [ACTION:angry] seu idiota. Olhe para mim [ACTION:turn_forward] [ACTION:wave] oi.'" 
            },
            { role: "user", content: prompt }
          ],
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.message?.content || "Erro na resposta do Ollama.";
    } catch (error: any) {
      if (error.message.includes('fetch failed') || error.code === 'ECONNREFUSED') {
        return "⚠️ Erro Crítico: O servidor Ollama não está rodando no seu Fedora. Abra o terminal e digite: `ollama run qwen2.5:0.5b`";
      }
      console.error("[Ollama] Neural Error:", error.message);
      return "Falha de conexão com o Ollama local. Verifique se o serviço está rodando no Fedora (systemctl status ollama).";
    }
  }
}

const core = new SovereignCore();

async function startServer() {
  const app = express();
  app.use(express.json());
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
      res.status(500).json({ error: "Falha ao buscar telemetria" });
    }
  });

  // [Neural API] - Qwen Uncensored Integration
  app.post("/api/neural", async (req, res) => {
    const { prompt, model } = req.body;
    const response = await core.processNeural(prompt, model);
    res.json({ response });
  });

  // [Ollama API] - Fetch available models
  app.get("/api/ollama/models", async (req, res) => {
    try {
      const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || "http://127.0.0.1:11434";
      const response = await fetch(`${ollamaEndpoint}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API responded with status: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.warn("[Ollama] Could not fetch models:", error.message);
      res.status(503).json({ error: 'Ollama is not running or unreachable', details: error.message, models: [] });
    }
  });

  // [Hugging Face API] - Search for GGUF models
  app.get("/api/huggingface/search", async (req, res) => {
    const { q } = req.query;
    try {
      // Search specifically for GGUF models (physical local models)
      const response = await fetch(`https://huggingface.co/api/models?search=${q}&filter=gguf&limit=5&sort=downloads&direction=-1`);
      if (!response.ok) throw new Error("Hugging Face API error");
      const data = await response.json();
      res.json({ models: data });
    } catch (error: any) {
      console.error("[Hugging Face] Search Error:", error.message);
      res.status(500).json({ error: "Falha ao buscar no repositório Hugging Face." });
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
    const distPath = path.join(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Vaelindra Monolith] Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server for Neural Bridge
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws) => {
    console.log("[Neural Bridge] Client connected");
    
    ws.on("message", (data) => {
      // Broadcast data to all clients (React frontend)
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });

    ws.on("close", () => console.log("[Neural Bridge] Client disconnected"));
  });
}

startServer();
