import React, { useRef, useEffect } from 'react';
import { VolumeData } from '../../../shared/types';

/**
 * Props for the AudioInputPanel component.
 */
interface AudioInputPanelProps {
  /**
   * Current volume data for input and output.
   */
  volume: VolumeData;
}

/**
 * Panel visualizing audio input and output levels.
 *
 * Displays numeric dB levels and a live waveform visualization using an HTML5 Canvas.
 *
 * @component
 * @param {AudioInputPanelProps} props - The component props.
 * @returns {JSX.Element} The audio input panel.
 */
export const AudioInputPanel: React.FC<AudioInputPanelProps> = ({ volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple waveform visualization
    const drawWaveform = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, width, height);

      // Draw bars based on volume
      const barCount = 50;
      const barWidth = width / barCount;
      const inputIntensity = volume.input / 100;
      const outputIntensity = volume.output / 100;

      for (let i = 0; i < barCount; i++) {
        // Simulate waveform with sine wave + random noise
        const t = i / barCount;
        const inputHeight = (Math.sin(t * Math.PI * 4 + Date.now() / 200) * 0.5 + 0.5) * inputIntensity * height * 0.4;
        const outputHeight = (Math.sin(t * Math.PI * 3 + Date.now() / 150) * 0.5 + 0.5) * outputIntensity * height * 0.4;

        // Draw input bars (top half)
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(i * barWidth, height / 2 - inputHeight, barWidth - 2, inputHeight);

        // Draw output bars (bottom half)
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(i * barWidth, height / 2, barWidth - 2, outputHeight);
      }
    };

    const interval = setInterval(drawWaveform, 50);
    return () => clearInterval(interval);
  }, [volume]);

  return (
    <div className="panel audio-input-panel">
      <h2 className="panel-title">Audio Input</h2>

      <div className="audio-channels">
        <div className="audio-channel">
          <label>Space Audio</label>
          <div className="audio-level">
            <span>{-60 + Math.round(volume.input * 0.6)} dB</span>
          </div>
        </div>

        <div className="audio-channel">
          <label>AI Output</label>
          <div className="audio-level">
            <span>{-66 + Math.round(volume.output * 0.66)} dB</span>
          </div>
          <div className="level-meter">
            <div className="level-bar" style={{ width: `${volume.output}%` }} />
          </div>
        </div>
      </div>

      <div className="waveform-container">
        <label>Live Waveform</label>
        <canvas ref={canvasRef} width={300} height={80} className="waveform-canvas" />
      </div>
    </div>
  );
};
