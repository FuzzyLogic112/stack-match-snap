import { motion, AnimatePresence } from 'framer-motion';
import { GameStatus } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, Frown } from 'lucide-react';

interface GameOverlayProps {
  status: GameStatus;
  score: number;
  onRestart: () => void;
}

export const GameOverlay = ({ status, score, onRestart }: GameOverlayProps) => {
  if (status === 'playing') return null;

  const isWon = status === 'won';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-card rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isWon ? 'bg-success/20' : 'bg-destructive/20'
            }`}
          >
            {isWon ? (
              <Trophy className="w-10 h-10 text-success" />
            ) : (
              <Frown className="w-10 h-10 text-destructive" />
            )}
          </motion.div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isWon ? 'Congratulations!' : 'Game Over'}
          </h2>
          
          <p className="text-muted-foreground mb-4">
            {isWon 
              ? 'You cleared all the tiles!' 
              : 'The tray is full. Better luck next time!'}
          </p>

          <div className="bg-secondary rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">Final Score</p>
            <p className="text-3xl font-bold text-primary">{score}</p>
          </div>

          <Button 
            onClick={onRestart}
            size="lg"
            className="w-full gap-2 rounded-xl"
          >
            <RefreshCw className="w-5 h-5" />
            Play Again
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
