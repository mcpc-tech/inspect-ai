import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Eye, Sparkles, ArrowRight, ChevronUp } from 'lucide-react';
import type { UIMessage } from 'ai';
import { FeedbackCart, type FeedbackItem } from './FeedbackCart';
import { MessageDetail } from './MessageDetail';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './ai-elements/conversation';
import { Message, MessageAvatar, MessageContent } from './ai-elements/message';
import { Loader } from './ai-elements/loader';
import { renderMessagePart } from '../lib/messageRenderer';
import { AVAILABLE_AGENTS, DEFAULT_AGENT } from '../constants/agents';

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
  console.log(messages);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [hideInputDuringWork, setHideInputDuringWork] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [allowHover, setAllowHover] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    // Set states for new query
    setHideInputDuringWork(true);
    setIsLocked(true);

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

          {/* Embed full MessageDetail rendering in the bar */}
          {showMessage && (
            <div className="flex-[2] min-w-0 h-10 overflow-hidden">
              <Conversation className="h-full flex items-center [&]:!overflow-visible" initial="smooth" resize="smooth">
                <ConversationContent className="px-3 py-0">
                  {messages.length === 0 ? (
                    <div className="flex items-center h-full text-muted-foreground text-sm">
                      Processing...
                    </div>
                  ) : (
                    messages.map((message) => {
                      const currentAgent = AVAILABLE_AGENTS.find((a) => a.name === DEFAULT_AGENT) || AVAILABLE_AGENTS[0];
                      return (
                        <Message
                          className="items-start py-0"
                          from={message.role as "user" | "assistant"}
                          key={message.id}
                        >
                          <MessageContent className="text-sm py-0 px-2">
                            {message.parts.map((part, index) =>
                              renderMessagePart(
                                part,
                                message.id,
                                index,
                                status === "streaming",
                                message.metadata as Record<string, unknown> | undefined
                              )
                            )}
                          </MessageContent>
                          {message.role === "assistant" && (
                            <MessageAvatar
                              name={currentAgent.name}
                              src={currentAgent.meta?.icon ?? ""}
                            />
                          )}
                        </Message>
                      );
                    })
                  )}
                  {status === "submitted" && <Loader />}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </div>
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

            {/* Expand button - only show when AI is working or has messages */}
            {(feedbackCount > 0 || messages.length > 0) && (isAgentWorking || isLocked || messages.length > 0) && (
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
