import React from 'react';
import { useAgentStore } from '../stores/useAgent';
import { useUIStore } from '../stores/useUI';

const Header: React.FC = () => {
  const { current, availablePresets, setCurrent } = useAgentStore();
  const { setShowUserConfig, setShowAgentEdit } = useUIStore();

  return (
    <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm z-10">
      <div className="flex items-center gap-3">
        <div style={{ backgroundColor: current.bodyColor }} className="w-4 h-4 rounded-full" />
        <select 
            value={current.id}
            onChange={e => setCurrent(e.target.value)}
            className="bg-transparent font-bold text-xl appearance-none focus:outline-none cursor-pointer"
        >
          {availablePresets.map(agent => (
            <option key={agent.id} value={agent.id} className="bg-gray-800">
                {agent.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setShowAgentEdit(true)} className="text-sm text-gray-300 hover:text-white transition">Agent Settings</button>
        <button onClick={() => setShowUserConfig(true)} className="text-sm text-gray-300 hover:text-white transition">Your Info</button>
      </div>
    </header>
  );
};

export default Header;