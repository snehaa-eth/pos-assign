interface VoiceVisualizerProps {
  isSpeaking: boolean;
}

export function VoiceVisualizer({ isSpeaking }: VoiceVisualizerProps) {
  if (!isSpeaking) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-[#fef3e7] px-3 py-1.5 text-[11px] font-medium text-[#92400e] shadow-sm">
      <span>Speaking…</span>
      <div className="speaking-bars" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}


