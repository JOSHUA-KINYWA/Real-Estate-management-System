'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, Users, DollarSign, Settings, LogOut, Home, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { cn, formatSuspensionReason } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const menuItems = [
  { label: 'Dashboard', icon: Home, href: '/agent/dashboard' },
  { label: 'Properties', icon: Building2, href: '/agent/properties' },
  { label: 'Tenants', icon: Users, href: '/agent/tenants' },
  { label: 'Commission', icon: DollarSign, href: '/agent/commission' },
  { label: 'Settings', icon: Settings, href: '/agent/settings' },
];

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<'PENDING_APPROVAL' | 'APPROVED' | 'CHECKING'>('CHECKING');
  const [suspensionInfo, setSuspensionInfo] = useState<any>(null);

  const checkApprovalStatus = async (userId: string) => {
    try {
      // Get agent record
      const response = await fetch('/api/agent/status', {
        headers: { 'x-user-id': userId },
        cache: 'no-store',
      });

      const data = await response.json();
      if (response.ok) {
        // If suspended, consider them approved for dashboard access purposes
        const newStatus = (data.approved || data.suspended) ? 'APPROVED' : 'PENDING_APPROVAL';
        setApprovalStatus((previousStatus) => {
          // If just approved, refresh the page to show full dashboard
          if (newStatus === 'APPROVED' && previousStatus === 'PENDING_APPROVAL') {
            setTimeout(() => {
              globalThis.window.location.reload();
            }, 1500);
          }
          return newStatus;
        });
      } else {
        setApprovalStatus('PENDING_APPROVAL');
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setApprovalStatus('PENDING_APPROVAL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'AGENT') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    checkApprovalStatus(parsedUser.id);
    checkSuspensionStatus(parsedUser.id);

    // Check approval status every 30 seconds if pending
    const interval = setInterval(() => {
      checkApprovalStatus(parsedUser.id);
      checkSuspensionStatus(parsedUser.id);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const checkSuspensionStatus = async (userId: string) => {
    try {
      const response = await fetch('/api/agent/suspension', {
        headers: { 'x-user-id': userId },
        cache: 'no-store',
      });

      const data = await response.json();
      if (response.ok && data.suspended) {
        setSuspensionInfo(data);
      } else {
        setSuspensionInfo(null);
      }
    } catch (error) {
      console.error('Error checking suspension status:', error);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show suspension banner if suspended (but allow navigation)
  const isSuspended = suspensionInfo?.suspended;

  // Show approval pending message if not approved (but allow suspended agents to see dashboard)
  // Suspended agents can access dashboard even if approvalStatus is PENDING_APPROVAL
  if (approvalStatus === 'PENDING_APPROVAL' && !isSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                  <Clock className="text-yellow-600 dark:text-yellow-400" size={48} />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Account Pending Approval
                </h1>
                <p className="text-muted-foreground">
                  Your account has been created successfully, but it's waiting for landlord approval.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={20} />
                  <div className="text-left">
                    <p className="font-medium text-foreground mb-2">What happens next?</p>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                      <li>The landlord who invited you will review your account</li>
                      <li>Once approved, you'll be able to access all features</li>
                      <li>You'll receive a notification when your account is approved</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={async () => {
                    setLoading(true);
                    await checkApprovalStatus(user.id);
                    setLoading(false);
                  }}
                  variant="outline"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Checking...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border text-card-foreground flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Building2 className="text-primary" size={24} />
            <h1 className="text-xl font-bold">Real Estate KE</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Agent Portal</p>
        </div>

        {/* Approval Status Banner */}
        {approvalStatus === 'APPROVED' && !isSuspended && (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border-b border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 size={16} />
              <span className="text-xs font-medium">Account Approved</span>
            </div>
          </div>
        )}

        {/* Suspension Status Banner */}
        {isSuspended && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <XCircle size={18} />
                <span className="text-sm font-semibold">Account Suspended</span>
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 space-y-1 pl-6">
                <p><strong>Reason (from Landlord):</strong> {formatSuspensionReason(suspensionInfo.reason || 'Account suspended')}</p>
                {suspensionInfo.suspensionDays && (
                  <p><strong>Duration:</strong> {suspensionInfo.suspensionDays} day(s)</p>
                )}
                {suspensionInfo.suspensionEndDate && (
                  <p><strong>Ends:</strong> {new Date(suspensionInfo.suspensionEndDate).toLocaleDateString('en-KE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</p>
                )}
                {suspensionInfo.notes && (
                  <p><strong>Notes:</strong> {suspensionInfo.notes}</p>
                )}
              </div>
              <div className="pt-2 border-t border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 italic">
                  All actions are disabled. Dashboard view only.
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isDisabled = isSuspended && item.href !== '/agent/dashboard';
            return (
              <div key={item.href} className="relative">
                {isDisabled ? (
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-not-allowed opacity-50',
                      'text-muted-foreground bg-muted/30'
                    )}
                    title="Account suspended - This feature is unavailable. Please contact your landlord."
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                    <XCircle size={14} className="ml-auto text-red-500" />
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

