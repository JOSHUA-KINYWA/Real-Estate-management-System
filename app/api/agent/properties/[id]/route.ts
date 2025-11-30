import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get single property details for agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle async params in Next.js 15+
    const { id: propertyId } = await Promise.resolve(params);

    const supabase = createServerClient();

    // Get agent record
    const { data: agent, error: agentError } = await supabase
      .from('Agent')
      .select('id, commissionRate')
      .eq('userId', userId)
      .single();

    if (agentError || !agent) {
      console.error('Agent lookup error:', agentError);
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    console.log('Agent found:', agent.id, 'Looking for property:', propertyId);

    // First check if property exists and is assigned to this agent
    const { data: propertyCheck, error: checkError } = await supabase
      .from('Property')
      .select('id, agentId')
      .eq('id', propertyId)
      .single();

    if (checkError || !propertyCheck) {
      console.error('Property check error:', checkError);
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (propertyCheck.agentId !== agent.id) {
      console.error('Property not assigned to agent:', {
        propertyAgentId: propertyCheck.agentId,
        agentId: agent.id,
      });
      return NextResponse.json(
        { error: 'Property not assigned to you' },
        { status: 403 }
      );
    }

    // Get property with full details (including notes)
    const { data: property, error: propertyError } = await supabase
      .from('Property')
      .select(`
        *,
        Landlord:landlordId (
          id,
          companyName,
          User:userId (
            id,
            firstName,
            lastName,
            email,
            phone
          )
        )
      `)
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Property fetch error:', propertyError);
      return NextResponse.json(
        { error: 'Failed to fetch property details' },
        { status: 500 }
      );
    }

    // Get active leases for this property (occupancy info)
    const { data: leases } = await supabase
      .from('Lease')
      .select(`
        id,
        status,
        startDate,
        endDate,
        rentAmount,
        Tenant:tenantId (
          id,
          User:userId (
            id,
            firstName,
            lastName,
            email,
            phone
          )
        )
      `)
      .eq('propertyId', propertyId)
      .in('status', ['PENDING', 'ACTIVE']);

    // Get all leases (including expired/terminated) for history
    const { data: allLeases } = await supabase
      .from('Lease')
      .select(`
        id,
        status,
        startDate,
        endDate,
        rentAmount,
        Tenant:tenantId (
          id,
          User:userId (
            id,
            firstName,
            lastName,
            email
          )
        )
      `)
      .eq('propertyId', propertyId)
      .order('createdAt', { ascending: false });

    // Calculate occupancy stats
    const activeLeases = leases?.filter(l => l.status === 'ACTIVE') || [];
    const pendingLeases = leases?.filter(l => l.status === 'PENDING') || [];
    const isOccupied = property.status === 'OCCUPIED' || activeLeases.length > 0;

    // Calculate commission
    const monthlyRent = Number(property.rent) || 0;
    const commissionRate = agent.commissionRate || 0;
    const monthlyCommission = (monthlyRent * commissionRate) / 100;

    return NextResponse.json({
      property: {
        ...property,
        monthlyCommission,
        annualCommission: monthlyCommission * 12,
      },
      occupancy: {
        isOccupied,
        activeLeasesCount: activeLeases.length,
        pendingLeasesCount: pendingLeases.length,
        totalLeasesCount: allLeases?.length || 0,
        activeLeases: activeLeases,
        pendingLeases: pendingLeases,
        allLeases: allLeases || [],
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

