import { useRef } from 'react';

// Custom hook for controlling animations
export function useAnimationControls() {
  const controls = useRef({
    isPlaying: true,
    speed: 1,
    intensity: 1,
  });

  const play = () => {
    controls.current.isPlaying = true;
  };

  const pause = () => {
    controls.current.isPlaying = false;
  };

  const setSpeed = (speed) => {
    controls.current.speed = speed;
  };

  const setIntensity = (intensity) => {
    controls.current.intensity = intensity;
  };

  return {
    controls: controls.current,
    play,
    pause,
    setSpeed,
    setIntensity,
  };
}

// Animation utilities
export const animationUtils = {
  // Smooth interpolation
  lerp: (start, end, factor) => {
    return start + (end - start) * factor;
  },

  // Easing functions
  easeInOut: (t) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },

  easeOut: (t) => {
    return 1 - Math.pow(1 - t, 3);
  },

  // Random float between min and max
  randomFloat: (min, max) => {
    return Math.random() * (max - min) + min;
  },

  // Clamp value between min and max
  clamp: (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  },
};