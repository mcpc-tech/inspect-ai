import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Eye, Sparkles, ArrowRight, Terminal, CheckCircle2, XCircle, ChevronUp } from 'lucide-react';
import { Shimmer } from '../../src/components/ai-elements/shimmer';
import type { UIMessage } from 'ai';
import { processMessage, extractToolName } from '../utils/messageProcessor';
import { FeedbackCart, type FeedbackItem } from './FeedbackCart';
import { MessageDetail } from './MessageDetail';

interface InspectorBarProps {
  isActive: boolean;
  onToggleInspector: () => void;
  onSubmitAgent: (query: string) => void;
  isAgentWorking: boolean;
  messages: UIMessage[];
  status: 'streaming' | 'submitted' | 'ready' | 'error';
  feedbackCount?: number;
  feedbackItems?: FeedbackItem[];
  onRemoveFeedback?: (id: string) => void;
}

export const InspectorBar = ({
  isActive,
  onToggleInspector,
  onSubmitAgent,
  isAgentWorking,
  messages,
  status,
  feedbackCount = 0,
  feedbackItems = [],
  onRemoveFeedback = () => { }
}: InspectorBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [displayText, setDisplayText] = useState<string>('');
  const [toolCall, setToolCall] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [hideInputDuringWork, setHideInputDuringWork] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lastDisplayedText, setLastDisplayedText] = useState<string>('');
  const [lastDisplayedToolResult, setLastDisplayedToolResult] = useState<string>('');
  const [allowHover, setAllowHover] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to get only new content
  const getNewContent = (currentContent: string, lastContent: string): string => {
    if (!lastContent) return currentContent;
    if (currentContent.startsWith(lastContent)) {
      return currentContent.slice(lastContent.length).trim();
    }
    return currentContent;
  };

  useEffect(() => {
    if (messages.length === 0) return;

    const last = messages[messages.length - 1];
    let currentTool: string | null = null;

    // Only extract tool from current message, don't look at previous messages
    currentTool = extractToolName(last);

    // Process message using utility functions
    const { displayText, toolOutput, toolCall: extractedToolCall } = processMessage(last, currentTool);

    setDisplayText(displayText);

    // Update tool result and tool call
    // If there's no tool output in the new message, clear the previous tool result
    // This allows new text messages to be displayed
    setToolResult(toolOutput);
    setToolCall(extractedToolCall);
  }, [messages]);

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Unlock immediately when AI finishes working, but delay hover to show result
  useEffect(() => {
    if (!isAgentWorking && isLocked) {
      // Unlock immediately, but keep showing the content
      setHideInputDuringWork(false);
      setIsLocked(false);
      // Clear tool states when work is done
      setToolCall(null);
      setToolResult(null);
      // Temporarily disable hover to show result
      setAllowHover(false);
      // Re-enable hover after 2 seconds
      const timer = setTimeout(() => {
        setAllowHover(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAgentWorking, isLocked]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear tool states immediately when submitting new input
    setToolCall(null);
    setToolResult(null);
    setDisplayText('');
    setHideInputDuringWork(true);
    setIsLocked(true);
    // Reset tracking for new query
    setLastDisplayedText('');
    setLastDisplayedToolResult('');

    onSubmitAgent(input);
    setInput('');
    // Only collapse the bar if the panel is not expanded
    if (!isPanelExpanded) {
      setIsExpanded(false);
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
  const shouldShowInput = isExpanded && !hideInputDuringWork;
  const showMessage = (!isExpanded || hideInputDuringWork) && (isAgentWorking || hasMessage);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed bottom-8 left-1/2 transform-center-x z-[999999]",
        "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isExpanded ? "w-[600px]" : (showMessage ? "w-auto min-w-[200px] max-w-[600px]" : "w-[160px]")
      )}
      onMouseEnter={() => {
        if (!isLocked && allowHover) {
          setIsExpanded(true);
        }
      }}
      onMouseLeave={() => {
        if (!input.trim() && !isPanelExpanded && !isLocked) {
          setIsExpanded(false);
        }
        // Re-enable hover when mouse leaves
        setAllowHover(true);
      }}
    >
      <div className={cn(
        "relative flex items-center backdrop-blur-xl shadow-2xl border border-border overflow-hidden",
        "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
        isExpanded ? "min-h-14 p-2 pl-4" : "min-h-12 px-3 py-2",
        isPanelExpanded
          ? "bg-muted/95 rounded-b-xl rounded-t-none border-t-0"
          : "bg-muted/90 rounded-full",
        isError && !isExpanded && "bg-destructive/10 border-destructive/20"
      )}>
        <div className={cn(
          "flex items-center gap-3 transition-opacity duration-300",
          shouldShowInput ? "absolute left-3 opacity-0 pointer-events-none" : "relative opacity-100"
        )}>
          {!showMessage && (
            <>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent flex-shrink-0">
                <Sparkles className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground/70">Hover to use</span>
            </>
          )}

          {showMessage && (
            <>
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-accent flex-shrink-0">
                {isAgentWorking ? (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-current opacity-20 animate-ping text-foreground" />
                    <Sparkles className="w-4 h-4 animate-pulse text-foreground" />
                  </>
                ) : isError ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>

              <div className="w-px h-6 bg-border flex-shrink-0" />

              <div className="flex flex-col pr-2 max-h-[120px] overflow-y-auto">
                {toolResult ? (
                  <div className="text-sm font-medium leading-[1.4] text-green-400 dark:text-green-600 line-clamp-3">
                    <span>{getNewContent(toolResult, lastDisplayedToolResult)}</span>
                  </div>
                ) : toolCall ? (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Terminal className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-3">{toolCall}</span>
                  </div>
                ) : (
                  <div className="text-sm font-medium leading-[1.4] text-foreground line-clamp-3">
                    {isAgentWorking ? (
                      <Shimmer duration={2} spread={2}>
                        Thinking...
                      </Shimmer>
                    ) : (
                      getNewContent(displayText, lastDisplayedText)
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div 
          className={cn(
            "flex items-center w-full gap-3 transition-all duration-500 delay-75",
            shouldShowInput
              ? "opacity-100 translate-y-0 relative pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none absolute top-2 left-4 right-2"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onToggleInspector}
            className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors flex-shrink-0",
              isActive
                ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
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

          <div className="w-px h-6 bg-border flex-shrink-0" />

          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to check something..."
              className="w-full bg-transparent border-none outline-none text-foreground placeholder-muted-foreground text-base h-10"
              tabIndex={0}
            />

            {/* Expand button */}
            {(feedbackCount > 0 || messages.length > 0 || true) && (
              <button
                type="button"
                onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0",
                  isPanelExpanded
                    ? "bg-blue-500 text-white"
                    : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                )}
                title={isPanelExpanded ? "Collapse" : "Expand messages"}
              >
                <ChevronUp
                  className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    isPanelExpanded && "rotate-180"
                  )}
                />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isAgentWorking}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0",
                input.trim()
                  ? "bg-foreground text-background scale-100"
                  : "bg-accent text-muted-foreground/50 scale-90"
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

      {/* Expanded Panel - shows above the bar */}
      {isPanelExpanded && (
        <div className="absolute bottom-full left-0 right-0 pointer-events-auto max-w-[600px] mx-auto animate-panel-in">
          <div className="bg-muted/95 backdrop-blur-xl rounded-t-xl border border-border border-b-0 shadow-2xl overflow-hidden">
            {/* Feedback Queue Section */}
            {feedbackItems.length > 0 && (
              <div className="border-b border-border">
                <FeedbackCart
                  items={feedbackItems}
                  onRemove={onRemoveFeedback}
                />
              </div>
            )}

            {/* Message Detail Section - Show InspectorBar messages */}
            <div className="h-[500px]">
              <MessageDetail messages={messages} status={status} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
