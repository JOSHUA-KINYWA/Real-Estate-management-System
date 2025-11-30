'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewLandlordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // User data
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    // Landlord data
    companyName: '',
    bankName: '',
    bankAccount: '',
    mpesaNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/landlords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed validation errors if available
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          const errorMessages = data.details
            .map((d: any) => `${d.field || 'field'}: ${d.message}`)
            .join('\n');
          setError(`${data.error || 'Validation error'}:\n${errorMessages}`);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Failed to create landlord. Please check all fields and try again.');
        }
        return;
      }

      // Success - redirect to landlords list
      router.push('/admin/landlords');
    } catch (err) {
      console.error('Error creating landlord:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/landlords">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Landlord</h1>
          <p className="text-muted-foreground">Create a new landlord account</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Landlord Information</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive dark:bg-destructive/20 dark:border-destructive/30 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium mb-2">Error:</p>
              <div className="text-sm whitespace-pre-line">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                <div>
                  <Input
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+254712345678 or 0712345678"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: +254712345678, 254712345678, or 0712345678
                  </p>
                </div>
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Name (Optional)"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
                <Input
                  label="Bank Name (Optional)"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                />
                <Input
                  label="Bank Account (Optional)"
                  value={formData.bankAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, bankAccount: e.target.value })
                  }
                />
                <div>
                  <Input
                    label="M-Pesa Number (Optional)"
                    value={formData.mpesaNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, mpesaNumber: e.target.value })
                    }
                    placeholder="+254712345678 or 0712345678"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: +254712345678, 254712345678, or 0712345678
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/admin/landlords">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={loading}>
                Create Landlord
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

