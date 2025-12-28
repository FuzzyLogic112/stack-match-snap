-- Update complete_daily_challenge to track daily streaks
CREATE OR REPLACE FUNCTION public.complete_daily_challenge(p_coin_reward integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_id uuid;
  v_last_date date;
  v_current_streak integer;
BEGIN
  -- Check if already completed today
  SELECT id INTO v_existing_id
  FROM daily_challenges
  WHERE user_id = auth.uid() AND challenge_date = CURRENT_DATE;
  
  IF v_existing_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already completed today');
  END IF;
  
  -- Get current streak info
  SELECT last_daily_date, daily_streak INTO v_last_date, v_current_streak
  FROM profiles WHERE id = auth.uid();
  
  -- Calculate new streak
  IF v_last_date IS NULL THEN
    v_current_streak := 1;
  ELSIF v_last_date = CURRENT_DATE - 1 THEN
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    v_current_streak := 1;
  END IF;
  
  -- Insert daily challenge record
  INSERT INTO daily_challenges (user_id, challenge_date, coins_awarded)
  VALUES (auth.uid(), CURRENT_DATE, p_coin_reward);
  
  -- Award coins and update streak
  UPDATE profiles 
  SET coins = coins + p_coin_reward,
      daily_streak = v_current_streak,
      last_daily_date = CURRENT_DATE
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'streak', v_current_streak);
END;
$function$;

-- Also update the no-argument version
CREATE OR REPLACE FUNCTION public.complete_daily_challenge()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_id uuid;
  v_coin_reward integer;
  v_last_date date;
  v_current_streak integer;
BEGIN
  -- Get daily challenge reward from server-side table
  SELECT coin_reward INTO v_coin_reward
  FROM level_rewards
  WHERE level_num = 0;
  
  IF v_coin_reward IS NULL THEN
    v_coin_reward := 200;
  END IF;
  
  -- Check if already completed today
  SELECT id INTO v_existing_id
  FROM daily_challenges
  WHERE user_id = auth.uid() AND challenge_date = CURRENT_DATE;
  
  IF v_existing_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already completed today');
  END IF;
  
  -- Get current streak info
  SELECT last_daily_date, daily_streak INTO v_last_date, v_current_streak
  FROM profiles WHERE id = auth.uid();
  
  -- Calculate new streak
  IF v_last_date IS NULL THEN
    v_current_streak := 1;
  ELSIF v_last_date = CURRENT_DATE - 1 THEN
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    v_current_streak := 1;
  END IF;
  
  -- Insert daily challenge record
  INSERT INTO daily_challenges (user_id, challenge_date, coins_awarded)
  VALUES (auth.uid(), CURRENT_DATE, v_coin_reward);
  
  -- Award coins and update streak
  UPDATE profiles 
  SET coins = coins + v_coin_reward,
      daily_streak = v_current_streak,
      last_daily_date = CURRENT_DATE
  WHERE id = auth.uid();
  
  RETURN json_build_object('success', true, 'coin_reward', v_coin_reward, 'streak', v_current_streak);
END;
$function$;