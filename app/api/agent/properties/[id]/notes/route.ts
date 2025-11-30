import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST - Save notes for a property
export async function POST(
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
      .select('id')
      .eq('userId', userId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Verify property is assigned to this agent
    const { data: property, error: propertyError } = await supabase
      .from('Property')
      .select('id, agentId')
      .eq('id', propertyId)
      .eq('agentId', agent.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Get notes from request body
    const { notes } = await request.json();

    // Update property notes
    const { data: updatedProperty, error: updateError } = await supabase
      .from('Property')
      .update({ 
        notes: notes || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .select('notes')
      .single();

    if (updateError) {
      console.error('Error updating notes:', updateError);
      return NextResponse.json(
        { error: 'Failed to save notes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notes: updatedProperty.notes || '',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

