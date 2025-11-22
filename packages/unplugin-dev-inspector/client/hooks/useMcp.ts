import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { useEffect, useRef } from "react";
import { createClientExecClient } from "@mcpc-tech/cmcp";
import { TOOL_SCHEMAS } from "../../src/tool-schemas.js";

const STORAGE_KEY = 'inspector-feedback-items';
const FEEDBACK_ID_KEY = 'inspector-current-feedback-id';
const TIMEOUT_MS = 600_000;

let pendingResolve: ((value: any) => void) | null = null;
let pendingReject: ((reason: any) => void) | null = null;

function clearPendingRequest() {
  pendingResolve = null;
  pendingReject = null;
}

function cancelPendingRequest(reason: string) {
  if (pendingReject) {
    pendingReject(new Error(reason));
    clearPendingRequest();
  }
}

function activateInspector() {
  window.dispatchEvent(new CustomEvent("activate-inspector"));
  return { success: true };
}

function createTextContent(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function formatElementInfo(elementInfo: any) {
  if (!elementInfo) return '';
  
  const { tagName, textContent, className, id: elemId, styles } = elementInfo;
  const idAttr = elemId ? ` id="${elemId}"` : '';
  const classAttr = className ? ` class="${className}"` : '';
  
  return `
**DOM Element**:
\`\`\`
Tag: <${tagName}${idAttr}${classAttr}>
Text: ${textContent || '(empty)'}
\`\`\`

**Key Styles**:
- display: ${styles.display}
- color: ${styles.color}
- background: ${styles.backgroundColor}
- font-size: ${styles.fontSize}
`;
}

function getAllFeedbacks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const items = saved ? JSON.parse(saved) : [];
    
    if (items.length === 0) {
      return createTextContent("# No Feedback Items\n\nThe queue is empty. Use 'inspect_element' to add tasks.");
    }
    
    const feedbackList = items.map((item: any, index: number) => {
      const { id, sourceInfo, feedback, status, progress, result } = item;
      const statusText = (status === 'loading' && progress)
        ? `LOADING (${progress.completed}/${progress.total} steps)`
        : status.toUpperCase();
      
      return `## ${index + 1}. Feedback ID: \`${id}\`

**Status**: ${statusText}
**File**: ${sourceInfo.file}
**Line**: ${sourceInfo.line}
**Component**: ${sourceInfo.component}
${formatElementInfo(sourceInfo.elementInfo)}
**User Request**:
${feedback}

${result ? `**Result**: ${result}\n` : ''}---`;
    }).join('\n\n');
    
    const hint = `\n\n## How to Update\n\nUse \`update_feedback_status\` tool to update any feedback:\n\n\`\`\`\nupdate_feedback_status({\n  feedbackId: "feedback-xxx",  // Copy from above\n  status: "completed",\n  message: "Your summary here"\n})\n\`\`\``;
    
    return createTextContent(`# Feedback Queue (${items.length} items)\n\n${feedbackList}${hint}`);
  } catch (e) {
    return createTextContent("# Error\n\nFailed to load feedback items.");
  }
}

function formatResult(sourceInfo: any, feedback: string) {
  const { file, line, component, elementInfo } = sourceInfo;
  const fullPath = file.startsWith('examples/') ? file : `examples/demo/${file}`;
  
  const domInfo = elementInfo ? `
## DOM Element
\`\`\`
Tag: <${elementInfo.tagName}${elementInfo.id ? ` id="${elementInfo.id}"` : ''}${elementInfo.className ? ` class="${elementInfo.className}"` : ''}>
Text: ${elementInfo.textContent || '(empty)'}
DOM Path: ${elementInfo.domPath || 'N/A'}
\`\`\`

### Position & Size
${elementInfo.boundingBox ? `
- **Position**: (${Math.round(elementInfo.boundingBox.x)}, ${Math.round(elementInfo.boundingBox.y)})
- **Size**: ${Math.round(elementInfo.boundingBox.width)}px × ${Math.round(elementInfo.boundingBox.height)}px
` : ''}

### Computed Styles (Key Properties)
${elementInfo.computedStyles ? `
**Layout**:
- display: ${elementInfo.computedStyles.layout.display}
- position: ${elementInfo.computedStyles.layout.position}
- z-index: ${elementInfo.computedStyles.layout.zIndex}

**Typography**:
- font: ${elementInfo.computedStyles.typography.fontSize} ${elementInfo.computedStyles.typography.fontFamily}
- color: ${elementInfo.computedStyles.typography.color}
- text-align: ${elementInfo.computedStyles.typography.textAlign}

**Spacing**:
- padding: ${elementInfo.computedStyles.spacing.padding}
- margin: ${elementInfo.computedStyles.spacing.margin}

**Background & Border**:
- background: ${elementInfo.computedStyles.background.backgroundColor}
- border: ${elementInfo.computedStyles.border.border}
- border-radius: ${elementInfo.computedStyles.border.borderRadius}

**Effects**:
- opacity: ${elementInfo.computedStyles.effects.opacity}
- box-shadow: ${elementInfo.computedStyles.effects.boxShadow || 'none'}
- transform: ${elementInfo.computedStyles.effects.transform || 'none'}
` : `
**Legacy Styles**:
\`\`\`css
display: ${elementInfo.styles?.display}
color: ${elementInfo.styles?.color}
background: ${elementInfo.styles?.backgroundColor}
font-size: ${elementInfo.styles?.fontSize}
padding: ${elementInfo.styles?.padding}
margin: ${elementInfo.styles?.margin}
\`\`\`
`}
` : '';
  
  return createTextContent(`# Element Inspection Result

