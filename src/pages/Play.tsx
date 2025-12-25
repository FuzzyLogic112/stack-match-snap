import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useAuth } from '@/hooks/useAuth';
import { GameBoard } from '@/components/game/GameBoard';
import { Tray } from '@/components/game/Tray';
import { GameOverlay } from '@/components/game/GameOverlay';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Star, Coins } from 'lucide-react';

const Play = () => {
  const navigate = useNavigate();
  const { levelId } = useParams();
  const levelNumber = parseInt(levelId || '1', 10);
  
  const { user, profile, loading, updateProfile } = useAuth();
  const { tiles, tray, gameStatus, score, currentLevel, selectTile, restartGame } = useGameLogic(levelNumber);
  const [hasAwarded, setHasAwarded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Check if user has access to this level
  useEffect(() => {
    if (!loading && profile && levelNumber > profile.max_level) {
      toast.error('Level locked! Complete previous levels first.');
      navigate('/');
    }
  }, [loading, profile, levelNumber, navigate]);

  // Handle win condition - award coins and unlock next level
  useEffect(() => {
    if (gameStatus === 'won' && profile && !hasAwarded) {
      setHasAwarded(true);
      
      const updates: { coins: number; max_level?: number } = {
        coins: profile.coins + currentLevel.coinReward
      };
      
      // Unlock next level if this was the highest
      if (levelNumber >= profile.max_level) {
        updates.max_level = levelNumber + 1;
      }
      
      updateProfile(updates).then(({ error }) => {
        if (error) {
          toast.error('Failed to save progress');
        } else {
          toast.success(`+${currentLevel.coinReward} coins! Level complete!`);
        }
      });
    }
  }, [gameStatus, profile, hasAwarded, currentLevel, levelNumber, updateProfile]);

  const handleRestart = () => {
    setHasAwarded(false);
    restartGame(levelNumber);
  };

  const handleBackToLevels = () => {
    navigate('/');
  };

  const handleNextLevel = () => {
    setHasAwarded(false);
    navigate(`/play/${levelNumber + 1}`);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
              Levels
            </Button>
            <h1 className="text-xl font-bold text-foreground">{currentLevel.name}</h1>
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
        </div>
        
        <div className="space-y-6">
          <GameBoard tiles={tiles} onSelectTile={selectTile} />
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
                <h2 className="text-2xl font-bold text-foreground mb-2">Level Complete!</h2>
                <p className="text-muted-foreground mb-2">Score: {score}</p>
                <div className="flex items-center justify-center gap-2 text-primary mb-6">
                  <Coins className="w-5 h-5" />
                  <span className="font-bold">+{currentLevel.coinReward} coins</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBackToLevels}>
                    Back to Levels
                  </Button>
                  <Button onClick={handleNextLevel}>
                    Next Level
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">😅</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Tray Full!</h2>
                <p className="text-muted-foreground mb-6">Score: {score}</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBackToLevels}>
                    Back to Levels
                  </Button>
                  <Button onClick={handleRestart}>
                    Try Again
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

export default Play;
