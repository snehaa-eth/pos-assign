export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface ChatSuggestion {
  type: "connect-linkedin";
  label: string;
  description: string;
  ctaLabel: string;
  href?: string;
}


