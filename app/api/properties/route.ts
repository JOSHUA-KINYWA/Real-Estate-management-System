import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { propertySchema } from '@/lib/validators';
import { generateId } from '@/lib/utils';

// GET - List all properties
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const county = searchParams.get('county');
    const town = searchParams.get('town');

    let query = supabase
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
        ),
        Agent:agentId (
          id,
          User:userId (
            id,
            firstName,
            lastName
          )
        )
      `)
      .order('createdAt', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (county) {
      query = query.eq('county', county);
    }
    if (town) {
      query = query.eq('town', town);
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
    const body = await request.json();
    const validated = propertySchema.parse(body);

    const supabase = createServerClient();

    const propertyId = generateId();
    const { data: property, error } = await supabase
      .from('Property')
      .insert({
        id: propertyId,
        ...validated,
        status: validated.status || 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        listedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return NextResponse.json(
        { error: 'Failed to create property' },
        { status: 500 }
      );
    }

    return NextResponse.json(property, { status: 201 });
  } catch (error: any) {
    console.error('Error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

