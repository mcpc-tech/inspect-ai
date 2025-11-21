import React, { useState, useRef, useEffect } from "react";
import type { InspectedElement } from "./types";
import { Notification } from "./components/Notification";
import { FeedbackBubble } from "./components/FeedbackBubble";
import { type FeedbackItem } from "./components/FeedbackCart";
import { Overlay, Tooltip } from "./components/Overlays";
import { useNotification } from "./hooks/useNotification";
import { useInspectorHover } from "./hooks/useInspectorHover";
import { useInspectorClick } from "./hooks/useInspectorClick";
import { useMcp } from "./hooks/useMcp";
import { Toaster } from "./components/ui/sonner";
import { cn } from "./lib/utils";
import { useInspectorTheme } from "./context/ThemeContext";
import { InspectorContainerContext } from "./context/InspectorContainerContext";
import { loadFeedbackItems, saveFeedbackItems } from "./utils/feedbackStorage";
import inspectorStyles from "./styles.css";
import ReactDOM from "react-dom/client";
import { InspectorThemeProvider } from "./context/ThemeContext";
import { InspectorBar } from "./components/InspectorBar";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AVAILABLE_AGENTS, DEFAULT_AGENT } from "./constants/agents";

interface InspectorContainerProps {
  shadowRoot?: ShadowRoot;
  mountPoint?: HTMLElement;
}

const InspectorContainer: React.FC<InspectorContainerProps> = ({
  shadowRoot,
  mountPoint,
}) => {
  useMcp();
  const { resolvedTheme } = useInspectorTheme();

  const [isActive, setIsActive] = useState(false);
  const [sourceInfo, setSourceInfo] = useState<InspectedElement | null>(null);
  const [bubbleMode, setBubbleMode] = useState<"input" | null>(null);
  const [feedbackItems, setFeedbackItems] =
    useState<FeedbackItem[]>(loadFeedbackItems);

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

  useEffect(() => {
    const activeFeedbackId = sessionStorage.getItem("inspector-current-feedback-id");
    if (!activeFeedbackId) return;

    const feedbackExists = feedbackItems.some((item) => item.id === activeFeedbackId);
    if (!feedbackExists) {
      sessionStorage.removeItem("inspector-current-feedback-id");
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActive) {
        handleBubbleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

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
      setBubbleMode("input");

      if (overlayRef.current) overlayRef.current.style.display = "none";
      if (tooltipRef.current) tooltipRef.current.style.display = "none";
    },
    btnRef,
  });

  const toggleInspector = () => {
    const newActive = !isActive;
    setIsActive(newActive);

    document.body.style.cursor = newActive ? "crosshair" : "";

    if (newActive) {
      setBubbleMode(null);
    } else {
      if (overlayRef.current) overlayRef.current.style.display = "none";
      if (tooltipRef.current) tooltipRef.current.style.display = "none";
      setBubbleMode(null);
    }

    showNotif(
      newActive ? "🔍 Inspector ON - Click any element" : "✅ Inspector OFF"
    );
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
      status: "loading",
      timestamp: Date.now(),
    };

    setFeedbackItems((prev) => [...prev, newItem]);
    setBubbleMode(null);
    setIsActive(false);
    document.body.style.cursor = "";

    const cleanSourceInfo = {
      file: sourceInfo.file,
      component: sourceInfo.component,
      line: sourceInfo.line,
      column: sourceInfo.column,
      elementInfo: sourceInfo.elementInfo,
    };
    const prompt = `Context: ${JSON.stringify(cleanSourceInfo, null, 2)}\n\nRequest: ${feedback}`;
    const currentAgent = AVAILABLE_AGENTS.find((a) => a.command === DEFAULT_AGENT) || AVAILABLE_AGENTS[0];

    sendMessage(
      { text: prompt },
      {
        body: {
          agent: currentAgent,
          envVars: {},
        },
      }
    );
  };

  const handleBubbleClose = () => {
    setBubbleMode(null);
    setIsActive(false);
    document.body.style.cursor = "";

    if (overlayRef.current) overlayRef.current.style.display = "none";
    if (tooltipRef.current) tooltipRef.current.style.display = "none";
  };

  const handleAgentSubmit = (query: string) => {
    const currentAgent = AVAILABLE_AGENTS.find((a) => a.command === DEFAULT_AGENT) || AVAILABLE_AGENTS[0];
    sendMessage(
      { text: query },
      {
        body: {
          agent: currentAgent,
          envVars: {},
        },
      }
    );
  };

  return (
    <div
      className={cn(
        "font-sans antialiased w-full h-full pointer-events-none fixed inset-0",
        resolvedTheme === "dark" && "dark"
      )}
    >
      <InspectorContainerContext.Provider value={mountPoint || null}>
        <div className="pointer-events-auto">
          <InspectorBar
            isActive={isActive}
            onToggleInspector={toggleInspector}
            onSubmitAgent={handleAgentSubmit}
            isAgentWorking={status === "streaming" || status === "submitted"}
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

class DevInspector extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: "open" });

    const styleElement = document.createElement("style");
    styleElement.textContent = inspectorStyles;
    shadowRoot.appendChild(styleElement);

    const mountPoint = document.createElement("div");
    shadowRoot.appendChild(mountPoint);

    const reactRoot = ReactDOM.createRoot(mountPoint);
    reactRoot.render(
      React.createElement(
        InspectorThemeProvider,
        null,
        React.createElement(InspectorContainer, { shadowRoot, mountPoint })
      )
    );
  }
}

export * from "./context/InspectorContainerContext";

export function registerDevInspector() {
  if (!customElements.get("dev-inspector")) {
    customElements.define("dev-inspector", DevInspector as CustomElementConstructor);
  }
}

registerDevInspector();
