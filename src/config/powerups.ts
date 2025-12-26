export interface PowerUp {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  descriptionCn: string;
  icon: string;
  price: number;
  effect: 'shuffle' | 'undo' | 'remove_three' | 'hint';
}

export const POWER_UPS: PowerUp[] = [
  {
    id: 'shuffle',
    name: 'Shuffle',
    nameCn: '洗牌',
    description: 'Randomize all tiles on the board',
    descriptionCn: '随机打乱所有方块位置',
    icon: '🔀',
    price: 100,
    effect: 'shuffle',
  },
  {
    id: 'undo',
    name: 'Undo',
    nameCn: '撤销',
    description: 'Return the last selected tile',
    descriptionCn: '撤销上一步操作',
    icon: '↩️',
    price: 50,
    effect: 'undo',
  },
  {
    id: 'remove_three',
    name: 'Clear 3',
    nameCn: '移除3个',
    description: 'Remove 3 tiles from tray',
    descriptionCn: '从槽中移除3个方块',
    icon: '🗑️',
    price: 150,
    effect: 'remove_three',
  },
  {
    id: 'hint',
    name: 'Hint',
    nameCn: '提示',
    description: 'Highlight matching tiles',
    descriptionCn: '高亮显示可消除的方块',
    icon: '💡',
    price: 80,
    effect: 'hint',
  },
];

export const getPowerUp = (id: string): PowerUp | undefined => {
  return POWER_UPS.find(p => p.id === id);
};
