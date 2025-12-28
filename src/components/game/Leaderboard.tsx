import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Calendar, CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimeFilter } from '@/hooks/useLeaderboard';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  timeFilter?: TimeFilter;
  onTimeFilterChange?: (filter: TimeFilter) => void;
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

const timeFilterLabels: Record<TimeFilter, { label: string; icon: React.ReactNode }> = {
  all: { label: '全部', icon: <Clock className="w-4 h-4" /> },
  week: { label: '本周', icon: <Calendar className="w-4 h-4" /> },
  month: { label: '本月', icon: <CalendarDays className="w-4 h-4" /> },
};

export const Leaderboard = ({ entries, isLoading, timeFilter = 'all', onTimeFilterChange }: LeaderboardProps) => {
  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          排行榜
        </h2>
        
        {onTimeFilterChange && (
          <div className="flex gap-1">
            {(Object.keys(timeFilterLabels) as TimeFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTimeFilterChange(filter)}
                className="gap-1 text-xs px-2 h-7"
              >
                {timeFilterLabels[filter].icon}
                {timeFilterLabels[filter].label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-lg border border-border">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            暂无记录
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
