import { useState, useCallback, useEffect, useRef } from 'react';
import { TileData, TrayTile, GameStatus, TILE_ICONS, TRAY_SIZE, MATCH_COUNT } from '@/types/game';
import { LevelConfig, getLevelConfig, generateDailyChallenge } from '@/config/levels';

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
  
  // Calculate board dimensions for centering (max-w-md = 448px, h-96 = 384px)
  const boardWidth = 380;
  const boardHeight = 350;
  
  // Find max grid dimensions across all layers
  let maxCols = 0;
  let maxRows = 0;
  for (let layer = 0; layer < layers; layer++) {
    const count = tilesPerLayer[layer] || 6;
    const gridSize = Math.ceil(Math.sqrt(count));
    maxCols = Math.max(maxCols, gridSize);
    maxRows = Math.max(maxRows, Math.ceil(count / gridSize));
  }
  
  // Calculate tile grid size and centering offsets
  const tileSize = 56;
  const gap = 4;
  const totalGridWidth = maxCols * tileSize + (maxCols - 1) * gap;
  const totalGridHeight = maxRows * tileSize + (maxRows - 1) * gap;
  const baseOffsetX = (boardWidth - totalGridWidth) / 2;
  const baseOffsetY = (boardHeight - totalGridHeight) / 2;
  
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
        x: baseOffsetX + col * (tileSize + gap) + offsetX + (layer * layerSpacing),
        y: baseOffsetY + row * (tileSize + gap) + offsetY + (layer * layerSpacing),
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

interface HistoryState {
  tiles: TileData[];
  tray: TrayTile[];
  score: number;
}

export const useGameLogic = (levelNumber: number = 1, isDailyChallenge: boolean = false) => {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [tray, setTray] = useState<TrayTile[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(
    isDailyChallenge ? generateDailyChallenge() : getLevelConfig(levelNumber)
  );
  const [hintedTiles, setHintedTiles] = useState<Set<string>>(new Set());
  
  const historyRef = useRef<HistoryState[]>([]);
  const onMatchRef = useRef<(() => void) | null>(null);

  const updateBlockedStatus = useCallback((currentTiles: TileData[]) => {
    return currentTiles.map(tile => ({
      ...tile,
      isBlocked: tile.isVisible ? checkBlocked(tile, currentTiles) : false,
    }));
  }, []);

  const initGame = useCallback((level?: number, isDaily?: boolean) => {
    const config = isDaily ? generateDailyChallenge() : getLevelConfig(level ?? levelNumber);
    setCurrentLevel(config);
    const newTiles = generateTiles(config);
    const tilesWithBlocked = updateBlockedStatus(newTiles);
    setTiles(tilesWithBlocked);
    setTray([]);
    setGameStatus('playing');
    setScore(0);
    setHintedTiles(new Set());
    historyRef.current = [];
  }, [levelNumber, updateBlockedStatus]);

  useEffect(() => {
    initGame(levelNumber, isDailyChallenge);
  }, [levelNumber, isDailyChallenge]);

  const selectTile = useCallback((tileId: string) => {
    if (gameStatus !== 'playing') return;
    
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.isBlocked || !tile.isVisible) return;

    // Save history before making changes
    historyRef.current.push({
      tiles: tiles.map(t => ({ ...t })),
      tray: tray.map(t => ({ ...t })),
      score,
    });
    // Keep only last 10 states
    if (historyRef.current.length > 10) {
      historyRef.current.shift();
    }

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

    let matched = false;
    Object.entries(iconCounts).forEach(([icon, matchingTiles]) => {
      if (matchingTiles.length >= MATCH_COUNT) {
        const idsToRemove = matchingTiles.slice(0, MATCH_COUNT).map(t => t.id);
        newTray = newTray.filter(t => !idsToRemove.includes(t.id));
        setScore(prev => prev + 100);
        matched = true;
      }
    });

    if (matched && onMatchRef.current) {
      onMatchRef.current();
    }

    // Clear hints after action
    setHintedTiles(new Set());

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
    
    return matched;
  }, [tiles, tray, gameStatus, score, updateBlockedStatus]);

  // Power-up: Shuffle
  const shuffleTiles = useCallback(() => {
    if (gameStatus !== 'playing') return false;
    
    const visibleTiles = tiles.filter(t => t.isVisible);
    const positions = visibleTiles.map(t => ({ x: t.x, y: t.y, layer: t.layer }));
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    let posIndex = 0;
    const newTiles = tiles.map(t => {
      if (t.isVisible) {
        const pos = positions[posIndex++];
        return { ...t, x: pos.x, y: pos.y, layer: pos.layer };
      }
      return t;
    });
    
    const updatedTiles = updateBlockedStatus(newTiles);
    setTiles(updatedTiles);
    setHintedTiles(new Set());
    return true;
  }, [tiles, gameStatus, updateBlockedStatus]);

  // Power-up: Undo
  const undoLastMove = useCallback(() => {
    if (gameStatus !== 'playing' || historyRef.current.length === 0) return false;
    
    const lastState = historyRef.current.pop()!;
    setTiles(lastState.tiles);
    setTray(lastState.tray);
    setScore(lastState.score);
    setHintedTiles(new Set());
    return true;
  }, [gameStatus]);

  // Power-up: Remove 3 tiles from tray
  const removeThreeFromTray = useCallback(() => {
    if (gameStatus !== 'playing' || tray.length === 0) return false;
    
    const toRemove = Math.min(3, tray.length);
    const newTray = tray.slice(toRemove);
    setTray(newTray);
    return true;
  }, [tray, gameStatus]);

  // Power-up: Hint - find matching tiles
  const showHint = useCallback(() => {
    if (gameStatus !== 'playing') return false;
    
    const visibleTiles = tiles.filter(t => t.isVisible && !t.isBlocked);
    const iconGroups: Record<string, TileData[]> = {};
    
    visibleTiles.forEach(t => {
      if (!iconGroups[t.icon]) iconGroups[t.icon] = [];
      iconGroups[t.icon].push(t);
    });
    
    // Find icons with at least 3 available
    const hints = new Set<string>();
    Object.values(iconGroups).forEach(group => {
      if (group.length >= 3) {
        group.slice(0, 3).forEach(t => hints.add(t.id));
      }
    });
    
    setHintedTiles(hints);
    
    // Clear hints after 3 seconds
    setTimeout(() => setHintedTiles(new Set()), 3000);
    
    return hints.size > 0;
  }, [tiles, gameStatus]);

  const setOnMatch = useCallback((callback: () => void) => {
    onMatchRef.current = callback;
  }, []);

  return {
    tiles,
    tray,
    gameStatus,
    score,
    currentLevel,
    hintedTiles,
    selectTile,
    restartGame: initGame,
    shuffleTiles,
    undoLastMove,
    removeThreeFromTray,
    showHint,
    setOnMatch,
    canUndo: historyRef.current.length > 0,
  };
};
