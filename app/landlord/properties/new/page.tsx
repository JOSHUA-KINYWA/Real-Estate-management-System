'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { getAllCounties, getConstituenciesByCounty } from '@/lib/kenya-locations';

export default function NewPropertyPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
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
  });

  const [availableConstituencies, setAvailableConstituencies] = useState<string[]>([]);
  const allCounties = getAllCounties();

  const bedroomOptions = [
    { value: 'SINGLE_ROOM', label: 'Single Room' },
    { value: 'BEDSITTER', label: 'Bedsitter' },
    { value: '1_BEDROOM', label: '1 Bedroom' },
    { value: '2_BEDROOM', label: '2 Bedroom' },
    { value: '3_BEDROOM', label: '3 Bedroom' },
    { value: '4_BEDROOM', label: '4 Bedroom' },
    { value: '5_PLUS_BEDROOM', label: '5+ Bedroom' },
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.title.trim()) {
      showError('Property title is required');
      return;
    }
    if (!formData.county) {
      showError('County is required');
      return;
    }
    if (!formData.town.trim()) {
      showError('Town/City is required');
      return;
    }
    if (!formData.estate.trim()) {
      showError('Estate is required');
      return;
    }
    if (!formData.address.trim()) {
      showError('Address is required');
      return;
    }
    if (!formData.rent || Number.isNaN(Number.parseFloat(formData.rent)) || Number.parseFloat(formData.rent) <= 0) {
      showError('Valid rent amount is required');
      return;
    }
    if (!formData.bedrooms) {
      showError('Bedrooms/room type is required');
      return;
    }

    setLoading(true);

    try {
      // Prepare data, removing empty strings and converting types
      const submitData: any = {
        title: formData.title.trim(),
        type: formData.type,
        rent: Number.parseFloat(formData.rent),
        bedrooms: formData.bedrooms, // Required field
        county: formData.county,
        town: formData.town.trim(),
        estate: formData.estate.trim(),
        address: formData.address.trim(),
        status: formData.status || 'AVAILABLE',
      };

      // Add optional fields only if they have values
      if (formData.description && formData.description.trim()) {
        submitData.description = formData.description.trim();
      }
      if (formData.constituency && formData.constituency.trim()) {
        submitData.constituency = formData.constituency.trim();
      }
      if (formData.bathrooms && formData.bathrooms.trim()) {
        submitData.bathrooms = Number.parseInt(formData.bathrooms, 10);
      }
      if (formData.area && formData.area.trim()) {
        submitData.area = Number.parseFloat(formData.area);
      }

      const response = await fetch('/api/landlord/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        success('Property created successfully!');
        setTimeout(() => {
          router.push('/landlord/properties');
        }, 1500);
      } else {
        // Show detailed validation errors if available
        if (data.message) {
          showError(data.message);
        } else if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) => 
            `${err.path?.join('.') || 'Field'}: ${err.message}`
          ).join(', ');
          showError(`Validation error: ${errorMessages}`);
        } else {
          showError(data.error || 'Failed to create property');
        }
      }
    } catch (error) {
      console.error('Error creating property:', error);
      showError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/landlord/properties">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New Property</h1>
            <p className="text-muted-foreground">List a new property for rent</p>
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
                  <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                    Property Title *
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Modern 2 Bedroom Apartment in Westlands"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the property..."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground min-h-[100px]"
                    rows={4}
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
                    Property Type *
                  </label>
                  <select
                    id="type"
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
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
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
                  <label htmlFor="rent" className="block text-sm font-medium text-foreground mb-2">
                    Monthly Rent (KES) *
                  </label>
                  <Input
                    id="rent"
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
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-foreground mb-2">
                    Bedrooms / Room Type *
                  </label>
                  <select
                    id="bedrooms"
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the number of bedrooms or room type (Single Room/Bedsitter)
                  </p>
                </div>

                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-foreground mb-2">
                    Bathrooms
                  </label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    placeholder="2"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-foreground mb-2">
                    Area (sqft)
                  </label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="1200"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="county" className="block text-sm font-medium text-foreground mb-2">
                    County *
                  </label>
                  <select
                    id="county"
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
                  <label htmlFor="constituency" className="block text-sm font-medium text-foreground mb-2">
                    Constituency {formData.county ? '*' : ''}
                  </label>
                  <select
                    id="constituency"
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
                  <label htmlFor="town" className="block text-sm font-medium text-foreground mb-2">
                    Town/City *
                  </label>
                  <Input
                    id="town"
                    value={formData.town}
                    onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                    placeholder="e.g., Westlands"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="estate" className="block text-sm font-medium text-foreground mb-2">
                    Estate *
                  </label>
                  <Input
                    id="estate"
                    value={formData.estate}
                    onChange={(e) => setFormData({ ...formData, estate: e.target.value })}
                    placeholder="e.g., Lavington Estate"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                    Address *
                  </label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  isLoading={loading}
                  className="flex-1"
                >
                  <Building2 size={20} className="mr-2" />
                  Create Property
                </Button>
                <Link href="/landlord/properties" className="flex-1">
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

