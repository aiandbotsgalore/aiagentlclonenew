# CLAUDE.md - AI Assistant Guide for EchoSphere AI

## Project Overview

**EchoSphere AI** is an interactive voice-enabled AI companion application built with React, TypeScript, and Google's Gemini Live API. The application enables real-time voice conversations with customizable AI personalities, featuring audio streaming, automatic reconnection, and a modern UI.

### Key Features
- Real-time voice conversations using Gemini 2.0 Flash Live API
- Customizable AI agent personalities (Zara, Kai, Onyx)
- Audio streaming with Web Audio API
- Automatic reconnection with exponential backoff
- Text fallback mode when microphone unavailable
- Visual feedback (volume indicators, 3D face animations)
- Persistent user and agent settings

---

## Tech Stack

### Core Technologies
- **React**: 19.1.1 (latest with concurrent features)
- **TypeScript**: 5.8.2 (strict mode enabled)
- **Vite**: 6.2.0 (build tool and dev server)
- **Zustand**: 5.0.8 (state management with persistence)
- **Google GenAI**: 1.19.0 (Gemini API client)
- **EventEmitter3**: 5.0.1 (event handling)
- **Tailwind CSS**: via CDN (styling)

### Build Configuration
- **Target**: ES2022
- **Module System**: ESNext with bundler resolution
- **JSX**: react-jsx (automatic runtime)
- **Strict Mode**: Enabled with all strict type checking
- **Path Aliases**: `@/*` maps to root directory

---

## Directory Structure

```
/
├── components/          # React UI components
│   ├── Header.tsx              # App header with branding
│   ├── KeynoteCompanion.tsx    # Main companion interface
│   ├── ControlTray.tsx         # Connection controls
│   ├── UserSettings.tsx        # User profile modal
│   ├── AgentEdit.tsx           # Agent customization modal
│   ├── BasicFace.tsx           # 3D animated face
│   ├── Visualizer.tsx          # Audio visualizer
│   ├── ChatView.tsx            # Chat message display
│   ├── ChatInterface.tsx       # Chat input/controls
│   ├── MessageBubble.tsx       # Individual message component
│   ├── InputBar.tsx            # Text input component
│   ├── Modal.tsx               # Reusable modal component
│   ├── SettingsModal.tsx       # Settings wrapper
│   ├── SettingsPanel.tsx       # Settings content
│   ├── DesignPanel.tsx         # Visual customization
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── IconComponents.tsx      # SVG icon components
│
├── context/             # React Context providers
│   └── LiveAPIProvider.tsx     # Provides LiveAPI to app tree
│
├── hooks/               # Custom React hooks
│   ├── useLiveApi.ts           # Main API connection hook
│   ├── useInteractions.ts      # 3D face interactions (hover, tilt)
│   ├── useSpeechRecognition.ts # Browser speech input
│   └── useSpeechSynthesis.ts   # Browser text-to-speech
│
├── lib/                 # Core library code
│   ├── GenAILiveClient.ts      # Gemini Live API client
│   ├── AudioStreamer.ts        # Audio playback manager
│   └── AudioRecorder.ts        # Microphone input handler
│
├── stores/              # Zustand state stores
│   ├── useAgent.ts             # Agent state + presets
│   ├── useUser.ts              # User profile state
│   └── useUI.ts                # UI state (modals, etc.)
│
├── services/            # Business logic services
│   └── geminiService.ts        # Gemini API utilities
│
├── public/              # Static assets
├── dist/                # Build output (git-ignored)
├── attached_assets/     # Documentation assets
│
├── App.tsx              # Root component
├── index.tsx            # Entry point
├── types.ts             # TypeScript type definitions
├── constants.ts         # App constants (currently empty)
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
├── index.html           # HTML template
├── README.md            # User documentation
└── replit.md            # Development history
```

---

## Key Components & Architecture

### 1. App Entry Point (`App.tsx`, `index.tsx`)
- **App.tsx**: Root component wrapping entire app in `LiveAPIProvider`
- **index.tsx**: Renders App into DOM
- **Component Tree**: `LiveAPIProvider` → `Header` + `KeynoteCompanion` + `ControlTray` + modals

### 2. Core Hook: `useLiveApi` (`hooks/useLiveApi.ts`)
**Purpose**: Manages Gemini Live API connection lifecycle

