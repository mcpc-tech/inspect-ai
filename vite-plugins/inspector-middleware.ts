import type { Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

/**
 * Setup middleware to serve the inspector client script
 */
export function setupInspectorMiddleware(middlewares: Connect.Server) {
  middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url === '/__inspector__/inspector.iife.js') {
      const clientScriptPath = path.resolve(process.cwd(), 'vite-plugins/client/dist/inspector.iife.js');
      
      try {
        const content = fs.readFileSync(clientScriptPath, 'utf-8');
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(content);
      } catch (error) {
        res.statusCode = 404;
        res.end('Inspector script not found');
      }
    } else {
      next();
    }
  });
}
