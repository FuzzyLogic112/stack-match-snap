import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ScoreSubmitDialogProps {
  isOpen: boolean;
  score: number;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

export const ScoreSubmitDialog = ({ isOpen, score, onSubmit, onClose }: ScoreSubmitDialogProps) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    await onSubmit(playerName.trim());
    setIsSubmitting(false);
    setPlayerName('');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Save Your Score!</h3>
              <p className="text-2xl font-bold text-primary">{score} pts</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              className="rounded-xl h-12 text-base"
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2 rounded-xl"
                disabled={isSubmitting}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Submit'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
