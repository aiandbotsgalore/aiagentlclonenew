import React, { useState, useEffect } from 'react';
import { ConnectionStatus, VolumeData, AudioDevice, ConversationTurn } from '../../shared/types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    connecting: false,
    error: null
  });
  const [volume, setVolume] = useState<VolumeData>({ input: 0, output: 0 });
  const [muted, setMuted] = useState(false);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  const [messages, setMessages] = useState<ConversationTurn[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // Load initial status and devices
    loadStatus();
    loadDevices();

    // Listen to events from main process
    window.snugglesAPI.onVolumeUpdate((data) => setVolume(data));
    window.snugglesAPI.onConnectionStatus((newStatus) => setStatus(newStatus));
    window.snugglesAPI.onMessageReceived((message) => {
      setMessages(prev => [...prev, message]);
    });
  }, []);

  const loadStatus = async () => {
    const st = await window.snugglesAPI.getStatus();
    setStatus({ connected: st.connected, connecting: false, error: null });
    setMuted(st.muted);
  };

  const loadDevices = async () => {
    const devs = await window.snugglesAPI.getAudioDevices();
    setDevices(devs);

    // Auto-select VoiceMeeter devices if available
    const vmInput = devs.find(d => d.label.includes('VoiceMeeter') && d.kind === 'audioinput');
    const vmOutput = devs.find(d => d.label.includes('VoiceMeeter') && d.kind === 'audiooutput');

    if (vmInput) setSelectedInput(vmInput.id);
    if (vmOutput) setSelectedOutput(vmOutput.id);
  };

  const handleConnect = async () => {
    if (selectedInput && selectedOutput) {
      await window.snugglesAPI.setAudioDevices(selectedInput, selectedOutput);
    }

    const result = await window.snugglesAPI.connect();
    if (!result.success) {
      setStatus({ connected: false, connecting: false, error: result.error || 'Connection failed' });
    }
  };

  const handleDisconnect = async () => {
    await window.snugglesAPI.disconnect();
  };

  const handleToggleMute = async () => {
    const newMuted = await window.snugglesAPI.toggleMute();
    setMuted(newMuted);
  };

  const handleReset = async () => {
    await window.snugglesAPI.resetAgent();
    setMessages([]);
  };

  const handleSendText = async () => {
    if (inputText.trim()) {
      await window.snugglesAPI.sendMessage(inputText);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: Date.now(),
        role: 'user',
        text: inputText
      }]);
      setInputText('');
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <h1>🎙️ Dr. Snuggles - Audio Node</h1>
        <div className="subtitle">Local-First AI Companion for Twitter Spaces</div>
      </header>

      {/* Status Panel */}
      <div className="panel status-panel">
        <h2>Connection Status</h2>
        <div className="status-indicator">
          <div className={`status-dot ${status.connected ? 'connected' : 'disconnected'}`} />
          <span>
            {status.connecting ? 'Connecting...' :
             status.connected ? 'Connected to Gemini (Charon Voice)' :
             'Disconnected'}
          </span>
        </div>
        {status.error && (
          <div className="error-message">⚠️ {status.error}</div>
        )}
      </div>

      {/* Audio Devices */}
      <div className="panel devices-panel">
        <h2>Audio Routing (VoiceMeeter)</h2>
        <div className="device-select">
          <label>
            Input Device:
            <select value={selectedInput} onChange={(e) => setSelectedInput(e.target.value)}>
              <option value="">Select Input...</option>
              {devices.filter(d => d.kind === 'audioinput').map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </label>
          <label>
            Output Device:
            <select value={selectedOutput} onChange={(e) => setSelectedOutput(e.target.value)}>
              <option value="">Select Output...</option>
              {devices.filter(d => d.kind === 'audiooutput').map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Volume Meters */}
      <div className="panel volume-panel">
        <h2>Audio Levels</h2>
        <div className="volume-meters">
          <div className="meter">
            <label>Input (Mic)</label>
            <div className="meter-bar">
              <div className="meter-fill" style={{ width: `${volume.input}%` }} />
            </div>
            <span>{volume.input}%</span>
          </div>
          <div className="meter">
            <label>Output (Snuggles)</label>
            <div className="meter-bar">
              <div className="meter-fill output" style={{ width: `${volume.output}%` }} />
            </div>
            <span>{volume.output}%</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="panel controls-panel">
        <h2>Controls</h2>
        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handleConnect}
            disabled={status.connected || status.connecting}
          >
            🔗 Connect
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDisconnect}
            disabled={!status.connected}
          >
            🔌 Disconnect
          </button>
          <button
            className="btn btn-warning"
            onClick={handleToggleMute}
          >
            {muted ? '🔇 Unmute' : '🔊 Mute'} Snuggles
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleReset}
          >
            🔄 Reset Agent
          </button>
        </div>
      </div>

      {/* Text Input (Fallback) */}
      <div className="panel chat-panel">
        <h2>Text Input (Fallback)</h2>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message to Dr. Snuggles..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            disabled={!status.connected}
          />
          <button
            className="btn btn-primary"
            onClick={handleSendText}
            disabled={!status.connected || !inputText.trim()}
          >
            Send
          </button>
        </div>

        {/* Message Log */}
        <div className="message-log">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <strong>{msg.role === 'user' ? 'You' : 'Dr. Snuggles'}:</strong> {msg.text}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>Powered by Google Gemini 2.0 Flash • Voice: Charon • Local RAM: 48GB</p>
        <p>Zero-Cost • Local-First • Audio-Only Architecture</p>
      </footer>
    </div>
  );
};

export default Dashboard;
