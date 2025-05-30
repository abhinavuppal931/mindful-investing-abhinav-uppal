
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BrainCircuit, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    resetEmail: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Mindful Investing Companion",
        });
        // Redirect will happen automatically via auth state change
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to your account",
        });
        // Redirect will happen automatically via auth state change
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link",
      });
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mindful-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BrainCircuit className="h-8 w-8 text-mindful-600" />
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.resetEmail}
                    onChange={(e) => handleInputChange('resetEmail', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mindful-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BrainCircuit className="h-8 w-8 text-mindful-600" />
          </div>
          <CardTitle className="text-2xl">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Join the mindful investing community' 
              : 'Sign in to your account to continue'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm">Remember me</Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </Button>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Please wait..."
              ) : (
                <span className="flex items-center">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <Button
                type="button"
                variant="link"
                className="ml-1 px-0"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
