import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FriendLeaderboardEntry {
  user_id: string;
  username: string;
  max_level: number;
  coins: number;
  rank: number;
}

interface FriendLeaderboardProps {
  entries: FriendLeaderboardEntry[];
  isLoading: boolean;
  currentUserId?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
  }
};

export const FriendLeaderboard = ({ entries, isLoading, currentUserId }: FriendLeaderboardProps) => {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">好友排行榜</h3>
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">还没有好友</p>
        <p className="text-sm text-muted-foreground mt-1">添加好友来比较进度！</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">好友排行榜</h3>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl ${
              entry.user_id === currentUserId
                ? 'bg-primary/10 border border-primary/30'
                : 'bg-muted/50'
            }`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${
                entry.user_id === currentUserId ? 'text-primary' : 'text-foreground'
              }`}>
                {entry.username}
                {entry.user_id === currentUserId && ' (你)'}
              </p>
              <p className="text-xs text-muted-foreground">
                关卡 {entry.max_level}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">{entry.coins}</p>
              <p className="text-xs text-muted-foreground">金币</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
