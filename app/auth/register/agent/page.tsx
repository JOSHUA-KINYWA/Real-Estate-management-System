'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { Building2, Lock, Mail, User, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AgentRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  // Verify token and fetch invitation data
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (!token) {
          console.error('No token found in URL');
          setValidToken(false);
          showError('Invalid or missing invitation token');
          setVerifying(false);
          return;
        }

        // Verify token and get invitation details
        const emailParamPart = emailParam ? `&email=${encodeURIComponent(emailParam)}` : '';
        const verifyUrl = `/api/auth/verify-invitation?token=${token}${emailParamPart}`;
        
        console.log('Verifying invitation token:', {
          tokenPrefix: token.substring(0, 20) + '...',
          tokenLength: token.length,
          email: emailParam,
          url: verifyUrl,
        });
        
        let response: Response;
        let data: any;
        
        try {
          response = await fetch(verifyUrl);
          
          if (!response.ok) {
            console.error('Verification request failed:', {
              status: response.status,
              statusText: response.statusText,
              url: verifyUrl,
            });
          }
          
          // Try to parse JSON response
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            const text = await response.text();
            console.error('Response text:', text);
            throw new Error('Invalid response from server');
          }
        } catch (fetchError: any) {
          console.error('Fetch error:', {
            message: fetchError.message,
            name: fetchError.name,
            stack: fetchError.stack,
          });
          showError('Failed to connect to server. Please check your internet connection and try again.');
          setValidToken(false);
          setVerifying(false);
          return;
        }
        console.log('Verification API response:', {
          status: response.status,
          ok: response.ok,
          data: data,
        });

        if (response.ok && data.valid === true) {
          setValidToken(true);
          setFormData({
            email: data.invitation?.email || emailParam || '',
            firstName: data.invitation?.firstName || '',
            lastName: data.invitation?.lastName || '',
            phone: data.invitation?.phone || '',
            password: '',
            confirmPassword: '',
          });
        } else {
          const errorMessage = data.error || data.message || 'Invalid or expired invitation token';
          console.error('Token verification failed:', {
            status: response.status,
            responseOk: response.ok,
            dataValid: data.valid,
            error: errorMessage,
            fullData: data,
          });
          showError(errorMessage);
          setValidToken(false);
        }
      } catch (err: any) {
        console.error('Error verifying token:', err);
        showError(err.message || 'Error verifying invitation token');
        setValidToken(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, emailParam]);

  // Password requirements checker
  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[^a-zA-Z\d]/.test(formData.password),
  };

  const isPasswordStrong = Object.values(passwordRequirements).every(req => req === true);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (!isPasswordStrong) {
      showError('Password must meet all requirements');
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      showError('First name and last name are required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Failed to create account');
        return;
      }

      success('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 2000);
    } catch (err) {
      console.error('Error:', err);
      showError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invalid Invitation Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              <p className="text-sm">
                This invitation link is invalid or has expired. Please contact the landlord who invited you.
              </p>
            </div>
            <Link href="/auth/login" className="block">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
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
              Create Your Agent Account
            </h2>
            <p className="text-lg text-muted-foreground">
              Complete your registration to start managing properties.
            </p>
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
              <CardTitle className="text-2xl">Agent Registration</CardTitle>
              <p className="text-muted-foreground text-xs">
                Complete your account setup
              </p>
            </CardHeader>
            <CardContent className="pb-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Email (read-only) */}
                <div>
                  <label htmlFor="email" className="text-xs font-medium text-foreground mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      readOnly
                      className="pl-9 text-sm py-2 bg-muted/50"
                    />
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="text-xs font-medium text-foreground mb-1.5 block">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      className="pl-9 text-sm py-2"
                      required
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="text-xs font-medium text-foreground mb-1.5 block">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      className="pl-9 text-sm py-2"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="text-xs font-medium text-foreground mb-1.5 block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+254712345678"
                      className="pl-9 text-sm py-2"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="text-xs font-medium text-foreground mb-1.5 block">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a strong password"
                      className="pl-9 pr-9 text-sm py-2"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  {formData.password && (
                    <div className="mt-2 bg-muted/50 p-2 rounded-lg">
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {[
                          { key: 'length', label: '8+ chars', met: passwordRequirements.length },
                          { key: 'uppercase', label: 'A-Z', met: passwordRequirements.uppercase },
                          { key: 'lowercase', label: 'a-z', met: passwordRequirements.lowercase },
                          { key: 'number', label: '0-9', met: passwordRequirements.number },
                          { key: 'special', label: '!@#$', met: passwordRequirements.special, colSpan: 'col-span-2' },
                        ].map((req) => (
                          <div key={req.key} className={`flex items-center gap-1.5 ${req.colSpan || ''}`}>
                            {req.met ? (
                              <Check className="text-green-600 dark:text-green-400 flex-shrink-0" size={12} />
                            ) : (
                              <X className="text-muted-foreground flex-shrink-0" size={12} />
                            )}
                            <span
                              className={
                                req.met
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-muted-foreground'
                              }
                            >
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground mb-1.5 block">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className={(() => {
                        if (formData.confirmPassword.length > 0 && !passwordsMatch) {
                          return 'pl-9 pr-9 text-sm py-2 border-destructive focus:border-destructive';
                        }
                        if (passwordsMatch) {
                          return 'pl-9 pr-9 text-sm py-2 border-green-500 focus:border-green-500';
                        }
                        return 'pl-9 pr-9 text-sm py-2';
                      })()}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.confirmPassword.length > 0 && (
                    <div className="mt-1 flex items-center gap-1.5">
                      {passwordsMatch ? (
                        <>
                          <Check className="text-green-600 dark:text-green-400" size={14} />
                          <span className="text-xs text-green-600 dark:text-green-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="text-destructive" size={14} />
                          <span className="text-xs text-destructive">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full mt-4"
                  size="lg"
                  isLoading={loading}
                  disabled={!isPasswordStrong || !passwordsMatch || !formData.firstName || !formData.lastName}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{' '}
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

