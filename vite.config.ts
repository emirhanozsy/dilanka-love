import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

const memoryApiPlugin = () => ({
  name: 'memory-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // GET /api/memories
      if (req.url === '/api/memories' && req.method === 'GET') {
        const filePath = path.resolve('public', 'memories.json');
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, JSON.stringify([]));
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
        return;
      }
      
      // POST /api/memories
      if (req.url === '/api/memories' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const newMemory = JSON.parse(body);
            
            const uploadsDir = path.resolve('public', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            const savedImages = [];
            if (newMemory.imagesBase64 && Array.isArray(newMemory.imagesBase64)) {
               for (const b64 of newMemory.imagesBase64) {
                 const matches = b64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                 if (matches && matches.length === 3) {
                   const buffer = Buffer.from(matches[2], 'base64');
                   const fileName = `img_${Date.now()}_${Math.floor(Math.random()*10000)}.jpg`;
                   fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
                   savedImages.push(`/uploads/${fileName}`);
                 } else {
                   savedImages.push(b64);
                 }
               }
            }
            
            const filePath = path.resolve('public', 'memories.json');
            let memories = [];
            if (fs.existsSync(filePath)) {
               memories = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }

            // Check if a memory with the same date already exists
            const existingIdx = memories.findIndex((m) => m.date === newMemory.date);

            if (existingIdx !== -1) {
              // Append images to the existing memory for that date
              const existing = memories[existingIdx];
              const existingImages = [
                ...(existing.images || []),
                ...(existing.image ? [existing.image] : []),
              ];
              // Remove legacy `image` field, use `images` array going forward
              delete existing.image;
              existing.images = [...existingImages, ...savedImages];
              memories[existingIdx] = existing;
              fs.writeFileSync(filePath, JSON.stringify(memories, null, 2));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, appended: true, memory: existing }));
            } else {
              // New date — create a new memory entry
              newMemory.images = savedImages;
              delete newMemory.imagesBase64;
              memories.unshift(newMemory);
              fs.writeFileSync(filePath, JSON.stringify(memories, null, 2));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, appended: false, memory: newMemory }));
            }
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // DELETE /api/memories/:id
      if (req.url?.startsWith('/api/memories/') && req.method === 'DELETE') {
        const id = req.url.replace('/api/memories/', '');
        const filePath = path.resolve('public', 'memories.json');
        if (fs.existsSync(filePath)) {
          let memories = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          memories = memories.filter((m: { id: string }) => m.id !== id);
          fs.writeFileSync(filePath, JSON.stringify(memories, null, 2));
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // PATCH /api/memories/:id
      if (req.url?.startsWith('/api/memories/') && req.method === 'PATCH') {
        const id = req.url.replace('/api/memories/', '');
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { note } = JSON.parse(body);
            const filePath = path.resolve('public', 'memories.json');
            let memories = [];
            if (fs.existsSync(filePath)) {
              memories = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
            memories = memories.map((m: { id: string }) => m.id === id ? { ...m, note } : m);
            fs.writeFileSync(filePath, JSON.stringify(memories, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }
      
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), memoryApiPlugin()],
  server: {
    host: '0.0.0.0', // Allow network access
  }
})
