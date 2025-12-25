import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LEVELS, generateProceduralLevel } from '@/config/levels';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Unlock, Star, Coins, LogOut, Trophy } from 'lucide-react';

const LevelSelect = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show all predefined levels plus a few procedural ones
  const maxLevel = profile.max_level;
  const allLevels = [
    ...LEVELS,
    ...Array.from({ length: Math.max(0, maxLevel - LEVELS.length + 2) }, (_, i) => 
      generateProceduralLevel(LEVELS.length + 1 + i)
    )
  ].slice(0, Math.max(LEVELS.length, maxLevel + 2));

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Level Select</h1>
            <p className="text-muted-foreground">Hi, {profile.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">{profile.coins}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6 p-4 bg-secondary/30 rounded-xl">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="text-foreground">
            Highest level reached: <strong>Level {maxLevel}</strong>
          </span>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allLevels.map((level) => {
            const isUnlocked = level.id <= maxLevel;
            const isCompleted = level.id < maxLevel;

            return (
              <Card 
                key={level.id}
                className={`transition-all duration-200 ${
                  isUnlocked 
                    ? 'cursor-pointer hover:border-primary hover:shadow-lg' 
                    : 'opacity-50 cursor-not-allowed'
                } ${isCompleted ? 'border-primary/50' : ''}`}
                onClick={() => isUnlocked && navigate(`/play/${level.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {isUnlocked ? (
                        <Unlock className="w-4 h-4 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                      {level.name}
                    </CardTitle>
                    {isCompleted && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                      </div>
                    )}
                  </div>
                  <CardDescription>{level.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {level.layers} layers • {level.tilesPerLayer.reduce((a, b) => a + b, 0)} tiles
                    </span>
                    <div className="flex items-center gap-1 text-primary">
                      <Coins className="w-3 h-3" />
                      <span>+{level.coinReward}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LevelSelect;
