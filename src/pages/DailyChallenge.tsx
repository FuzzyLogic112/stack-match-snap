import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useAuth } from '@/hooks/useAuth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { POWER_UPS } from '@/config/powerups';
import { GameBoard } from '@/components/game/GameBoard';
import { Tray } from '@/components/game/Tray';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Star, Coins, Calendar } from 'lucide-react';

const DailyChallenge = () => {
  const navigate = useNavigate();
  const { user, profile, loading, updateProfile } = useAuth();
  const { playSelect, playMatch, playWin, playLose, playPowerUp, playButton, playError } = useSoundEffects();
  
  const { 
    tiles, tray, gameStatus, score, currentLevel, hintedTiles,
    selectTile, restartGame, shuffleTiles, undoLastMove, removeThreeFromTray, showHint, setOnMatch
  } = useGameLogic(1, true); // isDailyChallenge = true
  
  const [hasAwarded, setHasAwarded] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);

  // Check if already completed today
  useEffect(() => {
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem('daily_challenge_date');
    if (lastPlayed === today) {
      setHasPlayedToday(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setOnMatch(() => playMatch);
  }, [setOnMatch, playMatch]);

  // Handle win condition
  useEffect(() => {
    if (gameStatus === 'won' && profile && !hasAwarded) {
      setHasAwarded(true);
      playWin();
      
      // Mark as completed today
      localStorage.setItem('daily_challenge_date', new Date().toDateString());
      
      const reward = currentLevel.coinReward;
      
      updateProfile({ coins: profile.coins + reward }).then(({ error }) => {
        if (error) {
          toast.error('保存进度失败');
        } else {
          toast.success(`+${reward} 金币！每日挑战完成！`);
        }
      });
    } else if (gameStatus === 'lost') {
      playLose();
    }
  }, [gameStatus, profile, hasAwarded, currentLevel, updateProfile, playWin, playLose]);

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

  const usePowerUp = (powerUpId: string) => {
    playButton();
    
    const inventory = JSON.parse(localStorage.getItem('powerup_inventory') || '{}');
    const count = inventory[powerUpId] || 0;
    
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
      playPowerUp();
      inventory[powerUpId] = count - 1;
      localStorage.setItem('powerup_inventory', JSON.stringify(inventory));
      toast.success(`使用了 ${powerUp?.nameCn || '道具'}！`);
    } else {
      playError();
      toast.error('无法使用该道具');
    }
  };

  const getInventoryCount = (powerUpId: string): number => {
    const inventory = JSON.parse(localStorage.getItem('powerup_inventory') || '{}');
    return inventory[powerUpId] || 0;
  };

  if (loading || !profile) {
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToLevels}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
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
                  onClick={() => usePowerUp(powerUp.id)}
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
        </div>
        
        <div className="space-y-6">
          <GameBoard tiles={tiles} onSelectTile={handleTileSelect} hintedTiles={hintedTiles} />
          <Tray tiles={tray} />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          奖励: +{currentLevel.coinReward} 金币
        </p>
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
                <div className="flex items-center justify-center gap-2 text-primary mb-6">
                  <Coins className="w-5 h-5" />
                  <span className="font-bold">+{currentLevel.coinReward} 金币</span>
                </div>
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
