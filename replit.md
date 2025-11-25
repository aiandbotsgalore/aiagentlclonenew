# EchoSphere AI - AI Companion App

## Overview
This is an AI companion application built with React, TypeScript, and Vite. It uses Google's Gemini API for real-time conversational AI with live audio capabilities. The app provides an interactive chat interface where users can have voice conversations with a customizable AI agent.

## Project Architecture
- **Frontend**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 6.2.0
- **AI Integration**: Google Gemini API (@google/genai)
- **State Management**: Zustand
- **Audio Processing**: Web Audio API with real-time streaming
- **Styling**: Tailwind CSS (via CDN)

## Key Components
- **GenAILiveClient**: Manages live connection to Gemini API
- **AudioRecorder/AudioStreamer**: Handles real-time audio input/output
- **KeynoteCompanion**: Main AI companion interface
- **ControlTray**: Connection controls and audio management
- **Agent/User Settings**: Customizable personalities and user preferences

## Development Setup
- **Server**: Vite dev server on port 5000 (0.0.0.0:5000)
- **Environment**: Requires GEMINI_API_KEY environment variable
- **Workflow**: `npm run dev` (configured in Replit)

## Deployment
- **Target**: Autoscale deployment
- **Build**: `npm run build`
- **Run**: `npm run preview`

## Current Status
✅ Successfully imported and configured for Replit environment
✅ Development workflow active on port 5000 (Frontend Server)
✅ Gemini API key integration configured via Replit secrets
✅ Deployment configuration complete (autoscale with build/preview)
✅ All dependencies installed and working
✅ Cross-platform compatible (works on Windows 11, Mac, Linux)
✅ **LIVE API CONNECTION WORKING** - Fixed all connection issues
✅ **VOICE CONVERSATIONS ENABLED** - Connect button works, AI agent responds with voice
✅ **AUTOMATIC RECONNECTION** - Handles connection drops with exponential backoff
✅ **TEXT FALLBACK MODE** - Can chat via text if microphone unavailable
✅ **Ready for voice AI interactions** - Robust, production-ready voice chat

## Recent Fixes Applied (Nov 25, 2025)
- Fixed Gemini API environment variable name (GEMINI_API_KEY)
- Corrected Live API model name to 'models/gemini-2.0-flash-live-001'
- Configured single response modality (AUDIO only) as required by Live API
- Resolved WebSocket connection issues for Replit environment
- Verified end-to-end voice conversation functionality
- **Implemented automatic reconnection with exponential backoff + jitter**
- **Fixed PCM audio playback (was trying to decode raw audio incorrectly)**
- **Added comprehensive error handling and user feedback**
- **Added text input fallback for testing without microphone**
- **Throttled volume updates to prevent UI lag (20 updates/sec max)**
- **Created missing hooks/useInteractions.ts (useHover, useTilt for 3D face effects)**
- **Added AudioStreamer error handler to prevent queue stalls during playback failures**
- **Added input validation in useLiveApi (validates agent/user data, allows optional info field)**
- **Hardened ControlTray cleanup logic to prevent race conditions on unmount/re-render**
- **Fixed ref storage timing in useLiveApi to enable reconnection after initial failures**
- **CRITICAL FIX: Fixed vite.config.ts environment variable injection using loadEnv() - API key now properly injected into browser**
- **Added API key presence logging to verify injection is working**

## Reconnection Features
- **Exponential Backoff**: 1s → 2s → 4s → 8s... up to 30s
- **Jitter**: Random 0-500ms delay prevents thundering herd after server restart
- **Max Attempts**: 10 reconnection attempts before giving up
- **Smart Reconnect**: Only auto-reconnects on abnormal closure, respects user disconnect
- **Connection Params**: Stores agent personality and user settings for seamless reconnection

## UI Improvements
- **Real-time Status**: Shows "Connecting...", "Reconnecting... attempt 3/10"
- **Error Messages**: Clear red banner showing what went wrong
- **Microphone Toggle**: Mute/unmute button for audio control
- **Text Input Mode**: Alternative chat via text with edit button
- **Volume Feedback**: Visual volume indicator for voice activity

## User Preferences
- For personal use only (non-production)
- No security concerns for API key exposure