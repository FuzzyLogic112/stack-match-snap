export type DifficultyTier = 'easy' | 'normal' | 'hard';

export interface LevelConfig {
  id: number;
  tier: DifficultyTier;
  tierLevel: number; // 1-20 within each tier
  name: string;
  description: string;
  layers: number;
  tilesPerLayer: number[];
  iconCount: number;
  offsetRandomness: number;
  layerSpacing: number;
  coinReward: number;
}

export const DIFFICULTY_TIERS: { id: DifficultyTier; name: string; nameCn: string; levels: number; baseReward: number }[] = [
  { id: 'easy', name: 'Easy', nameCn: '简单', levels: 20, baseReward: 50 },
  { id: 'normal', name: 'Normal', nameCn: '普通', levels: 20, baseReward: 100 },
  { id: 'hard', name: 'Hard', nameCn: '困难', levels: 20, baseReward: 200 },
];

// Generate level config based on tier and level number within tier
const generateLevelForTier = (tier: DifficultyTier, tierLevel: number): LevelConfig => {
  const globalId = tier === 'easy' ? tierLevel : tier === 'normal' ? 20 + tierLevel : 40 + tierLevel;
  
  let layers: number;
  let tilesPerLayer: number[];
  let iconCount: number;
  let offsetRandomness: number;
  let layerSpacing: number;
  let coinReward: number;
  
  if (tier === 'easy') {
    // Easy: 2-4 layers, fewer tiles, simple patterns
    layers = Math.min(2 + Math.floor(tierLevel / 7), 4);
    const baseTiles = 6 + tierLevel;
    tilesPerLayer = Array.from({ length: layers }, (_, i) => 
      Math.floor((baseTiles - i * 3) / 3) * 3
    ).filter(t => t >= 3);
    iconCount = Math.min(5 + Math.floor(tierLevel / 4), 10);
    offsetRandomness = 10 + tierLevel * 0.5;
    layerSpacing = 20 - tierLevel * 0.3;
    coinReward = 50 + tierLevel * 5;
  } else if (tier === 'normal') {
    // Normal: 3-5 layers, medium density
    layers = Math.min(3 + Math.floor(tierLevel / 5), 5);
    const baseTiles = 15 + tierLevel * 2;
    tilesPerLayer = Array.from({ length: layers }, (_, i) => 
      Math.floor((baseTiles - i * 4) / 3) * 3
    ).filter(t => t >= 3);
    iconCount = Math.min(8 + Math.floor(tierLevel / 3), 14);
    offsetRandomness = 15 + tierLevel;
    layerSpacing = 15 - tierLevel * 0.3;
    coinReward = 100 + tierLevel * 10;
  } else {
    // Hard: "Sheep a Sheep" style - deep layers, high density
    layers = Math.min(4 + Math.floor(tierLevel / 4), 8);
    const baseTiles = 24 + tierLevel * 3;
    tilesPerLayer = Array.from({ length: layers }, (_, i) => 
      Math.floor((baseTiles - i * 5) / 3) * 3
    ).filter(t => t >= 3);
    iconCount = Math.min(10 + Math.floor(tierLevel / 2), 16);
    offsetRandomness = 20 + tierLevel * 1.5;
    layerSpacing = 10 - tierLevel * 0.2;
    coinReward = 200 + tierLevel * 15;
  }
  
  // Ensure we have valid layers
  if (tilesPerLayer.length === 0) {
    tilesPerLayer = [6];
  }
  
  return {
    id: globalId,
    tier,
    tierLevel,
    name: `${tier === 'easy' ? '简单' : tier === 'normal' ? '普通' : '困难'} ${tierLevel}`,
    description: getDescriptionForLevel(tier, tierLevel),
    layers: tilesPerLayer.length,
    tilesPerLayer,
    iconCount,
    offsetRandomness: Math.max(5, offsetRandomness),
    layerSpacing: Math.max(6, layerSpacing),
    coinReward,
  };
};

const getDescriptionForLevel = (tier: DifficultyTier, tierLevel: number): string => {
  if (tier === 'easy') {
    if (tierLevel <= 5) return '新手入门';
    if (tierLevel <= 10) return '逐渐上手';
    if (tierLevel <= 15) return '初见成效';
    return '简单精通';
  } else if (tier === 'normal') {
    if (tierLevel <= 5) return '正式挑战';
    if (tierLevel <= 10) return '步步为营';
    if (tierLevel <= 15) return '越战越勇';
    return '普通大师';
  } else {
    if (tierLevel <= 5) return '硬核开始';
    if (tierLevel <= 10) return '地狱模式';
    if (tierLevel <= 15) return '绝境求生';
    return '终极挑战';
  }
};

// Generate all 60 levels (20 per tier)
export const ALL_LEVELS: LevelConfig[] = [];
for (let i = 1; i <= 20; i++) {
  ALL_LEVELS.push(generateLevelForTier('easy', i));
}
for (let i = 1; i <= 20; i++) {
  ALL_LEVELS.push(generateLevelForTier('normal', i));
}
for (let i = 1; i <= 20; i++) {
  ALL_LEVELS.push(generateLevelForTier('hard', i));
}

export const getLevelConfig = (levelNumber: number): LevelConfig => {
  const level = ALL_LEVELS.find(l => l.id === levelNumber);
  if (level) return level;
  // Fallback to last level if somehow out of bounds
  return ALL_LEVELS[ALL_LEVELS.length - 1];
};

export const getLevelsForTier = (tier: DifficultyTier): LevelConfig[] => {
  return ALL_LEVELS.filter(l => l.tier === tier);
};

export const getTierForLevel = (levelNumber: number): DifficultyTier => {
  if (levelNumber <= 20) return 'easy';
  if (levelNumber <= 40) return 'normal';
  return 'hard';
};

// Daily challenge generation
export const generateDailyChallenge = (): LevelConfig => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Pseudo-random based on date
  const random = (max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
  };
  
  const layers = 4 + random(3);
  const baseTiles = 30 + random(20);
  const tilesPerLayer = Array.from({ length: layers }, (_, i) => 
    Math.floor((baseTiles - i * 5) / 3) * 3
  ).filter(t => t >= 3);
  
  return {
    id: -1, // Special ID for daily challenge
    tier: 'normal',
    tierLevel: 0,
    name: '每日挑战',
    description: `${today.getMonth() + 1}月${today.getDate()}日特别关卡`,
    layers: tilesPerLayer.length,
    tilesPerLayer: tilesPerLayer.length > 0 ? tilesPerLayer : [12, 9, 6],
    iconCount: 10 + random(4),
    offsetRandomness: 20 + random(10),
    layerSpacing: 8 + random(4),
    coinReward: 300,
  };
};
