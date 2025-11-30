'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Search,
  Users,
  Mail,
  Phone,
  DollarSign,
  Building2,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';

export default function LandlordAgentsPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [agents, setAgents] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [suspendNotes, setSuspendNotes] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('');
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

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
    fetchData(parsedUser.id);
    fetchAvailableAgents();
    fetchPendingApprovals(parsedUser.id);
  }, [router]);

  const fetchPendingApprovals = async (userId: string) => {
    try {
      const response = await fetch('/api/landlord/agents/invitations', {
        headers: { 'x-user-id': userId },
        cache: 'no-store',
      });

      const data = await response.json();
      if (response.ok) {
        // Filter for pending approvals
        const pending = (data || []).filter((inv: any) => inv.status === 'PENDING_APPROVAL');
        console.log('Pending approvals fetched:', pending);
        setPendingApprovals(pending);
      } else {
        console.error('Error fetching invitations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const parsedUser = JSON.parse(userData);
      const response = await fetch('/api/landlord/agents/available', {
        headers: { 'x-user-id': parsedUser.id },
      });

      const data = await response.json();
      if (response.ok) {
        setAvailableAgents(data || []);
      }
    } catch (error) {
      console.error('Error fetching available agents:', error);
    }
  };

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch agents assigned to landlord's properties
      const agentsRes = await fetch('/api/landlord/agents', {
        headers: { 'x-user-id': userId },
      });
      const agentsData = await agentsRes.json();

      // Fetch landlord's properties
      const propertiesRes = await fetch('/api/landlord/properties', {
        headers: { 'x-user-id': userId },
      });
      const propertiesData = await propertiesRes.json();

      if (agentsRes.ok) {
        setAgents(agentsData || []);
      }
      if (propertiesRes.ok) {
        setProperties(propertiesData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgent || !selectedProperty) {
      showError('Please select both agent and property');
      return;
    }

    try {
      const response = await fetch('/api/landlord/agents/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          propertyId: selectedProperty,
          commissionRate: commissionRate ? Number.parseFloat(commissionRate) : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        success('Agent assigned to property successfully!');
        setShowAssignModal(false);
        setSelectedAgent(null);
        setSelectedProperty('');
        setCommissionRate('');
        fetchData(user.id);
      } else {
        showError(data.error || 'Failed to assign agent');
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      showError('An error occurred. Please try again.');
    }
  };

  const handleSuspendAgent = async () => {
    const finalReason = suspendReason === 'OTHER' ? customReason : suspendReason;
    
    if (!selectedAgent || !finalReason.trim()) {
      showError('Please provide a reason for suspending the agent');
      return;
    }

    if (!suspensionDays || Number(suspensionDays) < 1) {
      showError('Please enter a valid suspension duration (at least 1 day)');
      return;
    }

    try {
      const response = await fetch('/api/landlord/agents/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          reason: finalReason,
          suspensionDays: Number(suspensionDays),
          notes: suspendNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        success(`Agent suspended for ${suspensionDays} day(s) successfully`);
        setShowSuspendModal(false);
        setSelectedAgent(null);
        setSuspendReason('');
        setCustomReason('');
        setSuspendNotes('');
        setSuspensionDays('');
        fetchData(user.id);
      } else {
        showError(data.error || 'Failed to suspend agent');
      }
    } catch (error) {
      console.error('Error suspending agent:', error);
      showError('An error occurred. Please try again.');
    }
  };

  const handlePayCommission = async (agentId: string, amount: number) => {
    if (!confirm(`Pay commission of ${formatCurrency(amount)} to this agent?`)) {
      return;
    }

    try {
      const response = await fetch('/api/landlord/agents/pay-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          agentId,
          amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        success('Commission paid successfully!');
        fetchData(user.id);
      } else {
        showError(data.error || 'Failed to pay commission');
      }
    } catch (error) {
      console.error('Error paying commission:', error);
      showError('An error occurred. Please try again.');
    }
  };

  const filteredAgents = agents.filter((agent) =>
    agent.User?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.User?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.User?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Agents</h1>
          <p className="text-muted-foreground">Manage agents assigned to your properties</p>
          {pendingApprovals.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                ⚠️ {pendingApprovals.length} agent{pendingApprovals.length > 1 ? 's' : ''} waiting for approval
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (user) {
                    fetchPendingApprovals(user.id);
                  }
                }}
                className="h-6 px-2"
              >
                <RefreshCw size={14} />
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Link href="/landlord/agents/invite">
            <Button variant="outline">
              <UserPlus size={20} className="mr-2" />
              Invite Agent
            </Button>
          </Link>
          <Button onClick={() => setShowAssignModal(true)}>
            <UserPlus size={20} className="mr-2" />
            Assign Agent
          </Button>
        </div>
      </div>

      {/* Pending Approvals Section - Always show if there are any */}
      {pendingApprovals.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Agents have created accounts and are waiting for your approval. Review their details and approve to grant access.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="p-5 border border-yellow-500/20 rounded-lg bg-background space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">
                          {approval.firstName} {approval.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Account created and awaiting your approval
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={16} className="text-muted-foreground" />
                            <span className="text-foreground font-medium">Email:</span>
                            <span className="text-muted-foreground">{approval.email}</span>
                          </div>
                          {approval.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone size={16} className="text-muted-foreground" />
                              <span className="text-foreground font-medium">Phone:</span>
                              <span className="text-muted-foreground">{approval.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {approval.createdAt && (
                            <div className="text-sm">
                              <span className="text-foreground font-medium">Invitation Sent:</span>
                              <span className="text-muted-foreground ml-2">
                                {new Date(approval.createdAt).toLocaleDateString('en-KE', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                          {approval.accountCreatedAt && (
                            <div className="text-sm">
                              <span className="text-foreground font-medium">Account Created:</span>
                              <span className="text-muted-foreground ml-2">
                                {new Date(approval.accountCreatedAt).toLocaleDateString('en-KE', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-border">
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/landlord/agents/approve', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-user-id': user.id,
                            },
                            body: JSON.stringify({
                              agentId: approval.agentId,
                              invitationId: approval.id,
                            }),
                          });

                          const data = await response.json();

                          if (response.ok) {
                            success('Agent account approved successfully!');
                            // Refresh all data
                            await fetchPendingApprovals(user.id);
                            await fetchData(user.id);
                            await fetchAvailableAgents();
                          } else {
                            showError(data.error || 'Failed to approve agent');
                          }
                        } catch (error) {
                          console.error('Error approving agent:', error);
                          showError('An error occurred. Please try again.');
                        }
                      }}
                      className="flex-1"
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      Approve Account
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Search agents by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Agents Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Assign agents to manage your properties'}
            </p>
            <Button onClick={() => setShowAssignModal(true)}>
              <UserPlus size={20} className="mr-2" />
              Assign Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {agent.User?.firstName} {agent.User?.lastName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {agent.licenseNumber || 'No License'}
                    </p>
                  </div>
                  {(() => {
                    if (agent.User?.status === 'SUSPENDED') {
                      return <XCircle className="text-red-600 dark:text-red-400" size={20} title="Suspended" />;
                    }
                    if (agent.active) {
                      return <CheckCircle className="text-green-600 dark:text-green-400" size={20} title="Active" />;
                    }
                    return <XCircle className="text-red-600 dark:text-red-400" size={20} title="Inactive" />;
                  })()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-muted-foreground" />
                    <span className="text-foreground">{agent.User?.email}</span>
                  </div>
                  {agent.User?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-muted-foreground" />
                      <span className="text-foreground">{agent.User.phone}</span>
                    </div>
                  )}
                  {agent.commissionRate && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={16} className="text-muted-foreground" />
                      <span className="text-foreground">
                        Commission: {agent.commissionRate}%
                      </span>
                    </div>
                  )}
                  {agent.totalEarnings && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={16} className="text-primary" />
                      <span className="font-medium text-foreground">
                        Total Earnings: {formatCurrency(agent.totalEarnings)}
                      </span>
                    </div>
                  )}
                </div>

                {agent.assignedProperties && agent.assignedProperties.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Assigned Properties</p>
                    <div className="space-y-1">
                      {agent.assignedProperties.slice(0, 3).map((property: any) => (
                        <div key={property.id} className="flex items-center gap-2 text-xs">
                          <Building2 size={12} className="text-muted-foreground" />
                          <span className="text-foreground">{property.title}</span>
                        </div>
                      ))}
                      {agent.assignedProperties.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{agent.assignedProperties.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-border">
                  {agent.pendingCommission > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handlePayCommission(agent.id, agent.pendingCommission)}
                    >
                      <DollarSign size={14} className="mr-1" />
                      Pay {formatCurrency(agent.pendingCommission)}
                    </Button>
                  )}
                  {agent.pendingCommission === 0 && (
                    <div className="flex-1 text-xs text-muted-foreground text-center py-2">
                      No pending commission
                    </div>
                  )}
                  {agent.User?.status === 'SUSPENDED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/landlord/agents/unsuspend', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-user-id': user.id,
                            },
                            body: JSON.stringify({
                              agentId: agent.id,
                            }),
                          });

                          const data = await response.json();

                          if (response.ok) {
                            success('Agent unsuspended successfully!');
                            fetchData(user.id);
                          } else {
                            showError(data.error || 'Failed to unsuspend agent');
                          }
                        } catch (error) {
                          console.error('Error unsuspending agent:', error);
                          showError('An error occurred. Please try again.');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Unsuspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowSuspendModal(true);
                      }}
                    >
                      <UserMinus size={14} className="mr-1" />
                      Suspend
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Agent Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Agent to Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="assign-agent-select" className="block text-sm font-medium text-foreground mb-2">
                  Select Agent
                </label>
                <select
                  id="assign-agent-select"
                  value={selectedAgent?.id || ''}
                  onChange={(e) => {
                    const agent = availableAgents.find((a) => a.id === e.target.value);
                    setSelectedAgent(agent);
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="">Select an agent</option>
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.User?.firstName} {agent.User?.lastName} - {agent.User?.email}
                      {agent.commissionRate ? ` (${agent.commissionRate}% commission)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assign-property-select" className="block text-sm font-medium text-foreground mb-2">
                  Select Property
                </label>
                <select
                  id="assign-property-select"
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="">Select a property</option>
                  {properties
                    .filter((p) => !p.agentId)
                    .map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="commission-rate" className="block text-sm font-medium text-foreground mb-2">
                  Commission Rate (%)
                </label>
                <Input
                  id="commission-rate"
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="e.g., 5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAssignAgent} className="flex-1">
                  Assign Agent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAgent(null);
                    setSelectedProperty('');
                    setCommissionRate('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suspend Agent Modal */}
      {showSuspendModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Suspend Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <p className="text-sm text-foreground">
                  Suspending <strong>{selectedAgent.User?.firstName} {selectedAgent.User?.lastName}</strong> from your portal. The agent will be able to see the reason and duration.
                </p>
              </div>
              <div>
                <label htmlFor="suspend-days" className="block text-sm font-medium text-foreground mb-2">
                  Suspension Duration (Days) *
                </label>
                <Input
                  id="suspend-days"
                  type="number"
                  min="1"
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(e.target.value)}
                  placeholder="Enter number of days"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The agent will be suspended for this many days
                </p>
              </div>
              <div>
                <label htmlFor="suspend-reason" className="block text-sm font-medium text-foreground mb-2">
                  Reason for Suspension *
                </label>
                <select
                  id="suspend-reason"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground mb-2"
                  required
                >
                  <option value="">Select reason</option>
                  <option value="TERMINATING_CONTRACT">Terminating Contract</option>
                  <option value="POOR_PERFORMANCE">Poor Performance</option>
                  <option value="VIOLATION_OF_TERMS">Violation of Terms</option>
                  <option value="BREACH_OF_CONTRACT">Breach of Contract</option>
                  <option value="MUTUAL_AGREEMENT">Mutual Agreement</option>
                  <option value="OTHER">Other</option>
                </select>
                {suspendReason === 'OTHER' && (
                  <Input
                    id="suspend-reason-other"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please specify the reason..."
                    className="mt-2"
                    required
                  />
                )}
              </div>
              <div>
                <label htmlFor="suspend-notes" className="block text-sm font-medium text-foreground mb-2">
                  Additional Notes (Visible to Agent)
                </label>
                <textarea
                  id="suspend-notes"
                  value={suspendNotes}
                  onChange={(e) => setSuspendNotes(e.target.value)}
                  placeholder="Any additional information (this will be visible to the agent)..."
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground min-h-[100px]"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleSuspendAgent}
                  className="flex-1"
                >
                  <UserMinus size={16} className="mr-2" />
                  Suspend Agent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSelectedAgent(null);
                    setSuspendReason('');
                    setCustomReason('');
                    setSuspendNotes('');
                    setSuspensionDays('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

