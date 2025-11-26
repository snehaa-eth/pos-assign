import { Sparkles } from "lucide-react";

interface ChatHeaderProps {
  isThinking: boolean;
}

export function ChatHeader({ isThinking }: ChatHeaderProps) {
  if (!isThinking) return null;

  return (
    <header className="pointer-events-none absolute left-[55%] top-6 z-10 flex w-[380px] -translate-x-1/2 items-center justify-center animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3 rounded-full bg-white/90 px-5 py-3 text-xs font-medium text-[#4b5563] shadow-[0_18px_40px_rgba(15,23,42,0.1)] backdrop-blur">
        <div className="relative flex h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
          <div
            className="absolute left-0 top-0 h-full w-3/4 rounded-full bg-linear-to-r from-[#3b82f6] via-[#6366f1] to-[#22c55e] animate-[shimmer_1.4s_ease-in-out_infinite]"
            aria-hidden
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#f97316]" />
          <span className="uppercase tracking-[0.12em] text-[10px] text-[#6b7280]">
            Step 1 of 4
          </span>
        </div>
        <span className="truncate text-[11px] text-[#111827]">
          Scout is thinking about your answer…
        </span>
      </div>
    </header>
  );
}


