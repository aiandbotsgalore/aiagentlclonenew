import React, { useRef, useEffect } from 'react';
import { useAgentStore } from '../stores/useAgent';
import { useHover, useTilt } from '../hooks/useInteractions';

const useFace = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    color: string,
    volume: number,
) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        let lastVolume = -1;
        let lastColor = '';
        let lastWidth = 0;
        let lastHeight = 0;

        const draw = () => {
            const { width, height } = canvas.getBoundingClientRect();

            // Only redraw if volume or color changed, or canvas resized
            const volumeChanged = Math.abs(volume - lastVolume) > 0.001;
            const colorChanged = color !== lastColor;
            const sizeChanged = width !== lastWidth || height !== lastHeight;

            if (volumeChanged || colorChanged || sizeChanged) {
                canvas.width = width;
                canvas.height = height;

                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = color;

                // Simple circle body
                ctx.beginPath();
                ctx.arc(width / 2, height / 2, Math.min(width, height) / 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                const eyeXOffset = width / 8;
                const eyeYOffset = -height / 12;
                const eyeRadius = width / 30;
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(width / 2 - eyeXOffset, height / 2 + eyeYOffset, eyeRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(width / 2 + eyeXOffset, height / 2 + eyeYOffset, eyeRadius, 0, Math.PI * 2);
                ctx.fill();

                // Mouth
                const mouthY = height / 2 + height / 10;
                const mouthWidth = width / 6;
                const mouthHeight = Math.max(2, Math.min(height / 8, volume * height * 1.5));
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.ellipse(width / 2, mouthY, mouthWidth / 2, mouthHeight / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                lastVolume = volume;
                lastColor = color;
                lastWidth = width;
                lastHeight = height;
            }

            frameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [canvasRef, color, volume]);
};

interface BasicFaceProps {
    volume: number;
}

const BasicFace: React.FC<BasicFaceProps> = ({ volume }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { current: currentAgent } = useAgentStore();
    
    const isHovering = useHover(containerRef);
    const tilt = useTilt(containerRef);

    useFace(canvasRef, currentAgent.bodyColor, volume);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full" 
            style={{
                transformStyle: 'preserve-3d',
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.05 : 1})`,
                transition: 'transform 0.1s linear',
            }}
        >
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
};

export default BasicFace;