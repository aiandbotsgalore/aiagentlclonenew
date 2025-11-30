import React from 'react';
import { LiveAPIProvider } from './context/LiveAPIProvider';
import { useUIStore } from './stores/useUI';
import Header from './components/Header';
import KeynoteCompanion from './components/KeynoteCompanion';
import ControlTray from './components/ControlTray';
import UserSettings from './components/UserSettings';
import AgentEdit from './components/AgentEdit';

/**
 * The main application component.
 *
 * This component sets up the `LiveAPIProvider` context and the main layout of the application.
 * It conditionally renders the `UserSettings` and `AgentEdit` modals based on the UI store state.
 *
 * @component
 * @returns {JSX.Element} The rendered application component.
 */
const App: React.FC = () => {
    const { showUserConfig, showAgentEdit } = useUIStore();

    return (
        <LiveAPIProvider>
            <div className="h-screen w-screen flex flex-col bg-gray-900 text-white font-sans overflow-hidden">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <KeynoteCompanion />
                </main>
                <ControlTray />
                {showUserConfig && <UserSettings />}
                {showAgentEdit && <AgentEdit />}
            </div>
        </LiveAPIProvider>
    );
};

export default App;
