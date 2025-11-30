'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Building2, MapPin, Bed, Bath, Square, DollarSign, Users, CheckCircle2, Clock, FileText, Save, Edit2, Phone, Mail } from 'lucide-react';
import { formatCurrency, formatDate, formatBedrooms } from '@/lib/utils';

export default function AgentPropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

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

    fetchProperty(parsedUser.id);
  }, [router, params.id]);

  const fetchProperty = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/agent/properties/${params.id}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProperty(data.property);
        setOccupancy(data.occupancy);
        setNotes(data.property.notes || '');
      } else {
        console.error('Error fetching property:', data.error);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) return;

    const parsedUser = JSON.parse(userData);
    setSavingNotes(true);

    try {
      const response = await fetch(`/api/agent/properties/${params.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': parsedUser.id,
        },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (response.ok) {
        setEditingNotes(false);
        if (property) {
          setProperty({ ...property, notes: data.notes });
        }
      } else {
        console.error('Error saving notes:', data.error);
        alert('Failed to save notes. Please try again.');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
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
            <p className="text-muted-foreground mb-4">This property may not be assigned to you.</p>
            <Link href="/agent/properties">
              <Button variant="outline">
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/agent/properties">
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
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              property.status === 'AVAILABLE'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : property.status === 'OCCUPIED'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {property.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            {property.images && property.images.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="grid grid-cols-2 gap-2 p-4">
                    {property.images.slice(0, 4).map((image: string, index: number) => (
                      <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`${property.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Bed size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-semibold text-foreground">{formatBedrooms(property.bedrooms)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-semibold text-foreground">{property.bathrooms || 'N/A'}</p>
                    </div>
                  </div>
                  {property.size && (
                    <div className="flex items-center gap-2">
                      <Square size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p className="font-semibold text-foreground">{property.size} sqft</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rent</p>
                      <p className="font-semibold text-foreground">{formatCurrency(property.rent)}/mo</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={18} className="text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Location</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{property.address}</p>
                  <p className="text-sm text-muted-foreground">{property.estate}, {property.town}</p>
                  <p className="text-sm text-muted-foreground">{property.county}, Kenya</p>
                </div>

                {property.description && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-2">Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{property.description}</p>
                  </div>
                )}

                {property.amenities && property.amenities.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted rounded-md text-xs text-foreground"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Occupancy Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  Occupancy Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {occupancy?.activeLeasesCount || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Occupied</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {property.status === 'AVAILABLE' ? 1 : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">
                      {occupancy?.totalLeasesCount || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Leases</p>
                  </div>
                </div>

                {/* Active Leases */}
                {occupancy?.activeLeases && occupancy.activeLeases.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Currently Occupied By:</p>
                    <div className="space-y-3">
                      {occupancy.activeLeases.map((lease: any) => (
                        <div key={lease.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                                <p className="font-semibold text-foreground">
                                  {lease.Tenant?.User?.firstName} {lease.Tenant?.User?.lastName}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                Lease: {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                Rent: {formatCurrency(lease.rentAmount)}/month
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                              ACTIVE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Leases */}
                {occupancy?.pendingLeases && occupancy.pendingLeases.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Pending Leases:</p>
                    <div className="space-y-3">
                      {occupancy.pendingLeases.map((lease: any) => (
                        <div key={lease.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock size={16} className="text-yellow-600 dark:text-yellow-400" />
                                <p className="font-semibold text-foreground">
                                  {lease.Tenant?.User?.firstName} {lease.Tenant?.User?.lastName}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Starting: {formatDate(lease.startDate)}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs font-medium">
                              PENDING
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!occupancy?.activeLeases || occupancy.activeLeases.length === 0) && 
                 (!occupancy?.pendingLeases || occupancy.pendingLeases.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No active or pending leases</p>
                    <p className="text-sm">This property is currently available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Commission Info */}
            {property.monthlyCommission > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Commission</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(property.monthlyCommission)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(property.annualCommission)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Landlord Info */}
            {property.Landlord && (
              <Card>
                <CardHeader>
                  <CardTitle>Landlord</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      {property.Landlord.companyName || 
                       `${property.Landlord.User?.firstName || ''} ${property.Landlord.User?.lastName || ''}`.trim() || 
                       'Landlord'}
                    </p>
                  </div>
                  {property.Landlord.User?.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={14} />
                      <span>{property.Landlord.User.email}</span>
                    </div>
                  )}
                  {property.Landlord.User?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={14} />
                      <span>{property.Landlord.User.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText size={18} />
                    Notes
                  </CardTitle>
                  {!editingNotes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNotes(true)}
                    >
                      <Edit2 size={14} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingNotes ? (
                  <div className="space-y-3">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this property..."
                      className="w-full min-h-[150px] p-3 border border-border rounded-lg bg-background text-foreground resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                      >
                        <Save size={14} className="mr-2" />
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingNotes(false);
                          setNotes(property.notes || '');
                        }}
                        disabled={savingNotes}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {notes ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No notes yet. Click edit to add notes.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

