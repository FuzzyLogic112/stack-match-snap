import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { DIFFICULTY_TIERS, getLevelsForTier, DifficultyTier } from '@/config/levels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Unlock, Star, Coins, LogOut, Trophy, ShoppingBag, Calendar, Volume2, VolumeX, Users, Award } from 'lucide-react';

const LevelSelect = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { playButton, toggleSound, isSoundEnabled } = useSoundEffects();
  const [soundOn, setSoundOn] = useState(true);
  const [activeTier, setActiveTier] = useState<DifficultyTier>('easy');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    playButton();
    await signOut();
    navigate('/auth');
  };

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  // Check if daily challenge completed today
  const isDailyChallengeCompleted = () => {
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem('daily_challenge_date');
    return lastPlayed === today;
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const maxLevel = profile.max_level;

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">消消乐</h1>
            <p className="text-muted-foreground">你好, {profile.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSound}
              className="text-muted-foreground hover:text-foreground"
            >
              {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">{profile.coins}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:border-accent hover:shadow-lg ${
              isDailyChallengeCompleted() ? 'opacity-60' : ''
            }`}
            onClick={() => {
              playButton();
              navigate('/daily');
            }}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <Calendar className="w-8 h-8 text-accent" />
              <div>
                <p className="font-bold text-foreground">每日挑战</p>
                <p className="text-xs text-muted-foreground">
                  {isDailyChallengeCompleted() ? '今日已完成' : '+300 金币'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg"
            onClick={() => {
              playButton();
              navigate('/shop');
            }}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <ShoppingBag className="w-8 h-8 text-primary" />
              <div>
                <p className="font-bold text-foreground">道具商店</p>
                <p className="text-xs text-muted-foreground">购买强化道具</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg"
            onClick={() => {
              playButton();
              navigate('/friends');
            }}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="font-bold text-foreground">好友</p>
                <p className="text-xs text-muted-foreground">好友排行榜</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg"
            onClick={() => {
              playButton();
              navigate('/achievements');
            }}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <Award className="w-8 h-8 text-primary" />
              <div>
                <p className="font-bold text-foreground">成就</p>
                <p className="text-xs text-muted-foreground">解锁成就奖励</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6 p-4 bg-secondary/30 rounded-xl">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="text-foreground">
            最高关卡: <strong>第 {maxLevel} 关</strong>
          </span>
        </div>

        {/* Difficulty Tabs */}
        <Tabs value={activeTier} onValueChange={(v) => {
          playButton();
          setActiveTier(v as DifficultyTier);
        }}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {DIFFICULTY_TIERS.map((tier) => (
              <TabsTrigger 
                key={tier.id} 
                value={tier.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tier.nameCn}
              </TabsTrigger>
            ))}
          </TabsList>

          {DIFFICULTY_TIERS.map((tier) => {
            const levels = getLevelsForTier(tier.id);
            
            return (
              <TabsContent key={tier.id} value={tier.id}>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {levels.map((level) => {
                    const isUnlocked = level.id <= maxLevel;
                    const isCompleted = level.id < maxLevel;

                    return (
                      <Button
                        key={level.id}
                        variant={isCompleted ? "default" : isUnlocked ? "outline" : "ghost"}
                        className={`h-14 relative ${
                          isUnlocked 
                            ? 'hover:border-primary hover:shadow-md' 
                            : 'opacity-50 cursor-not-allowed'
                        } ${isCompleted ? 'bg-primary/80' : ''}`}
                        onClick={() => {
                          if (isUnlocked) {
                            playButton();
                            navigate(`/play/${level.id}`);
                          }
                        }}
                        disabled={!isUnlocked}
                      >
                        <div className="flex flex-col items-center">
                          {isUnlocked ? (
                            <>
                              <span className="text-lg font-bold">{level.tierLevel}</span>
                              {isCompleted && (
                                <Star className="w-3 h-3 absolute top-1 right-1 fill-current" />
                              )}
                            </>
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-secondary/20 rounded-xl text-center text-sm text-muted-foreground">
                  {tier.id === 'easy' && '适合新手，循序渐进学习游戏'}
                  {tier.id === 'normal' && '中等难度，需要一定策略'}
                  {tier.id === 'hard' && '羊了个羊级别难度，极具挑战性'}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default LevelSelect;
