'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, MapPin, DollarSign, Phone, Mail, Briefcase } from 'lucide-react';
import { formatCurrency, formatBedrooms } from '@/lib/utils';

export default function AgentPropertiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalRent: 0,
    totalMonthlyCommission: 0,
    commissionRate: 0,
  });

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

    fetchProperties(parsedUser.id);
  }, [router]);

  const fetchProperties = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent/properties', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      if (response.ok) {
        setProperties(data.properties || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Properties</h1>
          <p className="text-muted-foreground mt-1">Properties assigned to you</p>
        </div>

        {/* Stats Summary */}
        {stats.totalProperties > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Properties</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.totalProperties}</p>
                  </div>
                  <Building2 className="text-primary" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Monthly Rent</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {formatCurrency(stats.totalRent)}
                    </p>
                  </div>
                  <DollarSign className="text-primary" size={24} />
                </div>
              </CardContent>
            </Card>

            <Card>
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
                  <Briefcase className="text-primary" size={24} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Properties List */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: any) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{property.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={14} />
                      <span>{property.town}, {property.county}</span>
                    </div>
                    {property.estate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 size={14} />
                        <span>{property.estate}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Rent</p>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(property.rent)}/month
                      </p>
                    </div>
                    {property.monthlyCommission > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Commission</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(property.monthlyCommission)}/month
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Bedrooms</p>
                      <p className="font-semibold text-foreground">
                        {formatBedrooms(property.bedrooms)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
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
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Landlord:</p>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {(() => {
                            if (property.Landlord.companyName) return property.Landlord.companyName;
                            const fullName = `${property.Landlord.User?.firstName || ''} ${property.Landlord.User?.lastName || ''}`.trim();
                            return fullName || 'Landlord';
                          })()}
                        </p>
                        {property.Landlord.User?.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail size={12} />
                            <span>{property.Landlord.User.email}</span>
                          </div>
                        )}
                        {property.Landlord.User?.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone size={12} />
                            <span>{property.Landlord.User.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {property.description && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {property.description}
                      </p>
                    </div>
                  )}
                  
                  <Link href={`/agent/properties/${property.id}`}>
                    <Button variant="outline" className="w-full mt-3">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Properties Assigned</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any properties assigned yet. Once a landlord assigns properties to you, they will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

