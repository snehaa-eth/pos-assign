import { NextRequest } from "next/server";
import { AssemblyAI } from "assemblyai";
import { Readable } from "stream";

const apiKey = process.env.ASSEMBLYAI_API_KEY;

const client = apiKey
  ? new AssemblyAI({
      apiKey,
    })
  : null;

type Transcriber = ReturnType<NonNullable<typeof client>["streaming"]["transcriber"]>;
const activeSessions = new Map<string, {
  transcriber: Transcriber;
  audioStream: Readable;
}>();

export async function POST(req: NextRequest) {
  if (!client || !apiKey) {
    return new Response(
      JSON.stringify({ error: "AssemblyAI is not configured on the server." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const { action, sessionId, audioChunk } = (await req.json()) as {
    action?: "start" | "chunk" | "stop";
    sessionId?: string;
    audioChunk?: string;
  };

  if (action === "chunk" && sessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (audioChunk) {
      const audioBuffer = Buffer.from(audioChunk, "base64");
      session.audioStream.push(audioBuffer);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

    if (action === "stop" && sessionId) {
    const session = activeSessions.get(sessionId);
    if (session) {
      session.audioStream.push(null);
      await session.transcriber.close();
      activeSessions.delete(sessionId);
    }

    return new Response(
      JSON.stringify({ success: true, sessionId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (action === "start") {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const CONNECTION_PARAMS = {
            sampleRate: 16000,
            formatTurns: true,
          };

          const transcriber = client!.streaming.transcriber(CONNECTION_PARAMS);

          const audioStream = new Readable({
            read() {
            },
          });

          transcriber.on("open", ({ id }) => {
            console.log(`Session opened with ID: ${id}`);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "session", sessionId: newSessionId, id })}\n\n`,
              ),
            );
          });

          transcriber.on("error", (error) => {
            console.error("Transcriber error:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", error: error.message || "Transcription error" })}\n\n`,
              ),
            );
          });

          transcriber.on("close", (code, reason) => {
            console.log("Session closed:", code, reason);
            activeSessions.delete(newSessionId);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "close", code, reason })}\n\n`,
              ),
            );
            controller.close();
          });

          transcriber.on("turn", (turn) => {
            if (!turn.transcript) {
              return;
            }
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "transcript", text: turn.transcript })}\n\n`,
              ),
            );
          });

          await transcriber.connect();
          
          Readable.toWeb(audioStream).pipeTo(transcriber.stream());

          activeSessions.set(newSessionId, { transcriber, audioStream });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "ready", sessionId: newSessionId })}\n\n`,
            ),
          );
        } catch (error: any) {
          console.error("Stream error:", error);
          const errorMsg = JSON.stringify({
            type: "error",
            error: error.message || "Failed to process streaming request",
          });
          controller.enqueue(encoder.encode(`data: ${errorMsg}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  return new Response(
    JSON.stringify({ error: "Invalid action or missing sessionId" }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}
