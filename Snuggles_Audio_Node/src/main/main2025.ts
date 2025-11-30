/**
 * MAIN PROCESS - December 2025 Modernized
 *
 * Wires up the complete Echosphere AI system with:
 * - New GeminiLiveClient (16kHz audio, native-audio model)
 * - AudioManager2025 (volume monitoring)
 * - Knowledge store (Orama)
 * - IPC handlers for audio streaming
 * - Latency tracking
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

// Modern imports
import { GeminiLiveClient } from './llm/geminiLiveClient';
import { AudioManager2025 } from './audio/audioManager2025';
import { KnowledgeStore } from './knowledge/store';
import { SessionMemoryService } from './memory/database';
import { IPC_CHANNELS, AppConfig, LatencyMetrics } from '../shared/types';

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAGnm_VbusODo7gdoonGgb-56nEvUHtBrg';

/**
 * The main application class for Dr. Snuggles (2025 Edition).
 *
 * This modernized version integrates the new Gemini Live Client, advanced audio management,
 * and enhanced knowledge storage features. It handles the complete lifecycle of the Electron
 * application and manages IPC communication between the main and renderer processes.
 */
class SnugglesApp2025 {
  private mainWindow: BrowserWindow | null = null;
  private audioManager: AudioManager2025;
  private geminiLiveClient: GeminiLiveClient;
  private knowledgeStore: KnowledgeStore;
  private sessionMemory: SessionMemoryService;
  private config: AppConfig;
  private latencyMetrics: LatencyMetrics[] = [];

  /**
   * Initializes the SnugglesApp2025.
   *
   * Sets up configuration, audio manager, Gemini client, knowledge store,
   * IPC handlers, and Gemini event listeners. Logs startup information.
   */
  constructor() {
    this.config = this.loadConfig();
    this.audioManager = new AudioManager2025();
    this.geminiLiveClient = new GeminiLiveClient(API_KEY);
    this.knowledgeStore = new KnowledgeStore();
    this.sessionMemory = new SessionMemoryService();

    this.setupIPC();
    this.setupGeminiEventHandlers();

    console.log('='.repeat(60));
    console.log('🚀 ECHOSPHERE AI - DECEMBER 2025 EDITION');
    console.log('='.repeat(60));
    console.log('✅ New @google/genai SDK v1.30.0+');
    console.log('✅ Native-audio model: gemini-2.5-flash-native-audio-preview');
    console.log('✅ Audio: 16kHz upstream, 24kHz downstream');
    console.log('✅ Voice Activity Detection enabled');
    console.log('✅ Exponential backoff reconnection');
    console.log('✅ Latency tracking active');
    console.log('='.repeat(60));
  }

