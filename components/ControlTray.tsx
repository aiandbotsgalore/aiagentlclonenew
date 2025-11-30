import React, { useState, useRef, useEffect } from 'react';
import { useLiveAPI } from '../context/LiveAPIProvider';
import { AudioRecorder } from '../lib/AudioRecorder';

/**
 * A component that provides controls for the application, such as connecting/disconnecting,
 * muting audio, and sending text input.
 *
 * It manages the audio recording and streaming logic when connected to the Live API.
 *
 * @component
 * @returns {JSX.Element} The control tray component.
 */
const ControlTray: React.FC = () => {
    const { isConnected, isConnecting, connectionError, reconnectAttempt, connect, disconnect, client } = useLiveAPI();
    const [isMuted, setIsMuted] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const recorder = useRef<AudioRecorder | null>(null);

    useEffect(() => {
        let mounted = true;
        let currentRecorder: AudioRecorder | null = null;

        const setupRecorder = async () => {
            // Clean up any existing recorder first to prevent race conditions
            if (recorder.current) {
                await recorder.current.stop();
                recorder.current = null;
            }

            if (isConnected && !isMuted) {
                // Check mounted flag before creating new recorder
                if (!mounted) return;

                currentRecorder = new AudioRecorder();
                recorder.current = currentRecorder;

                currentRecorder.on('data', (data) => {
                    if (mounted && client) {
                        console.log(`🎤 Audio data captured: ${data.length} chars`);
                        client.sendRealtimeInput(data, 'audio/pcm');
                    }
                });

                currentRecorder.on('error', (error) => {
                    console.error('Recorder error:', error);
                    if (mounted) {
                        setShowTextInput(true);
                    }
                });

                try {
                    await currentRecorder.start();
                } catch (error) {
                    console.error('Failed to start recorder:', error);
                    if (mounted) {
                        setShowTextInput(true);
                    }
                }
            }
        };

        setupRecorder();

        return () => {
            mounted = false;
            // Clean up both refs to ensure no leaks
            if (currentRecorder) {
                currentRecorder.stop();
                currentRecorder = null;
            }
            if (recorder.current) {
                recorder.current.stop();
                recorder.current = null;
            }
        };
    }, [isConnected, isMuted, client]);

    /**
     * Toggles the connection to the Live API.
     */
    const handleConnectToggle = () => {
        if (isConnected) {
            disconnect();
            setShowTextInput(false);
        } else {
            connect();
        }
    };

    const MAX_TEXT_LENGTH = 1000;

    /**
     * Sends the text input to the Live API.
     */
    const handleSendText = () => {
        const trimmed = textInput.trim();

        if (!trimmed) {
            return;
        }

        if (trimmed.length > MAX_TEXT_LENGTH) {
            console.error(`Message too long. Maximum ${MAX_TEXT_LENGTH} characters.`);
            return;
        }

        if (client && isConnected) {
            console.log('Sending text:', trimmed);
            client.sendInitialText(trimmed);
            setTextInput('');
        }
    };

    /**
     * Handles key press events in the text input, sending the message on Enter.
     *
     * @param {React.KeyboardEvent} e - The keyboard event.
     */
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center gap-3 bg-gray-900/50 backdrop-blur-sm z-10">
            {connectionError && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded text-sm max-w-md text-center">
                    {connectionError}
                </div>
            )}
            
            {isConnecting && (
                <div className="text-yellow-300 text-sm animate-pulse">
                    {reconnectAttempt > 0 ? `Reconnecting... attempt ${reconnectAttempt}/10` : 'Connecting...'}
                </div>
            )}

            {showTextInput && isConnected && (
                <div className="flex gap-2 w-full max-w-md">
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type to chat..."
                        className="flex-1 px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSendText}
                        disabled={!textInput.trim()}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            )}

            <div className="flex justify-center items-center gap-4">
                <button
                    onClick={handleConnectToggle}
                    disabled={isConnecting}
                    className={`px-6 py-3 font-bold rounded-full transition text-lg ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isConnecting && reconnectAttempt > 0 ? `Reconnecting...` : (isConnecting ? 'Connecting...' : (isConnected ? 'Disconnect' : 'Connect'))}
                </button>
                <button
                    onClick={() => setIsMuted(prev => !prev)}
                    disabled={!isConnected}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 hover:bg-gray-600 transition"
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.114 5.636l.879.879M9.172 9.172L5.636 5.636m9.172 9.172l3.536 3.536M9.172 9.172l9.172 9.172" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 16.91c-1.25 1.1-2.848 1.64-4.5 1.64-1.652 0-3.25-.54-4.5-1.63V20h9v-3.09zM12 20c.553 0 1-.447 1-1s-.447-1-1-1-1 .447-1 1 .447 1 1 1z"/></svg>
                    )}
                </button>
                <button
                    onClick={() => setShowTextInput(!showTextInput)}
                    disabled={!isConnected}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 hover:bg-gray-600 transition"
                    title="Toggle text input"
                    aria-label="Text input"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
            </div>
        </div>
    );
};

export default ControlTray;
