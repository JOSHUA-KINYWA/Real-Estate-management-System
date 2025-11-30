import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateId } from '@/lib/utils';

// POST - Pay commission to agent
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
    const { agentId, amount, description } = body;

    if (!agentId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Agent ID and valid amount are required' },
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

    // Verify agent exists and is assigned to landlord's properties
    const { data: properties } = await supabase
      .from('Property')
      .select('id')
      .eq('landlordId', landlord.id)
      .eq('agentId', agentId)
      .limit(1);

    if (!properties || properties.length === 0) {
      return NextResponse.json(
        { error: 'Agent is not assigned to any of your properties' },
        { status: 404 }
      );
    }

    // Get agent record
    const { data: agent } = await supabase
      .from('Agent')
      .select('id, totalEarnings')
      .eq('id', agentId)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Create payment record
    const paymentId = generateId();
    const { error: paymentError } = await supabase.from('Payment').insert({
      id: paymentId,
      landlordId: landlord.id,
      agentId,
      amount: Number.parseFloat(amount.toString()),
      type: 'COMMISSION',
      status: 'COMPLETED',
      method: 'BANK_TRANSFER', // Default, can be updated
      description: description || `Commission payment to agent`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      );
    }

    // Update agent's total earnings
    const newTotalEarnings = (agent.totalEarnings || 0) + Number.parseFloat(amount.toString());
    await supabase
      .from('Agent')
      .update({
        totalEarnings: newTotalEarnings,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', agentId);

    return NextResponse.json({
      message: 'Commission paid successfully',
      paymentId,
      amount: Number.parseFloat(amount.toString()),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

