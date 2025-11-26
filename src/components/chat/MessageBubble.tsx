import type { ChatMessage } from "./types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[640px] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-lg bg-[#f7f8fa] text-[#111827]"
            : "rounded-bl-lg bg-white/90 text-[#111827]"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}


