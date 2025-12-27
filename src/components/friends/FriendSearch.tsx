import { useState } from 'react';
import { Search, UserPlus, Check, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SearchResult {
  user_id: string;
  username: string;
  is_friend: boolean;
  request_pending: boolean;
}

interface FriendSearchProps {
  searchResults: SearchResult[];
  isSearching: boolean;
  onSearch: (query: string) => void;
  onSendRequest: (userId: string) => Promise<{ error: Error | null }>;
}

export const FriendSearch = ({ searchResults, isSearching, onSearch, onSendRequest }: FriendSearchProps) => {
  const [query, setQuery] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);
    const { error } = await onSendRequest(userId);
    
    if (error) {
      toast.error('发送好友请求失败');
    } else {
      toast.success('好友请求已发送！');
    }
    setSendingTo(null);
  };

  return (
    <div className="bg-card rounded-2xl p-4">
      <h3 className="font-bold text-foreground mb-3">搜索好友</h3>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="输入用户名搜索..."
          className="pl-10"
        />
      </div>

      {isSearching && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="mt-3 space-y-2">
          {searchResults.map((result) => (
            <div
              key={result.user_id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
            >
              <span className="font-medium text-foreground">{result.username}</span>
              
              {result.is_friend ? (
                <span className="flex items-center gap-1 text-sm text-success">
                  <Check className="w-4 h-4" />
                  已是好友
                </span>
              ) : result.request_pending ? (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  请求中
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleSendRequest(result.user_id)}
                  disabled={sendingTo === result.user_id}
                >
                  {sendingTo === result.user_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      添加
                    </>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!isSearching && query.length >= 2 && searchResults.length === 0 && (
        <p className="text-center text-muted-foreground py-4">未找到用户</p>
      )}

      {query.length > 0 && query.length < 2 && (
        <p className="text-center text-muted-foreground py-4 text-sm">请输入至少2个字符</p>
      )}
    </div>
  );
};
