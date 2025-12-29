-- Enable RLS on achievements table (read-only reference data, public readable)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read achievements (public game data)
CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
USING (true);

-- Enable RLS on level_rewards table (read-only reference data, public readable)
ALTER TABLE public.level_rewards ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read level rewards (public game data)
CREATE POLICY "Anyone can view level rewards"
ON public.level_rewards
FOR SELECT
USING (true);