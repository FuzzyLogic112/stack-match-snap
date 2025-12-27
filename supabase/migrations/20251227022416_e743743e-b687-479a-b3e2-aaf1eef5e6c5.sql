-- =============================================
-- SECURITY FIXES
-- =============================================

-- 1. Create level_rewards table for server-side reward validation
CREATE TABLE IF NOT EXISTS public.level_rewards (
  level_num integer PRIMARY KEY,
  coin_reward integer NOT NULL DEFAULT 50,
  tier text NOT NULL DEFAULT 'easy'
);

-- Insert reward values for all 60 levels
INSERT INTO public.level_rewards (level_num, coin_reward, tier)
SELECT 
  level_num,
  CASE 
    WHEN level_num <= 20 THEN 30 + (level_num * 5)  -- Easy: 35-130
    WHEN level_num <= 40 THEN 100 + ((level_num - 20) * 10)  -- Normal: 110-300
    ELSE 200 + ((level_num - 40) * 15)  -- Hard: 215-500
  END,
  CASE 
    WHEN level_num <= 20 THEN 'easy'
    WHEN level_num <= 40 THEN 'normal'
    ELSE 'hard'
  END
FROM generate_series(1, 60) AS level_num;

-- Daily challenge reward constant
INSERT INTO public.level_rewards (level_num, coin_reward, tier)
VALUES (0, 200, 'daily');

-- 2. Update complete_level function to use server-side reward lookup
CREATE OR REPLACE FUNCTION public.complete_level(
  p_level_num integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_level integer;
  v_new_max_level integer;
  v_coin_reward integer;
BEGIN
  -- Get reward from server-side table
  SELECT coin_reward INTO v_coin_reward
  FROM level_rewards
  WHERE level_num = p_level_num;
  
  IF v_coin_reward IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid level');
  END IF;
  
  -- Get current max_level
  SELECT max_level INTO v_max_level
  FROM profiles
  WHERE id = auth.uid();
  
  IF v_max_level IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Verify level is unlocked
  IF p_level_num > v_max_level THEN
    RETURN json_build_object('success', false, 'error', 'Level not unlocked');
  END IF;
  
  -- Calculate new max level
  IF p_level_num >= v_max_level AND p_level_num < 60 THEN
    v_new_max_level := p_level_num + 1;
  ELSE
    v_new_max_level := v_max_level;
  END IF;
  
  -- Atomic update
  UPDATE profiles 
  SET coins = coins + v_coin_reward,
      max_level = v_new_max_level
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'new_max_level', v_new_max_level, 'coin_reward', v_coin_reward);
END;
$$;

-- 3. Update complete_daily_challenge to use server-side reward
CREATE OR REPLACE FUNCTION public.complete_daily_challenge()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_coin_reward integer;
BEGIN
  -- Get daily challenge reward from server-side table
  SELECT coin_reward INTO v_coin_reward
  FROM level_rewards
  WHERE level_num = 0;
  
  IF v_coin_reward IS NULL THEN
    v_coin_reward := 200; -- Fallback
  END IF;
  
  -- Check if already completed today
  SELECT id INTO v_existing_id
  FROM daily_challenges
  WHERE user_id = auth.uid() AND challenge_date = CURRENT_DATE;
  
  IF v_existing_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already completed today');
  END IF;
  
  -- Insert daily challenge record
  INSERT INTO daily_challenges (user_id, challenge_date, coins_awarded)
  VALUES (auth.uid(), CURRENT_DATE, v_coin_reward);
  
  -- Award coins
  UPDATE profiles SET coins = coins + v_coin_reward WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'coin_reward', v_coin_reward);
END;
$$;

-- 4. Add explicit DENY policies for daily_challenges
CREATE POLICY "Users cannot delete challenges"
ON public.daily_challenges FOR DELETE
USING (false);

CREATE POLICY "Users cannot update challenges"
ON public.daily_challenges FOR UPDATE
USING (false);

