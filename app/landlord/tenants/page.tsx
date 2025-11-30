'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search, Users, Mail, Phone, MapPin, Calendar, UserPlus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function LandlordTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'LANDLORD') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    fetchTenants(parsedUser.id);
  }, [router]);

  const fetchTenants = async (userId: string) => {
    setLoading(true);
    try {
      // Get properties for this landlord
      const propertiesRes = await fetch(`/api/landlord/properties`, {
        headers: { 'x-user-id': userId },
      });
      
      const properties = await propertiesRes.json();
      
      // Get all leases for these properties
      const allLeases: any[] = [];
      for (const property of properties || []) {
        if (property.Lease && property.Lease.length > 0) {
          allLeases.push(...property.Lease);
        }
      }

      // Extract unique tenants
      const tenantMap = new Map();
      allLeases.forEach((lease) => {
        if (lease.Tenant) {
          const tenantId = lease.Tenant.id;
          if (!tenantMap.has(tenantId)) {
            tenantMap.set(tenantId, {
              ...lease.Tenant,
              lease: lease,
              property: properties.find((p: any) => p.id === lease.propertyId),
            });
          }
        }
      });

      let tenantsList = Array.from(tenantMap.values());

      // Filter by search term
      if (searchTerm) {
        tenantsList = tenantsList.filter((t) =>
          t.User?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.User?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.User?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setTenants(tenantsList);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTenants(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Tenants</h1>
          <p className="text-muted-foreground">Manage your tenants and leases</p>
        </div>
        <Link href="/landlord/tenants/new">
          <Button>
            <UserPlus size={20} className="mr-2" />
            Create Tenant Account
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Search tenants by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      {tenants.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Tenants Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Try adjusting your search' : 'You don\'t have any active tenants yet'}
            </p>
            {!searchTerm && (
              <Link href="/landlord/tenants/new">
                <Button>
                  <UserPlus size={20} className="mr-2" />
                  Create Your First Tenant
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {tenant.User?.firstName} {tenant.User?.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">Tenant ID: {tenant.id.substring(0, 8)}...</p>
                  </div>
                  <Users className="text-primary" size={24} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-muted-foreground" />
                    <span className="text-foreground">{tenant.User?.email}</span>
                  </div>

                  {tenant.User?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-muted-foreground" />
                      <span className="text-foreground">{tenant.User.phone}</span>
                    </div>
                  )}

                  {tenant.property && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="text-foreground">{tenant.property.title}</span>
                    </div>
                  )}

                  {tenant.lease && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Lease Information</p>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span className="text-foreground">
                          {formatDate(tenant.lease.startDate)} - {formatDate(tenant.lease.endDate)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Status: <span className="font-medium text-foreground">{tenant.lease.status}</span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

