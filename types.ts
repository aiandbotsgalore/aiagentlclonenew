/**
 * Represents an AI Agent with specific personality and voice characteristics.
 */
export type Agent = {
  /**
   * The unique identifier for the agent.
   */
  id: string;
  /**
   * The name of the agent.
   */
  name: string;
  /**
   * A description of the agent's personality.
   */
  personality: string;
  /**
   * The color associated with the agent's visual representation.
   */
  bodyColor: string;
  /**
   * The voice settings for the agent.
   * These map to more complex voice generation settings.
   */
  voice: {
    /**
     * The pitch of the agent's voice.
     */
    pitch: 'low' | 'medium' | 'high';
    /**
     * The style of the agent's voice.
     */
    style: 'calm' | 'energetic' | 'formal';
  };
};
