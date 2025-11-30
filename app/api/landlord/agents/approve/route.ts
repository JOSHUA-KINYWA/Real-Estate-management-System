import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST - Approve agent account
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
    const { agentId, invitationId } = body;

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

    // Verify agent exists and get user ID
    const { data: agent } = await supabase
      .from('Agent')
      .select('id, userId, active')
      .eq('id', agentId)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Activate agent account
    const { error: updateError } = await supabase
      .from('Agent')
      .update({
        active: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', agentId);

    if (updateError) {
      console.error('Error activating agent:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve agent' },
        { status: 500 }
      );
    }

    // Update user status to ACTIVE if it's not already
    const { error: userUpdateError } = await supabase
      .from('User')
      .update({
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', agent.userId);

    if (userUpdateError) {
      console.error('Error updating user status:', userUpdateError);
      // Don't fail, just log
    }

    // Update invitation status to APPROVED
    if (invitationId) {
      const { data: invitationLog } = await supabase
        .from('AuditLog')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (invitationLog) {
        const details = (invitationLog.details || invitationLog.metadata) as any;
        const updatedDetails = {
          ...details,
          status: 'APPROVED',
          approvedAt: new Date().toISOString(),
          approvedBy: userId,
        };

        await supabase
          .from('AuditLog')
          .update({
            action: 'AGENT_ACCOUNT_APPROVED',
            details: updatedDetails,
            metadata: updatedDetails,
          })
          .eq('id', invitationId);
      }
    }

    return NextResponse.json({
      message: 'Agent account approved successfully',
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

