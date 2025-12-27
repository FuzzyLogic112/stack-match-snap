import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);

    if (!error && data) {
      setLeaderboard(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();

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
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      await fetchLeaderboard();
    }
    return { error };
  };

  return {
    leaderboard,
    isLoading,
    submitScore,
    refreshLeaderboard: fetchLeaderboard
  };
};
