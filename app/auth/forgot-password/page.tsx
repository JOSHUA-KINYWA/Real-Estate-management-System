'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { Building2, Mail, ArrowLeft, Shield, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { toasts, removeToast, success, error: showError } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  // Check email as user types (debounced)
  useEffect(() => {
    if (!email?.includes('@')) {
      setEmailExists(null);
      return;
    }

    const checkEmail = async () => {
      setCheckingEmail(true);
      try {
        // Trim email before sending
        const trimmedEmail = email.trim().toLowerCase();
        
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        });

        if (!response.ok) {
          throw new Error('Failed to check email');
        }

        const data = await response.json();
        setEmailExists(data.exists === true);
      } catch (err) {
        console.error('Error checking email:', err);
        setEmailExists(null);
      } finally {
        setCheckingEmail(false);
      }
    };

    // Debounce email check
    const timer = setTimeout(() => {
      checkEmail();
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Trim and normalize email before sending
      const trimmedEmail = email.trim().toLowerCase();
      
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Failed to send reset email');
        return;
      }

      // Check if email exists (for internal use, not shown to user)
      const exists = data.emailExists === true;
      setEmailExists(exists);

      if (!exists) {
        // Email not registered - show error but don't reveal it
        showError('If an account exists with this email, a password reset link has been sent.');
        // Still show the success UI to prevent email enumeration
        setSent(true);
        setResendCooldown(60); // 60 second cooldown
        setCanResend(false);
        return;
      }

      setSent(true);
      setResendCooldown(60); // 60 second cooldown
      setCanResend(false);
      success('Password reset link sent to your email!');
      
      // In development, log the reset link
      if (data.resetLink) {
        console.log('Reset Link (Development):', data.resetLink);
      }
    } catch (err) {
      console.error('Error:', err);
      showError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendCooldown > 0) return;

    setLoading(true);
    setCanResend(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Failed to resend reset email');
        return;
      }

      setEmailExists(data.emailExists || false);
      setResendCooldown(60); // Reset cooldown to 60 seconds
      success('Reset link resent successfully!');
      
      if (data.resetLink) {
        console.log('Reset Link (Development):', data.resetLink);
      }
    } catch (err) {
      console.error('Error:', err);
      showError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/20 to-primary/10">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1973&q=80"
            alt="Real Estate"
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
              Reset Your Password
            </h2>
            <p className="text-lg text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <div className="space-y-3 mt-8">
            <div className="flex items-center gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
              <Shield className="text-primary" size={20} />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Secure Process</h3>
                <p className="text-xs text-muted-foreground">Your account is protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
              <Mail className="text-primary" size={20} />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Email Verification</h3>
                <p className="text-xs text-muted-foreground">Check your inbox for reset link</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-6">
            <div className="flex items-center gap-3">
              <Building2 size={36} className="text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Real Estate KE</h1>
            </div>
          </div>

          <Card className="border-2 border-border shadow-xl">
            <CardHeader className="space-y-1 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Forgot Password</CardTitle>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={14} className="mr-1" />
                    Back
                  </Button>
                </Link>
              </div>
              <p className="text-muted-foreground text-xs">
                Enter your email to receive a password reset link
              </p>
            </CardHeader>
            <CardContent className="pb-4">
              {sent ? (
                <div className="space-y-4">
                  <div className={`px-4 py-3 rounded-lg ${
                    emailExists
                      ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="flex-shrink-0 mt-0.5" size={20} />
                      <div className="flex-1">
                        <p className="font-medium mb-1">
                          {emailExists ? 'Email Sent!' : 'Request Received'}
                        </p>
                        <p className="text-sm">
                          {emailExists
                            ? `We've sent a password reset link to ${email}`
                            : 'If an account exists with this email, a password reset link has been sent.'}
                        </p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          Please check your inbox and click the link to reset your password.
                        </p>
                        {process.env.NODE_ENV === 'development' && emailExists && (
                          <div className="mt-3 p-2 bg-muted/50 rounded border border-border">
                            <p className="text-xs font-medium mb-1">Development Mode:</p>
                            <p className="text-xs text-muted-foreground break-all">
                              Check the browser console for the reset link
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      <strong className="text-foreground">Didn't receive the email?</strong>
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Check your spam/junk folder</li>
                      <li>Make sure you entered the correct email address</li>
                      <li>Wait a few minutes and try again</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResend}
                      disabled={!canResend || resendCooldown > 0 || loading}
                    >
                      <RefreshCw
                        size={16}
                        className={`mr-2 ${loading ? 'animate-spin' : ''}`}
                      />
                      {resendCooldown > 0
                        ? `Resend in ${formatTime(resendCooldown)}`
                        : 'Resend Email'}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => {
                          setSent(false);
                          setEmail('');
                          setResendCooldown(0);
                          setCanResend(true);
                        }}
                      >
                        Use Different Email
                      </Button>
                      <Link href="/auth/login" className="flex-1">
                        <Button className="w-full">Back to Login</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="text-xs font-medium text-foreground mb-1.5 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={(() => {
                          if (emailExists === false && email.includes('@')) {
                            return 'pl-9 pr-9 text-sm py-2 border-destructive focus:border-destructive';
                          }
                          if (emailExists === true) {
                            return 'pl-9 pr-9 text-sm py-2 border-green-500 focus:border-green-500';
                          }
                          return 'pl-9 pr-9 text-sm py-2';
                        })()}
                        required
                      />
                      {checkingEmail && (
                        <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                      {!checkingEmail && emailExists === true && email.includes('@') && (
                        <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="text-green-500" size={16} />
                        </div>
                      )}
                      {!checkingEmail && emailExists === false && email.includes('@') && (
                        <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                          <Mail className="text-destructive" size={16} />
                        </div>
                      )}
                    </div>
                    {emailExists === false && email.includes('@') && (
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                        <span>This email is not registered in our system</span>
                      </p>
                    )}
                    {emailExists === true && email.includes('@') && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                        <CheckCircle size={12} />
                        <span>Email is registered</span>
                      </p>
                    )}
                    {emailExists === null && email && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Enter the email address associated with your account
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={loading}
                    disabled={!email || emailExists === false || checkingEmail}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-center text-xs text-muted-foreground">
                  Remember your password?{' '}
                  <Link
                    href="/auth/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
