import { createUnplugin } from 'unplugin';
import fs from 'fs';
import path from 'path';
import type { Connect } from 'vite';
import { setupMcpServer } from './mcp-server.js';
import { setupInspectorMiddleware } from './inspector-middleware.js';

export interface SourceMetadata {
  file: string;
  component: string;
  apis: string[];
  line: number;
  column: number;
}

export interface DevInspectorOptions {
  /**
   * Enable/disable the plugin
   * @default true in development, false in production
   */
  enabled?: boolean;
  
  /**
   * Enable MCP server for AI integration
   * @default true
   */
  enableMcp?: boolean;
}

const apiPatterns = [
  /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /\.request\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /url:\s*['"`]([^'"`]+)['"`]/g,
];

function extractAPIsFromCode(code: string): string[] {
  const apis = new Set<string>();
  
  apiPatterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.source, 'g');
    while ((match = regex.exec(code)) !== null) {
      const apiUrl = match[match.length - 1];
      if (apiUrl && apiUrl.length > 0) {
        apis.add(apiUrl);
      }
    }
  });
  
  return Array.from(apis);
}

function extractComponentName(code: string, id: string): string {
  let match = code.match(/export\s+default\s+function\s+(\w+)/);
  if (match) return match[1];
  
  match = code.match(/export\s+default\s+(\w+)/);
  if (match) return match[1];
  
  match = code.match(/function\s+(\w+)\s*\(/);
  if (match) return match[1];
  
  match = code.match(/const\s+(\w+)\s*=/);
  if (match) return match[1];
  
  return path.basename(id, path.extname(id));
}

function getLineAndColumn(code: string, componentName: string): { line: number; column: number } {
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes(`function ${componentName}`) ||
      line.includes(`const ${componentName}`) ||
      (line.includes('export default') && line.includes(componentName))
    ) {
      const column = line.indexOf(componentName) + 1;
      return {
        line: i + 1,
        column: column,
      };
    }
  }
  
  return { line: 1, column: 1 };
}

export const unplugin = createUnplugin<DevInspectorOptions | undefined>((options = {}) => {
  const sourceMapCache = new Map<string, SourceMetadata>();
  
  const enabled = options.enabled ?? process.env.NODE_ENV !== 'production';
  const enableMcp = options.enableMcp ?? true;

  if (!enabled) {
    return {
      name: 'unplugin-dev-inspector',
    };
  }

  return {
    name: 'unplugin-dev-inspector',
    
    enforce: 'pre',

    transform(code, id) {
      // Only process JS/TS/JSX/TSX files, skip node_modules
      if (!id.match(/\.(tsx?|jsx?)$/) || id.includes('node_modules')) {
        return;
      }

      const relativeId = path.relative(process.cwd(), id);
      const apis = extractAPIsFromCode(code);
      const componentName = extractComponentName(code, id);
      const { line, column } = getLineAndColumn(code, componentName);
      
      sourceMapCache.set(relativeId, {
        file: relativeId,
        component: componentName,
        apis,
        line,
        column,
      });
      
      const metadata = {
        file: relativeId,
        component: componentName,
        apis,
        line,
        column,
      };

      const injectCode = `\nif (typeof window !== 'undefined') { window.__SOURCE_INSPECTOR__ = window.__SOURCE_INSPECTOR__ || {}; window.__SOURCE_INSPECTOR__['${componentName}'] = ${JSON.stringify(metadata)}; }\n`;
      
      // Find the position after all imports
      const lines = code.split('\n');
      let insertIndex = -1;
      let inMultiLineImport = false;
      let lastImportLine = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i].trim();
        
        // Check if we're starting a multi-line import
        if (lineText.startsWith('import') && lineText.includes('{') && !lineText.includes('}')) {
          inMultiLineImport = true;
          continue;
        }
        
        // Check if we're ending a multi-line import
        if (inMultiLineImport) {
          if (lineText.includes('}') && lineText.includes('from')) {
            inMultiLineImport = false;
            lastImportLine = i;
          }
          continue;
        }
        
        // Single line import
        if (lineText.startsWith('import')) {
          lastImportLine = i;
          continue;
        }
        
        // If we found a non-import, non-comment, non-empty line after imports
        if (lastImportLine >= 0 && lineText && 
            !lineText.startsWith('//') && 
            !lineText.startsWith('/*') &&
            !lineText.startsWith('*')) {
          // Insert right after the last import
          insertIndex = lastImportLine + 1;
          break;
        }
      }
      
      // If we found where to insert, do it
      if (insertIndex > 0 && insertIndex < lines.length) {
        lines.splice(insertIndex, 0, injectCode);
        return {
          code: lines.join('\n'),
          map: null,
        };
      }
      
      // If we only found imports and nothing else, insert after last import
      if (lastImportLine >= 0) {
        lines.splice(lastImportLine + 1, 0, injectCode);
        return {
          code: lines.join('\n'),
          map: null,
        };
      }
      
      // Otherwise, prepend at the start (no imports found)
      return {
        code: injectCode + code,
        map: null,
      };
    },

    // Vite-specific hooks
    vite: {
      apply: 'serve',
      
      transformIndexHtml(html) {
        // Inject inspector CSS and client script
        const injectedHead = html.replace(
          '</head>',
          `<link rel="stylesheet" href="/__inspector__/inspector.css"></head>`
        );
        return injectedHead.replace(
          '</body>',
          `<script src="/__inspector__/inspector.iife.js"></script></body>`
        );
      },

      configureServer(server) {
        console.log('\n✨ Dev Inspector Plugin enabled!');
        console.log('👁️  Click the floating eye icon to inspect elements\n');
        
        if (enableMcp) {
          setupMcpServer(sourceMapCache, server.middlewares);
        }
        setupInspectorMiddleware(server.middlewares);
      },

      handleHotUpdate({ file }) {
        const relativeId = path.relative(process.cwd(), file);
        if (file.match(/\.(tsx?|jsx?)$/) && !file.includes('node_modules')) {
          try {
            const code = fs.readFileSync(file, 'utf-8');
            const apis = extractAPIsFromCode(code);
            const componentName = extractComponentName(code, file);
            const { line, column } = getLineAndColumn(code, componentName);
            
            sourceMapCache.set(relativeId, {
              file: relativeId,
              component: componentName,
              apis,
              line,
              column,
            });
          } catch (error) {
            // Ignore errors
          }
        }
      },
    },

    // Webpack-specific hooks
    webpack(compiler) {
      // Webpack implementation would go here
      console.log('⚠️  Webpack support coming soon');
    },

    // Rollup-specific hooks
    rollup: {
      // Rollup implementation
    },

    // esbuild-specific hooks  
    esbuild: {
      setup(build) {
        // esbuild implementation
      },
    },
  };
});

export default unplugin;
