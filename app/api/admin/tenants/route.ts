import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - List all tenants
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Fetch all users with TENANT role
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('*')
      .eq('role', 'TENANT')
      .order('createdAt', { ascending: false });

    if (usersError) {
      console.error('Error fetching tenants:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch tenants' },
        { status: 500 }
      );
    }

    // Fetch tenant records for additional info
    const userIds = users?.map((u) => u.id) || [];
    const { data: tenantRecords } = await supabase
      .from('Tenant')
      .select('*')
      .in('userId', userIds);

    // Combine user and tenant data
    const tenants = users?.map((user) => {
      const tenantRecord = tenantRecords?.find((t) => t.userId === user.id);
      return {
        ...user,
        nationalId: tenantRecord?.nationalId || null,
        dateOfBirth: tenantRecord?.dateOfBirth || null,
        employmentStatus: tenantRecord?.employmentStatus || null,
        employerName: tenantRecord?.employerName || null,
        emergencyContact: tenantRecord?.emergencyContact || null,
        emergencyPhone: tenantRecord?.emergencyPhone || null,
      };
    });

    return NextResponse.json({ tenants: tenants || [] }, { status: 200 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

