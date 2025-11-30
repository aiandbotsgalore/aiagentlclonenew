# Snuggles Audio Node

This is the Electron-based desktop application component of the Echosphere AI system. It serves as a powerful "Audio Node" designed to run locally on a host machine, facilitating high-fidelity, low-latency AI interactions for live broadcasts (like Twitter Spaces).

## Features

*   **Native Audio Integration**: Integrates with system audio devices and virtual cables (like VoiceMeeter) for professional routing.
*   **Gemini Live API Client**: Uses the latest Google Generative AI SDK for real-time, low-latency voice conversations.
*   **Voice Activity Detection (VAD)**: Intelligent turn-taking logic to prevent interruptions and save bandwidth.
*   **Local Knowledge Base (RAG)**: Ingests local documents (PDF, TXT) into an Orama vector database for context-aware responses.
*   **Session Memory**: Persists conversation history and session summaries using Dexie.js.
*   **Real-time Analytics**: Tracks response times, speaking ratios, and sentiment analysis.

## Setup & Installation

1.  **Prerequisites**:
    *   Node.js (v18+)
    *   Virtual Audio Cable / VoiceMeeter (recommended for routing audio to/from streaming software).

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configuration**:
    *   Ensure your `GEMINI_API_KEY` is set in the environment or `.env` file (if applicable for your setup, otherwise the app may prompt or use defaults).

## Development

To start the application in development mode:

```bash
npm run dev
```

This command uses `concurrently` to run:
*   `dev:main`: Compiles the Electron main process (TypeScript) and starts Electron.
*   `dev:renderer`: Starts the Vite dev server for the React UI.

## Building

To build the application for production:

```bash
npm run build
```

*   `build:main`: Compiles the main process code.
*   `build:renderer`: Builds the React renderer assets.

## Directory Structure

*   **`src/main`**: The Electron main process. Handles system resources, audio streams, and API connections.
    *   `audio/`: Audio processing logic (resampling, VAD).
    *   `llm/`: Clients for the Gemini API.
    *   `knowledge/`: Vector database and document ingestion.
    *   `memory/`: Database for conversation history.
*   **`src/renderer`**: The React-based user interface.
    *   `components/`: UI components (Panels, Visualizers).
    *   `services/`: Frontend services for analytics and data handling.
*   **`src/shared`**: Types and interfaces shared between main and renderer processes.
*   **`src/lib`**: Shared utility libraries (e.g., optimized audio resampler).

## Audio Pipeline

1.  **Input**: Audio is captured from the selected input device (e.g., Microphone or VoiceMeeter Output).
2.  **Processing**:
    *   Renderer captures raw audio (48kHz Float32).
    *   IPC sends audio chunks to Main process.
    *   Main process uses `AudioResampler` to convert to 16kHz PCM16.
    *   `VoiceActivityDetector` checks for speech.
3.  **Transmission**: If speech is detected, audio is streamed to Gemini Live API via WebSocket.
4.  **Output**:
    *   Gemini returns 24kHz PCM16 audio.
    *   Main process upsamples to 48kHz Float32.
    *   Audio is sent to Renderer via IPC.
    *   Renderer plays audio to the selected output device (e.g., Speakers or VoiceMeeter Input).

## License

MIT
