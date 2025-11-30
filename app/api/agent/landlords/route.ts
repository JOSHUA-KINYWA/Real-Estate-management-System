import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get landlords that the agent works with (through assigned properties)
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
      .select('id')
      .eq('userId', userId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get all properties assigned to this agent
    const { data: properties, error: propertiesError } = await supabase
      .from('Property')
      .select(`
        id,
        title,
        status,
        rent,
        county,
        town,
        estate,
        landlordId,
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
      .eq('agentId', agent.id);

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }

    // Group properties by landlord
    const landlordMap = new Map<string, any>();

    properties?.forEach((property: any) => {
      if (!property.landlordId || !property.Landlord) return;

      const landlordId = property.landlordId;
      
      if (!landlordMap.has(landlordId)) {
        landlordMap.set(landlordId, {
          ...property.Landlord,
          properties: [],
          totalProperties: 0,
          totalRent: 0,
        });
      }

      const landlord = landlordMap.get(landlordId);
      landlord.properties.push({
        id: property.id,
        title: property.title,
        status: property.status,
        rent: property.rent,
        county: property.county,
        town: property.town,
        estate: property.estate,
      });
      landlord.totalProperties += 1;
      landlord.totalRent += Number(property.rent) || 0;
    });

    // Convert map to array
    const landlords = Array.from(landlordMap.values());

    return NextResponse.json({
      landlords,
      totalLandlords: landlords.length,
      totalProperties: properties?.length || 0,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

