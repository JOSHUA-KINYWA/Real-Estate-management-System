'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Edit, Building2, MapPin, Bed, Bath, Square, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, formatBedrooms } from '@/lib/utils';

export default function PropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

    fetchProperty(parsedUser.id);
  }, [router, params.id]);

  const fetchProperty = async (userId: string) => {
    try {
      const response = await fetch(`/api/properties/${params.id}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProperty(data);
      } else {
        console.error('Error fetching property:', data.error);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Property Not Found</h3>
            <Link href="/landlord/properties">
              <Button variant="outline" className="mt-4">
                <ArrowLeft size={16} className="mr-2" />
                Back to Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/landlord/properties">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{property.title}</h1>
              <p className="text-muted-foreground">{property.town}, {property.county}</p>
            </div>
          </div>
          <Link href={`/landlord/properties/${property.id}/edit`}>
            <Button>
              <Edit size={16} className="mr-2" />
              Edit Property
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Property Image */}
            <Card>
              <CardContent className="p-0">
                <div className="h-96 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Building2 size={128} className="text-primary/50" />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {property.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Current Lease */}
            {property.Lease && property.Lease.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Lease</CardTitle>
                </CardHeader>
                <CardContent>
                  {property.Lease.map((lease: any) => (
                    <div key={lease.id} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Tenant</p>
                          <p className="font-medium text-foreground">
                            {lease.Tenant?.User?.firstName} {lease.Tenant?.User?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{lease.Tenant?.User?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rent Amount</p>
                          <p className="font-medium text-foreground">
                            {formatCurrency(lease.rentAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Start Date</p>
                          <p className="font-medium text-foreground">
                            {formatDate(lease.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">End Date</p>
                          <p className="font-medium text-foreground">
                            {formatDate(lease.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign size={20} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(property.rent)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 size={20} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium text-foreground">{property.type}</p>
                  </div>
                </div>

                {(property.bedrooms !== null && property.bedrooms !== undefined) && (
                  <div className="flex items-center gap-3">
                    <Bed size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-medium text-foreground">
                        {formatBedrooms(property.bedrooms)}
                      </p>
                    </div>
                  </div>
                )}

                {property.bathrooms && (
                  <div className="flex items-center gap-3">
                    <Bath size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-medium text-foreground">{property.bathrooms}</p>
                    </div>
                  </div>
                )}

                {property.area && (
                  <div className="flex items-center gap-3">
                    <Square size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Area</p>
                      <p className="font-medium text-foreground">{property.area} sqft</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium text-foreground">{property.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {property.town}, {property.county}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span
                    className={(() => {
                      if (property.status === 'AVAILABLE') {
                        return 'inline-block px-3 py-1 rounded text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                      }
                      if (property.status === 'OCCUPIED') {
                        return 'inline-block px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                      }
                      return 'inline-block px-3 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                    })()}
                  >
                    {property.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

