'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Building2,
  DollarSign,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function AdminLandlordsPage() {
  const [landlords, setLandlords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchLandlords();
  }, [page, searchTerm, statusFilter]);

  const fetchLandlords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/landlords?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLandlords(data.landlords || []);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching landlords:', data.error);
      }
    } catch (error) {
      console.error('Error fetching landlords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this landlord?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/landlords/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLandlords();
        alert('Landlord deactivated successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to deactivate landlord');
      }
    } catch (error) {
      console.error('Error deactivating landlord:', error);
      alert('Failed to deactivate landlord');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Landlords Management
          </h1>
          <p className="text-muted-foreground">Manage all landlords and their properties</p>
        </div>
        <Link href="/admin/landlords/new">
          <Button>
            <Plus size={20} className="mr-2" />
            Add Landlord
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search landlords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <Button variant="outline">
              <Filter size={20} className="mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Landlords Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Landlord
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Properties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupancy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && landlords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                      No landlords found
                    </td>
                  </tr>
                )}
                {!loading && landlords.length > 0 && (
                  landlords.map((landlord: any) => (
                    <tr key={landlord.id} className="hover:bg-accent/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {landlord.User?.firstName} {landlord.User?.lastName}
                          </div>
                          {landlord.companyName && (
                            <div className="text-sm text-muted-foreground">
                              {landlord.companyName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">
                          {landlord.User?.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {landlord.User?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {landlord.stats?.totalProperties || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 w-24">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${landlord.stats?.occupancyRate || 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-foreground">
                            {landlord.stats?.occupancyRate?.toFixed(0) || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {formatCurrency(landlord.stats?.monthlyRevenue || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const status = landlord.User?.status;
                          let className = 'px-2 py-1 text-xs font-medium rounded-full ';
                          if (status === 'ACTIVE') {
                            className += 'bg-primary/10 text-primary dark:bg-primary/20';
                          } else if (status === 'INACTIVE') {
                            className += 'bg-muted text-muted-foreground';
                          } else {
                            className += 'bg-destructive/10 text-destructive dark:bg-destructive/20';
                          }
                          return (
                            <span className={className}>
                              {status || 'UNKNOWN'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/landlords/${landlord.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye size={16} />
                            </Button>
                          </Link>
                          <Link href={`/admin/landlords/${landlord.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(landlord.id)}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

