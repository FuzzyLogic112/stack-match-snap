import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Gamepad2, Coins } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('请填写所有字段');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('邮箱或密码错误');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('欢迎回来！');
      navigate('/');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerUsername) {
      toast.error('请填写所有字段');
      return;
    }

    if (registerPassword.length < 6) {
      toast.error('密码至少需要6个字符');
      return;
    }

    if (registerUsername.length < 2) {
      toast.error('用户名至少需要2个字符');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(registerEmail, registerPassword, registerUsername);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('该邮箱已被注册');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('注册成功！获得500金币奖励！');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Gamepad2 className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">消消乐</h1>
        </div>
        <p className="text-muted-foreground">点击、消除、赢金币！</p>
      </div>

      <Card className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="login" className="mt-0">
              <CardTitle className="mb-2">欢迎回来</CardTitle>
              <CardDescription className="mb-4">
                登录以继续游戏
              </CardDescription>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">邮箱</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? '登录中...' : '登录'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <CardTitle className="mb-2">创建账号</CardTitle>
              <CardDescription className="mb-4 flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                免费获得500金币！
              </CardDescription>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">用户名</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="酷玩家"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">邮箱</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">密码</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? '注册中...' : '创建账号'}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
