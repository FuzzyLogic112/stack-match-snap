-- Create RPC to fetch pending friend requests with usernames (bypasses RLS securely)
CREATE OR REPLACE FUNCTION public.get_pending_friend_requests()
RETURNS TABLE(id uuid, requester_id uuid, requester_username text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.requester_id, p.username, f.created_at
  FROM friendships f
  JOIN profiles p ON p.id = f.requester_id
  WHERE f.addressee_id = auth.uid() AND f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$;

-- Update search_users to escape ILIKE wildcards and prevent username enumeration
CREATE OR REPLACE FUNCTION public.search_users(p_query text)
RETURNS TABLE(user_id uuid, username text, is_friend boolean, request_pending boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_escaped_query text;
BEGIN
  -- Require minimum 2 characters for search
  IF length(p_query) < 2 THEN
    RETURN;
  END IF;
  
  -- Escape ILIKE wildcards to prevent username enumeration attacks
  v_escaped_query := replace(replace(p_query, '%', '\%'), '_', '\_');
  
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
    AND p.username ILIKE '%' || v_escaped_query || '%'
  LIMIT 20;
END;
$$;