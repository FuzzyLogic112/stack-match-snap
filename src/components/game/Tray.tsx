import { motion, AnimatePresence } from 'framer-motion';
import { TrayTile, TRAY_SIZE } from '@/types/game';

interface TrayProps {
  tiles: TrayTile[];
}

export const Tray = ({ tiles }: TrayProps) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-tray rounded-2xl p-3 tray-shadow">
        <div className="flex gap-2 justify-center">
          {Array.from({ length: TRAY_SIZE }).map((_, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-xl bg-tray-slot flex items-center justify-center"
            >
              <AnimatePresence mode="popLayout">
                {tiles[index] && (
                  <motion.div
                    key={tiles[index].id}
                    initial={{ scale: 0, y: -50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-full h-full rounded-xl bg-tile tile-shadow-sm flex items-center justify-center text-xl"
                  >
                    {tiles[index].icon}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
