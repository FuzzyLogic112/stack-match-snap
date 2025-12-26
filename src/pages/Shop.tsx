import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { POWER_UPS } from '@/config/powerups';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Coins, ShoppingBag } from 'lucide-react';

const Shop = () => {
  const navigate = useNavigate();
  const { user, profile, loading, updateProfile, refreshProfile } = useAuth();
  const { playButton, playPowerUp, playError } = useSoundEffects();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handlePurchase = async (powerUpId: string, price: number, nameCn: string) => {
    playButton();
    
    if (!profile) return;
    
    if (profile.coins < price) {
      playError();
      toast.error('金币不足！');
      return;
    }
    
    // Get current inventory from localStorage
    const inventory = JSON.parse(localStorage.getItem('powerup_inventory') || '{}');
    inventory[powerUpId] = (inventory[powerUpId] || 0) + 1;
    localStorage.setItem('powerup_inventory', JSON.stringify(inventory));
    
    // Deduct coins
    const { error } = await updateProfile({ coins: profile.coins - price });
    
    if (error) {
      playError();
      toast.error('购买失败，请重试');
      // Rollback inventory
      inventory[powerUpId] = (inventory[powerUpId] || 1) - 1;
      localStorage.setItem('powerup_inventory', JSON.stringify(inventory));
    } else {
      playPowerUp();
      toast.success(`成功购买 ${nameCn}！`);
      refreshProfile();
    }
  };

  const getInventoryCount = (powerUpId: string): number => {
    const inventory = JSON.parse(localStorage.getItem('powerup_inventory') || '{}');
    return inventory[powerUpId] || 0;
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              playButton();
              navigate('/');
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">道具商店</h1>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
            <Coins className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">{profile.coins}</span>
          </div>
        </div>

        {/* Power-ups Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {POWER_UPS.map((powerUp) => {
            const count = getInventoryCount(powerUp.id);
            const canAfford = profile.coins >= powerUp.price;
            
            return (
              <Card 
                key={powerUp.id}
                className="transition-all duration-200 hover:border-primary hover:shadow-lg"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{powerUp.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{powerUp.nameCn}</CardTitle>
                        <CardDescription>{powerUp.descriptionCn}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      已拥有: <span className="font-bold text-foreground">{count}</span>
                    </div>
                    <Button
                      onClick={() => handlePurchase(powerUp.id, powerUp.price, powerUp.nameCn)}
                      disabled={!canAfford}
                      className="gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      {powerUp.price}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-secondary/30 rounded-xl text-center">
          <p className="text-sm text-muted-foreground">
            💡 提示：通关可获得金币奖励，每日挑战奖励更丰厚！
          </p>
        </div>
      </div>
    </div>
  );
};

export default Shop;
