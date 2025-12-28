import { ReactNode, forwardRef, useImperativeHandle, useState } from 'react';
import { motion } from 'framer-motion';

export interface ScreenShakeRef {
  shake: () => void;
}

interface ScreenShakeProps {
  children: ReactNode;
}

export const ScreenShake = forwardRef<ScreenShakeRef, ScreenShakeProps>(
  ({ children }, ref) => {
    const [isShaking, setIsShaking] = useState(false);

    useImperativeHandle(ref, () => ({
      shake: () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);
      },
    }));

    return (
      <motion.div
        animate={
          isShaking
            ? {
                x: [0, -8, 8, -6, 6, -4, 4, -2, 2, 0],
                y: [0, 2, -2, 2, -2, 1, -1, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    );
  }
);

ScreenShake.displayName = 'ScreenShake';