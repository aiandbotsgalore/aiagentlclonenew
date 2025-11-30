import React, { useState } from 'react';
import { useAgentStore } from '../stores/useAgent';
import { useUIStore } from '../stores/useUI';
import Modal from './Modal';

/**
 * Available color options for the agent's appearance.
 */
const COLORS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Violet', value: '#8b5cf6' },
];

/**
 * A component for editing the agent's properties (name, personality, color).
 *
 * This component uses a modal to present a form where the user can modify
 * the current agent's configuration. Changes are saved to the `useAgentStore`
 * upon clicking the "Save" button.
 *
 * @component
 * @returns {JSX.Element} The agent editing modal.
 */
const AgentEdit: React.FC = () => {
    const { current, update } = useAgentStore();
    const { setShowAgentEdit } = useUIStore();
    const [localAgent, setLocalAgent] = useState(current);

    /**
     * Handles saving the changes to the agent store and closing the modal.
     */
    const handleSave = () => {
        update(localAgent);
        setShowAgentEdit(false);
    };
    
    /**
     * Handles input changes for name and personality fields.
     *
     * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The change event.
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalAgent(prev => ({...prev, [name]: value}));
    };

    return (
        <Modal title="Edit Agent" onClose={() => setShowAgentEdit(false)}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Agent Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={localAgent.name}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="personality" className="block text-sm font-medium text-gray-300 mb-1">Personality</label>
                    <textarea
                        id="personality"
                        name="personality"
                        rows={6}
                        value={localAgent.personality}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Describe the agent's personality..."
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                    <div className="flex gap-3">
                        {COLORS.map(color => (
                            <button
                                key={color.name}
                                onClick={() => setLocalAgent(prev => ({...prev, bodyColor: color.value}))}
                                style={{ backgroundColor: color.value }}
                                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${localAgent.bodyColor === color.value ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}
                                aria-label={`Select ${color.name} color`}
                            />
                        ))}
                    </div>
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

export default AgentEdit;
