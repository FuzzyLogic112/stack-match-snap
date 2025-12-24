import { motion } from 'framer-motion';
import { TileData } from '@/types/game';

interface TileProps {
  tile: TileData;
  onSelect: (id: string) => void;
}

export const Tile = ({ tile, onSelect }: TileProps) => {
  if (!tile.isVisible) return null;

  const handleClick = () => {
    if (!tile.isBlocked) {
      onSelect(tile.id);
    }
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={!tile.isBlocked ? { scale: 1.05, y: -2 } : {}}
      whileTap={!tile.isBlocked ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={handleClick}
      disabled={tile.isBlocked}
      className={`
        absolute w-14 h-14 rounded-xl flex items-center justify-center text-2xl
        transition-all duration-200 select-none
        ${tile.isBlocked 
          ? 'bg-muted cursor-not-allowed opacity-60 tile-shadow-sm' 
          : 'bg-tile hover:bg-tile-hover cursor-pointer tile-shadow active:translate-y-1'
        }
      `}
      style={{
        left: tile.x,
        top: tile.y,
        zIndex: tile.layer * 10 + Math.floor(tile.y),
      }}
    >
      <span className={tile.isBlocked ? 'opacity-50' : ''}>
        {tile.icon}
      </span>
    </motion.button>
  );
};
