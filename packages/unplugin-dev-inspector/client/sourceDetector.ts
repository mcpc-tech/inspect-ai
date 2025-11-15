import type { InspectedElement, ReactFiber } from './types';

function getElementInfo(element: Element) {
  const computedStyles = window.getComputedStyle(element);
  
  return {
    tagName: element.tagName.toLowerCase(),
    textContent: element.textContent?.trim().slice(0, 100) || '',
    className: element.className || '',
    id: element.id || '',
    attributes: Array.from(element.attributes).reduce((acc, attr) => {
      if (!attr.name.startsWith('data-') && attr.name !== 'class' && attr.name !== 'id') {
        acc[attr.name] = attr.value;
      }
      return acc;
    }, {} as Record<string, string>),
    styles: {
      display: computedStyles.display,
      position: computedStyles.position,
      width: computedStyles.width,
      height: computedStyles.height,
      backgroundColor: computedStyles.backgroundColor,
      color: computedStyles.color,
      fontSize: computedStyles.fontSize,
      padding: computedStyles.padding,
      margin: computedStyles.margin,
      border: computedStyles.border,
    },
  };
}

export const getSourceInfo = (element: Element): InspectedElement => {
  // First, try to get data-source attribute directly
  let current: Element | null = element;
  const maxDepth = 20;
  let depth = 0;

  // Check current element and parents for data-source attribute
  while (current && depth < maxDepth) {
    const dataSource = current.getAttribute('data-source');
    if (dataSource) {
      // Parse data-source format: "file:line:col"
      const parts = dataSource.split(':');
      if (parts.length >= 3) {
        const col = parts.pop() || '0';
        const line = parts.pop() || '0';
        const file = parts.join(':'); // Re-join in case file path contains colons
        
        return {
          file: file,
          component: element.tagName.toLowerCase(),
          apis: [],
          line: parseInt(line, 10),
          column: parseInt(col, 10),
          element,
          elementInfo: getElementInfo(element),
        };
      }
    }
    current = current.parentElement;
    depth++;
  }

  // Fallback to React Fiber detection
  current = element;
  depth = 0;

  while (current && depth < maxDepth) {
    const fiberKey = Object.keys(current as any).find(key =>
      key.startsWith('__reactInternalInstance') ||
      key.startsWith('__reactFiber') ||
      key.startsWith('__react'),
    );

    if (fiberKey) {
      let fiber: ReactFiber | undefined = (current as any)[fiberKey];

      while (fiber) {
        if (fiber.type && typeof fiber.type === 'function') {
          const componentName: string = fiber.type.name || fiber.type.displayName || 'Anonymous';
          if (componentName && componentName !== 'Anonymous' && componentName !== '') {
            const metadata = (window as any).__SOURCE_INSPECTOR__ && (window as any).__SOURCE_INSPECTOR__[componentName];
            if (metadata) {
              return { ...metadata, element, elementInfo: getElementInfo(element) };
            }
            return {
              file: 'unknown',
              component: componentName,
              apis: [],
              line: 0,
              column: 0,
              element,
              elementInfo: getElementInfo(element),
            };
          }
        }
        fiber = fiber._owner || fiber.return;
      }
    }

    current = current.parentElement;
    depth++;
  }

  return {
    file: 'unknown',
    component: element.tagName.toLowerCase(),
    apis: [],
    line: 0,
    column: 0,
    element,
    elementInfo: getElementInfo(element),
  };
};