## Source Code
- **File**: ${fullPath}
- **Line**: ${line}
- **Component**: ${component}
${domInfo}
## User Request
${feedback}

## Debugging Tips

If you encounter issues:

1. **Check Browser Console**: Look for errors related to this component
   - Open DevTools → Console tab
   - Filter by component name or file
   
2. **Inspect Network**: Check if required assets/APIs are loading
   - Open DevTools → Network tab
   - Look for failed requests (red status)
   
3. **Verify Element Exists**: Use the DOM path to confirm element is rendered
   - DOM Path: ${elementInfo?.domPath || 'Use browser inspector'}
   
4. **Get Fresh Context**: Use patch_context tool to get current computed styles
   - Helpful after making changes to verify they applied
   - Can retrieve updated DOM state, styles, or events`);
}

function patchContext(args: any) {
  const { feedbackId, contextType = 'all' } = args;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const items = saved ? JSON.parse(saved) : [];
    const feedbackItem = items.find((item: any) => item.id === feedbackId);
    
    if (!feedbackItem) {
      return createTextContent(`Error: Feedback item '${feedbackId}' not found. Use 'get_all_feedbacks' to see available items.`);
    }
    
    const { sourceInfo } = feedbackItem;
    if (!sourceInfo.elementInfo?.domPath) {
      return createTextContent(`Error: No DOM path available for this element. Cannot retrieve fresh context.`);
    }
    
    // Try to locate the element using the DOM path
    // This is a best-effort approach and may not always work
    const domPath = sourceInfo.elementInfo.domPath;
    let element: Element | null = null;
    
    // Try direct selector if it has an ID
    if (sourceInfo.elementInfo.id) {
      element = document.getElementById(sourceInfo.elementInfo.id);
    }
    
    // Fallback: try to find by class and tag combination
    if (!element && sourceInfo.elementInfo.className) {
      const selector = `${sourceInfo.elementInfo.tagName}.${sourceInfo.elementInfo.className.split(' ')[0]}`;
      const candidates = document.querySelectorAll(selector);
      // Use the first match (rough approximation)
      element = candidates[0] || null;
    }
    
    if (!element) {
      return createTextContent(`# Unable to Locate Element

The element from feedback '${feedbackId}' could not be found in the current DOM.

**Possible reasons**:
- Element was removed or unmounted
- Page navigation occurred
- Element is in a different state/route

**Original DOM Path**: ${domPath}

**Suggestion**: Inspect the element again using 'inspect_element' tool.`);
    }
    
    // Element found! Extract fresh context
    const computedStyles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    let contextData = '';
    
    if (contextType === 'styles' || contextType === 'all') {
      contextData += `
## Fresh Computed Styles

