import { motion } from 'framer-motion';
import { Trophy, Lock, Coins, Star, Target, Users, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Achievement {
  id: string;
  name_cn: string;
  description_cn: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  coin_reward: number;
  unlocked: boolean;
  unlocked_at?: string;
}

interface AchievementListProps {
  achievements: Record<string, Achievement[]>;
  isLoading: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'progress':
      return <Star className="w-5 h-5" />;
    case 'collector':
      return <Coins className="w-5 h-5" />;
    case 'social':
      return <Users className="w-5 h-5" />;
    case 'challenge':
      return <Target className="w-5 h-5" />;
    case 'powerup':
      return <Zap className="w-5 h-5" />;
    default:
      return <Trophy className="w-5 h-5" />;
  }
};

const getCategoryName = (category: string) => {
  switch (category) {
    case 'progress':
      return '进度成就';
    case 'collector':
      return '收集成就';
    case 'social':
      return '社交成就';
    case 'challenge':
      return '挑战成就';
    case 'powerup':
      return '道具成就';
    default:
      return category;
  }
};

const getIconEmoji = (icon: string) => {
  const iconMap: Record<string, string> = {
    star: '⭐',
    trophy: '🏆',
    crown: '👑',
    gem: '💎',
    coin: '🪙',
    coins: '💰',
    target: '🎯',
    calendar: '📅',
    flame: '🔥',
    users: '👥',
    heart: '❤️',
    zap: '⚡',
    sparkles: '✨'
  };
  return iconMap[icon] || '🏅';
};

export const AchievementList = ({ achievements, isLoading }: AchievementListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl p-4">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 gap-3">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const categories = Object.keys(achievements);

  if (categories.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">暂无成就</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category} className="bg-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-primary">{getCategoryIcon(category)}</div>
            <h3 className="font-bold text-foreground">{getCategoryName(category)}</h3>
            <span className="text-sm text-muted-foreground">
              ({achievements[category].filter(a => a.unlocked).length}/{achievements[category].length})
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {achievements[category].map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  achievement.unlocked
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/50 opacity-60'
                }`}
              >
                <div className="text-2xl">
                  {achievement.unlocked ? getIconEmoji(achievement.icon) : <Lock className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {achievement.name_cn}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {achievement.description_cn}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-bold text-primary">
                    <Coins className="w-4 h-4" />
                    {achievement.coin_reward}
                  </div>
                  {achievement.unlocked && (
                    <p className="text-xs text-muted-foreground">已解锁</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
