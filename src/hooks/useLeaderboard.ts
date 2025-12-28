import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

export type TimeFilter = 'all' | 'week' | 'month';

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const fetchLeaderboard = useCallback(async (filter: TimeFilter = timeFilter) => {
    setIsLoading(true);
    
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);

    // Apply time filter
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('created_at', weekAgo.toISOString());
    } else if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte('created_at', monthAgo.toISOString());
    }

    const { data, error } = await query;

    if (!error && data) {
      setLeaderboard(data);
    }
    setIsLoading(false);
  }, [timeFilter]);

  useEffect(() => {
    fetchLeaderboard(timeFilter);

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leaderboard'
        },
        () => {
          fetchLeaderboard(timeFilter);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeFilter, fetchLeaderboard]);

  const changeTimeFilter = (filter: TimeFilter) => {
    setTimeFilter(filter);
  };

  const submitScore = async (playerName: string, score: number) => {
    // Client-side validation (defense in depth - database also has constraints)
    if (score < 0 || score > 1000000) {
      return { error: new Error('无效分数') };
    }
    
    const trimmedName = playerName.trim();
    if (!trimmedName || trimmedName.length > 20) {
      return { error: new Error('玩家名称必须在1-20个字符之间') };
    }
    
    // Only allow alphanumeric, spaces, underscores, hyphens, and Chinese characters
    if (!/^[\w\s\u4e00-\u9fa5_-]+$/.test(trimmedName)) {
      return { error: new Error('玩家名称包含无效字符') };
    }
    
    const { error } = await supabase
      .from('leaderboard')
      .insert([{ player_name: trimmedName, score }]);

    if (!error) {
      await fetchLeaderboard(timeFilter);
    }
    return { error };
  };

  return {
    leaderboard,
    isLoading,
    timeFilter,
    changeTimeFilter,
    submitScore,
    refreshLeaderboard: () => fetchLeaderboard(timeFilter)
  };
};
