import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Eye, Sparkles, ArrowRight, Terminal, CheckCircle2, XCircle } from 'lucide-react';
import type { UIMessage, UIMessagePart, UITool } from 'ai';



interface InspectorBarProps {
  isActive: boolean;
  onToggleInspector: () => void;
  onSubmitAgent: (query: string) => void;
  isAgentWorking: boolean;
  messages: UIMessage[];
  status: 'streaming' | 'submitted' | 'ready' | 'error';
  feedbackCount?: number;
}

export const InspectorBar = ({
  isActive,
  onToggleInspector,
  onSubmitAgent,
  isAgentWorking,
  messages,
  status,
  feedbackCount = 0
}: InspectorBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [displayText, setDisplayText] = useState<string>('');
  const [toolCall, setToolCall] = useState<string | null>(null);
  const [textOffset, setTextOffset] = useState(0); // For ticker animation

  console.log({ messages, displayText, toolCall });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // --- Message Processing Logic ---
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];

      // Extract text content from message parts
      let text = '';
      let currentTool: string | null = null;

      // Helper to extract tool name from a message
      const extractToolName = (msg: UIMessage): string | null => {
        if (!msg.parts) return null;

        for (const part of msg.parts) {
          // Check for standard tool-call
          if (part.type === 'tool-call' && 'toolName' in part && typeof part.toolName === 'string') {
            return part.toolName;
          }
          // Check for ACP tool call
          if (part.type === 'tool-acp.acp_provider_agent_dynamic_tool' && 'input' in part && typeof part.input === 'object' && part.input !== null && 'toolName' in part.input) {
            // @ts-ignore - Custom structure handling
            return part.input.toolName;
          }
        }
        return null;
      };

      // Check current message for tool call
      currentTool = extractToolName(last);

      // If no tool in current message, check lookback (second to last)
      // This helps keep the tool name visible while the response is starting
      if (!currentTool && messages.length > 1) {
        currentTool = extractToolName(messages[messages.length - 2]);
      }

      if ('parts' in last && Array.isArray(last.parts)) {
        for (const part of last.parts) {
          const messagePart = part as UIMessagePart<Record<string, unknown>, Record<string, UITool>>;

          // Accumulate text from all text parts
          if (messagePart.type === 'text' && 'text' in messagePart && typeof messagePart.text === 'string') {
            text += messagePart.text;
          }
        }
      } else if ('content' in last && typeof last.content === 'string') {
        text = last.content;
      } else if ('text' in last && typeof last.text === 'string') {
        // Handle custom text message structure
        text = last.text;
      }

      setDisplayText(text);

      // Show tool name if there's an active tool call
      if (currentTool) {
        console.log('🔧 Setting toolCall:', currentTool);
        setToolCall(currentTool);
      } else if ('toolInvocations' in last && Array.isArray(last.toolInvocations) && last.toolInvocations.length > 0) {
        // Fallback to toolInvocations for completed tool calls
        const lastTool = last.toolInvocations[last.toolInvocations.length - 1];
        if (typeof lastTool === 'object' && lastTool !== null && 'toolName' in lastTool && typeof lastTool.toolName === 'string') {
          console.log('🔧 Setting toolCall from toolInvocations:', lastTool.toolName);
          setToolCall(lastTool.toolName);
        }
      } else {
        setToolCall(null);
      }
    }
  }, [messages]);

  // Ticker animation for long text - cycle through every 3 seconds
  useEffect(() => {
    if (!displayText || displayText.length <= 50) {
      setTextOffset(0);
      return;
    }

    const interval = setInterval(() => {
      setTextOffset(prev => {
        const maxOffset = displayText.length - 40;
        const nextOffset = prev + 20;
        return nextOffset > maxOffset ? 0 : nextOffset;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [displayText]);

  // --- End Message Processing Logic ---

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmitAgent(input);
      setInput('');
      setIsExpanded(false);
      // Force blur to collapse the bar even if mouse is still hovering
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      inputRef.current?.blur();
    }
  };

  const isError = status === 'error';
  const hasMessage = messages.length > 0;
  // Determine if we should show the message view in collapsed state
  const showMessage = !isExpanded && (isAgentWorking || hasMessage);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-[999999]",
        "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isExpanded ? "w-[600px]" : (showMessage ? "w-auto max-w-[500px]" : "w-[160px]")
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        if (!input.trim()) setIsExpanded(false);
      }}
    >
      <div className={cn(
        "relative flex items-center bg-black/80 dark:bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-white/10 dark:border-black/5 overflow-hidden",
        "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isExpanded ? "h-14 p-2 pl-4" : "h-12 px-3",
        isError && !isExpanded && "bg-red-500/10 border-red-500/20"
      )}>
        {/* Collapsed State Content */}
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-300",
          isExpanded ? "absolute left-3 opacity-0 pointer-events-none" : "relative opacity-100"
        )}>
          {/* Logo and Branding - Always visible */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 dark:bg-black/5 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white dark:text-black" />
          </div>
          <span className="text-sm font-medium text-white dark:text-black whitespace-nowrap">
            FeedWeb AI
          </span>

          {/* Message View - Shows when there are messages */}
          {showMessage && (
            <>
              <div className="w-px h-6 bg-white/20 dark:bg-black/10 flex-shrink-0" />

              <div className="relative flex items-center justify-center w-6 h-6 flex-shrink-0">
                {isAgentWorking ? (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-current opacity-20 animate-ping text-white dark:text-black" />
                    <Sparkles className="w-4 h-4 animate-pulse text-white dark:text-black" />
                  </>
                ) : isError ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>

              <div className="flex flex-col min-w-[100px] max-w-[300px] pr-2">
                {toolCall ? (
                  // Show tool name with higher priority - hide text when tool is active
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white dark:text-black">
                    <Terminal className="w-4 h-4" />
                    <span className="truncate">{toolCall}</span>
                  </div>
                ) : (
                  // Show text message only when no tool is active
                  <div
                    ref={textRef}
                    className="text-sm font-medium leading-tight truncate text-white dark:text-black"
                  >
                    {displayText ? (
                      displayText.length > 50 ? (
                        <span key={textOffset}>
                          {displayText.substring(textOffset, textOffset + 50)}
                          {textOffset + 50 < displayText.length && '...'}
                        </span>
                      ) : (
                        displayText
                      )
                    ) : (
                      isAgentWorking ? "Thinking..." : "Ready"
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Expanded State Content */}
        <div className={cn(
          "flex items-center w-full gap-3 transition-all duration-500 delay-75",
          isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none absolute top-2 left-4 right-2"
        )}>
          {/* Inspector Toggle */}
          <button
            onClick={onToggleInspector}
            className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors flex-shrink-0",
              isActive
                ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                : "bg-white/10 dark:bg-black/5 text-white/70 dark:text-black/70 hover:bg-white/20 dark:hover:bg-black/10"
            )}
            title="Toggle Inspector"
          >
            <Eye className="w-5 h-5" />
            {feedbackCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-black dark:border-white">
                {feedbackCount > 99 ? '99+' : feedbackCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/20 dark:bg-black/10 flex-shrink-0" />

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 min-w-0">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to check something..."
                className="w-full bg-transparent border-none outline-none text-white dark:text-black placeholder-white/40 dark:placeholder-black/40 text-base h-10"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                <span className="text-[10px] font-medium text-white/30 dark:text-black/30 bg-white/10 dark:bg-black/5 px-1.5 py-0.5 rounded">⌘K</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isAgentWorking}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0",
                input.trim()
                  ? "bg-white dark:bg-black text-black dark:text-white scale-100"
                  : "bg-white/10 dark:bg-black/5 text-white/30 dark:text-black/30 scale-90"
              )}
            >
              {isAgentWorking ? (
                <Sparkles className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

