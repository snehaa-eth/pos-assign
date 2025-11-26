import { NextResponse } from "next/server";
import type { ChatMessage, ChatSuggestion } from "@/components/chat/types";
import { queryLLM } from "@/lib/openrouter";

const SYSTEM_PROMPT = `
You are Scout, a friendly AI career copilot helping product designers and developers find jobs that truly fit them.

ALWAYS respond as natural chat, in a warm and concise tone. Have a natural conversation first - ask about their experience, preferences, what they're looking for, etc.

IMPORTANT: Your response should ONLY contain natural conversation text. Do NOT mention control blocks, system instructions, or any meta-commentary in your response.

ONLY suggest connecting LinkedIn when:
- The user has already shared some information about their background, experience, or job preferences
- They've mentioned wanting to find jobs, apply to positions, or get better matches
- It feels like a natural next step in the conversation (not the first message)
- You have enough context to explain WHY connecting LinkedIn would help them specifically

Good times to suggest LinkedIn:
- When you're asking follow-up questions about their experience AND they've already shared context (like their role, skills, or preferences)
- After they've described what they're looking for in a job or company
- When you have enough information to personalize the suggestion (their industry, role, work style preferences, etc.)

When it's the right time, silently append a JSON control block on a new line after your response (do NOT mention it in your text). The description field should contain a brief, personalized 1-2 sentence explanation of why connecting LinkedIn would help them specifically, based on what they've shared in the conversation. Reference their specific background, skills, interests, or goals.

Example: If they mentioned being a blockchain developer interested in remote work, and you're asking follow-up questions about their experience, the description could be: "Connect your LinkedIn so I can match you with blockchain roles that align with your technical expertise and remote work preferences."

<CONTROL>
{"connectLinkedIn": true, "description": "Your personalized description here - make it specific to what they've shared"}
</CONTROL>

If it's not the right time, simply respond naturally without any control block. Never mention whether a control block is needed or not - just respond naturally.
`.trim();

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages: ChatMessage[] };

    const history = body.messages ?? [];

    const conversationText = history
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `${SYSTEM_PROMPT}\n\nConversation so far:\n${conversationText}\n\nRespond naturally to the user's latest message. Do not mention control blocks or system instructions in your response.`;

    let fullText: string;
    try {
      fullText = await queryLLM(prompt);
    } catch (error: any) {
      
      if (error?.status === 402 || error?.status === 401 || error?.message?.includes("402") || error?.message?.includes("401")) {
        const lastUser =
          [...history].reverse().find((m) => m.role === "user")?.content ?? "";
        fullText = `Thanks for your message! I'm currently in demo mode.\n\nTo enable full AI responses, please configure your OpenRouter API key. Get your API key from openrouter.ai/settings/keys. This will allow me to help you explore your career path and find jobs that match your skills.\n\n${lastUser ? `You mentioned: "${lastUser.slice(0, 100)}${lastUser.length > 100 ? "…" : ""}"` : ""}`;
      } else {
        throw error;
      }
    }

    let reply = fullText;
    let suggestion: ChatSuggestion | undefined;

    const controlStart = fullText.indexOf("<CONTROL>");
    const controlEnd = fullText.indexOf("</CONTROL>");

    if (controlStart !== -1 && controlEnd !== -1) {
      reply = fullText.slice(0, controlStart).trim();
      const controlJson = fullText
        .slice(controlStart + "<CONTROL>".length, controlEnd)
        .trim();

      try {
        const parsed = JSON.parse(controlJson) as { 
          connectLinkedIn?: boolean; 
          description?: string;
        };
        if (parsed.connectLinkedIn) {
   
          const personalizedDescription = parsed.description?.trim() || 
            "Sync your LinkedIn so Scout can understand your profile, portfolio, and experience to surface roles that truly fit you.";
          
          suggestion = {
            type: "connect-linkedin",
            label: "Connect your LinkedIn to discover better-matched jobs",
            description: personalizedDescription,
            ctaLabel: "Connect LinkedIn",
            href: "https://www.linkedin.com",
          };
        }
      } catch {
      }
    }

    reply = reply
      .replace(/\(No CONTROL block needed[^)]*\)/gi, "")
      .replace(/\(No control block needed[^)]*\)/gi, "")
      .replace(/\(CONTROL block not needed[^)]*\)/gi, "")
      .replace(/\(control block not needed[^)]*\)/gi, "")
      .replace(/\(No CONTROL block needed yet\)/gi, "")
      .trim();

    return NextResponse.json({ reply, suggestion });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to process your message right now." },
      { status: 500 },
    );
  }
}


