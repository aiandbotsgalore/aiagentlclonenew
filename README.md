# Echosphere AI - Dr. Snuggles

This repository contains the source code for **Dr. Snuggles**, a local-first AI audio companion designed for Twitter Spaces and other live audio environments. It leverages Google's Generative AI Gemini Live API to provide a responsive, conversational AI persona.

## Overview

The application is split into two main parts:

1.  **Web Application (Root)**: A React-based web interface for interacting with the AI directly in the browser.
2.  **Snuggles Audio Node**: An Electron-based desktop application that acts as a dedicated audio node, providing advanced features like VoiceMeeter integration, local knowledge base management, and low-latency audio processing.

## Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm (or yarn/pnpm)
*   A Google Cloud Project with the Gemini API enabled.
*   A Gemini API Key.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd echosphere-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    *   Create a `.env.local` file in the root directory.
    *   Add your Gemini API key:
        ```
        GEMINI_API_KEY=your_api_key_here
        ```

### Running the Web Application

To run the browser-based React application:

```bash
npm run dev
```

This will start the Vite development server, usually at `http://localhost:5173`.

### Running the Electron Audio Node

For the full desktop experience with advanced audio routing:

1.  Navigate to the `Snuggles_Audio_Node` directory:
    ```bash
    cd Snuggles_Audio_Node
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the Electron app:
    ```bash
    npm run dev
    ```

    This will start both the Electron main process and the renderer process concurrently.

## Architecture

### Root Web App
*   **`src/components`**: UI components for the web interface.
*   **`src/context`**: React context providers (e.g., `LiveAPIProvider`).
*   **`src/hooks`**: Custom hooks for API interaction and UI logic.
*   **`src/lib`**: Core libraries for audio recording and streaming.
*   **`src/stores`**: Zustand stores for state management.

### Snuggles Audio Node (Electron)
*   **`src/main`**: Electron main process code.
    *   **`audio`**: Audio management, VAD, and resampling.
    *   **`llm`**: Gemini API clients (WebSocket).
    *   **`knowledge`**: RAG implementation using Orama.
    *   **`memory`**: Conversation history management using Dexie.js.
*   **`src/renderer`**: React-based UI for the desktop window.
*   **`src/shared`**: Shared types and constants.

## Key Features

*   **Real-time Conversation**: Low-latency voice interaction using Gemini Live API.
*   **Persona Management**: Configurable personality traits and voices.
*   **Knowledge Base (RAG)**: Ingests documents (PDF, TXT) to provide context-aware responses.
*   **Audio Routing**: Integration with VoiceMeeter for professional audio setups.
*   **Session Memory**: Remembers key topics and context within a session.
*   **Analytics**: Tracks speaking time, response latency, and engagement metrics.

## Documentation

The codebase is fully documented with JSDoc comments. You can explore the source files for detailed information on functions, classes, and interfaces.

## Contributing

Contributions are welcome! Please ensure you follow the existing code style and document any new features or changes.
