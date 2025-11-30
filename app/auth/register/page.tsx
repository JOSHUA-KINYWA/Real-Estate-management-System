'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { Building2, Info, Check, X, Mail, Phone, User, Lock, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

type PasswordStrength = 'weak' | 'medium' | 'strong' | '';

export default function RegisterPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
  });

  // Password strength checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    if (password.length === 0) return '';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  // Password requirements checker
  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[^a-zA-Z\d]/.test(formData.password),
  };

  const passwordStrength = checkPasswordStrength(formData.password);
  const isPasswordStrong = Object.values(passwordRequirements).every(req => req === true);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  // Real-time password mismatch feedback
  useEffect(() => {
    if (formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword) {
      showError('Passwords do not match', 2000);
    }
  }, [formData.password, formData.confirmPassword, showError]);

  // Check email as user types (debounced) - for registration, check if email already exists
  useEffect(() => {
    if (!formData.email?.includes('@')) {
      setEmailExists(null);
      return;
    }

    const checkEmail = async () => {
      setCheckingEmail(true);
      try {
        // Trim email before sending
        const trimmedEmail = formData.email.trim().toLowerCase();
        
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
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      showError('Passwords do not match');
      return;
    }

    if (!isPasswordStrong) {
      const errorMsg = 'Password must meet all requirements';
      setFormError(errorMsg);
      showError(errorMsg);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: 'LANDLORD',
          companyName: formData.companyName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.existingAccount || (data.error && (data.error.includes('already exists') || data.error.includes('User with this email')))) {
          const errorMsg = data.error || 'An account with this email already exists. Please sign in instead.';
          setFormError(errorMsg);
          showError(errorMsg);
          setLoading(false);
          return;
        } else if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details
            .map((d: any) => `${d.field || 'field'}: ${d.message}`)
            .join('\n');
          const errorMsg = `${data.error || 'Validation error'}:\n${errorMessages}`;
          setFormError(errorMsg);
          showError('Please check all fields and try again');
          setLoading(false);
          return;
        } else {
          // Show detailed error message
          let errorMsg = data.error || 'Registration failed';
          if (data.details) {
            errorMsg += `: ${data.details}`;
          }
          if (data.code) {
            console.error('Registration error code:', data.code);
          }
          setFormError(errorMsg);
          showError(errorMsg);
          setLoading(false);
          return;
        }
      }

      // Success
      success('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = 'An error occurred. Please try again.';
      setFormError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
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
            alt="Real Estate Registration"
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
              Join Us Today!
            </h2>
            <p className="text-lg text-muted-foreground">
              Start managing your properties efficiently with our comprehensive platform.
            </p>
          </div>

          <div className="space-y-3 mt-8">
            <div className="flex items-center gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
              <Shield className="text-primary" size={20} />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Secure Registration</h3>
                <p className="text-xs text-muted-foreground">Your data is protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
              <Building2 className="text-primary" size={20} />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Property Management</h3>
                <p className="text-xs text-muted-foreground">Manage all your properties</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-background overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-4">
            <div className="flex items-center gap-3">
              <Building2 size={36} className="text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Real Estate KE</h1>
            </div>
          </div>

          <Card className="border-2 border-border shadow-xl">
            <CardHeader className="space-y-1 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Create Account</CardTitle>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft size={14} className="mr-1" />
                    Login
                  </Button>
                </Link>
              </div>
              <p className="text-muted-foreground text-xs">
                Register as a landlord to get started
              </p>
            </CardHeader>
            <CardContent className="pb-4">
              {/* Compact Info Box */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="text-primary mt-0.5 flex-shrink-0" size={16} />
                  <p className="text-xs text-foreground">
                    <strong>Note:</strong> Only landlords can register directly. Agents and tenants require invitation.
                  </p>
                </div>
              </div>

              {formError && !formError.includes('already exists') && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive dark:bg-destructive/20 dark:border-destructive/30 px-3 py-2 rounded-lg mb-4 text-xs">
                  {formError}
                </div>
              )}

              {formError && formError.includes('already exists') && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive dark:bg-destructive/20 dark:border-destructive/30 px-3 py-2 rounded-lg mb-4">
                  <p className="text-xs mb-2">{formError}</p>
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Go to Sign In
                    </Button>
                  </Link>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="text-xs font-medium text-foreground mb-1.5 block">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="pl-9 text-sm py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="text-xs font-medium text-foreground mb-1.5 block">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="pl-9 text-sm py-2"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
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
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="your@email.com"
                        className={(() => {
                          if (emailExists === false && formData.email.includes('@')) {
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
                      {!checkingEmail && emailExists === true && formData.email.includes('@') && (
                        <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                          <X className="text-destructive" size={16} />
                        </div>
                      )}
                      {!checkingEmail && emailExists === false && formData.email.includes('@') && (
                        <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                          <Check className="text-green-500" size={16} />
                        </div>
                      )}
                    </div>
                    {emailExists === true && formData.email.includes('@') && (
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                        <X size={12} />
                        <span>This email is already registered. Please sign in instead.</span>
                      </p>
                    )}
                    {emailExists === false && formData.email.includes('@') && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                        <Check size={12} />
                        <span>Email is available</span>
                      </p>
                    )}
                  </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="text-xs font-medium text-foreground mb-1.5 block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+254712345678"
                      className="pl-9 text-sm py-2"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: +254712345678, 254712345678, or 0712345678
                  </p>
                </div>

                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="text-xs font-medium text-foreground mb-1.5 block">
                    Company Name <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="Your company name"
                    className="text-sm py-2"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="text-xs font-medium text-foreground mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
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
                  
                  {/* Compact Password Strength */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-medium text-foreground">Strength:</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength === 'weak'
                                ? 'w-1/3 bg-destructive'
                                : passwordStrength === 'medium'
                                ? 'w-2/3 bg-yellow-500'
                                : passwordStrength === 'strong'
                                ? 'w-full bg-green-500'
                                : ''
                            }`}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            passwordStrength === 'weak'
                              ? 'text-destructive'
                              : passwordStrength === 'medium'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : passwordStrength === 'strong'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : passwordStrength === 'strong' ? 'Strong' : ''}
                        </span>
                      </div>

                      {/* Compact Password Requirements */}
                      <div className="bg-muted/50 p-2 rounded-lg">
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
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground mb-1.5 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter password"
                      className={`pl-9 pr-9 text-sm py-2 ${
                        formData.confirmPassword.length > 0 && !passwordsMatch
                          ? 'border-destructive focus:border-destructive'
                          : passwordsMatch
                          ? 'border-green-500 focus:border-green-500'
                          : ''
                      }`}
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
                  disabled={!isPasswordStrong || !passwordsMatch || emailExists === true || checkingEmail}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
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

          <p className="text-center text-xs text-muted-foreground mt-4">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
