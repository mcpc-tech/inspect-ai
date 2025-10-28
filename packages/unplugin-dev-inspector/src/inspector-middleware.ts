import type { Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the inspector client script content
 * Tries multiple paths to locate the bundled inspector script
 */
function getInspectorScript(): string | null {
  // Try multiple possible locations
  const possiblePaths = [
    // Development path (when working in the repo)
    path.resolve(process.cwd(), 'packages/unplugin-dev-inspector/client/dist/inspector.iife.js'),
    // Installed package path - new bundled location
    path.resolve(__dirname, '../client/dist/inspector.iife.js'),
    path.resolve(__dirname, './client/dist/inspector.iife.js'),
    path.resolve(__dirname, '../../client/dist/inspector.iife.js'),
    // Try relative to node_modules
    path.resolve(process.cwd(), 'node_modules/@mcpc-tech/unplugin-dev-inspector-mcp/client/dist/inspector.iife.js'),
  ];

  for (const scriptPath of possiblePaths) {
    try {
      if (fs.existsSync(scriptPath)) {
        console.log('✅ Found inspector script at:', scriptPath);
        return fs.readFileSync(scriptPath, 'utf-8');
      }
    } catch (error) {
      // Continue trying other paths
    }
  }

  console.warn('⚠️  Inspector script not found in any of the expected locations:');
  possiblePaths.forEach(p => console.warn('   -', p));
  return null;
}

/**
 * Get the inspector CSS content
 */
function getInspectorCSS(): string | null {
  const possiblePaths = [
    path.resolve(process.cwd(), 'packages/unplugin-dev-inspector/client/dist/inspector.css'),
    path.resolve(__dirname, '../client/dist/inspector.css'),
    path.resolve(__dirname, './client/dist/inspector.css'),
    path.resolve(__dirname, '../../client/dist/inspector.css'),
    path.resolve(process.cwd(), 'node_modules/@mcpc-tech/unplugin-dev-inspector-mcp/client/dist/inspector.css'),
  ];

  for (const cssPath of possiblePaths) {
    try {
      if (fs.existsSync(cssPath)) {
        return fs.readFileSync(cssPath, 'utf-8');
      }
    } catch (error) {
      // Continue trying other paths
    }
  }
  return null;
}

/**
 * Setup middleware to serve the inspector client script
 */
export function setupInspectorMiddleware(middlewares: Connect.Server) {
  // Cache the inspector script and CSS content on first load
  let cachedScript: string | null = null;
  let cachedCSS: string | null = null;
  let filesChecked = false;

  middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!filesChecked) {
      cachedScript = getInspectorScript();
      cachedCSS = getInspectorCSS();
      filesChecked = true;
    }

    if (req.url === '/__inspector__/inspector.iife.js') {
      if (cachedScript) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(cachedScript);
      } else {
        console.warn('⚠️  Inspector client script not found. Run `pnpm build:client` first.');
        res.statusCode = 404;
        res.end('Inspector script not found');
      }
    } else if (req.url === '/__inspector__/inspector.css') {
      if (cachedCSS) {
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(cachedCSS);
      } else {
        console.warn('⚠️  Inspector CSS not found. Run `pnpm build:client` first.');
        res.statusCode = 404;
        res.end('Inspector CSS not found');
      }
    } else {
      next();
    }
  });
}