**Key Features**:
- WebSocket connection management
- Automatic reconnection with exponential backoff (1s → 30s, max 10 attempts)
- Audio streaming integration
- Volume monitoring (throttled to 20 updates/sec)
- Connection state tracking

**Return Values**:
```typescript
{
  isConnected: boolean;
  isConnecting: boolean;
  outputVolume: number;
  client: GenAILiveClient | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  connectionError: string | null;
  reconnectAttempt: number;
}
```

**Critical Implementation Details**:
- Stores connection params in refs for reconnection
- Validates agent/user data before connecting
- Prevents reconnection on normal closure (codes 1000, 1001)
- Cancels reconnection on user-initiated disconnect
- Throttles volume updates to prevent UI lag

### 3. Live API Client (`lib/GenAILiveClient.ts`)
**Purpose**: WebSocket client for Gemini Live API

**Event Emitter**:
- `open`: Connection established
- `close`: Connection closed (with code/reason)
- `error`: Connection error
- `audio`: Audio chunk received (ArrayBuffer)

**Configuration**:
- Model: `models/gemini-2.0-flash-live-001`
- Response Modality: `AUDIO` only (required by Live API)
- System Instruction: Dynamically built from agent personality + user info

**Audio Handling**:
- Receives base64-encoded PCM audio
- Converts to ArrayBuffer
- Emits to AudioStreamer for playback

### 4. Audio Components (`lib/AudioStreamer.ts`, `lib/AudioRecorder.ts`)

**AudioStreamer**:
- Manages audio playback queue
- Uses Web Audio API (AudioContext)
- Emits volume events for visualizer
- Handles playback errors gracefully

**AudioRecorder**:
- Captures microphone input
- Converts to PCM16 format
- Sends to Live API client
- Manages MediaStream lifecycle

### 5. State Management (Zustand Stores)

**`stores/useAgent.ts`**:
- Current agent selection
- Agent presets (Zara, Kai, Onyx)
- Custom agent storage
- Persisted to localStorage as `agent-storage`

```typescript
type Agent = {
  id: string;
  name: string;
  personality: string;
  bodyColor: string;
  voice: { pitch: 'low'|'medium'|'high'; style: 'calm'|'energetic'|'formal' };
}
```

**`stores/useUser.ts`**:
- User name and info
- Persisted to localStorage as `user-storage`
- Used in agent system instructions

**`stores/useUI.ts`**:
- Modal visibility state
- Not persisted (ephemeral)

### 6. Context Provider (`context/LiveAPIProvider.tsx`)
- Wraps `useLiveApi` hook
- Provides API state to entire component tree
- Must be used at app root
- Hook accessor: `useLiveAPI()`

---

## Development Workflows

### Environment Setup

**Required Environment Variables**:
```bash
GEMINI_API_KEY=your_api_key_here
```

**Setup Methods**:
1. Create `.env.local` file (git-ignored)
2. Set in Replit Secrets (for Replit environment)
3. Set in shell: `export GEMINI_API_KEY=...`

**Important**: Vite config uses `loadEnv()` to inject env vars into browser via `process.env.GEMINI_API_KEY` define.

### Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://0.0.0.0:5000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Dev Server Configuration (Vite)
- Host: `0.0.0.0` (accessible from all interfaces)
- Port: `5000`
- HMR: WebSocket on port 5000, client uses port 443 with WSS
- Allowed Hosts: `true` (required for Replit)

---

## Code Conventions & Best Practices

### TypeScript Standards
1. **Strict Mode**: All strict type checking enabled
2. **No Unused Vars**: `noUnusedLocals` and `noUnusedParameters` enforced
3. **Explicit Returns**: `noImplicitReturns` enforced
4. **No Any**: Avoid `any` except for un-exported types (e.g., `LiveSession`)
5. **Type Imports**: Use type-only imports when possible

### React Patterns
1. **Functional Components**: All components use function syntax with `React.FC`
2. **Hooks**: Use custom hooks for complex logic (e.g., `useLiveApi`)
3. **Context**: Use Context + custom hook pattern (e.g., `LiveAPIProvider` + `useLiveAPI`)
4. **Event Handlers**: Use `useCallback` for event handlers to prevent re-renders
5. **Refs**: Use `useRef` for mutable values that don't trigger re-renders

### State Management
1. **Local State**: Use `useState` for component-local state
2. **Global State**: Use Zustand stores for app-wide state
3. **Persistence**: Use Zustand `persist` middleware for localStorage
4. **Derived State**: Compute in render, don't store

