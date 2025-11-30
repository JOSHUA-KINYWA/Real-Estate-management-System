import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST - Assign agent to property
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
    const { agentId, propertyId, commissionRate } = body;

    if (!agentId || !propertyId) {
      return NextResponse.json(
        { error: 'Agent ID and Property ID are required' },
        { status: 400 }
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

    // Verify property belongs to landlord
    const { data: property, error: propertyError } = await supabase
      .from('Property')
      .select('id, landlordId')
      .eq('id', propertyId)
      .eq('landlordId', landlord.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('Agent')
      .select('id, active')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    if (!agent.active) {
      return NextResponse.json(
        { error: 'Agent is not active' },
        { status: 400 }
      );
    }

    // Update property with agent ID
    const { error: updateError } = await supabase
      .from('Property')
      .update({
        agentId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', propertyId);

    if (updateError) {
      console.error('Error assigning agent:', updateError);
      return NextResponse.json(
        { error: 'Failed to assign agent' },
        { status: 500 }
      );
    }

    // Update agent commission rate if provided
    if (commissionRate !== null && commissionRate !== undefined) {
      await supabase
        .from('Agent')
        .update({
          commissionRate: Number.parseFloat(commissionRate.toString()),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', agentId);
    }

    return NextResponse.json({
      message: 'Agent assigned successfully',
      agentId,
      propertyId,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

