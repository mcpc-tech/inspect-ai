import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import type { InspectedElement } from './types';
import { createStyles } from './styles';
import { Notification } from './components/Notification';
import { FeedbackBubble } from './components/FeedbackBubble';
import { InspectorButton } from './components/InspectorButton';
import { Overlay, Tooltip } from './components/Overlays';
import { useNotification } from './hooks/useNotification';
import { useInspectorHover } from './hooks/useInspectorHover';
import { useInspectorClick } from './hooks/useInspectorClick';
import { useMcp } from './hooks/useMcp';

const InspectorContainer: React.FC = () => {
  useMcp();
  const [isActive, setIsActive] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isWaitingForFeedback, setIsWaitingForFeedback] = useState(false);
  const [sourceInfo, setSourceInfo] = useState<InspectedElement | null>(null);
  const [inspectedElement, setInspectedElement] = useState<Element | null>(null);

  const btnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const { notification, showNotif } = useNotification();

  useInspectorHover({
    isActive,
    isWaitingForFeedback,
    overlayRef,
    tooltipRef,
    btnRef,
  });

  useInspectorClick({
    isActive,
    isWaitingForFeedback,
    onElementInspected: (info, element) => {
      setSourceInfo(info);
      setInspectedElement(element);
      setShowBubble(true);
      setIsWaitingForFeedback(true);

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
    if (sourceInfo) {
      const event = new CustomEvent('element-inspected', {
        detail: { sourceInfo, feedback },
      });
      window.dispatchEvent(event);
    }
    handleFeedbackClose();
  };

  const handleFeedbackClose = () => {
    const wasPending = isWaitingForFeedback;
    
    setShowBubble(false);
    setIsWaitingForFeedback(false);
    setIsActive(false);
    if (btnRef.current) {
      btnRef.current.classList.remove('active');
    }
    document.body.style.cursor = '';
    if (overlayRef.current) overlayRef.current.style.display = 'none';
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';

    if (wasPending) {
      window.dispatchEvent(new CustomEvent('inspector-cancelled'));
    }
  };

  return (
    <>
      <InspectorButton ref={btnRef} isActive={isActive} onClick={toggleInspector} />
      <Overlay ref={overlayRef} visible={isActive && !isWaitingForFeedback} />
      <Tooltip ref={tooltipRef} visible={isActive && !isWaitingForFeedback} />

      {notification && <Notification message={notification} />}

      {showBubble && sourceInfo && inspectedElement && (
        <FeedbackBubble
          sourceInfo={sourceInfo}
          element={inspectedElement}
          onSubmit={handleFeedbackSubmit}
          onClose={handleFeedbackClose}
        />
      )}
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

  const styles = document.createElement('style');
  styles.textContent = createStyles();
  document.head.appendChild(styles);

  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(React.createElement(InspectorContainer));
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInspector);
  } else {
    initInspector();
  }
}
