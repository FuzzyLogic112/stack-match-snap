-- Fix PUBLIC_DATA_EXPOSURE: Remove overly permissive policy that exposes all profile data
-- The existing RPCs (search_users, get_friend_leaderboard) use SECURITY DEFINER
-- and will continue to work after this policy is removed

DROP POLICY IF EXISTS "Users can search other profiles" ON public.profiles;