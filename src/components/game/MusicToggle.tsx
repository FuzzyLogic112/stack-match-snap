import { Music, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

export const MusicToggle = () => {
  const { isEnabled, toggleMusic } = useBackgroundMusic();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleMusic}
      className="text-muted-foreground hover:text-foreground"
      title={isEnabled ? '关闭背景音乐' : '开启背景音乐'}
    >
    {isEnabled ? (
        <Music className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </Button>
  );
};
