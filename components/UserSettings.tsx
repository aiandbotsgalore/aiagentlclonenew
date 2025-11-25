import React, { useState } from 'react';
import { useUserStore } from '../stores/useUser';
import { useUIStore } from '../stores/useUI';
import Modal from './Modal';

const UserSettings: React.FC = () => {
  const { name, info, setName, setInfo } = useUserStore();
  const { setShowUserConfig } = useUIStore();
  const [localName, setLocalName] = useState(name);
  const [localInfo, setLocalInfo] = useState(info);

  const handleSave = () => {
    setName(localName);
    setInfo(localInfo);
    setShowUserConfig(false);
  };

  return (
    <Modal title="Your Information" onClose={() => setShowUserConfig(false)}>
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
          <input
            id="name"
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="info" className="block text-sm font-medium text-gray-300 mb-1">About You</label>
          <textarea
            id="info"
            rows={4}
            value={localInfo}
            onChange={(e) => setLocalInfo(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Tell the AI a bit about yourself..."
          />
        </div>
        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UserSettings;