import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { user, accountStatus, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', fullName: '' });

  useEffect(() => {
    if (user && accountStatus === 'approved') {
      navigate('/dashboard');
    }
  }, [user, accountStatus, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(loginForm.email, loginForm.password);
    
    if (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'Checking account status...'
      });
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);
    
    if (error) {
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setJustSignedUp(true);
      toast({
        title: 'Account created!',
        description: 'Waiting for admin approval.'
      });
      setSignupForm({ email: '', password: '', fullName: '' });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Staff Portal</CardTitle>
          <CardDescription className="text-center">
            Access the digital noticeboard management
          </CardDescription>
        </CardHeader>
        
        {justSignedUp && (
          <div className="px-6 pb-4">
            <Alert className="border-warning bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm">
                Your account is pending approval. You'll be notified once an admin reviews your registration.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {user && accountStatus === 'pending' && (
          <div className="px-6 pb-4">
            <Alert className="border-warning bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
              <AlertDescription className="text-sm">
                Your account is awaiting admin approval.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {user && accountStatus === 'approved' && (
          <div className="px-6 pb-4">
            <Alert className="border-success bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-sm">
                Your account is approved! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {user && accountStatus === 'rejected' && (
          <div className="px-6 pb-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your account registration was rejected. Please contact an administrator.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <Button 
            variant="ghost" 
            className="w-full mt-4" 
            onClick={() => navigate('/')}
          >
            Back to Noticeboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
