'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Users,
  Building2,
  DollarSign,
  Home,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalLandlords: 0,
    totalProperties: 0,
    totalTenants: 0,
    monthlyRevenue: 0,
    activeLeases: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch landlords count
      const landlordsRes = await fetch('/api/admin/landlords?limit=1');
      const landlordsData = await landlordsRes.json();
      const totalLandlords = landlordsData.pagination?.total || 0;

      // Fetch properties count
      const propertiesRes = await fetch('/api/properties');
      const properties = await propertiesRes.json();
      const totalProperties = Array.isArray(properties) ? properties.length : 0;

      setStats({
        totalLandlords,
        totalProperties,
        totalTenants: 0,
        monthlyRevenue: 0,
        activeLeases: 0,
        pendingPayments: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your real estate platform</p>
        </div>
        <Link href="/admin/landlords/new">
          <Button>Add New Landlord</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Landlords</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats.totalLandlords}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="text-primary" size={24} />
              </div>
            </div>
            <Link
              href="/admin/landlords"
              className="text-sm text-primary hover:underline mt-4 inline-block"
            >
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Properties</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats.totalProperties}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                <Building2 className="text-primary" size={24} />
              </div>
            </div>
            <Link
              href="/admin/properties"
              className="text-sm text-primary hover:underline mt-4 inline-block"
            >
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tenants</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats.totalTenants}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="text-primary" size={24} />
              </div>
            </div>
            <Link
              href="/admin/tenants"
              className="text-sm text-primary hover:underline mt-4 inline-block"
            >
              View all →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  KES {stats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                <DollarSign className="text-primary" size={24} />
              </div>
            </div>
            <Link
              href="/admin/payments"
              className="text-sm text-primary hover:underline mt-4 inline-block"
            >
              View details →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Leases</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats.activeLeases}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                <Home className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats.pendingPayments}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 dark:bg-destructive/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-destructive" size={24} />
              </div>
            </div>
            <Link
              href="/admin/payments?status=PENDING"
              className="text-sm text-destructive hover:underline mt-4 inline-block"
            >
              Review →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/landlords/new">
              <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <Users className="text-primary mb-2" size={24} />
                <h3 className="font-semibold text-foreground">Add New Landlord</h3>
                <p className="text-sm text-muted-foreground">
                  Register a new landlord account
                </p>
              </div>
            </Link>

            <Link href="/admin/properties/new">
              <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <Building2 className="text-primary mb-2" size={24} />
                <h3 className="font-semibold text-foreground">Add New Property</h3>
                <p className="text-sm text-muted-foreground">
                  List a new property for rent
                </p>
              </div>
            </Link>

            <Link href="/admin/payments">
              <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <DollarSign className="text-primary mb-2" size={24} />
                <h3 className="font-semibold text-foreground">View Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Review payment transactions
                </p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
