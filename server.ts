import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // --- OMNI-GENESIS BACKEND: PONTE DE HARDWARE (WEB SOCKET) ---
  // Este servidor WebSocket é a ponte entre os seus scripts locais (Python/OpenClaw/OpenCV)
  // e a interface React (Three.js/VRM).
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[OMNI-GENESIS BACKEND] Cliente conectado ao stream de hardware.');

    // Aqui, o seu script Python (OpenClaw) enviaria dados para este servidor Node.
    // Para fins de demonstração (quando você baixar e rodar sem o Python),
    // o servidor Node vai gerar um sinal de "respiração/idle" para manter o VRM vivo.
    const interval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      
      const time = Date.now() / 1000;
      
      // Enviando dados de Cinemática Inversa (IK) falsos para a cabeça do VRM
      // O seu script Python deve enviar JSONs neste exato formato.
      ws.send(JSON.stringify({
        type: 'vrm_ik',
        data: {
          head: {
            rotation: [
              Math.sin(time) * 0.05, // Pitch (x)
              Math.cos(time * 0.5) * 0.1, // Yaw (y)
              0 // Roll (z)
            ]
          }
        }
      }));
    }, 1000 / 30); // 30 FPS Stream

    ws.on('message', (message) => {
      // Recebe comandos do Python (ex: "executar script VDI", "mover mouse")
      console.log(`[OMNI-GENESIS BACKEND] Comando recebido do hardware: ${message}`);
    });

    ws.on('close', () => {
      clearInterval(interval);
      console.log('[OMNI-GENESIS BACKEND] Cliente desconectado.');
    });
  });

  // --- API REST ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Omni-Genesis Backend Ativo' });
  });

  // --- VITE MIDDLEWARE (FRONTEND) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n[OMNI-GENESIS] Servidor Full-Stack rodando em http://localhost:${PORT}`);
    console.log(`[OMNI-GENESIS] Ponte WebSocket aberta em ws://localhost:${PORT}\n`);
  });
}

startServer();
