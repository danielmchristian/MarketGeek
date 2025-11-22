import React, { useState } from 'react';
import { Shield, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { firebaseAuth } from '../utils/firebase/auth';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AuthComponentProps {
  onSuccess?: () => void;
}

export function AuthComponent({ onSuccess }: AuthComponentProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    name: '',
    organization: ''
  });
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ Loading timeout - resetting state');
      setIsLoading(false);
      setError('Request timed out. Please try again.');
    }, 10000); // 10 second timeout

    try {
      console.log('🚀 Starting Firebase signup...');
      
      // Use Firebase directly
      const signUpResult = await firebaseAuth.signUp(
        signUpData.email, 
        signUpData.password, 
        { name: signUpData.name, organization: signUpData.organization }
      );

      console.log('📥 Firebase signup result:', signUpResult);

      if (signUpResult.error) {
        console.log('❌ Firebase signup error:', signUpResult.error.message);
        // Handle specific Firebase errors
        const errorMessage = signUpResult.error.message;
        if (errorMessage.includes('email-already-in-use')) {
          setError('Account already exists. Please sign in instead.');
        } else if (errorMessage.includes('weak-password')) {
          setError('Password is too weak. Please use at least 6 characters.');
        } else if (errorMessage.includes('invalid-email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(errorMessage);
        }
        return;
      }

      console.log('✅ Firebase signup successful - calling onSuccess');
      onSuccess?.();
    } catch (err: any) {
      console.error('💥 Sign up error:', err);
      setError(err.message || 'Sign up failed');
    } finally {
      clearTimeout(loadingTimeout);
      console.log('🏁 Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use Firebase directly
      const signInResult = await firebaseAuth.signInWithPassword(
        signInData.email,
        signInData.password
      );

      if (signInResult.error) {
        // Handle specific Firebase errors
        const errorMessage = signInResult.error.message;
        if (errorMessage.includes('user-not-found')) {
          setError('No account found with this email. Please sign up first.');
        } else if (errorMessage.includes('wrong-password')) {
          setError('Incorrect password. Please try again.');
        } else if (errorMessage.includes('invalid-email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(errorMessage);
        }
        return;
      }

      console.log('✅ Firebase signin successful');
      onSuccess?.();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1639305239869-8ef28a21b313?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibG9ja2NoYWluJTIwY3J5cHRvY3VycmVuY3klMjB0cmFkaW5nfGVufDF8fHx8MTc1NzM2ODgzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
        alt="Blockchain background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-slate-900/90" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="h-12 w-12 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">WashGuard Pro</h1>
              <p className="text-blue-200">Digital Asset Compliance Platform</p>
            </div>
          </div>
          <p className="text-slate-300">
            Advanced wash sales detection for digital assets and cryptocurrency trading
          </p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-slate-900">Access Platform</CardTitle>
            <CardDescription>
              Sign in or create an account to access the compliance dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="analyst@company.com"
                        className="pl-10"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signInData.password}
                        onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-name"
                        placeholder="John Doe"
                        className="pl-10"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="analyst@company.com"
                        className="pl-10"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-organization">Organization</Label>
                    <Input
                      id="signup-organization"
                      placeholder="Compliance Firm LLC"
                      value={signUpData.organization}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, organization: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-slate-600">
              <p>Demo credentials available for testing</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}