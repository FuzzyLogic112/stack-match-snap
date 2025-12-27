import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Achievement {
  id: string;
  name_cn: string;
  description_cn: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  coin_reward: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export const useAchievements = () => {
  const { user, refreshProfile } = useAuth();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  const fetchAchievements = useCallback(async () => {
    setIsLoading(true);
    
    // Fetch all achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true });

    if (achievements) {
      setAllAchievements(achievements);
    }

    // Fetch user's unlocked achievements
    if (user) {
      const { data: unlocked } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      if (unlocked) {
        setUserAchievements(unlocked);
      }
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const checkAchievements = async () => {
    if (!user) return { success: false, unlocked: [], totalReward: 0 };

    const { data, error } = await supabase.rpc('check_achievements');

    if (error) {
      return { success: false, unlocked: [], totalReward: 0 };
    }

    const result = data as { success: boolean; unlocked: string[]; total_reward: number };

    if (result.success && result.unlocked.length > 0) {
      setNewlyUnlocked(result.unlocked);
      await fetchAchievements();
      await refreshProfile();
    }

    return {
      success: result.success,
      unlocked: result.unlocked,
      totalReward: result.total_reward
    };
  };

  const clearNewlyUnlocked = () => {
    setNewlyUnlocked([]);
  };

  const getAchievementsByCategory = () => {
    const categories: Record<string, (Achievement & { unlocked: boolean; unlocked_at?: string })[]> = {};

    allAchievements.forEach(achievement => {
      if (!categories[achievement.category]) {
        categories[achievement.category] = [];
      }

      const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);

      categories[achievement.category].push({
        ...achievement,
        unlocked: !!userAchievement,
        unlocked_at: userAchievement?.unlocked_at
      });
    });

    return categories;
  };

  const getUnlockedCount = () => userAchievements.length;
  const getTotalCount = () => allAchievements.length;

  return {
    allAchievements,
    userAchievements,
    isLoading,
    newlyUnlocked,
    checkAchievements,
    clearNewlyUnlocked,
    getAchievementsByCategory,
    getUnlockedCount,
    getTotalCount,
    refresh: fetchAchievements
  };
};
