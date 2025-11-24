import React from "react";
import type { UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./ai-elements/conversation";
import { Message, MessageAvatar, MessageContent } from "./ai-elements/message";
import { Loader } from "./ai-elements/loader";
import { renderMessagePart } from "../lib/messageRenderer";
import { AVAILABLE_AGENTS, DEFAULT_AGENT } from "../constants/agents";

interface MessageDetailProps {
  messages: UIMessage[];
  status: "streaming" | "submitted" | "ready" | "error";
  selectedAgent?: string;
}

export const MessageDetail: React.FC<MessageDetailProps> = ({
  messages,
  status,
  selectedAgent,
}) => {
  const currentAgent =
    AVAILABLE_AGENTS.find((a) => a.name === (selectedAgent || DEFAULT_AGENT)) ||
    AVAILABLE_AGENTS[0];

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-background">
      <div className="flex-1 overflow-hidden">
        <Conversation className="h-full">
          <ConversationContent className="h-full overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">
                    Enter a question below to start
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <Message
                  className="items-start"
                  from={message.role as "user" | "assistant"}
                  key={message.id}
                >
                  <MessageContent>
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
              ))
            )}
            {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
    </div>
  );
};
