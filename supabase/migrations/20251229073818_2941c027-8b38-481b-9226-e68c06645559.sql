-- Create a global player leaderboard function that returns all registered users
-- This replaces the friend-only leaderboard with a global one

CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE(user_id uuid, username text, max_level integer, coins integer, rank bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.username,
    p.max_level,
    p.coins,
    ROW_NUMBER() OVER (ORDER BY p.max_level DESC, p.coins DESC) AS rank
  FROM profiles p
  ORDER BY p.max_level DESC, p.coins DESC
  LIMIT 100;
END;
$function$;