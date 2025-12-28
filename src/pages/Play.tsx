import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useAuth } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { POWER_UPS } from '@/config/powerups';
import { getTierForLevel, DIFFICULTY_TIERS } from '@/config/levels';
import { GameBoard } from '@/components/game/GameBoard';
import { Tray } from '@/components/game/Tray';
import { AchievementUnlockToast } from '@/components/achievements/AchievementUnlockToast';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Star, Coins } from 'lucide-react';

const Play = () => {
  const navigate = useNavigate();
  const { levelId } = useParams();
  const levelNumber = parseInt(levelId || '1', 10);
  
  const { user, profile, loading, completeLevel, usePowerup, refreshProfile } = useAuth();
  const { checkAchievements, newlyUnlocked, clearNewlyUnlocked, allAchievements } = useAchievements();
  const { playSelect, playMatch, playWin, playLose, playPowerUp, playButton, playError } = useSoundEffects();
  
  const { 
    tiles, tray, gameStatus, score, currentLevel, hintedTiles,
    selectTile, restartGame, shuffleTiles, undoLastMove, removeThreeFromTray, showHint, setOnMatch
  } = useGameLogic(levelNumber);
  
  const [hasAwarded, setHasAwarded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Check if user has access to this level
  useEffect(() => {
    if (!loading && profile && levelNumber > profile.max_level) {
      toast.error('关卡未解锁！请先完成之前的关卡。');
      navigate('/');
    }
  }, [loading, profile, levelNumber, navigate]);

  useEffect(() => {
    setOnMatch(() => playMatch);
  }, [setOnMatch, playMatch]);

  // Handle win condition - award coins and unlock next level via server-side RPC
  useEffect(() => {
    if (gameStatus === 'won' && profile && !hasAwarded) {
      setHasAwarded(true);
      playWin();
      
      // Use server-side RPC to complete level
      completeLevel(levelNumber, currentLevel.coinReward).then(async ({ success, error }) => {
        if (error || !success) {
          toast.error('保存进度失败');
        } else {
          toast.success(`+${currentLevel.coinReward} 金币！关卡完成！`);
          // Auto-check achievements after level completion
          await checkAchievements();
        }
      });
    } else if (gameStatus === 'lost') {
      playLose();
    }
  }, [gameStatus, profile, hasAwarded, currentLevel, levelNumber, completeLevel, playWin, playLose, checkAchievements]);

  const handleTileSelect = (tileId: string) => {
    playSelect();
    selectTile(tileId);
  };

  const handleRestart = () => {
    playButton();
    setHasAwarded(false);
    restartGame(levelNumber);
  };

  const handleBackToLevels = () => {
    playButton();
    navigate('/');
  };

  const handleNextLevel = () => {
    playButton();
    setHasAwarded(false);
    if (levelNumber < 60) {
      navigate(`/play/${levelNumber + 1}`);
    } else {
      navigate('/');
    }
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

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const tier = getTierForLevel(levelNumber);
  const tierInfo = DIFFICULTY_TIERS.find(t => t.id === tier);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="w-full max-w-md mx-auto mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToLevels}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">{currentLevel.name}</h1>
              <span className="text-xs text-muted-foreground">{tierInfo?.nameCn}</span>
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
                  title={powerUp.nameCn}
                >
                  <span>{powerUp.icon}</span>
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-6">
          <GameBoard tiles={tiles} onSelectTile={handleTileSelect} hintedTiles={hintedTiles} />
          <Tray tiles={tray} />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {currentLevel.description}
        </p>
      </div>

      {/* Game Over Overlay */}
      {gameStatus !== 'playing' && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl">
            {gameStatus === 'won' ? (
              <>
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">关卡完成！</h2>
                <p className="text-muted-foreground mb-2">得分: {score}</p>
                <div className="flex items-center justify-center gap-2 text-primary mb-6">
                  <Coins className="w-5 h-5" />
                  <span className="font-bold">+{currentLevel.coinReward} 金币</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBackToLevels}>
                    返回主页
                  </Button>
                  {levelNumber < 60 && (
                    <Button onClick={handleNextLevel}>
                      下一关
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">😅</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">槽位已满！</h2>
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

      {/* Achievement unlock toasts */}
      <AchievementUnlockToast
        achievements={allAchievements.filter(a => newlyUnlocked.includes(a.id))}
        onClose={clearNewlyUnlocked}
      />
    </div>
  );
};

export default Play;