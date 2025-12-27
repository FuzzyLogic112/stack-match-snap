import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { FriendLeaderboard } from '@/components/friends/FriendLeaderboard';
import { FriendSearch } from '@/components/friends/FriendSearch';
import { FriendRequests } from '@/components/friends/FriendRequests';

const Friends = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const {
    friendLeaderboard,
    pendingRequests,
    searchResults,
    isLoading,
    isSearching,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    refreshLeaderboard
  } = useFriends();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground flex-1">好友</h1>
          <Button variant="ghost" size="icon" onClick={refreshLeaderboard}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <FriendRequests
          requests={pendingRequests}
          onAccept={acceptFriendRequest}
          onReject={rejectFriendRequest}
        />

        <FriendSearch
          searchResults={searchResults}
          isSearching={isSearching}
          onSearch={searchUsers}
          onSendRequest={sendFriendRequest}
        />

        <FriendLeaderboard
          entries={friendLeaderboard}
          isLoading={isLoading}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
};

export default Friends;
