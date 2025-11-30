import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { propertySchema } from '@/lib/validators';
import { generateId } from '@/lib/utils';

// GET - List properties for logged-in landlord
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

    // Get landlord ID
    const { data: landlord } = await supabase
      .from('Landlord')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!landlord) {
      return NextResponse.json(
        { error: 'Landlord not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = supabase
      .from('Property')
      .select(`
        *,
        Agent:agentId (
          id,
          User:userId (
            id,
            firstName,
            lastName,
            email
          )
        ),
        Lease:Lease!propertyId (
          id,
          status,
          startDate,
          endDate,
          Tenant:tenantId (
            id,
            User:userId (
              firstName,
              lastName,
              email
            )
          )
        )
      `)
      .eq('landlordId', landlord.id)
      .order('createdAt', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }

    return NextResponse.json(properties || []);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new property
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Log the received data for debugging
    console.log('Received property data:', JSON.stringify(body, null, 2));
    
    const validated = propertySchema.parse(body);

    const supabase = createServerClient();

    // Get landlord ID
    const { data: landlord } = await supabase
      .from('Landlord')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!landlord) {
      return NextResponse.json(
        { error: 'Landlord not found' },
        { status: 404 }
      );
    }

    const propertyId = generateId();

    // Convert bedrooms enum to number if needed for database compatibility
    // Map area to size (database uses 'size' column)
    const { area, ...validatedWithoutArea } = validated;
    const propertyData: any = {
      id: propertyId,
      landlordId: landlord.id,
      ...validatedWithoutArea,
      status: validated.status || 'AVAILABLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Map area to size for database
    if (area !== undefined && area !== null) {
      propertyData.size = area;
    }

    // Handle bedrooms - convert enum to number for database if needed
    if (typeof propertyData.bedrooms === 'string') {
      const bedroomMap: Record<string, number> = {
        SINGLE_ROOM: 0,
        BEDSITTER: 0,
        '1_BEDROOM': 1,
        '2_BEDROOM': 2,
        '3_BEDROOM': 3,
        '4_BEDROOM': 4,
        '5_PLUS_BEDROOM': 5,
      };
      // Convert enum string to number for database storage
      propertyData.bedrooms = bedroomMap[propertyData.bedrooms] ?? 0;
    }

    const { data: property, error } = await supabase
      .from('Property')
      .insert(propertyData)
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return NextResponse.json(
        { error: 'Failed to create property', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(property, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors,
          message: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

