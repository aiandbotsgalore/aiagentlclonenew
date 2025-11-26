import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { AudioManager } from './audio/audioManager';
import { GeminiClient } from './llm/geminiClient';
import { KnowledgeStore } from './knowledge/store';
import { IPC_CHANNELS, AudioDevice, AppConfig } from '../shared/types';
import fs from 'fs';

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAGnm_VbusODo7gdoonGgb-56nEvUHtBrg';

class SnugglesApp {
  private mainWindow: BrowserWindow | null = null;
  private audioManager: AudioManager;
  private geminiClient: GeminiClient;
  private knowledgeStore: KnowledgeStore;
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
    this.audioManager = new AudioManager();
    this.geminiClient = new GeminiClient(API_KEY, this.audioManager);
    this.knowledgeStore = new KnowledgeStore();

    this.setupIPC();
  }

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

  private saveConfig(): void {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  private setupIPC(): void {
    // Audio device management
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

    // Gemini connection
    ipcMain.handle(IPC_CHANNELS.CONNECT_GEMINI, async () => {
      try {
        const sessionSummaries = await this.getRecentSummaries(3);
        const knowledgeContext = await this.knowledgeStore.getSystemContext();
        await this.geminiClient.connect(sessionSummaries, knowledgeContext);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(IPC_CHANNELS.DISCONNECT_GEMINI, async () => {
      await this.geminiClient.disconnect();
      return true;
    });

    ipcMain.handle(IPC_CHANNELS.SEND_MESSAGE, async (_, text: string) => {
      await this.geminiClient.sendText(text);
      return true;
    });

    ipcMain.handle(IPC_CHANNELS.TOGGLE_MUTE, async () => {
      this.audioManager.toggleMute();
      return this.audioManager.isMuted();
    });

    ipcMain.handle(IPC_CHANNELS.GET_STATUS, async () => {
      return {
        connected: this.geminiClient.isConnected(),
        muted: this.audioManager.isMuted(),
        devices: await this.audioManager.getDevices()
      };
    });

    ipcMain.handle(IPC_CHANNELS.RESET_AGENT, async () => {
      await this.geminiClient.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const sessionSummaries = await this.getRecentSummaries(3);
      const knowledgeContext = await this.knowledgeStore.getSystemContext();
      await this.geminiClient.connect(sessionSummaries, knowledgeContext);
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

    // Forward events from backend to renderer
    this.audioManager.on('volumeUpdate', (data) => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.VOLUME_UPDATE, data);
    });

    this.geminiClient.on('statusChange', (status) => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.CONNECTION_STATUS, status);
    });

    this.geminiClient.on('message', (message) => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.MESSAGE_RECEIVED, message);
    });
  }

  private async getRecentSummaries(count: number): Promise<string[]> {
    // TODO: Implement with Dexie.js in next phase
    return [];
  }

  async createWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      title: 'Dr. Snuggles - Audio Node',
      icon: path.join(__dirname, '../../public/icon.png')
    });

    // Load renderer
    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Auto-load knowledge base on startup
    const knowledgeDir = path.join(__dirname, '../../knowledge');
    try {
      await this.knowledgeStore.loadDocuments(knowledgeDir);
      console.log('[App] Knowledge base loaded on startup');
    } catch (error) {
      console.error('[App] Failed to load knowledge base:', error);
    }
  }

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
const snugglesApp = new SnugglesApp();
snugglesApp.initialize().catch(console.error);
