import React, { useState, useRef, useEffect } from 'react';
import { PersonalityMix } from '../../../shared/types';
import { VoicePreviewService } from '../../services/voicePreviewService';

interface PersonalityPanelProps {
  personality: PersonalityMix;
  onPersonalityChange: (personality: PersonalityMix) => void;
}

export const PersonalityPanel: React.FC<PersonalityPanelProps> = ({
  personality,
  onPersonalityChange
}) => {
  const [selectedVoice, setSelectedVoice] = useState('Energetic Podcaster');
  const [responseStyle, setResponseStyle] = useState<'conversational' | 'formal'>('conversational');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const voicePreviewService = useRef(new VoicePreviewService());

  const handleSliderChange = (key: keyof PersonalityMix, value: number) => {
    onPersonalityChange({
      ...personality,
      [key]: value
    });
  };

  const handlePreviewVoice = async () => {
    if (isPreviewPlaying) {
      voicePreviewService.current.stop();
      setIsPreviewPlaying(false);
    } else {
      setIsPreviewPlaying(true);
      try {
        await voicePreviewService.current.previewVoice(
          selectedVoice,
          "Welcome to the future of AI conversations. I'm Dr. Snuggles, your hyper-intelligent AI companion."
        );
      } catch (error) {
        console.error('[VoicePreview] Failed:', error);
      } finally {
        setIsPreviewPlaying(false);
      }
    }
  };

  return (
    <div className="panel personality-panel">
      <h2 className="panel-title">Personality</h2>

      {/* Voice Selector */}
      <div className="personality-section">
        <label className="personality-label">Current Voice</label>
        <select
          className="voice-selector"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
        >
          <option value="Energetic Podcaster">Energetic Podcaster</option>
          <option value="Calm Narrator">Calm Narrator</option>
          <option value="Tech Expert">Tech Expert</option>
          <option value="Casual Friend">Casual Friend</option>
        </select>
        <button
          className={`preview-voice-btn ${isPreviewPlaying ? 'playing' : ''}`}
          onClick={handlePreviewVoice}
        >
          {isPreviewPlaying ? '⏹ Stop Preview' : '▶ Preview voice'}
        </button>
      </div>

      {/* Personality Mix Sliders */}
      <div className="personality-section">
        <label className="personality-label">Personality Mix</label>

        <div className="personality-slider">
          <div className="slider-header">
            <span>Comedy</span>
            <span className="slider-value">{personality.comedy}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={personality.comedy}
            onChange={(e) => handleSliderChange('comedy', parseInt(e.target.value))}
            className="slider slider-orange"
          />
        </div>

        <div className="personality-slider">
          <div className="slider-header">
            <span>Research</span>
            <span className="slider-value">{personality.research}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={personality.research}
            onChange={(e) => handleSliderChange('research', parseInt(e.target.value))}
            className="slider slider-green"
          />
        </div>
      </div>

      {/* Energy Level */}
      <div className="personality-section">
        <label className="personality-label">Energy Level</label>
        <div className="personality-slider">
          <input
            type="range"
            min="0"
            max="100"
            value={personality.energy}
            onChange={(e) => handleSliderChange('energy', parseInt(e.target.value))}
            className="slider slider-blue"
          />
          <div className="slider-value-large">{personality.energy}%</div>
        </div>
      </div>

      {/* Response Style Toggle */}
      <div className="personality-section">
        <label className="personality-label">Response Style</label>
        <div className="response-style-toggle">
          <button
            className={`toggle-btn ${responseStyle === 'conversational' ? 'active' : ''}`}
            onClick={() => setResponseStyle('conversational')}
          >
            Conversational
          </button>
          <button
            className={`toggle-btn ${responseStyle === 'formal' ? 'active' : ''}`}
            onClick={() => setResponseStyle('formal')}
          >
            Formal
          </button>
        </div>
      </div>
    </div>
  );
};
