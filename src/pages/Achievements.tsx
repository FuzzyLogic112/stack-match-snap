import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementList } from '@/components/achievements/AchievementList';
import { AchievementUnlockToast } from '@/components/achievements/AchievementUnlockToast';

const Achievements = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const {
    allAchievements,
    isLoading,
    newlyUnlocked,
    checkAchievements,
    clearNewlyUnlocked,
    getAchievementsByCategory,
    getUnlockedCount,
    getTotalCount,
    refresh
  } = useAchievements();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Check for new achievements when page loads
    if (user) {
      checkAchievements();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const unlockedAchievements = allAchievements.filter(a => 
    newlyUnlocked.includes(a.id)
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground flex-1">成就</h1>
          <Button variant="ghost" size="icon" onClick={refresh}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="bg-card rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <p className="font-bold text-foreground">成就进度</p>
              <p className="text-sm text-muted-foreground">
                已解锁 {getUnlockedCount()} / {getTotalCount()}
              </p>
            </div>
            <p className="text-2xl font-bold text-primary">
              {getTotalCount() > 0 ? Math.round((getUnlockedCount() / getTotalCount()) * 100) : 0}%
            </p>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${getTotalCount() > 0 ? (getUnlockedCount() / getTotalCount()) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievement List */}
      <div className="max-w-lg mx-auto px-4">
        <AchievementList 
          achievements={getAchievementsByCategory()} 
          isLoading={isLoading} 
        />
      </div>

      {/* Unlock Toast */}
      {unlockedAchievements.length > 0 && (
        <AchievementUnlockToast
          achievements={unlockedAchievements}
          onClose={clearNewlyUnlocked}
        />
      )}
    </div>
  );
};

export default Achievements;
