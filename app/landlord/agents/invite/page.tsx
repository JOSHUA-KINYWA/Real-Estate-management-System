'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Mail, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

export default function InviteAgentPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
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
    fetchInvitations(parsedUser.id);
  }, [router]);

  const fetchInvitations = async (userId: string) => {
    try {
      const response = await fetch('/api/landlord/agents/invitations', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      if (response.ok) {
        setInvitations(data || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/landlord/agents/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        success('Invitation sent successfully!');
        setFormData({ email: '', firstName: '', lastName: '' });
        fetchInvitations(user.id);
      } else {
        showError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      showError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
      case 'PENDING_APPROVAL':
        return <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />;
      case 'ACCEPTED':
        return <CheckCircle className="text-blue-600 dark:text-blue-400" size={20} />;
      case 'PENDING':
        return <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />;
      case 'EXPIRED':
        return <XCircle className="text-red-600 dark:text-red-400" size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/landlord/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invite Agent</h1>
            <p className="text-muted-foreground">Send invitation link or create agent account directly</p>
          </div>
        </div>

        {/* Invite Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Send Invitation Link</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Send an invitation email to the agent. They will receive a link to create their account and set their password.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="agent@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The agent will receive an invitation link at this email address
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="invite-firstname" className="block text-sm font-medium text-foreground mb-2">
                    First Name *
                  </label>
                  <Input
                    id="invite-firstname"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="invite-lastname" className="block text-sm font-medium text-foreground mb-2">
                    Last Name *
                  </label>
                  <Input
                    id="invite-lastname"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={loading} className="flex-1" size="lg">
                  <Mail size={16} className="mr-2" />
                  Send Invitation Link
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(invitation.status)}
                      <div>
                        <p className="font-medium text-foreground">
                          {invitation.firstName} {invitation.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sent: {formatDate(invitation.createdAt)}
                          {invitation.expiresAt && ` • Expires: ${formatDate(invitation.expiresAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={(() => {
                          if (invitation.status === 'APPROVED') {
                            return 'px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                          }
                          if (invitation.status === 'PENDING_APPROVAL') {
                            return 'px-3 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                          }
                          if (invitation.status === 'ACCEPTED') {
                            return 'px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                          }
                          if (invitation.status === 'PENDING') {
                            return 'px-3 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                          }
                          return 'px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                        })()}
                      >
                        {invitation.status === 'PENDING_APPROVAL' ? 'Pending Approval' : invitation.status}
                      </span>
                      {invitation.status === 'PENDING_APPROVAL' && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/landlord/agents/approve', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'x-user-id': user.id,
                                },
                                body: JSON.stringify({
                                  agentId: invitation.agentId,
                                  invitationId: invitation.id,
                                }),
                              });

                              const data = await response.json();

                              if (response.ok) {
                                success('Agent account approved successfully!');
                                fetchInvitations(user.id);
                                setTimeout(() => {
                                  router.push('/landlord/agents');
                                }, 1500);
                              } else {
                                showError(data.error || 'Failed to approve agent');
                              }
                            } catch (error) {
                              console.error('Error approving agent:', error);
                              showError('An error occurred. Please try again.');
                            }
                          }}
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Approve Account
                        </Button>
                      )}
                      {invitation.status === 'PENDING' && (
                        <span className="text-xs text-muted-foreground">
                          Waiting for agent to register
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

