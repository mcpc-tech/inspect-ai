import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";

const STORAGE_KEY = "inspector-chat-messages";

interface UsePersistentChatOptions {
  api: string;
}

// Load messages from localStorage
function loadMessagesFromStorage(): UIMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that it's an array
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Failed to load chat messages from localStorage:", error);
  }
  return [];
}

export function usePersistentChat({ api }: UsePersistentChatOptions) {
  // Initialize useChat without initial messages
  const chatResult = useChat({
    transport: new DefaultChatTransport({ api }),
  });

  const { messages, setMessages } = chatResult;
  const isRestoredRef = useRef(false);

  // Restore messages from localStorage on mount
  useEffect(() => {
    if (!isRestoredRef.current) {
      const savedMessages = loadMessagesFromStorage();
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      }
      isRestoredRef.current = true;
    }
  }, [setMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isRestoredRef.current && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.warn("Failed to save chat messages to localStorage:", error);
      }
    }
  }, [messages]);

  // Provide a method to clear message history
  const clearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setMessages([]);
    } catch (error) {
      console.warn("Failed to clear chat history:", error);
    }
  };

  return {
    ...chatResult,
    clearHistory,
  };
}
