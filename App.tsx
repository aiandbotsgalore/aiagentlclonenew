import React, { useState } from 'react';
import { LiveAPIProvider } from './context/LiveAPIProvider';
import { useUIStore } from './stores/useUI';
import Header from './components/Header';
import KeynoteCompanion from './components/KeynoteCompanion';
import ChatInterface from './components/ChatInterface';
import ControlTray from './components/ControlTray';
import UserSettings from './components/UserSettings';
import AgentEdit from './components/AgentEdit';

const App: React.FC = () => {
    const { showUserConfig, showAgentEdit } = useUIStore();
    const [showChat, setShowChat] = useState(true);  // Toggle between face-only and split view

    return (
        <LiveAPIProvider>
            <div className="h-screen w-screen flex flex-col bg-gray-900 text-white font-sans overflow-hidden">
                <Header />

                {/* Main Content Area */}
                <main className="flex-1 flex overflow-hidden relative">
                    {/* Split-screen layout for cohosting */}
                    <div className={`flex w-full h-full ${showChat ? 'gap-4 p-4' : ''}`}>
                        {/* Face/Companion View */}
                        <div className={`flex items-center justify-center transition-all duration-300 ${
                            showChat ? 'w-1/2' : 'w-full'
                        }`}>
                            <div className={`${showChat ? 'w-full max-w-lg' : 'w-[400px]'} h-[400px]`}>
                                <KeynoteCompanion />
                            </div>
                        </div>

                        {/* Chat Interface */}
                        {showChat && (
                            <div className="w-1/2 h-full">
                                <ChatInterface />
                            </div>
                        )}
                    </div>

                    {/* Toggle Chat Button */}
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="absolute top-4 right-4 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-sm font-medium backdrop-blur-sm transition flex items-center gap-2 z-10"
                        title={showChat ? 'Hide conversation' : 'Show conversation'}
                    >
                        {showChat ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                </svg>
                                Hide Chat
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                </svg>
                                Show Chat
                            </>
                        )}
                    </button>
                </main>

                <ControlTray />
                {showUserConfig && <UserSettings />}
                {showAgentEdit && <AgentEdit />}
            </div>
        </LiveAPIProvider>
    );
};

export default App;