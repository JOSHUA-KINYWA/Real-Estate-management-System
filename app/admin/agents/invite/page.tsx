'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Mail, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function InviteAgentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/agents/invite', {
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
          setError(data.error || 'Failed to send invitation');
        }
        return;
      }

      setSuccess(data);
    } catch (err) {
      console.error('Error inviting agent:', err);
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
        <Link href="/admin/agents">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invite Agent</h1>
          <p className="text-muted-foreground">
            Send an invitation link to a new agent
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>
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
                <p className="font-medium mb-2">✅ Invitation Created Successfully!</p>
                <p className="text-sm">
                  The agent account has been created. Share the credentials below.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="invitation-link" className="text-sm font-medium text-foreground mb-2 block">
                    Invitation Link
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="invitation-link"
                      value={success.invitationLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(success.invitationLink)}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label htmlFor="temp-password" className="text-sm font-medium text-foreground mb-2 block">
                    Temporary Password
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="temp-password"
                      value={success.tempPassword}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(success.tempPassword)}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    The agent should change this password after first login.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-foreground mb-2 font-medium">
                    Email to send:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Subject: Invitation to join Real Estate KE
                    <br />
                    <br />
                    Hello {success.email},
                    <br />
                    <br />
                    You have been invited to join Real Estate KE as an agent.
                    <br />
                    <br />
                    Please use the following link to complete your registration:
                    <br />
                    {success.invitationLink}
                    <br />
                    <br />
                    Your temporary password is: <strong>{success.tempPassword}</strong>
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
                      setFormData({ email: '', firstName: '', lastName: '', phone: '' });
                    }}
                  >
                    Invite Another
                  </Button>
                  <Link href="/admin/agents">
                    <Button>Back to Agents</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="agent@example.com"
                  required
                />
                <div>
                  <Input
                    label="Phone (Optional)"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+254712345678 or 0712345678"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: +254712345678, 254712345678, or 0712345678
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Link href="/admin/agents">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" isLoading={loading}>
                  <Mail size={16} className="mr-2" />
                  Send Invitation
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

