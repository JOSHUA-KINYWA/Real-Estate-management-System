import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { landlordSchema } from '@/lib/validators';

// GET - Get single landlord details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    const { data: landlord, error } = await supabase
      .from('Landlord')
      .select(`
        *,
        User:userId (
          id,
          firstName,
          lastName,
          email,
          phone,
          status,
          createdAt
        ),
        Property:Property!landlordId (
          id,
          title,
          status,
          rent,
          type,
          county,
          town
        ),
        Lease:Lease!landlordId (
          id,
          status,
          startDate,
          endDate,
          rentAmount,
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
      .eq('id', params.id)
      .single();

    if (error || !landlord) {
      return NextResponse.json(
        { error: 'Landlord not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(landlord);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update landlord
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userData, landlordData } = body;

    const supabase = createServerClient();

    // Get landlord to find userId
    const { data: landlord } = await supabase
      .from('Landlord')
      .select('userId')
      .eq('id', params.id)
      .single();

    if (!landlord) {
      return NextResponse.json(
        { error: 'Landlord not found' },
        { status: 404 }
      );
    }

    // Update user if userData provided
    if (userData) {
      const { error: userError } = await supabase
        .from('User')
        .update({
          ...userData,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', landlord.userId);

      if (userError) {
        console.error('Error updating user:', userError);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        );
      }
    }

    // Update landlord if landlordData provided
    if (landlordData) {
      const validated = landlordSchema.partial().parse(landlordData);
      const { data: updatedLandlord, error: landlordError } = await supabase
        .from('Landlord')
        .update({
          ...validated,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select(`
          *,
          User:userId (
            id,
            firstName,
            lastName,
            email,
            phone,
            status
          )
        `)
        .single();

      if (landlordError) {
        console.error('Error updating landlord:', landlordError);
        return NextResponse.json(
          { error: 'Failed to update landlord' },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedLandlord);
    }

    return NextResponse.json({ message: 'No updates provided' });
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

// DELETE - Deactivate landlord
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    // Get landlord
    const { data: landlord } = await supabase
      .from('Landlord')
      .select('userId')
      .eq('id', params.id)
      .single();

    if (!landlord) {
      return NextResponse.json(
        { error: 'Landlord not found' },
        { status: 404 }
      );
    }

    // Check for active leases
    const { count: activeLeases } = await supabase
      .from('Lease')
      .select('*', { count: 'exact', head: true })
      .eq('landlordId', params.id)
      .eq('status', 'ACTIVE');

    if (activeLeases && activeLeases > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot deactivate landlord with active leases. Please terminate all leases first.',
        },
        { status: 400 }
      );
    }

    // Deactivate user account
    const { error } = await supabase
      .from('User')
      .update({
        status: 'INACTIVE',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', landlord.userId);

    if (error) {
      console.error('Error deactivating landlord:', error);
      return NextResponse.json(
        { error: 'Failed to deactivate landlord' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Landlord deactivated successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

