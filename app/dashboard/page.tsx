'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Building2, Users, DollarSign, Home } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Role: <span className="font-semibold">{user.role}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                </div>
                <Building2 className="text-green-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tenants</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                </div>
                <Users className="text-blue-600" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    KES 0
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
                  <p className="text-sm text-gray-600">Active Leases</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                </div>
                <Home className="text-purple-600" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/properties')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <Building2 className="text-green-600 mb-2" size={24} />
                <h3 className="font-semibold">View Properties</h3>
                <p className="text-sm text-gray-600">
                  Browse and manage properties
                </p>
              </button>

              <button
                onClick={() => router.push('/tenants')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <Users className="text-blue-600 mb-2" size={24} />
                <h3 className="font-semibold">Manage Tenants</h3>
                <p className="text-sm text-gray-600">
                  View and manage tenant information
                </p>
              </button>

              <button
                onClick={() => router.push('/payments')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <DollarSign className="text-yellow-600 mb-2" size={24} />
                <h3 className="font-semibold">Payments</h3>
                <p className="text-sm text-gray-600">
                  Track and manage payments
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