### Layout
\`\`\`css
display: ${computedStyles.display}
position: ${computedStyles.position}
width: ${computedStyles.width}
height: ${computedStyles.height}
overflow: ${computedStyles.overflow}
z-index: ${computedStyles.zIndex}
\`\`\`

### Typography
\`\`\`css
font-family: ${computedStyles.fontFamily}
font-size: ${computedStyles.fontSize}
font-weight: ${computedStyles.fontWeight}
line-height: ${computedStyles.lineHeight}
color: ${computedStyles.color}
text-align: ${computedStyles.textAlign}
\`\`\`

### Spacing
\`\`\`css
padding: ${computedStyles.padding}
margin: ${computedStyles.margin}
\`\`\`

### Background & Border
\`\`\`css
background-color: ${computedStyles.backgroundColor}
background-image: ${computedStyles.backgroundImage}
border: ${computedStyles.border}
border-radius: ${computedStyles.borderRadius}
\`\`\`

### Effects
\`\`\`css
opacity: ${computedStyles.opacity}
visibility: ${computedStyles.visibility}
box-shadow: ${computedStyles.boxShadow}
transform: ${computedStyles.transform}
\`\`\`
`;
    }
    
    if (contextType === 'dom' || contextType === 'all') {
      const currentAttrs = Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {} as Record<string, string>);
      
      contextData += `
## Current DOM State

**Tag**: ${element.tagName.toLowerCase()}
**ID**: ${element.id || '(none)'}
**Classes**: ${element.className || '(none)'}
**Text Content**: ${element.textContent?.trim().slice(0, 100) || '(empty)'}

**Current Position**:
- X: ${Math.round(rect.x)}px, Y: ${Math.round(rect.y)}px
- Width: ${Math.round(rect.width)}px, Height: ${Math.round(rect.height)}px

**Attributes**:
\`\`\`json
${JSON.stringify(currentAttrs, null, 2)}
\`\`\`
`;
    }
    
    if (contextType === 'events' || contextType === 'all') {
      // Event listeners are not directly accessible via standard DOM APIs
      // This is a limitation of browser security
      contextData += `
## Event Listeners

*Note: Event listeners cannot be retrieved via standard DOM APIs for security reasons.*

To inspect event listeners:
1. Open DevTools → Elements tab
2. Select the element
3. View "Event Listeners" panel
`;
    }
    
    return createTextContent(`# Fresh Context for Feedback '${feedbackId}'

**Original Component**: ${sourceInfo.component}
**File**: ${sourceInfo.file}:${sourceInfo.line}
**DOM Path**: ${domPath}
${contextData}

---
*Context retrieved at: ${new Date().toLocaleTimeString()}*`);
    
  } catch (e) {
    return createTextContent(`Error: Failed to retrieve context. ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

function updateFeedbackStatus(args: any) {
  const { feedbackId: providedId, status, progress, message } = args;
  let feedbackId = providedId || sessionStorage.getItem(FEEDBACK_ID_KEY) || '';

  if (!feedbackId) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const items = saved ? JSON.parse(saved) : [];
      const loadingItem = items.find((item: any) => item.status === 'loading');
      
      if (loadingItem) {
        feedbackId = loadingItem.id;
        sessionStorage.setItem(FEEDBACK_ID_KEY, feedbackId);
      } else {
        return createTextContent("Error: No active feedback item found. Please use 'get_all_feedbacks' to see the queue, then provide the feedbackId parameter.");
      }
    } catch {
      return createTextContent("Error: No active feedback item");
    }
  }

  if (progress) {
    window.dispatchEvent(new CustomEvent("plan-progress-reported", {
      detail: { plan: { steps: progress.steps }, feedbackId, timestamp: new Date().toISOString() },
    }));
  }

  if (status === 'completed' || status === 'failed') {
    sessionStorage.removeItem(FEEDBACK_ID_KEY);
    const resultMessage = message || (status === 'completed' ? 'Task completed' : 'Task failed');
    window.dispatchEvent(new CustomEvent("feedback-result-received", {
      detail: {
        status: status === 'completed' ? "success" : "error",
        result: { message: resultMessage },
        feedbackId,
      },
    }));
    return createTextContent(`Feedback marked as ${status}.`);
  }

  return createTextContent("Status updated");
}

export function useMcp() {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (clientRef.current) return;

    const client = createClientExecClient(
      new Client(
        { name: "inspector", version: "0.1.0" },
        { capabilities: { tools: {} } }
      ),
      "inspector"
    );

    // Tool implementations
    async function inspectElement() {
      cancelPendingRequest("New inspect request started");
      activateInspector();

      return new Promise((resolve, reject) => {
        pendingResolve = resolve;
        pendingReject = reject;

        setTimeout(() => {
          if (pendingReject === reject) {
            clearPendingRequest();
            reject(new Error("Timeout: No element selected"));
          }
        }, TIMEOUT_MS);
      });
    }

    // Event handlers
    function handleElementInspected(event: CustomEvent) {
      if (!pendingResolve) return;

      const { sourceInfo, feedback, feedbackId } = event.detail;
      sessionStorage.setItem(FEEDBACK_ID_KEY, feedbackId);
      
      pendingResolve(formatResult(sourceInfo, feedback));
      clearPendingRequest();
    }

    function handleInspectorCancelled() {
      sessionStorage.removeItem(FEEDBACK_ID_KEY);
      cancelPendingRequest("Inspector cancelled by user");
    }

    // Register all event listeners
    const eventHandlers = [
      { event: "element-inspected", handler: handleElementInspected },
      { event: "inspector-cancelled", handler: handleInspectorCancelled },
    ];

    eventHandlers.forEach(({ event, handler }) => {
      window.addEventListener(event, handler as EventListener);
    });

    // Register all tools
    client.registerTools([
      {
        ...TOOL_SCHEMAS.get_all_feedbacks,
        implementation: getAllFeedbacks,
      },
      {
        ...TOOL_SCHEMAS.inspect_element,
        implementation: inspectElement,
      },
      {
        ...TOOL_SCHEMAS.update_feedback_status,
        implementation: updateFeedbackStatus,
      },
      {
        ...TOOL_SCHEMAS.patch_context,
        implementation: patchContext,
      },
    ]);

    const transport = new SSEClientTransport(
      new URL("/__mcp__/sse?sessionId=chrome", window.location.origin)
    );

    client
      .connect(transport)
      .then(() => {
        clientRef.current = client;
      })
      .catch((err) => {
        console.error("MCP connection error:", err);
      });

    return () => {
      eventHandlers.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler as EventListener);
      });
      transport.close?.();
    };
  }, []);

  return clientRef.current;
}
