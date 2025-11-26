# Assignment 

Assignment project: Next.js application with AI-powered career copilot chat and real-time voice transcription.

## Features

- AI chat interface with career guidance
- Real-time voice transcription (AssemblyAI)
- Pause/resume recording with frozen waveform
- LinkedIn integration suggestions
- UI with voice visualization

## Tech Stack

- Next.js 15, TypeScript, Tailwind CSS
- OpenRouter API (LLM)
- AssemblyAI (Speech-to-Text)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```env
ASSEMBLYAI_API_KEY=your_key
OPENROUTER_API_KEY=your_key
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Note**: Streaming transcription uses in-memory sessions. For production, consider using a database for session management.
