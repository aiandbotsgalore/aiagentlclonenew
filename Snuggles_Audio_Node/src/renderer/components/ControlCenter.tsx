import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionStatus, VolumeData, ConversationTurn, LiveAnalytics, SessionMemory, PersonalityMix, AICohostStatus } from '../../shared/types';
import { AudioInputPanel } from './panels/AudioInputPanel';
import { AICohostPanel } from './panels/AICohostPanel';
import { QuickCommandsPanel } from './panels/QuickCommandsPanel';
import { LiveTranscriptPanel } from './panels/LiveTranscriptPanel';
import { SessionMemoryPanel } from './panels/SessionMemoryPanel';
import { PersonalityPanel } from './panels/PersonalityPanel';
import { LiveAnalyticsPanel } from './panels/LiveAnalyticsPanel';
import { AnalyticsService } from '../services/analyticsService';
import { ClipDetectionService } from '../services/clipDetectionService';
import { TranscriptExporter } from '../services/transcriptExporter';
import { AudioCaptureService } from '../services/audioCaptureService';
import { AudioPlaybackService } from '../services/audioPlaybackService';
import './ControlCenter.css';

/**
 * The main control center component for the renderer application.
 *
 * It manages the state for connection, audio, conversation, analytics, and personality settings.
 * It coordinates the various panels (Audio Input, AI Cohost, Transcript, etc.) and handles user interactions.
 *
 * @component
 * @returns {JSX.Element} The control center UI.
 */