### Error Handling
1. **API Errors**: Always catch and display to user
2. **Validation**: Validate user input before API calls
3. **Logging**: Use `console.error` for errors, `console.log` for info
4. **User Feedback**: Show clear error messages in UI

### Component Structure
```typescript
import React, { useState, useCallback } from 'react';

// Types
type Props = {
  // ...
};

// Component
const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();

  // Callbacks
  const handleClick = useCallback(() => {
    // ...
  }, [deps]);

  // Render
  return (
    <div>...</div>
  );
};

export default Component;
```

---

## Common Patterns & Anti-Patterns

### ✅ DO

1. **Use Custom Hooks for Logic**
   ```typescript
   // Good: Logic in custom hook
   const { isConnected, connect } = useLiveAPI();
   ```

2. **Validate Input Before API Calls**
   ```typescript
   if (!agent || !userData?.name) {
     throw new Error('Missing required data');
   }
   ```

3. **Clean Up Resources**
   ```typescript
   useEffect(() => {
     const cleanup = initResource();
     return () => cleanup();
   }, []);
   ```

4. **Throttle High-Frequency Updates**
   ```typescript
   if (now - lastUpdate > 50) {
     setVolume(vol);
   }
   ```

5. **Use EventEmitter for Non-React Communication**
   ```typescript
   class Client extends EventEmitter<Events> {
     emit('event', data);
   }
   ```

### ❌ DON'T

1. **Don't Mutate State Directly**
   ```typescript
   // Bad
   state.value = newValue;

   // Good
   setState(prev => ({ ...prev, value: newValue }));
   ```

2. **Don't Forget Cleanup**
   ```typescript
   // Bad: Memory leak
   useEffect(() => {
     setInterval(...);
   }, []);

   // Good
   useEffect(() => {
     const id = setInterval(...);
     return () => clearInterval(id);
   }, []);
   ```

3. **Don't Use `any` Without Reason**
   ```typescript
   // Bad
   const data: any = ...;

   // Good
   type Data = { ... };
   const data: Data = ...;
   ```

4. **Don't Ignore Errors**
   ```typescript
   // Bad
   try { ... } catch (e) {}

   // Good
   try { ... } catch (e) {
     console.error(e);
     setError(e.message);
   }
   ```

---

## Critical Implementation Notes

### 1. API Key Injection
- **Issue**: Env vars not available in browser by default
- **Solution**: Vite config uses `loadEnv()` + `define` to inject
- **Verification**: Check console logs for "API key: ✓ Present"

### 2. Reconnection Logic
- **Automatic**: Only on abnormal closure (not codes 1000, 1001)
- **Exponential Backoff**: 1s → 2s → 4s → 8s... up to 30s
- **Jitter**: 0-500ms random delay prevents thundering herd
- **Max Attempts**: 10 attempts before giving up
- **User Disconnect**: Cancels auto-reconnection

### 3. Audio Playback
- **Format**: Raw PCM16 from Gemini API
- **Decoding**: Use AudioContext directly, NO decodeAudioData
- **Queue**: Buffer chunks to prevent stuttering
- **Error Handling**: Catch playback errors to prevent queue stalls

### 4. Volume Throttling
- **Rate**: Max 20 updates/sec (50ms interval)
- **Reason**: Prevent excessive re-renders
- **Implementation**: Ref-based last update timestamp

### 5. Input Validation
- **Agent**: Must exist and have valid structure
- **User Name**: Required, non-empty string
- **User Info**: Optional, can be null/undefined/string
- **Timing**: Validate before connection attempt

### 6. WebSocket Closure Codes
- `1000`: Normal closure (no reconnect)
- `1001`: Going away intentionally (no reconnect)
- Other codes: Abnormal (trigger reconnect)

---

## Testing & Quality Assurance

### Manual Testing Checklist
- [ ] Connection establishes successfully
- [ ] Voice conversation works end-to-end
- [ ] Reconnection works after network drop
- [ ] Text fallback mode works
- [ ] Agent switching works
- [ ] User settings persist
- [ ] Microphone permissions handled
- [ ] Error messages display correctly
- [ ] Volume indicator updates
- [ ] Modal open/close works

### Common Issues & Solutions

**Issue**: API key not found
- **Solution**: Check `.env.local` exists and Vite config injects it

