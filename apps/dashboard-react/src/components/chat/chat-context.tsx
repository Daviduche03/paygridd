"use client";

import { useChat } from "@ai-sdk/react";
import { LogEvents } from "eventbus/events";
import { useOpenPanel } from "@openpanel/nextjs";
import { DefaultChatTransport } from "@/ai-transport";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAccessToken } from "@/utils/session";

export type RateLimitInfo = { limit: number; remaining: number };

export type ChatState = ReturnType<typeof useChat> & {
  inputValue: string;
  setInputValue: (v: string) => void;
  chatTitle: string | null;
  setChatTitle: (v: string | null) => void;
  rateLimit: RateLimitInfo | null;
  rateLimitExceeded: boolean;
  conversationId: string;
  resetConversation: () => void;
};

const STORAGE_KEY = "paygrid_conversation_id";

function loadConversationId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch {}
  const id = crypto.randomUUID();
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  return id;
}

function saveConversationId(id: string) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
}

const ChatContext = createContext<ChatState | null>(null);

export function useChatState() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatState must be used within ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { track } = useOpenPanel();

  const [inputValue, setInputValue] = useState("");
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const [conversationId, setConversationId] = useState(loadConversationId);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const resetConversation = useCallback(() => {
    const id = crypto.randomUUID();
    saveConversationId(id);
    setConversationId(id);
    setChatTitle(null);
  }, []);

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/chat",
        headers: async () => {
          const token = await getAccessToken();
          const timezone =
            Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
          return {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "x-user-timezone": timezone,
          } as Record<string, string>;
        },
        body: () => ({
          conversationId: conversationIdRef.current,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
          localTime: new Date().toISOString(),
        }),
      }),
    [],
  );

  const chat = useChat({
    transport: chatTransport,
    onResponse: (response) => {
      const serverId = response.headers.get("X-Conversation-Id");
      if (serverId) {
        setConversationId(serverId);
        saveConversationId(serverId);
      }
    },
    onData: (part: any) => {
      if (part.type === "data-title" && part.data?.title) {
        setChatTitle(part.data.title);
      }
      if (part.type === "data-rate-limit" && part.data) {
        setRateLimit(part.data as RateLimitInfo);
        setRateLimitExceeded(false);
      }
    },
    onError: (err) => {
      if (err.message?.includes("RATE_LIMIT_EXCEEDED")) {
        setRateLimitExceeded(true);
        return;
      }
      console.error("Chat error:", err);
    },
  });

  const trackedSendMessage: typeof chat.sendMessage = useCallback(
    (...args) => {
      track(LogEvents.AssistantMessageSent.name);
      return chat.sendMessage(...args);
    },
    [chat.sendMessage, track],
  );

  return (
    <ChatContext.Provider
      value={{
        ...chat,
        sendMessage: trackedSendMessage,
        inputValue,
        setInputValue,
        chatTitle,
        setChatTitle,
        rateLimit,
        rateLimitExceeded,
        conversationId,
        resetConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