const ControlCenter: React.FC = () => {
  // Services
  const analyticsService = useRef(new AnalyticsService());
  const clipDetectionService = useRef(new ClipDetectionService());
  const transcriptExporter = useRef(new TranscriptExporter());
  const audioCaptureService = useRef(new AudioCaptureService());
  const audioPlaybackService = useRef(new AudioPlaybackService());

  // Connection & Audio State
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    connecting: false,
    error: null
  });
  const [volume, setVolume] = useState<VolumeData>({ input: 0, output: 0 });
  const [recording, setRecording] = useState(false);

  // AI Cohost State
  const [cohostStatus, setCohostStatus] = useState<AICohostStatus>({
    status: 'idle',
    responseTime: 0,
    confidence: 0
  });

  // Conversation State
  const [messages, setMessages] = useState<ConversationTurn[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Analytics State
  const [analytics, setAnalytics] = useState<LiveAnalytics>({
    speakingTime: { ai: 25, user: 75 },
    totalResponses: 0,
    avgResponseTime: 0,
    interrupts: 0,
    jokeSuccessRate: 88,
    clipWorthyMoments: []
  });

  // Session Memory State
  const [sessionMemory, setSessionMemory] = useState<SessionMemory>({
    keyTopics: [],
    speakerNotes: [],
    runningJokes: []
  });

  // Personality State
  const [personality, setPersonality] = useState<PersonalityMix>({
    comedy: 60,
    research: 40,
    energy: 75
  });

  // Load initial data and setup event listeners
  useEffect(() => {
    loadInitialState();
    setupEventListeners();
    setupKeyboardShortcuts();
  }, []);

  /**
   * Loads the initial status of the application.
   */
  const loadInitialState = async () => {
    try {
      const st = await window.snugglesAPI.getStatus();
      setStatus({ connected: st.connected, connecting: false, error: null });
      setRecording(st.connected);
    } catch (error) {
      console.error('[ControlCenter] Failed to load initial state:', error);
    }
  };

  /**
   * Sets up event listeners for updates from the main process.
   */
  const setupEventListeners = () => {
    window.snugglesAPI.onVolumeUpdate((data) => {
      setVolume(data);
      updateCohostStatus('listening');
    });

    window.snugglesAPI.onConnectionStatus((newStatus) => {
      setStatus(newStatus);
      setRecording(newStatus.connected);
    });

    window.snugglesAPI.onMessageReceived((message) => {
      setMessages(prev => [...prev, message]);

      // Track with analytics service
      analyticsService.current.trackMessage(message, cohostStatus.responseTime);

      // Detect clip-worthy moments with ML sentiment analysis
      const clip = clipDetectionService.current.analyzeMessage(message, sessionStartTime);

      // Update analytics with real metrics
      const clipMoments = clip
        ? [...analytics.clipWorthyMoments, clip].slice(-5)
        : analytics.clipWorthyMoments;

      const updatedAnalytics = analyticsService.current.getAnalytics(clipMoments);
      setAnalytics(updatedAnalytics);

      // Extract session insights
      extractSessionInsights(message);
      updateCohostStatus('idle');
    });
  };

  /**
   * Sets up global keyboard shortcuts for quick actions.
   */
  const setupKeyboardShortcuts = () => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'r':
            e.preventDefault();
            handleRiffOnThat();
            break;
          case '1':
            e.preventDefault();
            handleOneLinerOnly();
            break;
          case 'e':
            e.preventDefault();
            handleWrapIn10();
            break;
          case 't':
            e.preventDefault();
            handleSwitchTone();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  };

  /**
   * Updates the AI cohost status display.
   * @param {AICohostStatus['status']} newStatus - The new status.
   */
  const updateCohostStatus = (newStatus: AICohostStatus['status']) => {
    const responseTime = newStatus === 'speaking' ? Math.random() * 2 + 0.8 : cohostStatus.responseTime;
    setCohostStatus(prev => ({
      ...prev,
      status: newStatus,
      responseTime,
      confidence: newStatus === 'speaking' ? Math.floor(Math.random() * 20 + 80) : prev.confidence
    }));
  };

  /**
   * Extracts key topics from a new message.
   * @param {ConversationTurn} message - The new message.
   */
  const extractSessionInsights = (message: ConversationTurn) => {
    // Simple keyword extraction for topics
    const keywords = ['AI', 'Technology', 'Twitter Spaces', 'Voice Technology', 'Dr. Snuggles'];
    const detectedTopics = keywords.filter(keyword =>
      message.text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (detectedTopics.length > 0) {
      setSessionMemory(prev => {
        const updatedTopics = [...prev.keyTopics];
        detectedTopics.forEach(topic => {
          const existing = updatedTopics.find(t => t.topic === topic);
          if (existing) {
            existing.mentions++;
          } else {
            updatedTopics.push({
              topic,
              mentions: 1,
              speaker: message.role === 'assistant' ? 'assistant' : 'user'
            });
          }
        });

        return {
          ...prev,
          keyTopics: updatedTopics.sort((a, b) => b.mentions - a.mentions).slice(0, 5)
        };
      });
    }
  };

  /**
   * Formats the session duration into HH:MM:SS.
   * @param {number} ms - Duration in milliseconds.
   * @returns {string} Formatted time string.
   */
  const formatSessionTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Quick Command Handlers
  const handleRiffOnThat = () => {
    window.snugglesAPI.sendMessage('[Quick Command] Riff on the last topic with your signature style');
  };

  const handleOneLinerOnly = () => {
    window.snugglesAPI.sendMessage('[Quick Command] Give me a one-liner response only');
  };

  const handleWrapIn10 = () => {
    window.snugglesAPI.sendMessage('[Quick Command] Wrap up this segment in 10 seconds');
  };

  const handleSwitchTone = () => {
    setPersonality(prev => ({
      ...prev,
      comedy: prev.comedy > 50 ? 30 : 70,
      research: prev.research > 50 ? 30 : 70
    }));
  };

  // Connection Handlers
  const handleConnect = async () => {
    try {
      setStatus({ connected: false, connecting: true, error: null });

      // Start audio services first
      // Note: We'll update device ID if user selected one, for now default
      await audioCaptureService.current.start();
      audioPlaybackService.current.start();

      // Connect to Gemini
      // Using the new GENAI_START_SESSION for consistency with 2025 backend
      const result = await window.snugglesAPI.genaiStartSession();

      if (!result.success) {
        setStatus({ connected: false, connecting: false, error: result.error || 'Connection failed' });
        audioCaptureService.current.stop();
        audioPlaybackService.current.stop();
      } else {
        // Status update will come via IPC event listener (onConnectionStatus)
        // but we set local state to feel responsive
        setStatus({ connected: true, connecting: false, error: null });
        setRecording(true);
        const newSessionTime = Date.now();
        setSessionStartTime(newSessionTime);
        // Reset analytics for new session
        analyticsService.current.reset();
      }
    } catch (error: any) {
      console.error('[ControlCenter] Connection error:', error);
      setStatus({ connected: false, connecting: false, error: error.message || 'Connection error' });
      audioCaptureService.current.stop();
      audioPlaybackService.current.stop();
    }
  };

  const handleDisconnect = async () => {
    await window.snugglesAPI.disconnect();
    audioCaptureService.current.stop();
    audioPlaybackService.current.stop();
    setRecording(false);
    setStatus({ connected: false, connecting: false, error: null });
  };

  const handlePlay = () => {
    if (!status.connected) {
      handleConnect();
    } else {
      setRecording(!recording);
    }
  };

  const handleSkip = () => {
    window.snugglesAPI.sendMessage('[Quick Command] Skip to next topic');
  };

  // Export handlers
  const handleExportTXT = () => {
    const content = transcriptExporter.current.exportToTXT(messages, sessionMemory);
    const filename = transcriptExporter.current.generateFilename('txt');
    transcriptExporter.current.downloadFile(content, filename, 'text/plain');
  };

  const handleExportJSON = () => {
    const content = transcriptExporter.current.exportToJSON(messages, sessionMemory);
    const filename = transcriptExporter.current.generateFilename('json');
    transcriptExporter.current.downloadFile(content, filename, 'application/json');
  };

  const handleExportMarkdown = () => {
    const content = transcriptExporter.current.exportToMarkdown(messages, sessionMemory);
    const filename = transcriptExporter.current.generateFilename('md');
    transcriptExporter.current.downloadFile(content, filename, 'text/markdown');
  };

  return (
    <div className="control-center">
      {/* Header */}
      <header className="cc-header">
        <div className="cc-title">
          <h1>AI Cohost Control Center</h1>
          <span className={`cc-live-badge ${recording ? 'live' : ''}`}>
            {recording ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <div className="cc-session-time">
          {formatSessionTime(Date.now() - sessionStartTime)}
        </div>
        <div className="cc-version">v3</div>
      </header>

      {/* 3-Column Layout */}
      <div className="cc-main">
        {/* Left Column */}
        <div className="cc-column cc-left">
          <AudioInputPanel volume={volume} />
          <AICohostPanel
            status={cohostStatus}
            onPlay={handlePlay}
            onSkip={handleSkip}
            connected={status.connected}
          />
          <QuickCommandsPanel
            onRiffOnThat={handleRiffOnThat}
            onOneLinerOnly={handleOneLinerOnly}
            onWrapIn10={handleWrapIn10}
            onSwitchTone={handleSwitchTone}
          />
        </div>

        {/* Center Column */}
        <div className="cc-column cc-center">
          <LiveTranscriptPanel
            messages={messages}
            recording={recording}
          />
          <SessionMemoryPanel memory={sessionMemory} />
        </div>

        {/* Right Column */}
        <div className="cc-column cc-right">
          <PersonalityPanel
            personality={personality}
            onPersonalityChange={setPersonality}
          />
          <LiveAnalyticsPanel
            analytics={analytics}
            sessionTime={formatSessionTime(Date.now() - sessionStartTime)}
            onExportTXT={handleExportTXT}
            onExportJSON={handleExportJSON}
            onExportMarkdown={handleExportMarkdown}
          />
        </div>
      </div>
    </div>
  );
};

export default ControlCenter;
