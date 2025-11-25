export type Agent = {
  id: string;
  name: string;
  personality: string;
  bodyColor: string;
  voice: {
    // These would map to more complex voice generation settings in a real scenario
    // For this demo, they are hints for the personality prompt
    pitch: 'low' | 'medium' | 'high';
    style: 'calm' | 'energetic' | 'formal';
  };
};