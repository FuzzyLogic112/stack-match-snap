import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useAuth } from '@/hooks/useAuth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { POWER_UPS } from '@/config/powerups';
import { GameBoard } from '@/components/game/GameBoard';
import { Tray } from '@/components/game/Tray';
import { ScreenShake, ScreenShakeRef } from '@/components/effects/ScreenShake';
import { ParticleEffect } from '@/components/effects/ParticleEffect';
import { MusicToggle } from '@/components/game/MusicToggle';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Star, Coins, Calendar, Flame, Gift } from 'lucide-react';

const DailyChallenge = () => {
  const navigate = useNavigate();
  const { user, profile, loading, completeDailyChallenge, usePowerup, checkDailyChallengeCompleted } = useAuth();
  const { playSelect, playMatch, playWin, playLose, playPowerUp, playButton, playError } = useSoundEffects();
  
  const { 
    tiles, tray, gameStatus, score, currentLevel, hintedTiles,
    selectTile, restartGame, shuffleTiles, undoLastMove, removeThreeFromTray, showHint, setOnMatch
  } = useGameLogic(1, true); // isDailyChallenge = true
  
  const [hasAwarded, setHasAwarded] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particlePos, setParticlePos] = useState({ x: 0, y: 0 });
  const shakeRef = useRef<ScreenShakeRef>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Calculate streak bonus: base + (streak * 10), max 100 bonus
  const getStreakBonus = (streak: number) => Math.min(streak * 10, 100);

  // Check if already completed today via server-side
  useEffect(() => {
    const checkCompletion = async () => {
      if (user && profile) {
        const completed = await checkDailyChallengeCompleted();
        setHasPlayedToday(completed);
        setCurrentStreak(profile.daily_streak || 0);
      }
      setCheckingCompletion(false);
    };
    checkCompletion();
  }, [user, profile, checkDailyChallengeCompleted]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleMatch = useCallback(() => {
    playMatch();
    shakeRef.current?.shake();
    
    // Trigger particles at board center
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setParticlePos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setParticleTrigger(prev => prev + 1);
    }
  }, [playMatch]);

  useEffect(() => {
    setOnMatch(handleMatch);
  }, [setOnMatch, handleMatch]);

  // Handle win condition
  useEffect(() => {
    if (gameStatus === 'won' && profile && !hasAwarded && !hasPlayedToday) {
      setHasAwarded(true);
      playWin();
      
      const reward = currentLevel.coinReward;
      
      // Use server-side RPC to complete daily challenge
      completeDailyChallenge(reward).then(({ success, error, data }) => {
        if (error || !success) {
          toast.error('保存进度失败');
        } else {
          const newStreak = data?.streak || currentStreak + 1;
          setCurrentStreak(newStreak);
          toast.success(`+${reward} 金币！连续 ${newStreak} 天！`);
          setHasPlayedToday(true);
        }
      });
    } else if (gameStatus === 'lost') {
      playLose();
    }
  }, [gameStatus, profile, hasAwarded, hasPlayedToday, currentLevel, completeDailyChallenge, playWin, playLose, currentStreak]);

  const handleTileSelect = (tileId: string) => {
    playSelect();
    selectTile(tileId);
  };

  const handleRestart = () => {
    playButton();
    setHasAwarded(false);
    restartGame(1, true);
  };

  const handleBackToLevels = () => {
    playButton();
    navigate('/');
  };

  const handleUsePowerUp = async (powerUpId: string) => {
    playButton();
    
    const count = getInventoryCount(powerUpId);
    
    if (count <= 0) {
      playError();
      toast.error('道具不足，请前往商店购买！');
      return;
    }
    
    let success = false;
    const powerUp = POWER_UPS.find(p => p.id === powerUpId);
    
    switch (powerUpId) {
      case 'shuffle':
        success = shuffleTiles();
        break;
      case 'undo':
        success = undoLastMove();
        break;
      case 'remove_three':
        success = removeThreeFromTray();
        break;
      case 'hint':
        success = showHint();
        break;
    }
    
    if (success) {
      // Use server-side RPC to decrement powerup
      const { success: rpcSuccess, error } = await usePowerup(powerUpId);
      
      if (rpcSuccess) {
        playPowerUp();
        toast.success(`使用了 ${powerUp?.nameCn || '道具'}！`);
      } else {
        playError();
        toast.error('道具使用失败');
      }
    } else {
      playError();
      toast.error('无法使用该道具');
    }
  };

  const getInventoryCount = (powerUpId: string): number => {
    if (!profile) return 0;
    switch (powerUpId) {
      case 'shuffle': return profile.shuffle_count;
      case 'undo': return profile.undo_count;
      case 'remove_three': return profile.remove_three_count;
      case 'hint': return profile.hint_count;
      default: return 0;
    }
  };

  if (loading || !profile || checkingCompletion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="w-full max-w-md mx-auto mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToLevels}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
              <MusicToggle />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <h1 className="text-xl font-bold text-foreground">每日挑战</h1>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRestart}
              className="rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">{profile.coins}</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {dateStr}
            </div>
            
            <div className="flex items-center gap-2 bg-orange-500/20 rounded-xl px-4 py-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-foreground">{currentStreak}天</span>
            </div>
            
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <span className="font-bold text-foreground">{score}</span>
            </div>
          </div>

          {/* Power-ups bar */}
          <div className="flex items-center justify-center gap-2">
            {POWER_UPS.map((powerUp) => {
              const count = getInventoryCount(powerUp.id);
              return (
                <Button
                  key={powerUp.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleUsePowerUp(powerUp.id)}
                  disabled={count <= 0 || gameStatus !== 'playing'}
                  className="relative gap-1 text-xs"
                >
                  <span>{powerUp.icon}</span>
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Streak Bonus Info */}
          {currentStreak > 0 && (
            <div className="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-orange-500/20 to-primary/20 rounded-xl">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">
                连续签到奖励: +{getStreakBonus(currentStreak)} 金币
              </span>
            </div>
          )}

          {hasPlayedToday && (
            <div className="text-center p-2 bg-primary/10 rounded-xl">
              <span className="text-sm text-primary font-medium">✅ 今日挑战已完成</span>
            </div>
          )}
        </div>
        
        <ScreenShake ref={shakeRef}>
          <div className="space-y-6" ref={boardRef}>
            <GameBoard tiles={tiles} onSelectTile={handleTileSelect} hintedTiles={hintedTiles} />
            <Tray tiles={tray} />
          </div>
        </ScreenShake>

        <p className="text-center text-sm text-muted-foreground mt-4">
          奖励: +{currentLevel.coinReward} 金币 {currentStreak > 0 && `+ ${getStreakBonus(currentStreak)} 连签奖励`}
        </p>
        
        <ParticleEffect trigger={particleTrigger} x={particlePos.x} y={particlePos.y} />
      </div>

      {/* Game Over Overlay */}
      {gameStatus !== 'playing' && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl">
            {gameStatus === 'won' ? (
              <>
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">每日挑战完成！</h2>
                <p className="text-muted-foreground mb-2">得分: {score}</p>
                {!hasPlayedToday && (
                  <div className="flex items-center justify-center gap-2 text-primary mb-6">
                    <Coins className="w-5 h-5" />
                    <span className="font-bold">+{currentLevel.coinReward} 金币</span>
                  </div>
                )}
                <Button onClick={handleBackToLevels} className="w-full">
                  返回主页
                </Button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">😅</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">挑战失败</h2>
                <p className="text-muted-foreground mb-6">得分: {score}</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBackToLevels}>
                    返回主页
                  </Button>
                  <Button onClick={handleRestart}>
                    再试一次
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyChallenge;