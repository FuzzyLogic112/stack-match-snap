import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FriendLeaderboardEntry {
  user_id: string;
  username: string;
  max_level: number;
  coins: number;
  rank: number;
}

interface SearchResult {
  user_id: string;
  username: string;
  is_friend: boolean;
  request_pending: boolean;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  username: string;
  created_at: string;
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friendLeaderboard, setFriendLeaderboard] = useState<FriendLeaderboardEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const fetchFriendLeaderboard = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_friend_leaderboard');
    
    if (!error && data) {
      setFriendLeaderboard(data);
    }
    setIsLoading(false);
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, created_at')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    if (!error && data) {
      // Fetch usernames for pending requests
      const userIds = data.map(r => r.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const requestsWithNames = data.map(request => ({
        ...request,
        username: profiles?.find(p => p.id === request.requester_id)?.username || '未知用户'
      }));

      setPendingRequests(requestsWithNames);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFriendLeaderboard();
      fetchPendingRequests();
    }
  }, [user, fetchFriendLeaderboard, fetchPendingRequests]);

  const searchUsers = async (query: string) => {
    if (!user || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase.rpc('search_users', { p_query: query.trim() });
    
    if (!error && data) {
      setSearchResults(data);
    }
    setIsSearching(false);
  };

  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) return { error: new Error('未登录') };

    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: addresseeId });

    if (!error) {
      await searchUsers(''); // Clear search
      setSearchResults([]);
    }
    return { error };
  };

  const acceptFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (!error) {
      await fetchPendingRequests();
      await fetchFriendLeaderboard();
    }
    return { error };
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);

    if (!error) {
      await fetchPendingRequests();
    }
    return { error };
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendLeaderboard();
    }
    return { error };
  };

  return {
    friendLeaderboard,
    pendingRequests,
    searchResults,
    isLoading,
    isSearching,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refreshLeaderboard: fetchFriendLeaderboard,
    refreshRequests: fetchPendingRequests
  };
};
