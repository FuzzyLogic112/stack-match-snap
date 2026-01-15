-- Add server-side username validation constraints
-- 1. Add length constraint (2-30 characters)
ALTER TABLE public.profiles ADD CONSTRAINT username_length 
  CHECK (char_length(trim(username)) BETWEEN 2 AND 30);

-- 2. Add format constraint (alphanumeric, Chinese characters, underscore, hyphen only)
-- This prevents SQL injection chars, XSS payloads, and Unicode exploits
ALTER TABLE public.profiles ADD CONSTRAINT username_format 
  CHECK (username ~ '^[a-zA-Z0-9\u4e00-\u9fa5_-]+$');

-- 3. Update handle_new_user function to validate and sanitize username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  -- Get username from metadata, default to 'Player' if missing
  v_username := COALESCE(NEW.raw_user_meta_data ->> 'username', 'Player');
  
  -- Trim whitespace
  v_username := trim(v_username);
  
  -- Validate length (2-30 characters)
  IF char_length(v_username) < 2 THEN
    v_username := 'Player';
  ELSIF char_length(v_username) > 30 THEN
    v_username := left(v_username, 30);
  END IF;
  
  -- Validate format (only allow safe characters)
  -- If username contains invalid characters, use default
  IF v_username !~ '^[a-zA-Z0-9\u4e00-\u9fa5_-]+$' THEN
    v_username := 'Player';
  END IF;
  
  INSERT INTO public.profiles (id, username, coins, max_level, shuffle_count, undo_count, remove_three_count, hint_count)
  VALUES (
    NEW.id,
    v_username,
    500,
    1,
    0,
    0,
    0,
    0
  );
  RETURN NEW;
END;
$$;