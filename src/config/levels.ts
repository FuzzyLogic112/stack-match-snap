export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  layers: number;
  tilesPerLayer: number[];
  iconCount: number;
  offsetRandomness: number;
  layerSpacing: number;
  coinReward: number;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Tutorial",
    description: "Learn the basics",
    layers: 2,
    tilesPerLayer: [9, 6],
    iconCount: 5,
    offsetRandomness: 10,
    layerSpacing: 20,
    coinReward: 100,
  },
  {
    id: 2,
    name: "The Challenge",
    description: "Sheep a Sheep style!",
    layers: 4,
    tilesPerLayer: [24, 18, 12, 6],
    iconCount: 10,
    offsetRandomness: 25,
    layerSpacing: 12,
    coinReward: 100,
  },
  {
    id: 3,
    name: "Deep Stack",
    description: "More layers, more fun",
    layers: 5,
    tilesPerLayer: [30, 24, 18, 12, 6],
    iconCount: 12,
    offsetRandomness: 20,
    layerSpacing: 10,
    coinReward: 100,
  },
  {
    id: 4,
    name: "Icon Overload",
    description: "So many animals!",
    layers: 4,
    tilesPerLayer: [36, 27, 18, 9],
    iconCount: 14,
    offsetRandomness: 15,
    layerSpacing: 12,
    coinReward: 100,
  },
  {
    id: 5,
    name: "The Gauntlet",
    description: "Only the brave survive",
    layers: 6,
    tilesPerLayer: [42, 36, 30, 24, 18, 12],
    iconCount: 16,
    offsetRandomness: 30,
    layerSpacing: 8,
    coinReward: 100,
  },
];

// Generate procedural levels beyond the defined ones
export const generateProceduralLevel = (levelNumber: number): LevelConfig => {
  const baseLayers = 3 + Math.floor(levelNumber / 2);
  const layers = Math.min(baseLayers, 8);
  
  const tilesPerLayer: number[] = [];
  for (let i = 0; i < layers; i++) {
    // More tiles at bottom, fewer at top - ensure multiples of 3
    const baseTiles = Math.max(6, 42 - (i * 6) + Math.floor(levelNumber * 1.5));
    tilesPerLayer.push(Math.floor(baseTiles / 3) * 3);
  }
  
  return {
    id: levelNumber,
    name: `Level ${levelNumber}`,
    description: `Procedural challenge ${levelNumber}`,
    layers,
    tilesPerLayer,
    iconCount: Math.min(16, 6 + Math.floor(levelNumber / 2)),
    offsetRandomness: 15 + Math.min(20, levelNumber * 2),
    layerSpacing: Math.max(6, 15 - Math.floor(levelNumber / 3)),
    coinReward: 100,
  };
};

export const getLevelConfig = (levelNumber: number): LevelConfig => {
  const predefinedLevel = LEVELS.find(l => l.id === levelNumber);
  if (predefinedLevel) return predefinedLevel;
  return generateProceduralLevel(levelNumber);
};
