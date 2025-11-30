'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditLandlordPage() {
  const router = useRouter();
  const params = useParams();
  const landlordId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // User data
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    // Landlord data
    companyName: '',
    bankName: '',
    bankAccount: '',
    mpesaNumber: '',
  });

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

      // Populate form with existing data
      setFormData({
        email: data.User?.email || '',
        firstName: data.User?.firstName || '',
        lastName: data.User?.lastName || '',
        phone: data.User?.phone || '',
        companyName: data.companyName || '',
        bankName: data.bankName || '',
        bankAccount: data.bankAccount || '',
        mpesaNumber: data.mpesaNumber || '',
      });
    } catch (err) {
      console.error('Error fetching landlord:', err);
      setError('An error occurred while fetching landlord details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/landlords/${landlordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
          },
          landlordData: {
            companyName: formData.companyName,
            bankName: formData.bankName,
            bankAccount: formData.bankAccount,
            mpesaNumber: formData.mpesaNumber,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update landlord');
        return;
      }

      // Success - redirect to landlord details
      router.push(`/admin/landlords/${landlordId}`);
    } catch (err) {
      console.error('Error updating landlord:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/landlords/${landlordId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Landlord</h1>
          <p className="text-gray-600">Update landlord information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Landlord Information</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+254712345678"
                  required
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                <Input
                  label="M-Pesa Number (Optional)"
                  value={formData.mpesaNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, mpesaNumber: e.target.value })
                  }
                  placeholder="+254712345678"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/admin/landlords/${landlordId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

