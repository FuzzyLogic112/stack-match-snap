-- Create leaderboard table for storing high scores
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the leaderboard (public scores)
CREATE POLICY "Anyone can view leaderboard" 
ON public.leaderboard 
FOR SELECT 
USING (true);

-- Allow anyone to insert scores (anonymous game)
CREATE POLICY "Anyone can submit scores" 
ON public.leaderboard 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster score queries
CREATE INDEX idx_leaderboard_score ON public.leaderboard (score DESC);

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;