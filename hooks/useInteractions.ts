import { useEffect, useState } from 'react';

/**
 * Hook that tracks whether an element is being hovered over.
 *
 * @param {React.RefObject<HTMLElement>} ref - The ref of the element to track.
 * @returns {boolean} True if the element is being hovered, false otherwise.
 */
export const useHover = (ref: React.RefObject<HTMLElement>): boolean => {
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);

  return isHovering;
};

/**
 * Hook that calculates tilt effect values based on mouse position over an element.
 *
 * @param {React.RefObject<HTMLElement>} ref - The ref of the element to track.
 * @returns {{ x: number, y: number }} The tilt values for x and y axes.
 */
export const useTilt = (ref: React.RefObject<HTMLElement>): { x: number; y: number } => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { width, height, left, top } = node.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      setTilt({ x: -y * 20, y: x * 20 });
    };

    const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

    node.addEventListener('mousemove', handleMouseMove);
    node.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      node.removeEventListener('mousemove', handleMouseMove);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);

  return tilt;
};
