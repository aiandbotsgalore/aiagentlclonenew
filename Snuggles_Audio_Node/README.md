# 🎙️ Echosphere AI - Dr. Snuggles Edition

**Local-First, Audio-Only AI Companion for Twitter Spaces**

Dr. Snuggles is a high-context, hyper-intelligent AI persona powered by Google Gemini Live API, designed for live audio interactions in Twitter Spaces. Built as an Electron desktop application with zero-cost architecture and local-first design.

---

## 🌟 Features

- **Audio-Only Architecture**: Headless audio node routing via VoiceMeeter
- **Local RAG System**: 48GB RAM-optimized vector search with Orama
- **Zero Cost**: Uses Google Gemini free tier + local compute
- **Dr. Snuggles Persona**: Deep, authoritative "Charon" voice with scientific/esoteric personality
- **Long-Term Memory**: Dexie.js-powered conversation history
- **Sample Rate Conversion**: Automatic resampling for VoiceMeeter compatibility

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **VoiceMeeter** installed and configured
- **Google Gemini API Key** (free tier)
- **Windows** (for VoiceMeeter support)

### Installation

```bash
# Navigate to project directory
cd Snuggles_Audio_Node

# Install dependencies
npm install

# Set up environment
# Edit .env and add your Gemini API key (already included)

# Run development mode
npm run dev

# Build for production
npm run build
npm start
```

---

## 🏗️ Architecture

### Tech Stack

- **Electron**: Desktop app framework
- **React + TypeScript**: UI dashboard
- **Google Gemini Live API**: AI model (WebSocket)
- **Orama**: In-memory vector search (RAG)
- **Dexie.js**: IndexedDB wrapper (conversation history)
- **VoiceMeeter**: Audio routing to Twitter Spaces

### Audio Pipeline

```
Microphone (48kHz)
  → Downsample (24kHz)
  → Gemini Live API
  → Upsample (48kHz)
  → VoiceMeeter Input
  → Twitter Spaces
```

### Directory Structure

```
Snuggles_Audio_Node/
├── src/
│   ├── main/              # Electron main process
│   │   ├── audio/         # Audio manager + resampler
│   │   ├── llm/           # Gemini WebSocket client
│   │   ├── knowledge/     # RAG system (Orama + PDF parser)
│   │   ├── memory/        # Dexie.js conversation database
│   │   ├── main.ts        # Entry point
│   │   └── preload.ts     # IPC bridge
│   ├── renderer/          # React UI
│   │   ├── components/    # Dashboard components
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── shared/
│       └── types.ts       # TypeScript types
├── knowledge/             # Place PDF/TXT files here
├── package.json
└── README.md
```

---

## 📚 Knowledge Base

Place your PDF and text files in the `/knowledge` directory. The app will automatically:

1. Parse them on startup
2. Index them with Orama vector search
3. Save the index to disk for fast subsequent boots
4. Inject relevant knowledge into Dr. Snuggles' context during conversations

**Supported Formats:**
- `.pdf` - Parsed with pdf-parse
- `.txt` - Plain text files

---

## 🎭 Dr. Snuggles Persona

**Archetype**: Unholy hybrid of molecular biologist, esoteric scholar, and aggressive logician

**Voice**: Charon (deep, authoritative, commanding)

**Core Behavior**:
- Asserts, deconstructs, and reveals (rarely asks questions)
- Simulates running complex code/simulations verbally
- Sarcastic, "biologically surgical" tone
- Live Twitter Space conversational style

**System Prompt**: Automatically injected with:
- Current date/time awareness
- Recent session summaries
- Knowledge base context

---

## 🎛️ VoiceMeeter Setup

1. Install VoiceMeeter (Banana or Potato recommended)
2. Configure inputs:
   - **A1**: Your microphone
   - **B1**: Virtual input for Dr. Snuggles output
3. In Twitter Spaces:
   - Select "VoiceMeeter Input (B1)" as your microphone
4. In Dr. Snuggles Dashboard:
   - **Input Device**: Your microphone or VoiceMeeter Out
   - **Output Device**: VoiceMeeter Input

---

## 🔧 Configuration

### Audio Settings

- **System Sample Rate**: 48kHz (VoiceMeeter standard)
- **Gemini Sample Rate**: 24kHz (automatic conversion)
- **Buffer Size**: 4096 samples

### API Configuration

- **Model**: `gemini-2.0-flash-exp`
- **Voice**: `Charon` (hardcoded)
- **Response Modality**: Audio only

### Memory Management

- **Conversation History**: Last 50 turns stored in IndexedDB
- **Session Summaries**: Last 10 sessions
- **Cleanup**: Auto-prune conversations older than 30 days

---

## 🛠️ Development

### Scripts

```bash
npm run dev          # Start dev server (main + renderer)
npm run dev:main     # Build and run main process
npm run dev:renderer # Start Vite dev server
npm run build        # Build for production
npm start            # Run production build
```

### Key Files

- `src/main/audio/resampler.ts` - **CRITICAL**: Sample rate conversion logic
- `src/main/llm/geminiClient.ts` - Gemini WebSocket client + Dr. Snuggles prompt
- `src/main/knowledge/store.ts` - Orama RAG system
- `src/main/memory/database.ts` - Dexie.js conversation history

---

## 🐛 Troubleshooting

### Audio Issues

- **No audio output**: Check VoiceMeeter routing and selected devices
- **Pitch/speed problems**: Verify resampler is active (check console logs)
- **Crackling audio**: Increase buffer size in `audioManager.ts`

### Connection Issues

- **WebSocket fails**: Verify API key in `.env`
- **"403 Forbidden"**: Check Gemini API quota
- **Reconnection loops**: Check network connectivity

### Knowledge Base

- **PDFs not parsing**: Ensure `pdf-parse` is installed
- **Slow indexing**: Large PDFs are automatically chunked
- **Missing context**: Check `knowledge/` directory and console logs

---

## 📝 License

MIT License - Free for personal and commercial use

---

## 🙏 Credits

- **AI Model**: Google Gemini 2.0 Flash (Live API)
- **Voice**: Charon (Gemini prebuilt voice)
- **Audio Routing**: VoiceMeeter by VB-Audio Software
- **Vector Search**: Orama by Orama Inc.

---

## 🚀 Roadmap

- [ ] Multi-voice support (beyond Charon)
- [ ] Real-time transcript export
- [ ] Twitter Spaces API integration
- [ ] Custom knowledge base UI
- [ ] Session analytics dashboard
- [ ] Multi-persona switching

---

**Built with ❤️ for the AI community**

*Dr. Snuggles - Because Twitter Spaces deserves better AI.*
