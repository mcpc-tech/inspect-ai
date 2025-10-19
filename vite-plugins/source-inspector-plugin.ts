import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { setupMcpServer } from './mcp-server.js';
import { setupInspectorMiddleware } from './inspector-middleware.js';

interface SourceMetadata {
  file: string;
  component: string;
  apis: string[];
  line: number;
  column: number;
}

export function sourceInspectorPlugin(): Plugin {
  const sourceMapCache = new Map<string, SourceMetadata>();
  
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



  return {
    name: 'source-inspector-plugin',
    apply: 'serve',

    transform(code, id) {
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
      
      let transformedCode = code;

      const metadata = {
        file: relativeId,
        component: componentName,
        apis,
        line,
        column,
      };

      const injectCode = `if (typeof window !== 'undefined') { window.__SOURCE_INSPECTOR__ = window.__SOURCE_INSPECTOR__ || {}; window.__SOURCE_INSPECTOR__['${componentName}'] = ${JSON.stringify(metadata)}; }`;
      
      const lines = transformedCode.split('\n');
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i].trim();
        if (lineText && !lineText.startsWith('import') && !lineText.startsWith('//') && !lineText.startsWith('/*')) {
          insertIndex = i;
          break;
        }
      }
      
      if (insertIndex > 0) {
        lines.splice(insertIndex, 0, injectCode);
        transformedCode = lines.join('\n');
      } else if (lines.length > 0) {
        transformedCode = transformedCode + '\n' + injectCode;
      }

      return {
        code: transformedCode,
        map: null,
      };
    },

    transformIndexHtml(html) {
      // Check if the inspector script exists
      const clientScriptPath = path.resolve(process.cwd(), 'vite-plugins/client/dist/inspector.iife.js');
      
      try {
        fs.accessSync(clientScriptPath);
      } catch {
        console.warn('⚠️  Inspector client script not found. Run `pnpm build:inspector` first.');
        return html;
      }

      // Inject script tag that loads the inspector as a separate file
      return html.replace(
        '</body>',
        `<script src="/__inspector__/inspector.iife.js"></script></body>`
      );
    },

    configureServer(server) {
      console.log('\n✨ Source Inspector Plugin enabled!');
      console.log('👁️  Click the floating eye icon to inspect elements\n');
      console.log(`sourceMapCache initialized with ${sourceMapCache?.size} entries.`, sourceMapCache);
      
      setupMcpServer(sourceMapCache, server.middlewares);
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
  };
}
