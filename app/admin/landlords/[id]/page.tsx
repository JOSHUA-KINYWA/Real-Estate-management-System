'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Building2, Users, DollarSign, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function LandlordDetailsPage() {
  const params = useParams();
  const landlordId = params.id as string;
  
  const [landlord, setLandlord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (landlordId) {
      fetchLandlord();
    }
  }, [landlordId]);

  const fetchLandlord = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/landlords/${landlordId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch landlord');
        return;
      }

      setLandlord(data);
    } catch (err) {
      console.error('Error fetching landlord:', err);
      setError('An error occurred while fetching landlord details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading landlord details...</p>
        </div>
      </div>
    );
  }

  if (error || !landlord) {
    return (
      <div className="space-y-6">
        <Link href="/admin/landlords">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back to Landlords
          </Button>
        </Link>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'Landlord not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = landlord.User;
  const properties = landlord.Property || [];
  const leases = landlord.Lease || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/landlords">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h1>
            {landlord.companyName && (
              <p className="text-gray-600">{landlord.companyName}</p>
            )}
          </div>
        </div>
        <Link href={`/admin/landlords/${landlordId}/edit`}>
          <Button>
            <Edit size={20} className="mr-2" />
            Edit Landlord
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {properties.length}
                </p>
              </div>
              <Building2 className="text-blue-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Leases</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {leases.filter((l: any) => l.status === 'ACTIVE').length}
                </p>
              </div>
              <Users className="text-green-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {landlord.portfolioValue
                    ? formatCurrency(landlord.portfolioValue)
                    : 'KES 0'}
                </p>
              </div>
              <DollarSign className="text-yellow-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(() => {
                    const status = user?.status;
                    let className = 'px-2 py-1 text-sm font-medium rounded-full ';
                    if (status === 'ACTIVE') {
                      className += 'bg-green-100 text-green-800';
                    } else if (status === 'INACTIVE') {
                      className += 'bg-gray-100 text-gray-800';
                    } else {
                      className += 'bg-red-100 text-red-800';
                    }
                    return (
                      <span className={className}>
                        {status}
                      </span>
                    );
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{user?.phone}</p>
              </div>
            </div>
            {landlord.mpesaNumber && (
              <div className="flex items-center gap-3">
                <Phone className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-600">M-Pesa Number</p>
                  <p className="font-medium">{landlord.mpesaNumber}</p>
                </div>
              </div>
            )}
            {landlord.bankName && (
              <div className="flex items-center gap-3">
                <DollarSign className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Bank Account</p>
                  <p className="font-medium">
                    {landlord.bankName} - {landlord.bankAccount}
                  </p>
                </div>
              </div>
            )}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium">
                {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Properties List */}
        <Card>
          <CardHeader>
            <CardTitle>Properties ({properties.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No properties yet
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {properties.map((property: any) => (
                  <div
                    key={property.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {property.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {property.type} • {property.county}, {property.town}
                        </p>
                        <p className="text-sm font-medium text-green-600 mt-1">
                          {formatCurrency(property.rent)}/month
                        </p>
                      </div>
                      {(() => {
                        const status = property.status;
                        let className = 'px-2 py-1 text-xs font-medium rounded-full ';
                        if (status === 'OCCUPIED') {
                          className += 'bg-green-100 text-green-800';
                        } else if (status === 'AVAILABLE') {
                          className += 'bg-blue-100 text-blue-800';
                        } else {
                          className += 'bg-gray-100 text-gray-800';
                        }
                        return (
                          <span className={className}>
                            {status}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Leases */}
      {leases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Leases ({leases.filter((l: any) => l.status === 'ACTIVE').length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leases
                .filter((lease: any) => lease.status === 'ACTIVE')
                .map((lease: any) => (
                  <div
                    key={lease.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {lease.Tenant?.User?.firstName}{' '}
                          {lease.Tenant?.User?.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                        </p>
                        <p className="text-sm font-medium text-green-600 mt-1">
                          {formatCurrency(lease.rentAmount)}/month
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {lease.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

