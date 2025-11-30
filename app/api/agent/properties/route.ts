import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get properties assigned to the agent
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get agent record
    const { data: agent, error: agentError } = await supabase
      .from('Agent')
      .select('id, commissionRate')
      .eq('userId', userId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found for userId:', userId, agentError);
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    console.log('Found agent:', agent.id, 'for userId:', userId);

    // Get all properties assigned to this agent
    const { data: properties, error: propertiesError } = await supabase
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
      .eq('agentId', agent.id)
      .order('createdAt', { ascending: false });

    console.log('Properties query result:', {
      agentId: agent.id,
      propertiesCount: properties?.length || 0,
      error: propertiesError?.message,
    });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }

    // Calculate commission for each property
    const propertiesWithCommission = properties?.map((property: any) => {
      const monthlyRent = Number(property.rent) || 0;
      const commissionRate = agent.commissionRate || 0;
      const monthlyCommission = (monthlyRent * commissionRate) / 100;

      return {
        ...property,
        monthlyCommission,
        annualCommission: monthlyCommission * 12,
      };
    });

    // Calculate totals
    const totalRent = properties?.reduce((sum, p) => sum + (Number(p.rent) || 0), 0) || 0;
    const totalMonthlyCommission = propertiesWithCommission?.reduce(
      (sum, p) => sum + (p.monthlyCommission || 0),
      0
    ) || 0;

    return NextResponse.json({
      properties: propertiesWithCommission || [],
      stats: {
        totalProperties: properties?.length || 0,
        totalRent,
        totalMonthlyCommission,
        totalAnnualCommission: totalMonthlyCommission * 12,
        commissionRate: agent.commissionRate || 0,
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

