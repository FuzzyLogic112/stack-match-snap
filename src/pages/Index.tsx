import { useGameLogic } from '@/hooks/useGameLogic';
import { GameBoard } from '@/components/game/GameBoard';
import { Tray } from '@/components/game/Tray';
import { GameOverlay } from '@/components/game/GameOverlay';
import { GameHeader } from '@/components/game/GameHeader';

const Index = () => {
  const { tiles, tray, gameStatus, score, selectTile, restartGame } = useGameLogic();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <GameHeader score={score} onRestart={restartGame} />
        
        <div className="space-y-6">
          <GameBoard tiles={tiles} onSelectTile={selectTile} />
          <Tray tiles={tray} />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Tap unblocked tiles to move them to the tray. Match 3 to clear!
        </p>
      </div>

      <GameOverlay 
        status={gameStatus} 
        score={score} 
        onRestart={restartGame} 
      />
    </div>
  );
};

export default Index;