**Issue**: Connection fails immediately
- **Solution**: Check API key validity and network connectivity

**Issue**: Audio doesn't play
- **Solution**: Check AudioStreamer initialization and browser permissions

**Issue**: Reconnection doesn't work
- **Solution**: Verify closure code is not 1000/1001 and `shouldReconnect` ref is true

**Issue**: Volume indicator lags
- **Solution**: Ensure throttling is working (check 50ms interval)

---

## Important Guidelines for AI Assistants

### When Modifying This Codebase

1. **Read Before Editing**
   - Always read the file you're modifying
   - Understand the context and dependencies
   - Check for related files that might be affected

2. **Preserve TypeScript Strictness**
   - Don't disable strict mode or ignore errors
   - Fix type errors properly, don't use `any` as escape hatch
   - Maintain explicit return types for functions

3. **Maintain State Management Patterns**
   - Keep Zustand stores for global state
   - Use local state for component-specific data
   - Don't mix state management approaches

4. **Follow React Best Practices**
   - Use functional components
   - Implement proper cleanup in useEffect
   - Memoize callbacks and expensive computations
   - Don't create components inside other components

5. **Test Critical Paths**
   - Connection/disconnection flow
   - Reconnection logic
   - Audio streaming
   - Error handling

6. **Preserve Reconnection Logic**
   - Don't simplify the exponential backoff algorithm
   - Maintain jitter for thundering herd prevention
   - Keep closure code checking logic intact

7. **Document Complex Changes**
   - Update this CLAUDE.md if architecture changes
   - Add comments for non-obvious logic
   - Update README.md for user-facing changes

### Common Modification Scenarios

**Adding New Agent Preset**:
1. Add to `AGENT_PRESETS` array in `stores/useAgent.ts`
2. Follow existing structure (id, name, personality, bodyColor, voice)
3. Test agent switching and reconnection

**Changing API Model**:
1. Update `MODEL` constant in `lib/GenAILiveClient.ts`
2. Verify response modality compatibility
3. Test audio format compatibility

**Adding UI Component**:
1. Create in `components/` directory
2. Use TypeScript with `React.FC<Props>`
3. Import and use in appropriate parent component
4. Follow Tailwind CSS patterns from existing components

**Modifying Reconnection Behavior**:
1. Edit `useLiveApi.ts` carefully
2. Maintain exponential backoff + jitter
3. Test with network disconnections
4. Verify closure code handling

---

## Project History & Context

### Original Purpose
- Built as AI companion demo for Google AI Studio
- Designed for personal use with Gemini API
- Focus on real-time voice interaction

### Recent Major Fixes (Nov 2025)
- Fixed Gemini API environment variable injection
- Corrected Live API model name and configuration
- Implemented automatic reconnection with exponential backoff
- Fixed PCM audio playback (removed incorrect decoding)
- Added comprehensive error handling
- Added text input fallback mode
- Throttled volume updates for performance
- Created missing interaction hooks
- Hardened cleanup logic to prevent race conditions

### Current State
- Production-ready for personal use
- Stable voice conversations
- Robust error handling and reconnection
- Cross-platform compatible (Windows, Mac, Linux)
- Optimized for Replit deployment

---

## Quick Reference

### Key Files to Understand First
1. `hooks/useLiveApi.ts` - Connection management
2. `lib/GenAILiveClient.ts` - API client
3. `stores/useAgent.ts` - Agent state
4. `components/ControlTray.tsx` - Connection UI
5. `vite.config.ts` - Build configuration

### Key Commands
```bash
npm run dev          # Start development
npm run build        # Build for production
npm run preview      # Preview production build
```

### Environment Variables
```bash
GEMINI_API_KEY      # Required - Gemini API key
```

### Important URLs
- AI Studio App: https://ai.studio/apps/drive/1VYUE2igRKe8KMc2aghUbGVmiGA9r_9i8
- Dev Server: http://0.0.0.0:5000 (or Replit URL)

---

## Conclusion

This codebase represents a well-structured React application with careful attention to real-time communication, error handling, and user experience. When working with this code, prioritize maintaining the existing patterns, especially around connection management and audio streaming, as these are critical to the app's functionality.

For questions or clarifications, refer to the detailed documentation in this file or examine the referenced source files directly.

**Last Updated**: 2025-11-25
**Version**: 1.0.0
**Maintained By**: AI Assistant (Claude)
