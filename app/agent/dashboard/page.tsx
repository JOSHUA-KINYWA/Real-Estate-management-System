'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, DollarSign, AlertCircle, XCircle, Phone, Mail, Briefcase } from 'lucide-react';
import { formatCurrency, formatSuspensionReason } from '@/lib/utils';

export default function AgentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [suspensionInfo, setSuspensionInfo] = useState<any>(null);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalRent: 0,
    totalMonthlyCommission: 0,
    totalAnnualCommission: 0,
    commissionRate: 0,
  });
  const [landlords, setLandlords] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

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
    Promise.all([
      checkApprovalStatus(parsedUser.id),
      checkSuspensionStatus(parsedUser.id),
      fetchProperties(parsedUser.id),
      fetchLandlords(parsedUser.id),
    ]).finally(() => {
      setLoading(false);
    });
  }, [router]);

  const checkApprovalStatus = async (userId: string) => {
    try {
      const response = await fetch('/api/agent/status', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      if (response.ok && !data.approved) {
        // If not approved, redirect will be handled by layout
        router.push('/agent/dashboard');
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    } finally {
      setLoading(false);
    }
  };

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
      setSuspensionInfo(null);
    }
  };

  const fetchProperties = async (userId: string) => {
    try {
      const response = await fetch('/api/agent/properties', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      if (response.ok) {
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.properties) {
          setProperties(data.properties);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchLandlords = async (userId: string) => {
    try {
      const response = await fetch('/api/agent/landlords', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      if (response.ok && data.landlords) {
        setLandlords(data.landlords);
      }
    } catch (error) {
      console.error('Error fetching landlords:', error);
    }
  };

  const isSuspended = suspensionInfo?.suspended === true;

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {user?.firstName || 'Agent'}!
          </h1>
          <p className="text-muted-foreground mt-1">Agent Dashboard</p>
        </div>

        {/* Suspension Notice - Always show prominently if suspended */}
        {isSuspended && (
          <Card className="border-red-500/50 bg-red-500/5 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xl">
                <XCircle size={24} />
                Account Suspended
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
                <div>
                  <p className="font-semibold text-foreground mb-1">Reason for Suspension (from Landlord):</p>
                  <p className="text-sm text-foreground font-medium bg-white dark:bg-gray-800 p-3 rounded border border-red-200 dark:border-red-800">
                    {formatSuspensionReason(suspensionInfo.reason || 'Account suspended')}
                  </p>
                </div>
                {suspensionInfo.suspensionDays && (
                  <div>
                    <p className="font-semibold text-foreground mb-1">Suspension Duration:</p>
                    <p className="text-sm text-muted-foreground">
                      {suspensionInfo.suspensionDays} day(s)
                    </p>
                  </div>
                )}
                {suspensionInfo.suspensionEndDate && (
                  <div>
                    <p className="font-semibold text-foreground mb-1">Suspension End Date:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(suspensionInfo.suspensionEndDate).toLocaleDateString('en-KE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
                {suspensionInfo.notes && (
                  <div>
                    <p className="font-semibold text-foreground mb-1">Additional Notes from Landlord:</p>
                    <p className="text-sm text-muted-foreground">{suspensionInfo.notes}</p>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-border bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Account Access Restricted
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your account is currently suspended. You can view your dashboard and account information, but all actions and features are disabled. Please contact your landlord for more information or to request account reactivation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isSuspended ? 'opacity-60' : ''}`}>
          <Card className={isSuspended ? 'cursor-not-allowed' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Properties</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.totalProperties}</p>
                  {stats.totalRent > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total Rent: {formatCurrency(stats.totalRent)}/month
                    </p>
                  )}
                </div>
                <Building2 className={isSuspended ? 'text-muted-foreground' : 'text-primary'} size={24} />
              </div>
              {isSuspended && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  View only - Actions disabled
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={isSuspended ? 'cursor-not-allowed' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Landlords</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{landlords.length}</p>
                  {landlords.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {landlords.length} landlord{landlords.length > 1 ? 's' : ''} working with
                    </p>
                  )}
                </div>
                <Briefcase className={isSuspended ? 'text-muted-foreground' : 'text-primary'} size={24} />
              </div>
              {isSuspended && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  View only - Actions disabled
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={isSuspended ? 'cursor-not-allowed' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Commission</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {formatCurrency(stats.totalMonthlyCommission)}
                  </p>
                  {stats.commissionRate > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Rate: {stats.commissionRate}%
                    </p>
                  )}
                </div>
                <DollarSign className={isSuspended ? 'text-muted-foreground' : 'text-primary'} size={24} />
              </div>
              {isSuspended && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  View only - Actions disabled
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Landlords Section */}
        {landlords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase size={20} />
                Landlords I Work With
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {landlords.map((landlord: any) => (
                  <div
                    key={landlord.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {landlord.companyName || `${landlord.User?.firstName || ''} ${landlord.User?.lastName || ''}`.trim() || 'Landlord'}
                        </h3>
                        {landlord.User && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail size={14} />
                              <span>{landlord.User.email}</span>
                            </div>
                            {landlord.User.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone size={14} />
                                <span>{landlord.User.phone}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            <Building2 size={14} className="inline mr-1" />
                            {landlord.totalProperties} {landlord.totalProperties === 1 ? 'property' : 'properties'}
                          </span>
                          {landlord.totalRent > 0 && (
                            <span className="text-muted-foreground">
                              Total Rent: {formatCurrency(landlord.totalRent)}/month
                            </span>
                          )}
                        </div>
                        {landlord.properties && landlord.properties.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Properties:</p>
                            <div className="flex flex-wrap gap-2">
                              {landlord.properties.slice(0, 3).map((property: any) => (
                                <span
                                  key={property.id}
                                  className="text-xs px-2 py-1 bg-muted rounded-md text-foreground"
                                >
                                  {property.title}
                                </span>
                              ))}
                              {landlord.properties.length > 3 && (
                                <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">
                                  +{landlord.properties.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Properties List */}
        {properties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 size={20} />
                My Assigned Properties ({properties.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.map((property: any) => (
                  <div
                    key={property.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg mb-2">
                          {property.title}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p className="font-medium text-foreground">
                              {property.town}, {property.county}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rent</p>
                            <p className="font-medium text-foreground">
                              {formatCurrency(property.rent)}/month
                            </p>
                          </div>
                          {property.monthlyCommission > 0 && (
                            <div>
                              <p className="text-muted-foreground">Commission</p>
                              <p className="font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(property.monthlyCommission)}/month
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              (() => {
                                if (property.status === 'AVAILABLE') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                                if (property.status === 'OCCUPIED') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
                              })()
                            }`}>
                              {property.status}
                            </span>
                          </div>
                        </div>
                        {property.Landlord && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Landlord:</p>
                            <p className="text-sm text-foreground">
                              {property.Landlord.companyName || 
                               `${property.Landlord.User?.firstName || ''} ${property.Landlord.User?.lastName || ''}`.trim() || 
                               'Landlord'}
                            </p>
                            {property.Landlord.User?.email && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {property.Landlord.User.email}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {properties.length === 0 && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Properties Assigned</h3>
              <p className="text-muted-foreground">
                You don't have any properties assigned yet. Once a landlord assigns properties to you, they will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

