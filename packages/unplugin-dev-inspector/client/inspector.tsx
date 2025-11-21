import inspectorStyles from './styles.css';
import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import type { InspectedElement } from './types';
import { Notification } from './components/Notification';
import { FeedbackBubble } from './components/FeedbackBubble';
import { type FeedbackItem } from './components/FeedbackCart';
import { Overlay, Tooltip } from './components/Overlays';
import { useNotification } from './hooks/useNotification';
import { useInspectorHover } from './hooks/useInspectorHover';
import { useInspectorClick } from './hooks/useInspectorClick';
import { useMcp } from './hooks/useMcp';
import { Toaster } from './components/ui/sonner';
import { cn } from './lib/utils';
import { InspectorThemeProvider, useInspectorTheme } from './context/ThemeContext';

// --- Inspector Container ---

// Context for Portal components
const InspectorContainerContext = createContext<HTMLElement | ShadowRoot | null>(null);
export const useInspectorContainer = () => useContext(InspectorContainerContext);
// Alias for backward compatibility with existing components
export const useShadowRoot = useInspectorContainer;

const STORAGE_KEY = 'inspector-feedback-items';

function loadFeedbackItems(): FeedbackItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveFeedbackItems(items: FeedbackItem[]) {
  try {
    console.log('💾 Saving feedback items:', items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.warn('Failed to save feedback items');
  }
}

interface InspectorContainerProps {
  shadowRoot?: ShadowRoot;
}

// Import new components
import { InspectorBar } from './components/InspectorBar';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { AVAILABLE_AGENTS, DEFAULT_AGENT } from './constants/agents';

const InspectorContainer: React.FC<InspectorContainerProps> = ({ shadowRoot }) => {
  useMcp();
  const { resolvedTheme } = useInspectorTheme();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [sourceInfo, setSourceInfo] = useState<InspectedElement | null>(null);
  const [bubbleMode, setBubbleMode] = useState<'input' | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(loadFeedbackItems);

  // Agent State
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/acp/chat",
    }),
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null); // Kept for hooks but not rendered

  const { notification, showNotif } = useNotification();

  // Restore active feedback ID on mount
  useEffect(() => {
    const activeFeedbackId = sessionStorage.getItem('inspector-current-feedback-id');
    if (!activeFeedbackId) return;

    const feedbackExists = feedbackItems.some(item => item.id === activeFeedbackId);
    if (!feedbackExists) {
      sessionStorage.removeItem('inspector-current-feedback-id');
    }
  }, []);

  // Handle ESC key to exit inspection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isActive) {
          handleBubbleClose();
        }
        // Also support CMD+K to focus inspector bar (handled in component, but global shortcut here if needed)
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Save feedback items to localStorage whenever they change
  useEffect(() => {
    saveFeedbackItems(feedbackItems);
  }, [feedbackItems]);

  useInspectorHover({
    isActive,
    isWaitingForFeedback: bubbleMode !== null,
    overlayRef,
    tooltipRef,
    btnRef,
  });

  useInspectorClick({
    isActive,
    isWaitingForFeedback: bubbleMode !== null,
    onElementInspected: (info) => {
      setSourceInfo(info);
      setBubbleMode('input');

      if (overlayRef.current) overlayRef.current.style.display = 'none';
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
    },
    btnRef,
  });

  const toggleInspector = () => {
    const newActive = !isActive;
    setIsActive(newActive);

    document.body.style.cursor = newActive ? 'crosshair' : '';

    if (newActive) {
      setBubbleMode(null);
    } else {
      if (overlayRef.current) overlayRef.current.style.display = 'none';
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      setBubbleMode(null);
    }

    showNotif(newActive ? '🔍 Inspector ON - Click any element' : '✅ Inspector OFF');
  };

  const handleFeedbackSubmit = (feedback: string) => {
    if (!sourceInfo) return;

    const feedbackId = `feedback-${Date.now()}`;
    const newItem: FeedbackItem = {
      id: feedbackId,
      sourceInfo: {
        file: sourceInfo.file,
        component: sourceInfo.component,
        line: sourceInfo.line,
        column: sourceInfo.column,
        elementInfo: sourceInfo.elementInfo,
      },
      feedback,
      status: 'loading',
      timestamp: Date.now(),
    };

    setFeedbackItems(prev => [...prev, newItem]);
    setBubbleMode(null);
    setIsActive(false);
    document.body.style.cursor = '';

    // Send to agent via sendMessage
    // Construct a cleaner prompt without cyclic references
    const cleanSourceInfo = {
      file: sourceInfo.file,
      component: sourceInfo.component,
      line: sourceInfo.line,
      column: sourceInfo.column,
      elementInfo: sourceInfo.elementInfo,
    };
    const prompt = `Context: ${JSON.stringify(cleanSourceInfo, null, 2)}\n\nRequest: ${feedback}`;

    // We need to use the default agent for now or the one selected in a future settings UI
    const currentAgent = AVAILABLE_AGENTS.find(a => a.command === DEFAULT_AGENT) || AVAILABLE_AGENTS[0];

    sendMessage(
      { text: prompt },
      {
        body: {
          agent: currentAgent,
          envVars: {}, // TODO: Handle env vars
        }
      }
    );
  };

  const handleBubbleClose = () => {
    setBubbleMode(null);
    setIsActive(false);
    document.body.style.cursor = '';

    if (overlayRef.current) overlayRef.current.style.display = 'none';
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';
  };

  const handleAgentSubmit = (query: string) => {
    const currentAgent = AVAILABLE_AGENTS.find(a => a.command === DEFAULT_AGENT) || AVAILABLE_AGENTS[0];
    sendMessage(
      { text: query },
      {
        body: {
          agent: currentAgent,
          envVars: {},
        }
      }
    );
  };

  return (
    <div
      ref={setContainer}
      className={cn(
        "font-sans antialiased w-full h-full pointer-events-none fixed inset-0",
        resolvedTheme === 'dark' && 'dark'
      )}
    >
      <InspectorContainerContext.Provider value={container || shadowRoot || null}>

        {/* New UI Components */}
        <div className="pointer-events-auto">
          <InspectorBar
            isActive={isActive}
            onToggleInspector={toggleInspector}
            onSubmitAgent={handleAgentSubmit}
            isAgentWorking={status === 'streaming' || status === 'submitted'}
            messages={messages}
            status={status}
            feedbackCount={feedbackItems.length}
          />
        </div>

        <Overlay ref={overlayRef} visible={isActive && bubbleMode === null} />
        <Tooltip ref={tooltipRef} visible={isActive && bubbleMode === null} />

        {notification && <Notification message={notification} />}

        {bubbleMode && sourceInfo && (
          <div className="pointer-events-auto">
            <FeedbackBubble
              sourceInfo={sourceInfo}
              mode={bubbleMode}
              onSubmit={handleFeedbackSubmit}
              onClose={handleBubbleClose}
            />
          </div>
        )}

        <Toaster />
      </InspectorContainerContext.Provider>
    </div>
  );
};

// Initialize
class DevInspector extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: 'open' });

    // Inject styles into Shadow DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = inspectorStyles;
    shadowRoot.appendChild(styleElement);

    // Create mount point for React inside Shadow DOM
    const mountPoint = document.createElement('div');
    shadowRoot.appendChild(mountPoint);

    // Render React app inside Shadow DOM with ShadowRoot context
    const reactRoot = ReactDOM.createRoot(mountPoint);
    reactRoot.render(
      React.createElement(InspectorThemeProvider, null,
        React.createElement(InspectorContainer, { shadowRoot })
      )
    );
  }
}

if (!customElements.get('dev-inspector')) {
  customElements.define('dev-inspector', DevInspector);
}

