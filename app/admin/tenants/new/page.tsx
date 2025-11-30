'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function NewTenantPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    dateOfBirth: '',
    employmentStatus: '',
    employerName: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/tenants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details
            .map((d: any) => `${d.field || 'field'}: ${d.message}`)
            .join('\n');
          setError(`${data.error || 'Validation error'}:\n${errorMessages}`);
        } else {
          setError(data.error || 'Failed to create tenant');
        }
        return;
      }

      setSuccess(data);
    } catch (err) {
      console.error('Error creating tenant:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Tenant</h1>
          <p className="text-muted-foreground">
            Create a new tenant account and share login credentials
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive dark:bg-destructive/20 dark:border-destructive/30 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium mb-2">Error:</p>
              <div className="text-sm whitespace-pre-line">{error}</div>
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
                <p className="font-medium mb-2">✅ Tenant Created Successfully!</p>
                <p className="text-sm">
                  Share the login credentials with the tenant.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="login-link" className="text-sm font-medium text-foreground mb-2 block">
                    Login Link
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="login-link"
                      value={success.credentials.loginLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(success.credentials.loginLink)}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label htmlFor="tenant-email" className="text-sm font-medium text-foreground mb-2 block">
                    Email
                  </label>
                  <Input
                    id="tenant-email"
                    value={success.credentials.email}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="tenant-password" className="text-sm font-medium text-foreground mb-2 block">
                    Temporary Password
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="tenant-password"
                      value={success.credentials.password}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(success.credentials.password)}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    The tenant should change this password after first login.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-foreground mb-2 font-medium">
                    Message to send:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hello {success.tenant.firstName},
                    <br />
                    <br />
                    Your tenant account has been created. Please use the following credentials to log in:
                    <br />
                    <br />
                    Login: {success.credentials.loginLink}
                    <br />
                    Email: {success.credentials.email}
                    <br />
                    Password: <strong>{success.credentials.password}</strong>
                    <br />
                    <br />
                    Please change your password after logging in.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(null);
                      setFormData({
                        email: '',
                        firstName: '',
                        lastName: '',
                        phone: '',
                        nationalId: '',
                        dateOfBirth: '',
                        employmentStatus: '',
                        employerName: '',
                        emergencyContact: '',
                        emergencyPhone: '',
                      });
                    }}
                  >
                    Add Another
                  </Button>
                  <Link href="/admin/tenants">
                    <Button>Back to Tenants</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
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
                    placeholder="tenant@example.com"
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
                    label="National ID"
                    value={formData.nationalId}
                    onChange={(e) =>
                      setFormData({ ...formData, nationalId: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Employment Information (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Employment Status"
                    value={formData.employmentStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, employmentStatus: e.target.value })
                    }
                    placeholder="e.g., Employed, Self-employed, Student"
                  />
                  <Input
                    label="Employer Name"
                    value={formData.employerName}
                    onChange={(e) =>
                      setFormData({ ...formData, employerName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Emergency Contact (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Emergency Contact Name"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyContact: e.target.value })
                    }
                  />
                  <div>
                    <Input
                      label="Emergency Contact Phone"
                      value={formData.emergencyPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyPhone: e.target.value })
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
                <Link href="/admin/tenants">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" isLoading={loading}>
                  Create Tenant
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

