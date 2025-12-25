import { useState, useCallback, useEffect } from 'react';
import { TileData, TrayTile, GameStatus, TILE_ICONS, TRAY_SIZE, MATCH_COUNT } from '@/types/game';
import { LevelConfig, getLevelConfig } from '@/config/levels';

const generateId = () => Math.random().toString(36).substr(2, 9);

const generateTiles = (config: LevelConfig): TileData[] => {
  const tiles: TileData[] = [];
  const { layers, tilesPerLayer, iconCount, offsetRandomness, layerSpacing } = config;
  
  // Select icons based on level config
  const selectedIcons = TILE_ICONS.slice(0, iconCount);
  
  // Calculate total tiles
  const totalTiles = tilesPerLayer.reduce((a, b) => a + b, 0);
  
  // Create tile icons ensuring multiples of 3
  const tileIcons: string[] = [];
  const tilesPerIcon = Math.floor(totalTiles / selectedIcons.length / 3) * 3;
  
  selectedIcons.forEach(icon => {
    for (let i = 0; i < tilesPerIcon; i++) {
      tileIcons.push(icon);
    }
  });
  
  // Fill remaining with random icons (ensuring multiples of 3)
  while (tileIcons.length < totalTiles) {
    const icon = selectedIcons[Math.floor(Math.random() * selectedIcons.length)];
    tileIcons.push(icon, icon, icon);
  }
  
  // Shuffle
  for (let i = tileIcons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tileIcons[i], tileIcons[j]] = [tileIcons[j], tileIcons[i]];
  }
  
  let iconIndex = 0;
  
  for (let layer = 0; layer < layers; layer++) {
    const count = tilesPerLayer[layer] || 6;
    const gridSize = Math.ceil(Math.sqrt(count));
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Add randomness to positions based on level config
      const offsetX = (Math.random() - 0.5) * offsetRandomness;
      const offsetY = (Math.random() - 0.5) * offsetRandomness;
      
      tiles.push({
        id: generateId(),
        icon: tileIcons[iconIndex % tileIcons.length],
        layer,
        x: col * 60 + offsetX + (layer * layerSpacing) + 20,
        y: row * 60 + offsetY + (layer * layerSpacing) + 20,
        isBlocked: false,
        isVisible: true,
      });
      
      iconIndex++;
    }
  }
  
  return tiles;
};

const checkBlocked = (tile: TileData, allTiles: TileData[]): boolean => {
  return allTiles.some(other => {
    if (other.layer <= tile.layer || !other.isVisible) return false;
    
    const overlapX = Math.abs(tile.x - other.x) < 45;
    const overlapY = Math.abs(tile.y - other.y) < 45;
    
    return overlapX && overlapY;
  });
};

export const useGameLogic = (levelNumber: number = 1) => {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [tray, setTray] = useState<TrayTile[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(getLevelConfig(levelNumber));

  const updateBlockedStatus = useCallback((currentTiles: TileData[]) => {
    return currentTiles.map(tile => ({
      ...tile,
      isBlocked: tile.isVisible ? checkBlocked(tile, currentTiles) : false,
    }));
  }, []);

  const initGame = useCallback((level?: number) => {
    const config = getLevelConfig(level ?? levelNumber);
    setCurrentLevel(config);
    const newTiles = generateTiles(config);
    const tilesWithBlocked = updateBlockedStatus(newTiles);
    setTiles(tilesWithBlocked);
    setTray([]);
    setGameStatus('playing');
    setScore(0);
  }, [levelNumber, updateBlockedStatus]);

  useEffect(() => {
    initGame(levelNumber);
  }, [levelNumber]);

  const selectTile = useCallback((tileId: string) => {
    if (gameStatus !== 'playing') return;
    
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.isBlocked || !tile.isVisible) return;

    // Remove tile from board
    const newTiles = tiles.map(t => 
      t.id === tileId ? { ...t, isVisible: false } : t
    );
    
    // Add to tray
    const newTrayTile: TrayTile = { id: tile.id, icon: tile.icon };
    let newTray = [...tray];
    
    // Find if there are same icons and insert next to them
    const sameIconIndex = newTray.findIndex(t => t.icon === tile.icon);
    if (sameIconIndex !== -1) {
      let lastIndex = sameIconIndex;
      for (let i = sameIconIndex; i < newTray.length; i++) {
        if (newTray[i].icon === tile.icon) lastIndex = i;
        else break;
      }
      newTray.splice(lastIndex + 1, 0, newTrayTile);
    } else {
      newTray.push(newTrayTile);
    }

    // Check for matches
    const iconCounts: Record<string, TrayTile[]> = {};
    newTray.forEach(t => {
      if (!iconCounts[t.icon]) iconCounts[t.icon] = [];
      iconCounts[t.icon].push(t);
    });

    Object.entries(iconCounts).forEach(([icon, tiles]) => {
      if (tiles.length >= MATCH_COUNT) {
        const idsToRemove = tiles.slice(0, MATCH_COUNT).map(t => t.id);
        newTray = newTray.filter(t => !idsToRemove.includes(t.id));
        setScore(prev => prev + 100);
      }
    });

    // Update blocked status
    const updatedTiles = updateBlockedStatus(newTiles);
    setTiles(updatedTiles);
    setTray(newTray);

    // Check game over conditions
    const remainingTiles = updatedTiles.filter(t => t.isVisible);
    if (remainingTiles.length === 0 && newTray.length === 0) {
      setGameStatus('won');
    } else if (newTray.length >= TRAY_SIZE) {
      setGameStatus('lost');
    }
  }, [tiles, tray, gameStatus, updateBlockedStatus]);

  return {
    tiles,
    tray,
    gameStatus,
    score,
    currentLevel,
    selectTile,
    restartGame: initGame,
  };
};
