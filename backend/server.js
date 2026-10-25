/**
 * Node.js Express & Socket.IO full-stack entry point
 */
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './socketHandler.js';
import { WORD_CATEGORIES } from './words.js';
import { connectDB, getDBStatus, getGlobalLeaderboard, getRecentMatches } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function createServer() {
  const app = express();
  const server = http.createServer(app);

  // Initialize MongoDB connection in background
  connectDB().catch(err => console.error('[MongoDB] Init error:', err.message));

  // Attach Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Setup game socket handlers
  setupSocketHandlers(io);

  // Express JSON middleware & CORS headers for cross-origin deployments (e.g. Vercel)
  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  app.get('/api/db/status', (req, res) => {
    res.json(getDBStatus());
  });

  app.get('/api/leaderboard', async (req, res) => {
    try {
      const data = await getGlobalLeaderboard(20);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/matches', async (req, res) => {
    try {
      const data = await getRecentMatches(10);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/categories', (req, res) => {
    res.json(WORD_CATEGORIES);
  });

  const distPath = path.resolve(rootDir, 'dist');
  const isProduction = process.env.NODE_ENV === 'production' || (!process.env.NODE_ENV && fs.existsSync(distPath));

  if (!isProduction) {
    // Dynamic import of Vite in dev mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: rootDir,
      server: {
        middlewareMode: true
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files from /dist
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.resolve(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Index HTML not found. Run npm run build.');
        }
      });
    } else {
      console.warn('[skribbl-server] /dist directory not found. Please build frontend with: npm run build');
      app.get('/', (req, res) => {
        res.send('Frontend build not found. Please run "npm run build" to build the client.');
      });
    }
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[skribbl-server] Running on http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });

  return server;
}

createServer().catch(err => {
  console.error('[skribbl-server] Failed to start:', err);
  process.exit(1);
});
