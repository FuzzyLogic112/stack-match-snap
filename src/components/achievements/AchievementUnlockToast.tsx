import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Achievement {
  id: string;
  name_cn: string;
  description_cn: string;
  icon: string;
  coin_reward: number;
}

interface AchievementUnlockToastProps {
  achievements: Achievement[];
  onClose: () => void;
}

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

export const AchievementUnlockToast = ({ achievements, onClose }: AchievementUnlockToastProps) => {
  if (achievements.length === 0) return null;

  const totalReward = achievements.reduce((sum, a) => sum + a.coin_reward, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">成就解锁！</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-3 mb-4">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl"
              >
                <div className="text-3xl">{getIconEmoji(achievement.icon)}</div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{achievement.name_cn}</p>
                  <p className="text-sm text-muted-foreground">{achievement.description_cn}</p>
                </div>
                <div className="flex items-center gap-1 text-primary font-bold">
                  <Coins className="w-4 h-4" />
                  +{achievement.coin_reward}
                </div>
              </motion.div>
            ))}
          </div>

          {achievements.length > 1 && (
            <div className="text-center py-2 border-t border-border">
              <p className="text-sm text-muted-foreground">总奖励</p>
              <p className="text-xl font-bold text-primary flex items-center justify-center gap-1">
                <Coins className="w-5 h-5" />
                +{totalReward}
              </p>
            </div>
          )}

          <Button className="w-full mt-4" onClick={onClose}>
            太棒了！
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
