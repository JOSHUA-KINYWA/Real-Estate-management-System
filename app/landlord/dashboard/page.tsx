'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  Users,
  DollarSign,
  Package,
  ArrowRight,
  Check,
  Star,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function LandlordDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });

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
    fetchStats();
    setLoading(false);
  }, [router]);

  const fetchStats = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const parsedUser = JSON.parse(userData);
      const response = await fetch('/api/landlord/stats', {
        headers: {
          'x-user-id': parsedUser.id,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStats({
          totalProperties: data.totalProperties || 0,
          activeTenants: data.activeTenants || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          pendingPayments: data.pendingPayments || 0,
        });
      } else {
        console.error('Error fetching stats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
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

  const packages = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      period: 'month',
      description: 'Perfect for getting started',
      features: [
        'Up to 5 properties',
        'Up to 20 tenants',
        'Basic reporting',
        'Email support',
        'M-Pesa integration',
      ],
      popular: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 5000,
      period: 'month',
      description: 'For growing portfolios',
      features: [
        'Up to 25 properties',
        'Unlimited tenants',
        'Advanced reporting',
        'Priority support',
        'M-Pesa integration',
        'Document management',
        'Maintenance tracking',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 15000,
      period: 'month',
      description: 'For large portfolios',
      features: [
        'Unlimited properties',
        'Unlimited tenants',
        'Custom reporting',
        '24/7 support',
        'M-Pesa integration',
        'Full document management',
        'Advanced maintenance',
        'Multi-agent support',
        'API access',
        'Custom integrations',
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.firstName || 'Landlord'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your properties and tenants from one place
            </p>
          </div>
          <Link href="/landlord/properties/new">
            <Button>
              <Building2 size={20} className="mr-2" />
              Add Property
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Tenants</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats.activeTenants}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {formatCurrency(stats.monthlyRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-primary" size={24} />
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
                    {formatCurrency(stats.pendingPayments)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Packages Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Choose Your Plan</h2>
              <p className="text-muted-foreground mt-1">
                Select the perfect package for your needs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative border-2 ${
                  pkg.popular
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star size={14} fill="currentColor" />
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <Package className="text-primary" size={24} />
                  </div>
                  <p className="text-muted-foreground text-sm">{pkg.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {pkg.price === 0 ? 'Free' : formatCurrency(pkg.price)}
                    </span>
                    {pkg.price > 0 && (
                      <span className="text-muted-foreground">/{pkg.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check
                          className="text-primary mt-0.5 flex-shrink-0"
                          size={18}
                        />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={pkg.popular ? 'default' : 'outline'}
                  >
                    {pkg.price === 0 ? 'Current Plan' : 'Choose Plan'}
                    <ArrowRight className="ml-2" size={16} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/landlord/properties">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 size={20} className="mr-2" />
                  View Properties
                </Button>
              </Link>
              <Link href="/landlord/tenants">
                <Button variant="outline" className="w-full justify-start">
                  <Users size={20} className="mr-2" />
                  Manage Tenants
                </Button>
              </Link>
              <Link href="/landlord/payments">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign size={20} className="mr-2" />
                  View Payments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

