import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST - Unsuspend agent
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
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
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

    // Get agent record
    const { data: agent } = await supabase
      .from('Agent')
      .select('userId')
      .eq('id', agentId)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if agent is actually suspended
    const { data: user } = await supabase
      .from('User')
      .select('status')
      .eq('id', agent.userId)
      .single();

    if (user?.status !== 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Agent is not suspended' },
        { status: 400 }
      );
    }

    // Reactivate agent - set status to ACTIVE
    const { error: userUpdateError } = await supabase
      .from('User')
      .update({
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', agent.userId);

    if (userUpdateError) {
      console.error('Error unsuspending agent:', userUpdateError);
      return NextResponse.json(
        { error: 'Failed to unsuspend agent' },
        { status: 500 }
      );
    }

    // Reactivate agent record
    const { error: agentUpdateError } = await supabase
      .from('Agent')
      .update({
        active: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', agentId);

    if (agentUpdateError) {
      console.error('Error reactivating agent:', agentUpdateError);
      // Continue anyway as user is already reactivated
    }

    // Create audit log entry for unsuspension
    try {
      await supabase.from('AuditLog').insert({
        userId: userId,
        action: 'AGENT_UNSUSPENDED',
        entityType: 'AGENT',
        entityId: agentId,
        details: {
          agentUserId: agent.userId,
          unsuspendedAt: new Date().toISOString(),
        },
        metadata: {
          agentUserId: agent.userId,
          unsuspendedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      });
    } catch (auditError) {
      // Audit log is optional
      console.log('Audit log not available:', auditError);
    }

    return NextResponse.json({
      message: 'Agent unsuspended successfully',
      agentId,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

