import { AudioLines, Loader2, MessageCircle, Mic, MicOff, Pause, Play, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  disabled?: boolean;
  onSend: (text: string, meta?: { viaVoice?: boolean }) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sseReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const accumulatedTextRef = useRef<string>("");
  const isListeningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      void stopListening();
    };
  }, []);

  const convertToPCM16 = (float32Array: Float32Array): Uint8Array => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Uint8Array(buffer);
  };

  const startStreamingTranscription = async () => {
    try {
      const res = await fetch("/api/stt/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (!res.ok) {
        throw new Error("Failed to start streaming session");
      }

      // Read Server-Sent Events
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      sseReaderRef.current = reader;

      const processSSE = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === "ready" && data.sessionId) {
                    sessionIdRef.current = data.sessionId;
                  } else if (data.type === "transcript" && data.text) {
                    const newText = data.text.trim();
                    if (newText) {
                      accumulatedTextRef.current = newText;
                      setValue(newText);
                    }
                  } else if (data.type === "error") {
                    console.error("Transcription error:", data.error);
                  } else if (data.type === "close") {
                    break;
                  }
                } catch (e) {
                }
              }
            }
          }
        } catch (error) {
          console.error("SSE processing error:", error);
        }
      };

      void processSSE();
    } catch (error) {
      console.error("Failed to start streaming:", error);
      setIsListening(false);
    }
  };

  const sendAudioChunk = async (pcm16Data: Uint8Array) => {
    if (!sessionIdRef.current) return;

    try {
      const binaryString = Array.from(pcm16Data, (byte) => String.fromCharCode(byte)).join("");
      const base64 = btoa(binaryString);

      fetch("/api/stt/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chunk",
          sessionId: sessionIdRef.current,
          audioChunk: base64,
        }),
      }).catch((error) => {
        console.error("Chunk send error:", error);
      });
    } catch (error) {
      console.error("Chunk encoding error:", error);
    }
  };

  const handleSend = async (viaVoice?: boolean) => {
    if (!value.trim() || disabled) return;

    setIsSending(true);
    try {
      onSend(value.trim(), { viaVoice });
      setValue("");
      accumulatedTextRef.current = "";
    } finally {
      setIsSending(false);
    }
  };

  const stopListening = async () => {
    isListeningRef.current = false;
    isPausedRef.current = false;
    setIsListening(false);
    setIsPaused(false);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (sessionIdRef.current) {
      try {
        await fetch("/api/stt/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "stop",
            sessionId: sessionIdRef.current,
          }),
        });
      } catch (error) {
        console.error("Error stopping session:", error);
      }
      sessionIdRef.current = null;
    }

    if (sseReaderRef.current) {
      try {
        await sseReaderRef.current.cancel();
      } catch (error) {
      }
      sseReaderRef.current = null;
    }

    if (accumulatedTextRef.current) {
      setValue(accumulatedTextRef.current);
    }
  };

  const toggleListening = async () => {
    if (disabled) return;

    if (isListening) {
      await stopListening();
      return;
    }

    setValue("");
    accumulatedTextRef.current = "";

    try {
      await startStreamingTranscription();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!isListeningRef.current || isPausedRef.current) return;

        const inputData = event.inputBuffer.getChannelData(0);
        const pcm16Data = convertToPCM16(inputData);
        void sendAudioChunk(pcm16Data);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      isListeningRef.current = true;
      isPausedRef.current = false;
      setIsListening(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsListening(false);
      await stopListening();
    }
  };

  const pauseListening = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const resumeListening = () => {
    isPausedRef.current = false;
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isPaused) {
      resumeListening();
    } else {
      pauseListening();
    }
  };

  return (
    <div className="space-y-3">
      {isListening ? (
        <div className="flex items-center justify-between rounded-2xl bg-[#fff1e6] px-4 py-3 text-sm shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <span className="font-medium text-[#ea580c]">{isPaused ? "Paused" : "Listening..."}</span>
          <div className="flex flex-1 items-center justify-center">
            <div className={`speaking-bars ${isPaused ? "paused" : ""}`} aria-hidden>
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span/>
              <span/>
              <span/>
              <span/>
              <span/>
              <span/>
              <span/>
              <span/>
              <span/>
              <span/>
              <span/>
              <span/>
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#4b5563] shadow-sm"
              aria-label="Stop listening"
            >
              <MicOff className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={togglePause}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#4b5563] shadow-sm"
              aria-label={isPaused ? "Resume listening" : "Pause listening"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                stopListening();
                if (textAreaRef.current) {
                  textAreaRef.current.focus();
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#111827] shadow-sm"
              aria-label="Switch to chat input"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-3 rounded-2xl border border-[#e5e7eb] bg-white/80 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex-1 relative">
            <textarea
              ref={textAreaRef}
              rows={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Talk to Scout..."
              className="min-h-[44px] max-h-[120px] w-full resize-none border-none bg-transparent px-3 py-2 text-sm text-[#111827] outline-none placeholder:text-[#9ca3af]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
          </div>
             <button
            type="button"
            disabled={disabled || !value.trim()}
            onClick={() => void handleSend(false)}
            className="flex h-11 w-11 items-center justify-center rounded-md bg-[#e15d39] text-white shadow-md transition hover:bg-[#d54c2a] disabled:cursor-not-allowed disabled:bg-[#fca68b] cursor-pointer"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
          
          <button
            type="button"
            onClick={toggleListening}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-[#111827] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827] cursor-pointer"
            aria-label="Start voice input"
          >
            <AudioLines className="h-6 w-6" />
          </button>
       
        </div>
      )}
    </div>
  );
}


