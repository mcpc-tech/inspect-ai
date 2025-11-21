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
  const [textOffset, setTextOffset] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;

    const last = messages[messages.length - 1];
    let text = '';
    let currentTool: string | null = null;

    const extractToolName = (msg: UIMessage): string | null => {
      if (!msg.parts) return null;

      for (const part of msg.parts) {
        if (part.type === 'tool-call' && 'toolName' in part && typeof part.toolName === 'string') {
          return part.toolName;
        }
        if (part.type === 'tool-acp.acp_provider_agent_dynamic_tool' && 'input' in part && typeof part.input === 'object' && part.input !== null && 'toolName' in part.input) {
          // @ts-ignore - Custom structure handling
          return part.input.toolName;
        }
      }
      return null;
    };

    currentTool = extractToolName(last);
    if (!currentTool && messages.length > 1) {
      currentTool = extractToolName(messages[messages.length - 2]);
    }

    if ('parts' in last && Array.isArray(last.parts)) {
      for (const part of last.parts) {
        const messagePart = part as UIMessagePart<Record<string, unknown>, Record<string, UITool>>;
        if (messagePart.type === 'text' && 'text' in messagePart && typeof messagePart.text === 'string') {
          text += messagePart.text;
        }
      }
    } else if ('content' in last && typeof last.content === 'string') {
      text = last.content;
    } else if ('text' in last && typeof last.text === 'string') {
      text = last.text;
    }

    setDisplayText(text);

    if (currentTool) {
      setToolCall(currentTool);
    } else if ('toolInvocations' in last && Array.isArray(last.toolInvocations) && last.toolInvocations.length > 0) {
      const lastTool = last.toolInvocations[last.toolInvocations.length - 1];
      if (typeof lastTool === 'object' && lastTool !== null && 'toolName' in lastTool && typeof lastTool.toolName === 'string') {
        setToolCall(lastTool.toolName);
      }
    } else {
      setToolCall(null);
    }
  }, [messages]);

  useEffect(() => {
    if (!displayText || displayText.length <= 50) {
      setTextOffset(0);
      return;
    }

    const interval = setInterval(() => {
      setTextOffset(prev => {
        const maxOffset = displayText.length - 40;
        return prev + 20 > maxOffset ? 0 : prev + 20;
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
    if (!input.trim()) return;

    onSubmitAgent(input);
    setInput('');
    setIsExpanded(false);
    inputRef.current?.blur();
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
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-300",
          isExpanded ? "absolute left-3 opacity-0 pointer-events-none" : "relative opacity-100"
        )}>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 dark:bg-black/5 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white dark:text-black" />
          </div>
          <span className="text-sm font-medium text-white dark:text-black whitespace-nowrap">
            FeedWeb AI
          </span>

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
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white dark:text-black">
                    <Terminal className="w-4 h-4" />
                    <span className="truncate">{toolCall}</span>
                  </div>
                ) : (
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

        <div className={cn(
          "flex items-center w-full gap-3 transition-all duration-500 delay-75",
          isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none absolute top-2 left-4 right-2"
        )}>
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

          <div className="w-px h-6 bg-white/20 dark:bg-black/10 flex-shrink-0" />

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

