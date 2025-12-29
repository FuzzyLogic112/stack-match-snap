import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
}

interface ParticleEffectProps {
  trigger: number; // Increment this to trigger particles
  x?: number;
  y?: number;
}

const COLORS = [
  'hsl(24, 80%, 55%)', // primary orange
  'hsl(45, 60%, 85%)', // secondary yellow
  'hsl(340, 70%, 65%)', // accent pink
  'hsl(145, 60%, 45%)', // success green
  'hsl(200, 70%, 60%)', // sky blue
];

export const ParticleEffect = ({ trigger, x = 0, y = 0 }: ParticleEffectProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const createParticles = useCallback((posX: number, posY: number) => {
    const newParticles: Particle[] = [];
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: posX,
        y: posY,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        angle: (Math.PI * 2 * i) / particleCount + Math.random() * 0.5,
        speed: Math.random() * 60 + 40,
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    
    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 800);
  }, []);
  
  useEffect(() => {
    if (trigger > 0) {
      createParticles(x, y);
    }
  }, [trigger, x, y, createParticles]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: particle.x + Math.cos(particle.angle) * particle.speed,
              y: particle.y + Math.sin(particle.angle) * particle.speed + 30,
              scale: 0,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
