-- Add powerup inventory columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shuffle_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS undo_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remove_three_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS hint_count integer NOT NULL DEFAULT 0;

-- Create daily_challenges table to track daily challenge completions
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  coins_awarded integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, challenge_date)
);

-- Enable RLS on daily_challenges
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_challenges
CREATE POLICY "Users can view their own daily challenges"
ON public.daily_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily challenges"
ON public.daily_challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add constraints to leaderboard for input validation
ALTER TABLE public.leaderboard
ADD CONSTRAINT score_positive CHECK (score >= 0),
ADD CONSTRAINT score_reasonable CHECK (score <= 1000000),
ADD CONSTRAINT player_name_length CHECK (char_length(player_name) BETWEEN 1 AND 20);

-- Function to purchase a powerup (atomic operation)
CREATE OR REPLACE FUNCTION public.purchase_powerup(
  p_powerup_id text,
  p_price integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_coins integer;
  v_result json;
BEGIN
  -- Get current coins
  SELECT coins INTO v_current_coins
  FROM profiles
  WHERE id = auth.uid();
  
  IF v_current_coins IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  IF v_current_coins < p_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  -- Validate powerup_id
  IF p_powerup_id NOT IN ('shuffle', 'undo', 'remove_three', 'hint') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid powerup');
  END IF;
  
  -- Atomic update: deduct coins and increment powerup
  IF p_powerup_id = 'shuffle' THEN
    UPDATE profiles SET coins = coins - p_price, shuffle_count = shuffle_count + 1 WHERE id = auth.uid();
  ELSIF p_powerup_id = 'undo' THEN
    UPDATE profiles SET coins = coins - p_price, undo_count = undo_count + 1 WHERE id = auth.uid();
  ELSIF p_powerup_id = 'remove_three' THEN
    UPDATE profiles SET coins = coins - p_price, remove_three_count = remove_three_count + 1 WHERE id = auth.uid();
  ELSIF p_powerup_id = 'hint' THEN
    UPDATE profiles SET coins = coins - p_price, hint_count = hint_count + 1 WHERE id = auth.uid();
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Function to use a powerup (atomic decrement)
CREATE OR REPLACE FUNCTION public.use_powerup(
  p_powerup_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Get current count
  IF p_powerup_id = 'shuffle' THEN
    SELECT shuffle_count INTO v_count FROM profiles WHERE id = auth.uid();
  ELSIF p_powerup_id = 'undo' THEN
    SELECT undo_count INTO v_count FROM profiles WHERE id = auth.uid();
  ELSIF p_powerup_id = 'remove_three' THEN
    SELECT remove_three_count INTO v_count FROM profiles WHERE id = auth.uid();
  ELSIF p_powerup_id = 'hint' THEN
    SELECT hint_count INTO v_count FROM profiles WHERE id = auth.uid();
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid powerup');
  END IF;
  
  IF v_count IS NULL OR v_count <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No powerups available');
  END IF;
  
  -- Decrement powerup
  IF p_powerup_id = 'shuffle' THEN
    UPDATE profiles SET shuffle_count = shuffle_count - 1 WHERE id = auth.uid() AND shuffle_count > 0;
  ELSIF p_powerup_id = 'undo' THEN
    UPDATE profiles SET undo_count = undo_count - 1 WHERE id = auth.uid() AND undo_count > 0;
  ELSIF p_powerup_id = 'remove_three' THEN
    UPDATE profiles SET remove_three_count = remove_three_count - 1 WHERE id = auth.uid() AND remove_three_count > 0;
  ELSIF p_powerup_id = 'hint' THEN
    UPDATE profiles SET hint_count = hint_count - 1 WHERE id = auth.uid() AND hint_count > 0;
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Function to complete a level (server-side validation)
CREATE OR REPLACE FUNCTION public.complete_level(
  p_level_num integer,
  p_coin_reward integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_level integer;
  v_new_max_level integer;
BEGIN
  -- Get current max_level
  SELECT max_level INTO v_max_level
  FROM profiles
  WHERE id = auth.uid();
  
  IF v_max_level IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Verify level is unlocked (can only complete unlocked levels)
  IF p_level_num > v_max_level THEN
    RETURN json_build_object('success', false, 'error', 'Level not unlocked');
  END IF;
  
  -- Calculate new max level
  IF p_level_num >= v_max_level AND p_level_num < 60 THEN
    v_new_max_level := p_level_num + 1;
  ELSE
    v_new_max_level := v_max_level;
  END IF;
  
  -- Atomic update: award coins and update max_level
  UPDATE profiles 
  SET coins = coins + p_coin_reward,
      max_level = v_new_max_level
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'new_max_level', v_new_max_level);
END;
$$;

-- Function to complete daily challenge (prevents multiple completions per day)
CREATE OR REPLACE FUNCTION public.complete_daily_challenge(
  p_coin_reward integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
BEGIN
  -- Check if already completed today
  SELECT id INTO v_existing_id
  FROM daily_challenges
  WHERE user_id = auth.uid() AND challenge_date = CURRENT_DATE;
  
  IF v_existing_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already completed today');
  END IF;
  
  -- Insert daily challenge record
  INSERT INTO daily_challenges (user_id, challenge_date, coins_awarded)
  VALUES (auth.uid(), CURRENT_DATE, p_coin_reward);
  
  -- Award coins
  UPDATE profiles SET coins = coins + p_coin_reward WHERE id = auth.uid();
  
  RETURN json_build_object('success', true);
END;
$$;

-- Function to check if daily challenge is completed
CREATE OR REPLACE FUNCTION public.check_daily_challenge_completed()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM daily_challenges
    WHERE user_id = auth.uid() AND challenge_date = CURRENT_DATE
  );
END;
$$;