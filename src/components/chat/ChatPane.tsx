"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { Sidebar } from "./Sidebar";
import { Modal } from "./Modal";
import { ConnectButton } from "./ConnectButton";
import type { ChatMessage, ChatSuggestion } from "./types";

async function postChat(messages: ChatMessage[]): Promise<{
  reply: string;
  suggestion?: ChatSuggestion;
}> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error("Failed to reach chat service");
  }

  return res.json();
}

export function ChatPane() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingSuggestion, setPendingSuggestion] = useState<ChatSuggestion>();
  const [isBusy, setIsBusy] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  const handleSend = useCallback(
    async (text: string) => {
      const nextMessages: ChatMessage[] = [
        ...messages,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: text,
        },
      ];

      setMessages(nextMessages);
      setIsBusy(true);

      try {
        const { reply, suggestion } = await postChat(nextMessages);

        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: reply,
          },
        ]);

        if (suggestion) {
          setPendingSuggestion(suggestion);
          setShowSuggestionModal(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsBusy(false);
      }
    },
    [messages],
  );

  useEffect(() => {
    const container = document.getElementById("chat-scroll-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isBusy]);

  return (
    <div className=" relative flex h-screen bg-[#f7f8fa] items-stretch">
      <ChatHeader isThinking={isBusy} />
      <Sidebar currentSection="jobs" />

      <div className="flex h-full w-full justify-center p-2 items-stretch gap-0">
     

        <main className=" w-full chat-gradient-bg flex min-h-0 flex-col rounded-4xl px-20 py-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <section
            id="chat-scroll-container"
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-6 pr-2 w-[80%] mx-auto"
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isBusy && (
              <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="max-w-[640px] rounded-3xl rounded-bl-lg bg-white/90 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 rounded-full bg-[#9ca3af] animate-bounce" />
                    </div>
                    <span className="text-xs text-[#6b7280] font-medium">Scout is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="mt-4 w-[80%] mx-auto relative" style={{ zIndex: 60 }}>
            <ChatInput disabled={isBusy} onSend={(text) => void handleSend(text)} />
          </section>
        </main>
      </div>

      {showSuggestionModal && pendingSuggestion && (
        <Modal
          isOpen={showSuggestionModal}
          onClose={() => setShowSuggestionModal(false)}
          title={pendingSuggestion.label}
        >
          <ConnectButton
            label={pendingSuggestion.ctaLabel}
            href={pendingSuggestion.href}
            variant="linkedin"
            onClick={() => setShowSuggestionModal(false)}
            icon={
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            }
          />
        </Modal>
      )}
    </div>
  );
}


