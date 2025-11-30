'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Plus,
  Search,
  Eye,
  Mail,
  UserX,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAgents();
  }, [searchTerm, statusFilter]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // TODO: Create API endpoint for fetching agents
      // For now, fetch from User table with AGENT role
      const response = await fetch('/api/admin/agents');
      const data = await response.json();

      if (response.ok) {
        let filtered = data.agents || [];
        
        if (searchTerm) {
          filtered = filtered.filter(
            (agent: any) =>
              agent.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              agent.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              agent.phone?.includes(searchTerm)
          );
        }

        if (statusFilter !== 'all') {
          filtered = filtered.filter(
            (agent: any) => agent.status === statusFilter
          );
        }

        setAgents(filtered);
      } else {
        console.error('Error fetching agents:', data.error);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage agents and send invitations
          </p>
        </div>
        <Link href="/admin/agents/invite">
          <Button>
            <Plus size={20} className="mr-2" />
            Invite Agent
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search agents by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="p-8 text-center">
              <UserX className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground mb-4">No agents found</p>
              <Link href="/admin/agents/invite">
                <Button>Invite Your First Agent</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 text-foreground">
                        {agent.firstName} {agent.lastName}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-muted-foreground" />
                          {agent.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {agent.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const isActive = agent.status === 'ACTIVE';
                          return (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isActive
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                  : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {agent.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/agents/${agent.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye size={16} className="mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

