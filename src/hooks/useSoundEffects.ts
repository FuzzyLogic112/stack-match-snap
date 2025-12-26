import { useCallback, useRef, useEffect } from 'react';

// Simple Web Audio API based sound effects
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
  if (!audioContext) return;
  
  // Resume audio context if suspended (required by browsers)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const playMultiTone = (frequencies: number[], duration: number, delay: number = 0.08) => {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playTone(freq, duration, 'sine', 0.2), i * delay * 1000);
  });
};

export const useSoundEffects = () => {
  const enabled = useRef(true);
  
  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (audioContext?.state === 'suspended') {
        audioContext.resume();
      }
    };
    
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);
  
  const playSelect = useCallback(() => {
    if (!enabled.current) return;
    playTone(600, 0.1, 'sine', 0.2);
  }, []);
  
  const playMatch = useCallback(() => {
    if (!enabled.current) return;
    // Pleasant ascending arpeggio for match
    playMultiTone([523, 659, 784], 0.15, 0.06);
  }, []);
  
  const playWin = useCallback(() => {
    if (!enabled.current) return;
    // Victory fanfare
    playMultiTone([523, 659, 784, 1047], 0.3, 0.12);
  }, []);
  
  const playLose = useCallback(() => {
    if (!enabled.current) return;
    // Descending sad tone
    playMultiTone([400, 350, 300], 0.25, 0.15);
  }, []);
  
  const playPowerUp = useCallback(() => {
    if (!enabled.current) return;
    // Magical power-up sound
    playMultiTone([800, 1000, 1200, 1400], 0.1, 0.04);
  }, []);
  
  const playButton = useCallback(() => {
    if (!enabled.current) return;
    playTone(440, 0.05, 'sine', 0.15);
  }, []);
  
  const playError = useCallback(() => {
    if (!enabled.current) return;
    playTone(200, 0.2, 'sawtooth', 0.15);
  }, []);
  
  const toggleSound = useCallback(() => {
    enabled.current = !enabled.current;
    return enabled.current;
  }, []);
  
  const isSoundEnabled = useCallback(() => {
    return enabled.current;
  }, []);
  
  return {
    playSelect,
    playMatch,
    playWin,
    playLose,
    playPowerUp,
    playButton,
    playError,
    toggleSound,
    isSoundEnabled,
  };
};
