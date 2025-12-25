import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { GameBoard } from '@/components/game/GameBoard';
import { Tray } from '@/components/game/Tray';
import { GameOverlay } from '@/components/game/GameOverlay';
import { GameHeader } from '@/components/game/GameHeader';
import { Leaderboard } from '@/components/game/Leaderboard';
import { ScoreSubmitDialog } from '@/components/game/ScoreSubmitDialog';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { tiles, tray, gameStatus, score, selectTile, restartGame } = useGameLogic();
  const { leaderboard, isLoading, submitScore } = useLeaderboard();
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [pendingScore, setPendingScore] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleGameEnd = (finalScore: number) => {
    if (finalScore > 0) {
      setPendingScore(finalScore);
      setShowScoreDialog(true);
    }
  };

  const handleRestart = () => {
    if (gameStatus !== 'playing' && score > 0 && !showScoreDialog) {
      handleGameEnd(score);
    } else {
      restartGame();
    }
  };

  const handleScoreSubmit = async (playerName: string) => {
    const { error } = await submitScore(playerName, pendingScore);
    if (error) {
      toast.error('Failed to save score. Please try again.');
    } else {
      toast.success('Score saved to leaderboard!');
    }
    setShowScoreDialog(false);
    restartGame();
  };

  const handleScoreDialogClose = () => {
    setShowScoreDialog(false);
    restartGame();
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-lg">
        <GameHeader 
          score={score} 
          coins={profile.coins}
          username={profile.username}
          onRestart={handleRestart}
          onLogout={handleLogout}
        />
        
        <div className="space-y-6">
          <GameBoard tiles={tiles} onSelectTile={selectTile} />
          <Tray tiles={tray} />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Tap unblocked tiles to move them to the tray. Match 3 to clear!
        </p>

        <Leaderboard entries={leaderboard} isLoading={isLoading} />
      </div>

      <GameOverlay 
        status={gameStatus} 
        score={score} 
        onRestart={() => handleGameEnd(score)} 
      />

      <ScoreSubmitDialog
        isOpen={showScoreDialog}
        score={pendingScore}
        onSubmit={handleScoreSubmit}
        onClose={handleScoreDialogClose}
      />
    </div>
  );
};

export default Index;
