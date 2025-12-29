import { useCallback, useRef, useEffect, useState } from 'react';

// Simple Web Audio API based background music with procedural generation
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

// Generate a simple looping melody
const createMelodyOscillator = (
  ctx: AudioContext,
  gainNode: GainNode,
  frequency: number,
  duration: number,
  startTime: number
) => {
  const osc = ctx.createOscillator();
  const noteGain = ctx.createGain();
  
  osc.connect(noteGain);
  noteGain.connect(gainNode);
  
  osc.frequency.value = frequency;
  osc.type = 'sine';
  
  noteGain.gain.setValueAtTime(0, startTime);
  noteGain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
  noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration - 0.05);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const useBackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bgMusicEnabled') !== 'false';
    }
    return true;
  });
  
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pentatonic scale frequencies for a pleasant, non-intrusive melody
  const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
  
  const playMelodyLoop = useCallback(() => {
    if (!audioContext || !gainNodeRef.current) return;
    
    const now = audioContext.currentTime;
    const noteDuration = 0.5;
    
    // Play a random pleasant sequence
    for (let i = 0; i < 8; i++) {
      const noteIndex = Math.floor(Math.random() * scale.length);
      const frequency = scale[noteIndex];
      createMelodyOscillator(
        audioContext,
        gainNodeRef.current,
        frequency,
        noteDuration * 0.9,
        now + i * noteDuration
      );
    }
  }, []);
  
  const startMusic = useCallback(() => {
    if (!audioContext || !isEnabled) return;
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain();
      gainNodeRef.current.connect(audioContext.destination);
      gainNodeRef.current.gain.value = 0.05; // Very low volume
    }
    
    if (!intervalRef.current) {
      playMelodyLoop();
      intervalRef.current = setInterval(playMelodyLoop, 4000);
    }
    
    setIsPlaying(true);
  }, [isEnabled, playMelodyLoop]);
  
  const stopMusic = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);
  
  const toggleMusic = useCallback(() => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    localStorage.setItem('bgMusicEnabled', String(newEnabled));
    
    if (newEnabled) {
      startMusic();
    } else {
      stopMusic();
    }
    
    return newEnabled;
  }, [isEnabled, startMusic, stopMusic]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Auto-start based on user preference
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (isEnabled && !isPlaying) {
        startMusic();
      }
    };
    
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isEnabled, isPlaying, startMusic]);
  
  return {
    isPlaying,
    isEnabled,
    startMusic,
    stopMusic,
    toggleMusic,
  };
};
