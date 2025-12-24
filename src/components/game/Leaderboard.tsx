import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
}

const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Trophy className="w-5 h-5 text-amber-500" />;
    case 1:
      return <Medal className="w-5 h-5 text-slate-400" />;
    case 2:
      return <Award className="w-5 h-5 text-amber-700" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
  }
};

export const Leaderboard = ({ entries, isLoading }: LeaderboardProps) => {
  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Leaderboard
      </h2>

      <div className="bg-card rounded-2xl p-4 shadow-lg border border-border">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No scores yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  index === 0 ? 'bg-primary/10' : 'bg-muted/50'
                }`}
              >
                {getRankIcon(index)}
                <span className="flex-1 font-medium text-foreground truncate">
                  {entry.player_name}
                </span>
                <span className="font-bold text-primary">
                  {entry.score.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
