import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user from localStorage (would be better with session/auth)
    const authHeader = request.headers.get('authorization');
    const userId = authHeader?.replace('Bearer ', '') || request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get landlord ID from user
    const { data: landlord, error: landlordError } = await supabase
      .from('Landlord')
      .select('id')
      .eq('userId', userId)
      .single();

    if (landlordError || !landlord) {
      return NextResponse.json(
        { error: 'Landlord not found' },
        { status: 404 }
      );
    }

    const landlordId = landlord.id;

    // Get total properties
    const { count: totalProperties } = await supabase
      .from('Property')
      .select('*', { count: 'exact', head: true })
      .eq('landlordId', landlordId);

    // Get active tenants (tenants with active leases)
    const { count: activeTenants } = await supabase
      .from('Lease')
      .select('*', { count: 'exact', head: true })
      .eq('landlordId', landlordId)
      .eq('status', 'ACTIVE');

    // Get monthly revenue (sum of payments this month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: payments } = await supabase
      .from('Payment')
      .select('amount')
      .eq('landlordId', landlordId)
      .eq('status', 'COMPLETED')
      .gte('createdAt', startOfMonth.toISOString());

    const monthlyRevenue = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    // Get pending payments
    const { data: pendingPayments } = await supabase
      .from('Payment')
      .select('amount')
      .eq('landlordId', landlordId)
      .eq('status', 'PENDING');

    const pendingPaymentsTotal = pendingPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    return NextResponse.json({
      totalProperties: totalProperties || 0,
      activeTenants: activeTenants || 0,
      monthlyRevenue,
      pendingPayments: pendingPaymentsTotal,
    });
  } catch (error) {
    console.error('Error fetching landlord stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