  /**
   * Loads the application configuration from the user data directory.
   *
   * @returns {AppConfig} The loaded configuration or default values.
   */
  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }

    return {
      inputDeviceId: null,
      outputDeviceId: null,
      apiKey: API_KEY,
      lastUsed: Date.now()
    };
  }

  /**
   * Saves the current application configuration to the user data directory.
   */
  private saveConfig(): void {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  /**
   * Sets up event handlers for the Gemini Live Client.
   *
   * Handles connection events (connected, disconnected, reconnecting),
   * audio reception, and errors. Updates the renderer process via IPC.
   */
  private setupGeminiEventHandlers(): void {
    // Connected
    this.geminiLiveClient.on('connected', () => {
      console.log('[Main] ✅ Gemini connected');
      this.mainWindow?.webContents.send(IPC_CHANNELS.CONNECTION_STATUS, {
        connected: true,
        connecting: false,
        error: null
      });
    });

    // Disconnected
    this.geminiLiveClient.on('disconnected', (reason) => {
      console.log(`[Main] ❌ Gemini disconnected: ${reason}`);
      this.mainWindow?.webContents.send(IPC_CHANNELS.CONNECTION_STATUS, {
        connected: false,
        connecting: false,
        error: reason
      });
    });

    // Audio received
    this.geminiLiveClient.on('audioReceived', (audioData, latencyMs) => {
      // Process audio (volume calculation)
      const processedAudio = this.audioManager.processOutputAudio(audioData);

      // Forward to renderer for playback
      this.mainWindow?.webContents.send(IPC_CHANNELS.GENAI_AUDIO_RECEIVED, processedAudio);

      // Track latency
      const metrics: LatencyMetrics = {
        audioUpload: 0, // Set when sending
        geminiProcessing: latencyMs,
        audioDownload: 0, // Negligible
        totalRoundtrip: latencyMs,
        timestamp: Date.now()
      };
      this.latencyMetrics.push(metrics);
      this.mainWindow?.webContents.send(IPC_CHANNELS.GENAI_LATENCY_UPDATE, metrics);

      console.log(`[Main] 📊 Total latency: ${latencyMs.toFixed(2)}ms`);
    });

    // Error
    this.geminiLiveClient.on('error', (error) => {
      console.error('[Main] ⚠️ Gemini error:', error);
      this.mainWindow?.webContents.send(IPC_CHANNELS.CONNECTION_STATUS, {
        connected: false,
        connecting: false,
        error: error.message
      });
    });

    // Reconnecting
    this.geminiLiveClient.on('reconnecting', (attempt, delayMs) => {
      console.log(`[Main] 🔄 Reconnecting... (attempt ${attempt}, delay ${delayMs}ms)`);
      this.mainWindow?.webContents.send(IPC_CHANNELS.CONNECTION_STATUS, {
        connected: false,
        connecting: true,
        error: `Reconnecting (attempt ${attempt})...`
      });
    });
  }

  /**
   * Sets up Inter-Process Communication (IPC) handlers.
   *
   * Registers handlers for audio device management, Gemini session control,
   * audio streaming, and legacy support.
   */
  private setupIPC(): void {
    // ===== Audio Device Management =====
    ipcMain.handle(IPC_CHANNELS.GET_AUDIO_DEVICES, async () => {
      return this.audioManager.getDevices();
    });

    ipcMain.handle(IPC_CHANNELS.SET_AUDIO_DEVICES, async (_, inputId: string, outputId: string) => {
      this.config.inputDeviceId = inputId;
      this.config.outputDeviceId = outputId;
      this.saveConfig();
      await this.audioManager.setDevices(inputId, outputId);
      return true;
    });

    // ===== December 2025 Gemini Live Streaming =====

    /**
     * Start Gemini Live session
     */
    ipcMain.handle(IPC_CHANNELS.GENAI_START_SESSION, async (_, config) => {
      try {
        console.log('[Main] 🎙️ Starting Gemini Live session...');

        const sessionSummaries = await this.getRecentSummaries(3);
        const knowledgeContext = await this.knowledgeStore.getSystemContext();

        await this.geminiLiveClient.connect({
          sessionSummaries,
          knowledgeContext,
          ...config
        });

        return { success: true };
      } catch (error: any) {
        console.error('[Main] ❌ Session start failed:', error);
        return { success: false, error: error.message };
      }
    });

    /**
     * Send audio chunk to Gemini
     * Renderer sends 48kHz Float32, we convert to 16kHz PCM16
     */
    ipcMain.handle(IPC_CHANNELS.GENAI_SEND_AUDIO_CHUNK, async (_, audioChunk: Float32Array) => {
      try {
        const startTime = performance.now();

        // Process input audio (volume monitoring)
        this.audioManager.processInputAudio(audioChunk);

        // Send to Gemini (handles 16kHz conversion internally)
        await this.geminiLiveClient.sendAudio(audioChunk);

        const totalTime = performance.now() - startTime;

        // Emit VAD state periodically
        const vadState = this.geminiLiveClient.getVADState();
        this.mainWindow?.webContents.send(IPC_CHANNELS.GENAI_VAD_STATE, vadState);

        return totalTime;
      } catch (error: any) {
        console.error('[Main] ❌ Send audio failed:', error);
        return -1;
      }
    });

    // ===== Legacy Handlers (for backward compatibility) =====

    ipcMain.handle(IPC_CHANNELS.CONNECT_GEMINI, async () => {
      try {
        const sessionSummaries = await this.getRecentSummaries(3);
        const knowledgeContext = await this.knowledgeStore.getSystemContext();
        await this.geminiLiveClient.connect({ sessionSummaries, knowledgeContext });
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(IPC_CHANNELS.DISCONNECT_GEMINI, async () => {
      await this.geminiLiveClient.disconnect();
      return true;
    });

    ipcMain.handle(IPC_CHANNELS.TOGGLE_MUTE, async () => {
      this.audioManager.toggleMute();
      return this.audioManager.isMuted();
    });

    ipcMain.handle(IPC_CHANNELS.GET_STATUS, async () => {
      return {
        connected: this.geminiLiveClient.connected(),
        muted: this.audioManager.isMuted(),
        devices: await this.audioManager.getDevices()
      };
    });

    ipcMain.handle(IPC_CHANNELS.RESET_AGENT, async () => {
      await this.geminiLiveClient.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sessionSummaries = await this.getRecentSummaries(3);
      const knowledgeContext = await this.knowledgeStore.getSystemContext();
      await this.geminiLiveClient.connect({ sessionSummaries, knowledgeContext });
      return true;
    });

    ipcMain.handle(IPC_CHANNELS.SEARCH_KNOWLEDGE, async (_, query: string) => {
      return this.knowledgeStore.search(query);
    });

    ipcMain.handle(IPC_CHANNELS.LOAD_KNOWLEDGE, async () => {
      const knowledgeDir = path.join(__dirname, '../../knowledge');
      await this.knowledgeStore.loadDocuments(knowledgeDir);
      return { success: true, count: await this.knowledgeStore.getDocumentCount() };
    });

    // Forward volume updates
    this.audioManager.on('volumeUpdate', (data) => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.VOLUME_UPDATE, data);
    });
  }

  /**
   * Retrieves recent session summaries.
   *
   * @param {number} count - The number of summaries to retrieve.
   * @returns {Promise<string[]>} A promise resolving to an array of summaries.
   */
  private async getRecentSummaries(count: number): Promise<string[]> {
    try {
      return await this.sessionMemory.getRecentSummaries(count);
    } catch (error) {
      console.error('[Main] Failed to retrieve summaries:', error);
      return [];
    }
  }

  /**
   * Creates the main browser window for the application.
   *
   * Configures window properties, loads the renderer (Vite dev server or built files),
   * and initializes the knowledge base.
   *
   * @returns {Promise<void>}
   */
  async createWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../main/preload.js') // Correct path relative to main2025.js
      },
      title: 'Dr. Snuggles - Echosphere AI (Dec 2025)',
      icon: path.join(__dirname, '../../public/icon.png')
    });

    // Load renderer
    // Check if Vite dev server is running (always in dev mode for npm run dev)
    const isDev = !app.isPackaged;

    if (isDev) {
      console.log('[Main] Loading from Vite dev server: http://localhost:5173');
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      console.log('[Main] Loading from built files');
      await this.mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Auto-load knowledge base
    const knowledgeDir = path.join(__dirname, '../../knowledge');
    try {
      await this.knowledgeStore.loadDocuments(knowledgeDir);
      console.log('[Main] ✅ Knowledge base loaded');
    } catch (error) {
      console.error('[Main] ⚠️ Knowledge base load failed:', error);
    }
  }

  /**
   * Initializes the application.
   *
   * Waits for the app to be ready, creates the window, and sets up global app event listeners.
   *
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    await app.whenReady();
    await this.createWindow();

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (this.mainWindow === null) {
        this.createWindow();
      }
    });
  }
}

// Bootstrap
const snugglesApp = new SnugglesApp2025();
snugglesApp.initialize().catch(console.error);
