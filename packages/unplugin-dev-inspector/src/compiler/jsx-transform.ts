import MagicString from 'magic-string';
import { parse } from '@babel/parser';
import type { JSXOpeningElement } from '@babel/types';
import path from 'node:path';
import { createRequire } from 'node:module';

// Use createRequire to load CJS modules
const require = createRequire(import.meta.url);
const traverse = require('@babel/traverse').default;

// Ensure normalizePath is typed correctly
function normalizePath(id: string): string {
  return id.split(path.sep).join('/');
}

const DATA_SOURCE_ATTR = 'data-source';

interface TransformOptions {
  code: string;
  id: string;
}

export async function transformJSX({ code, id }: TransformOptions): Promise<{ code: string; map: any } | null> {
  // Get relative path from cwd
  const relativePath = normalizePath(path.relative(process.cwd(), id));
  
  // Parse JSX/TSX code with Babel
  const ast = parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      'classProperties',
      'importMeta',
    ],
  });

  const s = new MagicString(code);
  let hasModifications = false;

  // Traverse AST and inject data-source attribute
  traverse(ast, {
    JSXOpeningElement(path: any) {
      const node = path.node as JSXOpeningElement;
      
      // Skip if already has data-source attribute
      const hasDataSource = node.attributes.some(
        (attr) => attr.type === 'JSXAttribute' && attr.name.name === DATA_SOURCE_ATTR
      );
      
      if (hasDataSource) return;

      // Get position info
      const { line, column } = node.loc!.start;
      const sourceValue = `${relativePath}:${line}:${column}`;

      // Find the end of the tag name (handles Foo, Foo.Bar, Foo.Bar.Baz)
      const nameNode = node.name;
      const nameEnd = nameNode.end!;
      
      // Insert right after the tag name
      const attr = ` ${DATA_SOURCE_ATTR}="${sourceValue}"`;
      s.appendLeft(nameEnd, attr);
      hasModifications = true;
    },
  });

  if (!hasModifications) {
    return null;
  }

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}
