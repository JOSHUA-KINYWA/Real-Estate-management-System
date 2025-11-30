'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { Building2, Mail, Lock, Eye, EyeOff, Shield, Users, UserCheck, Briefcase, Home, Check } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { toasts, removeToast, success } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '' as 'LANDLORD' | 'AGENT' | 'TENANT' | '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roleWarning, setRoleWarning] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Show success message if redirected from registration or password reset
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      success('Registration successful! Please sign in.');
    }
    if (searchParams.get('passwordReset') === 'true') {
      success('Password reset successful! Please sign in with your new password.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Check if user is already logged in and redirect
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        
        // Redirect based on role
        let redirectPath = '/dashboard';
        if (user.role === 'ADMIN') {
          redirectPath = '/admin/dashboard';
        } else if (user.role === 'LANDLORD') {
          redirectPath = '/landlord/dashboard';
        } else if (user.role === 'AGENT') {
          redirectPath = '/agent/dashboard';
        } else if (user.role === 'TENANT') {
          redirectPath = '/tenant/dashboard';
        }

        // Redirect to dashboard if already logged in
        globalThis.window.location.href = redirectPath;
        return;
      }
      setCheckingAuth(false);
    } catch (err) {
      console.error('Error checking auth:', err);
      setCheckingAuth(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRoleWarning(false);
    
    if (!formData.role) {
      setRoleWarning(true);
      setError('Please select your role first');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Validate selected role matches user's actual role
      if (formData.role) {
        if (data.user.role !== formData.role) {
          setError(`This account is registered as ${data.user.role}. Please select the correct role.`);
          setLoading(false);
          return;
        }
      }

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role - use window.location for reliable navigation
      let redirectPath = '/dashboard';
      if (data.user.role === 'ADMIN') {
        redirectPath = '/admin/dashboard';
      } else if (data.user.role === 'LANDLORD') {
        redirectPath = '/landlord/dashboard';
      } else if (data.user.role === 'AGENT') {
        redirectPath = '/agent/dashboard';
      } else if (data.user.role === 'TENANT') {
        redirectPath = '/tenant/dashboard';
      }

      // Use window.location for more reliable navigation
      globalThis.window.location.href = redirectPath;
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/20 to-primary/10">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1973&q=80"
            alt="Real Estate Management"
            fill
            className="object-cover opacity-30"
            priority
            sizes="50vw"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Building2 size={48} className="text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Real Estate KE</h1>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Welcome Back!
            </h2>
            <p className="text-lg text-muted-foreground">
              Sign in to manage your properties, tenants, and payments all in one place.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-3 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
              <Shield className="text-primary" size={24} />
              <div>
                <h3 className="font-semibold text-foreground">Secure Login</h3>
                <p className="text-sm text-muted-foreground">Bank-level encryption</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
              <Users className="text-primary" size={24} />
              <div>
                <h3 className="font-semibold text-foreground">Multi-User Support</h3>
                <p className="text-sm text-muted-foreground">Landlords, Agents & Tenants</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
              <UserCheck className="text-primary" size={24} />
              <div>
                <h3 className="font-semibold text-foreground">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">Tailored dashboards for each role</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <Building2 size={40} className="text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Real Estate KE</h1>
            </div>
          </div>

          <Card className="border-2 border-border shadow-xl">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <p className="text-center text-muted-foreground text-xs">
                Enter your credentials to access your account
              </p>
            </CardHeader>
            <CardContent className="pb-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive dark:bg-destructive/20 dark:border-destructive/30 px-4 py-3 rounded-lg mb-6">
                  <div className="flex items-center gap-2">
                    <Shield size={16} />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selector with Icons */}
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Landlord Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, role: 'LANDLORD' });
                        setRoleWarning(false);
                        setError('');
                      }}
                      className={`relative p-2.5 rounded-lg border-2 transition-all duration-200 ${
                        formData.role === 'LANDLORD'
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                      } ${roleWarning ? 'border-destructive/50' : ''}`}
                    >
                      {formData.role === 'LANDLORD' && (
                        <div className="absolute -top-1.5 -right-1.5 bg-primary rounded-full p-0.5 shadow-lg">
                          <Check className="text-primary-foreground" size={12} />
                        </div>
                      )}
                      <Building2
                        className={`mx-auto mb-1 ${
                          formData.role === 'LANDLORD' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        size={20}
                      />
                      <p
                        className={`text-xs font-medium ${
                          formData.role === 'LANDLORD' ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        Landlord
                      </p>
                    </button>

                    {/* Agent Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, role: 'AGENT' });
                        setRoleWarning(false);
                        setError('');
                      }}
                      className={`relative p-2.5 rounded-lg border-2 transition-all duration-200 ${
                        formData.role === 'AGENT'
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                      } ${roleWarning ? 'border-destructive/50' : ''}`}
                    >
                      {formData.role === 'AGENT' && (
                        <div className="absolute -top-1.5 -right-1.5 bg-primary rounded-full p-0.5 shadow-lg">
                          <Check className="text-primary-foreground" size={12} />
                        </div>
                      )}
                      <Briefcase
                        className={`mx-auto mb-1 ${
                          formData.role === 'AGENT' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        size={20}
                      />
                      <p
                        className={`text-xs font-medium ${
                          formData.role === 'AGENT' ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        Agent
                      </p>
                    </button>

                    {/* Tenant Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, role: 'TENANT' });
                        setRoleWarning(false);
                        setError('');
                      }}
                      className={`relative p-2.5 rounded-lg border-2 transition-all duration-200 ${
                        formData.role === 'TENANT'
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                      } ${roleWarning ? 'border-destructive/50' : ''}`}
                    >
                      {formData.role === 'TENANT' && (
                        <div className="absolute -top-1.5 -right-1.5 bg-primary rounded-full p-0.5 shadow-lg">
                          <Check className="text-primary-foreground" size={12} />
                        </div>
                      )}
                      <Home
                        className={`mx-auto mb-1 ${
                          formData.role === 'TENANT' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                        size={20}
                      />
                      <p
                        className={`text-xs font-medium ${
                          formData.role === 'TENANT' ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        Tenant
                      </p>
                    </button>
                  </div>
                  {roleWarning && (
                    <p className="text-xs text-destructive mt-1.5 text-center font-medium">
                      Please select your role before entering email
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => {
                        if (!formData.role && e.target.value) {
                          setRoleWarning(true);
                          setError('Please select your role first');
                        } else {
                          setRoleWarning(false);
                          setError('');
                        }
                        setFormData({ ...formData, email: e.target.value });
                      }}
                      onFocus={() => {
                        if (!formData.role) {
                          setRoleWarning(true);
                          setError('Please select your role first');
                        }
                      }}
                      placeholder={(() => {
                        if (formData.role === 'AGENT') return 'agent@example.com';
                        if (formData.role === 'LANDLORD') return 'landlord@example.com';
                        if (formData.role === 'TENANT') return 'tenant@example.com';
                        return 'your@email.com';
                      })()}
                      className={`pl-10 ${roleWarning ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                  {roleWarning && formData.email && (
                    <p className="text-xs text-destructive mt-1">
                      Select your role above before entering email
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="text-sm font-medium text-foreground mb-2 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="remember-me" className="flex items-center cursor-pointer">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="mr-2 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={loading}
                  disabled={!formData.role}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-4 space-y-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Are you a landlord?{' '}
                  <Link
                    href="/auth/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Register here
                  </Link>
                </p>

                <div className="bg-muted/50 p-3 rounded-lg border border-border">
                  <p className="text-xs text-center text-muted-foreground">
                    <strong className="text-foreground">New users:</strong> Landlords can register directly, agents need invitation links.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