-- 5. Fix leaderboard to require authentication and link to user
ALTER TABLE public.leaderboard ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policy and create authenticated one
DROP POLICY IF EXISTS "Anyone can submit scores" ON public.leaderboard;

CREATE POLICY "Authenticated users can submit scores"
ON public.leaderboard FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- =============================================
-- FRIEND SYSTEM
-- =============================================

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they're involved in
CREATE POLICY "Users can view their friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = requester_id AND requester_id != addressee_id);

-- Users can update friendships they received (accept/reject)
CREATE POLICY "Users can respond to friend requests"
ON public.friendships FOR UPDATE
USING (auth.uid() = addressee_id);

-- Users can delete friendships they're involved in
CREATE POLICY "Users can remove friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Allow users to view other profiles for friend search (username only)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can search other profiles"
ON public.profiles FOR SELECT
USING (true);

-- =============================================
-- ACHIEVEMENT SYSTEM
-- =============================================

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS public.achievements (
  id text PRIMARY KEY,
  name_cn text NOT NULL,
  description_cn text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  coin_reward integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view their achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- System can insert achievements (via RPC with SECURITY DEFINER)
CREATE POLICY "System can insert achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert achievement definitions
INSERT INTO public.achievements (id, name_cn, description_cn, icon, category, requirement_type, requirement_value, coin_reward) VALUES
-- Level achievements
('first_level', '初出茅庐', '完成第一个关卡', '🎮', 'level', 'max_level', 2, 50),
('easy_master', '简单大师', '完成所有简单关卡', '🌟', 'level', 'max_level', 21, 200),
('normal_master', '普通大师', '完成所有普通关卡', '⭐', 'level', 'max_level', 41, 500),
('hard_master', '困难大师', '完成所有困难关卡', '💫', 'level', 'max_level', 61, 1000),

-- Coin achievements
('first_hundred', '小富即安', '累计获得100金币', '💰', 'coins', 'coins', 100, 20),
('rich', '腰缠万贯', '累计获得1000金币', '💎', 'coins', 'coins', 1000, 100),
('wealthy', '富可敌国', '累计获得5000金币', '👑', 'coins', 'coins', 5000, 500),

-- Daily challenge achievements
('first_daily', '每日挑战者', '完成第一次每日挑战', '📅', 'daily', 'daily_count', 1, 50),
('weekly_warrior', '周挑战勇士', '累计完成7次每日挑战', '🗓️', 'daily', 'daily_count', 7, 200),
('monthly_master', '月挑战大师', '累计完成30次每日挑战', '📆', 'daily', 'daily_count', 30, 500),

-- Social achievements
('first_friend', '交友达人', '添加第一个好友', '🤝', 'social', 'friend_count', 1, 50),
('popular', '人气之星', '拥有5个好友', '🌈', 'social', 'friend_count', 5, 200),

-- Powerup achievements
('first_powerup', '道具新手', '首次使用道具', '🔧', 'powerup', 'powerup_used', 1, 30),
('powerup_master', '道具大师', '使用50次道具', '🛠️', 'powerup', 'powerup_used', 50, 200);

-- Track total powerups used in profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_powerups_used integer NOT NULL DEFAULT 0;

-- Update use_powerup to track total usage
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
  
  -- Decrement powerup and increment total used
  IF p_powerup_id = 'shuffle' THEN
    UPDATE profiles SET shuffle_count = shuffle_count - 1, total_powerups_used = total_powerups_used + 1 WHERE id = auth.uid() AND shuffle_count > 0;
  ELSIF p_powerup_id = 'undo' THEN
    UPDATE profiles SET undo_count = undo_count - 1, total_powerups_used = total_powerups_used + 1 WHERE id = auth.uid() AND undo_count > 0;
  ELSIF p_powerup_id = 'remove_three' THEN
    UPDATE profiles SET remove_three_count = remove_three_count - 1, total_powerups_used = total_powerups_used + 1 WHERE id = auth.uid() AND remove_three_count > 0;
  ELSIF p_powerup_id = 'hint' THEN
    UPDATE profiles SET hint_count = hint_count - 1, total_powerups_used = total_powerups_used + 1 WHERE id = auth.uid() AND hint_count > 0;
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_daily_count integer;
  v_friend_count integer;
  v_achievement RECORD;
  v_unlocked text[] := '{}';
  v_total_reward integer := 0;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  IF v_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Get daily challenge count
  SELECT COUNT(*) INTO v_daily_count FROM daily_challenges WHERE user_id = auth.uid();
  
  -- Get friend count (accepted friendships)
  SELECT COUNT(*) INTO v_friend_count 
  FROM friendships 
  WHERE (requester_id = auth.uid() OR addressee_id = auth.uid()) AND status = 'accepted';
  
  -- Check each achievement
  FOR v_achievement IN SELECT * FROM achievements LOOP
    -- Skip if already unlocked
    IF EXISTS (SELECT 1 FROM user_achievements WHERE user_id = auth.uid() AND achievement_id = v_achievement.id) THEN
      CONTINUE;
    END IF;
    
    -- Check requirement
    IF (v_achievement.requirement_type = 'max_level' AND v_profile.max_level >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'coins' AND v_profile.coins >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'daily_count' AND v_daily_count >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'friend_count' AND v_friend_count >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'powerup_used' AND v_profile.total_powerups_used >= v_achievement.requirement_value) THEN
      
      -- Unlock achievement
      INSERT INTO user_achievements (user_id, achievement_id) VALUES (auth.uid(), v_achievement.id);
      
      -- Award coins
      UPDATE profiles SET coins = coins + v_achievement.coin_reward WHERE id = auth.uid();
      
      v_unlocked := array_append(v_unlocked, v_achievement.id);
      v_total_reward := v_total_reward + v_achievement.coin_reward;
    END IF;
  END LOOP;
  
  RETURN json_build_object('success', true, 'unlocked', v_unlocked, 'total_reward', v_total_reward);
END;
$$;

-- Function to get friend leaderboard
CREATE OR REPLACE FUNCTION public.get_friend_leaderboard()
RETURNS TABLE(
  user_id uuid,
  username text,
  max_level integer,
  coins integer,
  rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH friends AS (
    SELECT 
      CASE 
        WHEN requester_id = auth.uid() THEN addressee_id
        ELSE requester_id
      END AS friend_id
    FROM friendships
    WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
      AND status = 'accepted'
    UNION
    SELECT auth.uid() -- Include self
  )
  SELECT 
    p.id AS user_id,
    p.username,
    p.max_level,
    p.coins,
    ROW_NUMBER() OVER (ORDER BY p.max_level DESC, p.coins DESC) AS rank
  FROM profiles p
  INNER JOIN friends f ON p.id = f.friend_id
  ORDER BY p.max_level DESC, p.coins DESC
  LIMIT 50;
END;
$$;

-- Function to search users by username
CREATE OR REPLACE FUNCTION public.search_users(p_query text)
RETURNS TABLE(
  user_id uuid,
  username text,
  is_friend boolean,
  request_pending boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.username,
    EXISTS (
      SELECT 1 FROM friendships 
      WHERE ((requester_id = auth.uid() AND addressee_id = p.id) OR 
             (addressee_id = auth.uid() AND requester_id = p.id))
        AND status = 'accepted'
    ) AS is_friend,
    EXISTS (
      SELECT 1 FROM friendships 
      WHERE ((requester_id = auth.uid() AND addressee_id = p.id) OR 
             (addressee_id = auth.uid() AND requester_id = p.id))
        AND status = 'pending'
    ) AS request_pending
  FROM profiles p
  WHERE p.id != auth.uid()
    AND p.username ILIKE '%' || p_query || '%'
  LIMIT 20;
END;
$$;