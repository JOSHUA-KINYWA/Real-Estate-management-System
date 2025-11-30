import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { propertySchema } from '@/lib/validators';

// GET - Get single property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    const { data: property, error } = await supabase
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
      .eq('id', params.id)
      .single();

    if (error || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update property
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = propertySchema.partial().parse(body);

    const supabase = createServerClient();

    // Map area to size (database uses 'size' column)
    const { area, ...validatedWithoutArea } = validated;
    const updateData: any = {
      ...validatedWithoutArea,
      updatedAt: new Date().toISOString(),
    };

    // Map area to size for database
    if (area !== undefined && area !== null) {
      updateData.size = area;
    }

    const { data: property, error } = await supabase
      .from('Property')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      return NextResponse.json(
        { error: 'Failed to update property' },
        { status: 500 }
      );
    }

    return NextResponse.json(property);
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

// DELETE - Delete property
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    const { error } = await supabase
      .from('Property')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting property:', error);
      return NextResponse.json(
        { error: 'Failed to delete property' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

