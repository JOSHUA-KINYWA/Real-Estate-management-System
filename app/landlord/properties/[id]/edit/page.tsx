'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Building2, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { getAllCounties, getConstituenciesByCounty } from '@/lib/kenya-locations';

const bedroomOptions = [
  { value: 'SINGLE_ROOM', label: 'Single Room' },
  { value: 'BEDSITTER', label: 'Bedsitter' },
  { value: '1_BEDROOM', label: '1 Bedroom' },
  { value: '2_BEDROOM', label: '2 Bedroom' },
  { value: '3_BEDROOM', label: '3 Bedroom' },
  { value: '4_BEDROOM', label: '4 Bedroom' },
  { value: '5_PLUS_BEDROOM', label: '5+ Bedroom' },
];

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'APARTMENT',
    address: '',
    county: '',
    constituency: '',
    town: '',
    estate: '',
    rent: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    status: 'AVAILABLE',
    agentId: '',
  });

  const [availableConstituencies, setAvailableConstituencies] = useState<string[]>([]);
  const allCounties = getAllCounties();

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
    fetchProperty(parsedUser.id);
    fetchAvailableAgents(parsedUser.id);
  }, [router, params.id]);

  // Update constituencies when county changes
  useEffect(() => {
    if (formData.county) {
      const constituencies = getConstituenciesByCounty(formData.county);
      setAvailableConstituencies(constituencies);
      // Reset constituency if it's not valid for the new county
      if (formData.constituency && !constituencies.includes(formData.constituency)) {
        setFormData(prev => ({ ...prev, constituency: '' }));
      }
    } else {
      setAvailableConstituencies([]);
      setFormData(prev => ({ ...prev, constituency: '' }));
    }
  }, [formData.county]);

  const fetchProperty = async (userId: string) => {
    setFetching(true);
    try {
      const response = await fetch(`/api/properties/${params.id}`, {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();

      if (response.ok) {
        setProperty(data);
        // Convert numeric bedrooms to enum if needed
        // Note: Since SINGLE_ROOM and BEDSITTER both map to 0, we default to SINGLE_ROOM
        // The user can change it if needed when editing
        let bedroomValue = '';
        if (data.bedrooms !== null && data.bedrooms !== undefined) {
          const bedroomReverseMap: Record<number, string> = {
            0: 'SINGLE_ROOM', // Default to SINGLE_ROOM (could also be BEDSITTER)
            1: '1_BEDROOM',
            2: '2_BEDROOM',
            3: '3_BEDROOM',
            4: '4_BEDROOM',
            5: '5_PLUS_BEDROOM',
          };
          bedroomValue = bedroomReverseMap[data.bedrooms] || '';
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          type: data.type || 'APARTMENT',
          address: data.address || '',
          county: data.county || '',
          constituency: data.constituency || '',
          town: data.town || '',
          estate: data.estate || '',
          rent: data.rent?.toString() || '',
          bedrooms: bedroomValue,
          bathrooms: data.bathrooms?.toString() || '',
          area: data.size?.toString() || data.area?.toString() || '',
          status: data.status || 'AVAILABLE',
          agentId: data.agentId || '',
        });
      } else {
        showError(data.error || 'Failed to fetch property');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      showError('An error occurred. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  const fetchAvailableAgents = async (userId: string) => {
    try {
      const response = await fetch('/api/landlord/agents/available', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      if (response.ok) {
        setAvailableAgents(data || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/properties/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          ...formData,
          rent: Number.parseFloat(formData.rent),
          bedrooms: formData.bedrooms, // Keep as enum string
          bathrooms: formData.bathrooms ? Number.parseInt(formData.bathrooms, 10) : null,
          area: formData.area ? Number.parseFloat(formData.area) : null,
          agentId: formData.agentId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        success('Property updated successfully!');
        setTimeout(() => {
          router.push(`/landlord/properties/${params.id}`);
        }, 1500);
      } else {
        showError(data.error || 'Failed to update property');
      }
    } catch (error) {
      console.error('Error updating property:', error);
      showError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAgent = async () => {
    if (!confirm('Remove agent from this property?')) {
      return;
    }

    try {
      const response = await fetch(`/api/properties/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          agentId: null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        success('Agent removed from property');
        setFormData({ ...formData, agentId: '' });
        fetchProperty(user.id);
      } else {
        showError(data.error || 'Failed to remove agent');
      }
    } catch (error) {
      console.error('Error removing agent:', error);
      showError('An error occurred. Please try again.');
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">Property Not Found</h3>
            <Link href="/landlord/properties">
              <Button variant="outline" className="mt-4">
                <ArrowLeft size={16} className="mr-2" />
                Back to Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentAgent = availableAgents.find((a) => a.id === formData.agentId);

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/landlord/properties/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Property</h1>
            <p className="text-muted-foreground">Update property details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="edit-title" className="block text-sm font-medium text-foreground mb-2">
                    Property Title *
                  </label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Modern 2 Bedroom Apartment in Westlands"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="edit-description" className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the property..."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground min-h-[100px]"
                    rows={4}
                  />
                </div>

                <div>
                  <label htmlFor="edit-type" className="block text-sm font-medium text-foreground mb-2">
                    Property Type *
                  </label>
                  <select
                    id="edit-type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    required
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="BUNGALOW">Bungalow</option>
                    <option value="MAISONETTE">Maisonette</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="VILLA">Villa</option>
                    <option value="SINGLE_ROOM">Single Room</option>
                    <option value="BEDSITTER">Bedsitter</option>
                    <option value="HOUSE">House</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-foreground mb-2">
                    Status *
                  </label>
                  <select
                    id="edit-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    required
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-rent" className="block text-sm font-medium text-foreground mb-2">
                    Monthly Rent (KES) *
                  </label>
                  <Input
                    id="edit-rent"
                    type="number"
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                    placeholder="50000"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label htmlFor="edit-bedrooms" className="block text-sm font-medium text-foreground mb-2">
                    Bedrooms / Room Type *
                  </label>
                  <select
                    id="edit-bedrooms"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    required
                  >
                    <option value="">Select room type</option>
                    {bedroomOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-bathrooms" className="block text-sm font-medium text-foreground mb-2">
                    Bathrooms
                  </label>
                  <Input
                    id="edit-bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    placeholder="2"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="edit-area" className="block text-sm font-medium text-foreground mb-2">
                    Area (sqft)
                  </label>
                  <Input
                    id="edit-area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="1200"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="edit-county" className="block text-sm font-medium text-foreground mb-2">
                    County *
                  </label>
                  <select
                    id="edit-county"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value, constituency: '' })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    required
                  >
                    <option value="">Select County</option>
                    {allCounties.map((county) => (
                      <option key={county} value={county}>
                        {county}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-constituency" className="block text-sm font-medium text-foreground mb-2">
                    Constituency {formData.county ? '*' : ''}
                  </label>
                  <select
                    id="edit-constituency"
                    value={formData.constituency}
                    onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                    disabled={!formData.county}
                    required={!!formData.county}
                  >
                    <option value="">
                      {formData.county ? 'Select Constituency' : 'Select County first'}
                    </option>
                    {availableConstituencies.map((constituency) => (
                      <option key={constituency} value={constituency}>
                        {constituency}
                      </option>
                    ))}
                  </select>
                  {!formData.county && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Please select a county first
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-town" className="block text-sm font-medium text-foreground mb-2">
                    Town/City *
                  </label>
                  <Input
                    id="edit-town"
                    value={formData.town}
                    onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                    placeholder="e.g., Westlands"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-estate" className="block text-sm font-medium text-foreground mb-2">
                    Estate *
                  </label>
                  <Input
                    id="edit-estate"
                    value={formData.estate}
                    onChange={(e) => setFormData({ ...formData, estate: e.target.value })}
                    placeholder="e.g., Lavington Estate"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="edit-address" className="block text-sm font-medium text-foreground mb-2">
                    Address *
                  </label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                    required
                  />
                </div>

                {/* Agent Assignment */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="edit-agent" className="block text-sm font-medium text-foreground">
                      Assigned Agent
                    </label>
                    {currentAgent && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAgent}
                      >
                        <UserMinus size={14} className="mr-1" />
                        Remove Agent
                      </Button>
                    )}
                  </div>
                  <select
                    id="edit-agent"
                    value={formData.agentId}
                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="">No agent assigned</option>
                    {availableAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.User?.firstName} {agent.User?.lastName} - {agent.User?.email}
                        {agent.commissionRate ? ` (${agent.commissionRate}% commission)` : ''}
                      </option>
                    ))}
                  </select>
                  {currentAgent && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {currentAgent.User?.firstName} {currentAgent.User?.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="flex-1"
                >
                  <Building2 size={20} className="mr-2" />
                  Update Property
                </Button>
                <Link href={`/landlord/properties/${params.id}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
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

