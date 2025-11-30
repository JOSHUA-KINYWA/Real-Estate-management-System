'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, UserPlus, Mail, Phone, User } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';

export default function NewTenantPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    idNumber: '',
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
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/landlord/tenants/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        success('Tenant account created successfully!');
        setTimeout(() => {
          router.push('/landlord/tenants');
        }, 1500);
      } else {
        showError(data.error || 'Failed to create tenant account');
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      showError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/landlord/tenants">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Tenant Account</h1>
            <p className="text-muted-foreground">Create a new tenant account directly</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Create a tenant account. They will receive login credentials via email.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="tenant-email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="tenant-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tenant@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tenant-firstname" className="block text-sm font-medium text-foreground mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="tenant-firstname"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="tenant-lastname" className="block text-sm font-medium text-foreground mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="tenant-lastname"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="tenant-phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="tenant-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254712345678"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tenant-id" className="block text-sm font-medium text-foreground mb-2">
                  ID Number
                </label>
                <Input
                  id="tenant-id"
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  placeholder="12345678"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" isLoading={loading} className="flex-1" size="lg">
                  <UserPlus size={16} className="mr-2" />
                  Create Tenant Account
                </Button>
                <Link href="/landlord/tenants" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" size="lg">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

