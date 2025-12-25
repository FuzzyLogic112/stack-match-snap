import { Button } from '@/components/ui/button';
import { RefreshCw, Star, Coins, LogOut } from 'lucide-react';

interface GameHeaderProps {
  score: number;
  coins: number;
  username: string;
  onRestart: () => void;
  onLogout: () => void;
}

export const GameHeader = ({ score, coins, username, onRestart, onLogout }: GameHeaderProps) => {
  return (
    <div className="w-full max-w-md mx-auto mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hi, {username}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Match 3</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
          <Coins className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">{coins}</span>
        </div>
        
        <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
          <Star className="w-5 h-5 text-primary fill-primary" />
          <span className="font-bold text-foreground">{score}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onRestart}
          className="rounded-xl"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
