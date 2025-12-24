import { Button } from '@/components/ui/button';
import { RefreshCw, Star } from 'lucide-react';

interface GameHeaderProps {
  score: number;
  onRestart: () => void;
}

export const GameHeader = ({ score, onRestart }: GameHeaderProps) => {
  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto mb-4">
      <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
        <Star className="w-5 h-5 text-primary fill-primary" />
        <span className="font-bold text-foreground">{score}</span>
      </div>

      <h1 className="text-2xl font-bold text-foreground">
        Match 3
      </h1>

      <Button
        variant="outline"
        size="icon"
        onClick={onRestart}
        className="rounded-xl"
      >
        <RefreshCw className="w-5 h-5" />
      </Button>
    </div>
  );
};
