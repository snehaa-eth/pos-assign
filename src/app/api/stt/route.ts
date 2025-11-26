import { NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

const apiKey = process.env.ASSEMBLYAI_API_KEY;

const client = apiKey
  ? new AssemblyAI({
      apiKey,
    })
  : null;

export async function POST(req: Request) {

  if (!client || !apiKey) {
    return NextResponse.json(
      { error: "AssemblyAI is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const { audioBase64 } = (await req.json()) as { audioBase64?: string };

    if (!audioBase64) {
      return NextResponse.json(
        { error: "Missing audioBase64 in request body." },
        { status: 400 },
      );
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");

    const uploadRes = await client.files.upload(audioBuffer);

    console.log({uploadRes});

    const transcript = await client.transcripts.transcribe({
      audio: uploadRes,
      format_text: true,
    });

    console.log({transcript});

    return NextResponse.json({
      text: transcript.text ?? "",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to transcribe audio with AssemblyAI." },
      { status: 500 },
    );
  }
}


