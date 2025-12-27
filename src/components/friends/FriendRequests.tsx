import { useState } from 'react';
import { Check, X, Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface FriendRequest {
  id: string;
  requester_id: string;
  username: string;
  created_at: string;
}

interface FriendRequestsProps {
  requests: FriendRequest[];
  onAccept: (requestId: string) => Promise<{ error: Error | null }>;
  onReject: (requestId: string) => Promise<{ error: Error | null }>;
}

export const FriendRequests = ({ requests, onAccept, onReject }: FriendRequestsProps) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    const { error } = await onAccept(requestId);
    
    if (error) {
      toast.error('接受请求失败');
    } else {
      toast.success('已添加好友！');
    }
    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    const { error } = await onReject(requestId);
    
    if (error) {
      toast.error('拒绝请求失败');
    }
    setProcessingId(null);
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">好友请求</h3>
        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>

      <div className="space-y-2">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
          >
            <div>
              <p className="font-medium text-foreground">{request.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: zhCN })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => handleAccept(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
