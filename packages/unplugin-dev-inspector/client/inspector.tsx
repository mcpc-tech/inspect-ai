import './styles.css';
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { InspectedElement } from './types';
import { Notification } from './components/Notification';
import { FeedbackBubble } from './components/FeedbackBubble';
import { FeedbackCart, type FeedbackItem } from './components/FeedbackCart';
import { InspectorButton } from './components/InspectorButton';
import { Overlay, Tooltip } from './components/Overlays';
import { useNotification } from './hooks/useNotification';
import { useInspectorHover } from './hooks/useInspectorHover';
import { useInspectorClick } from './hooks/useInspectorClick';
import { useMcp } from './hooks/useMcp';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';

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

const InspectorContainer: React.FC = () => {
  useMcp();
  
  const [isActive, setIsActive] = useState(false);
  const [sourceInfo, setSourceInfo] = useState<InspectedElement | null>(null);
  const [bubbleMode, setBubbleMode] = useState<'input' | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(loadFeedbackItems);
  const [showCart, setShowCart] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      if (e.key === 'Escape' && isActive) {
        handleBubbleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Save feedback items to localStorage whenever they change
  useEffect(() => {
    saveFeedbackItems(feedbackItems);
  }, [feedbackItems]);

  // Handle feedback result updates
  useEffect(() => {
    const handleResultReceived = (event: Event) => {
      const { status, result, feedbackId } = (event as CustomEvent).detail;
      
      setFeedbackItems(prev => 
        prev.map(item => 
          item.id === feedbackId 
            ? { 
                ...item, 
                status: status === 'success' ? 'success' : 'error',
                result: result.message || `Processing ${status === 'success' ? 'completed' : 'failed'}`
              }
            : item
        )
      );
      
      showNotif(status === 'success' ? '✅ AI processing completed' : '⚠️ AI processing failed');
    };

    const handlePlanProgress = (event: Event) => {
      const { plan, feedbackId } = (event as CustomEvent).detail;
      const completedSteps = plan.steps.filter((s: any) => s.status === 'completed').length;
      
      setFeedbackItems(prev =>
        prev.map(item =>
          item.id === feedbackId
            ? { ...item, status: 'loading', progress: { completed: completedSteps, total: plan.steps.length } }
            : item
        )
      );
    };

    const handleActivateInspector = () => {
      if (!isActive && btnRef.current) btnRef.current.click();
    };

    const events = [
      ['feedback-result-received', handleResultReceived],
      ['plan-progress-reported', handlePlanProgress],
      ['activate-inspector', handleActivateInspector]
    ] as const;

    events.forEach(([name, handler]) => window.addEventListener(name, handler as EventListener));
    return () => events.forEach(([name, handler]) => window.removeEventListener(name, handler as EventListener));
  }, [showNotif, isActive]);

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

  const toggleInspector = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newActive = !isActive;
    setIsActive(newActive);
    
    btnRef.current?.classList.toggle('active', newActive);
    document.body.style.cursor = newActive ? 'crosshair' : '';

    if (!newActive) {
      if (overlayRef.current) overlayRef.current.style.display = 'none';
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
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
    btnRef.current?.classList.remove('active');
    document.body.style.cursor = '';
    
    window.dispatchEvent(new CustomEvent('element-inspected', {
      detail: { sourceInfo, feedback, feedbackId },
    }));
  };

  const handleBubbleClose = () => {
    setBubbleMode(null);
    setIsActive(false);
    btnRef.current?.classList.remove('active');
    document.body.style.cursor = '';
    
    if (overlayRef.current) overlayRef.current.style.display = 'none';
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';

    window.dispatchEvent(new CustomEvent('inspector-cancelled'));
  };

  const handleRemoveFeedback = (id: string) => {
    setFeedbackItems(prev => prev.filter(item => item.id !== id));
  };

  const handleMouseEnter = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (feedbackItems.length > 0) setShowCart(true);
  };

  const handleMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => setShowCart(false), 150);
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Popover open={showCart && feedbackItems.length > 0} onOpenChange={setShowCart}>
          <PopoverTrigger asChild>
            <InspectorButton 
              ref={btnRef} 
              isActive={isActive} 
              onClick={toggleInspector}
              feedbackCount={feedbackItems.length}
            />
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-0" 
            side="top" 
            align="center"
            sideOffset={4}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <FeedbackCart
              items={feedbackItems}
              onRemove={handleRemoveFeedback}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Overlay ref={overlayRef} visible={isActive && bubbleMode === null} />
      <Tooltip ref={tooltipRef} visible={isActive && bubbleMode === null} />

      {notification && <Notification message={notification} />}

      {bubbleMode && sourceInfo && (
        <FeedbackBubble
          sourceInfo={sourceInfo}
          mode={bubbleMode}
          onSubmit={handleFeedbackSubmit}
          onClose={handleBubbleClose}
        />
      )}
      
      <Toaster />
    </>
  );
};

// Initialize
export function initInspector(): void {
  const INSPECTOR_ID = 'source-inspector-plugin-v1';
  if ((window as any)[INSPECTOR_ID]) return;
  (window as any)[INSPECTOR_ID] = true;

  const root = document.createElement('div');
  root.id = 'source-inspector-root';
  document.body.appendChild(root);

  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(
    React.createElement(ThemeProvider, { 
      attribute: 'class',
      defaultTheme: 'system',
      enableSystem: true,
      storageKey: 'inspector-theme',
    }, React.createElement(InspectorContainer))
  );
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInspector);
  } else {
    initInspector();
  }
}
