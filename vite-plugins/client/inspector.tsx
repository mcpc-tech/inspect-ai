import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { InspectedElement } from './types';
import { Notification } from './components/Notification';
import { FeedbackBubble } from './components/FeedbackBubble';
import { InspectorButton } from './components/InspectorButton';
import { Overlay, Tooltip } from './components/Overlays';
import { useNotification } from './hooks/useNotification';
import { useInspectorHover } from './hooks/useInspectorHover';
import { useInspectorClick } from './hooks/useInspectorClick';
import { useMcp } from './hooks/useMcp';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';

const InspectorContainer: React.FC = () => {
  useMcp();
  const [isActive, setIsActive] = useState(false);
  const [sourceInfo, setSourceInfo] = useState<InspectedElement | null>(null);
  const [bubbleMode, setBubbleMode] = useState<'input' | 'loading' | 'success' | 'error' | null>(null);
  const [resultMessage, setResultMessage] = useState<string>('');

  const btnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const { notification, showNotif } = useNotification();

  useEffect(() => {
    const handleResultReceived = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { status, result } = customEvent.detail;
      
      setBubbleMode(status === 'success' ? 'success' : 'error');
      setResultMessage(result.message || 'Processing completed');
      
      showNotif(status === 'success' ? '✅ AI processing completed' : '⚠️ AI processing failed');
    };

    window.addEventListener('feedback-result-received', handleResultReceived as EventListener);
    return () => {
      window.removeEventListener('feedback-result-received', handleResultReceived as EventListener);
    };
  }, [showNotif]);

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
    if (btnRef.current) {
      btnRef.current.classList.toggle('active', newActive);
    }
    document.body.style.cursor = newActive ? 'crosshair' : '';

    if (!newActive) {
      if (overlayRef.current) overlayRef.current.style.display = 'none';
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
    }

    showNotif(newActive ? '🔍 Inspector ON - Click any element' : '✅ Inspector OFF');
  };

  const handleFeedbackSubmit = (feedback: string) => {
    console.log('📤 Feedback submitted:', feedback);
    if (sourceInfo) {
      setBubbleMode('loading');
      const event = new CustomEvent('element-inspected', {
        detail: { sourceInfo, feedback },
      });
      console.log('🔔 Dispatching element-inspected event');
      window.dispatchEvent(event);
    }
  };

  const handleBubbleClose = () => {
    setBubbleMode(null);
    setIsActive(false);
    if (btnRef.current) {
      btnRef.current.classList.remove('active');
    }
    document.body.style.cursor = '';
    if (overlayRef.current) overlayRef.current.style.display = 'none';
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';

    window.dispatchEvent(new CustomEvent('inspector-cancelled'));
  };

  return (
    <>
      <InspectorButton ref={btnRef} isActive={isActive} onClick={toggleInspector} />
      <Overlay ref={overlayRef} visible={isActive && bubbleMode === null} />
      <Tooltip ref={tooltipRef} visible={isActive && bubbleMode === null} />

      {notification && <Notification message={notification} />}

      {bubbleMode && sourceInfo && (
        <FeedbackBubble
          sourceInfo={sourceInfo}
          mode={bubbleMode}
          onSubmit={handleFeedbackSubmit}
          onClose={handleBubbleClose}
          resultMessage={resultMessage}
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
