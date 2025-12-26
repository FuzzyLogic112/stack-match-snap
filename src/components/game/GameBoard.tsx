import { AnimatePresence } from 'framer-motion';
import { TileData } from '@/types/game';
import { Tile } from './Tile';

interface GameBoardProps {
  tiles: TileData[];
  onSelectTile: (id: string) => void;
  hintedTiles?: Set<string>;
}

export const GameBoard = ({ tiles, onSelectTile, hintedTiles = new Set() }: GameBoardProps) => {
  return (
    <div className="relative w-full max-w-md h-96 mx-auto bg-game-board rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-transparent" />
      <AnimatePresence>
        {tiles.filter(t => t.isVisible).map(tile => (
          <Tile 
            key={tile.id} 
            tile={tile} 
            onSelect={onSelectTile} 
            isHinted={hintedTiles.has(tile.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
