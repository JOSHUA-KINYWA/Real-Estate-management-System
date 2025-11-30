'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Building2,
  Filter,
  MapPin,
  Bed,
  Bath,
  Square,
} from 'lucide-react';
import { formatCurrency, formatBedrooms } from '@/lib/utils';

export default function LandlordPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
    fetchProperties(parsedUser.id);
  }, [router]);

  const fetchProperties = async (userId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/landlord/properties?${params}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Filter by search term on client side
        let filtered = data || [];
        if (searchTerm) {
          filtered = filtered.filter((p: any) =>
            p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.town?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        setProperties(filtered);
      } else {
        console.error('Error fetching properties:', data.error);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProperties(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Properties</h1>
          <p className="text-muted-foreground">Manage your property portfolio</p>
        </div>
        <Link href="/landlord/properties/new">
          <Button>
            <Plus size={20} className="mr-2" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Properties Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first property'}
            </p>
            <Link href="/landlord/properties/new">
              <Button>
                <Plus size={20} className="mr-2" />
                Add Your First Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Property Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Building2 size={64} className="text-primary/50" />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-muted-foreground text-sm mb-3">
                        <MapPin size={14} className="mr-1" />
                        <span>{property.town}, {property.county}</span>
                      </div>
                    </div>
                    <span
                      className={(() => {
                        if (property.status === 'AVAILABLE') {
                          return 'px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                        }
                        if (property.status === 'OCCUPIED') {
                          return 'px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                        }
                        return 'px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                      })()}
                    >
                      {property.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {property.bedrooms !== null && property.bedrooms !== undefined && (
                      <div className="flex items-center gap-1">
                        <Bed size={16} />
                        <span>
                          {formatBedrooms(property.bedrooms)}
                        </span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath size={16} />
                        <span>{property.bathrooms}</span>
                      </div>
                    )}
                    {property.area && (
                      <div className="flex items-center gap-1">
                        <Square size={16} />
                        <span>{property.area} sqft</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(property.rent)}
                      </p>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>
                  </div>

                  {property.Agent && (
                    <div className="mb-3 p-3 bg-primary/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Assigned Agent</p>
                      <p className="text-sm font-medium text-foreground">
                        {property.Agent.User?.firstName} {property.Agent.User?.lastName}
                      </p>
                    </div>
                  )}
                  {property.Lease && property.Lease.length > 0 && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Current Tenant</p>
                      <p className="text-sm font-medium text-foreground">
                        {property.Lease[0]?.Tenant?.User?.firstName}{' '}
                        {property.Lease[0]?.Tenant?.User?.lastName}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/landlord/properties/${property.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye size={16} className="mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/landlord/properties/${property.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Edit size={16} className="mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

