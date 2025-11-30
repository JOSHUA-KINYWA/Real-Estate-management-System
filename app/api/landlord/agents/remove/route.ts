import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateId } from '@/lib/utils';

// POST - Suspend agent from landlord's properties
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
    const { agentId, reason, suspensionDays, notes } = body;

    if (!agentId || !reason) {
      return NextResponse.json(
        { error: 'Agent ID and reason are required' },
        { status: 400 }
      );
    }

    if (!suspensionDays || suspensionDays < 1) {
      return NextResponse.json(
        { error: 'Suspension duration (days) is required and must be at least 1 day' },
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

    // Get all properties assigned to this agent by this landlord
    const { data: properties } = await supabase
      .from('Property')
      .select('id, title')
      .eq('landlordId', landlord.id)
      .eq('agentId', agentId);

    // Calculate suspension end date
    const suspensionStartDate = new Date();
    const suspensionEndDate = new Date();
    suspensionEndDate.setDate(suspensionEndDate.getDate() + Number(suspensionDays));

    // Suspend agent - set status to SUSPENDED
    const { error: userUpdateError } = await supabase
      .from('User')
      .update({
        status: 'SUSPENDED',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', agent.userId);

    if (userUpdateError) {
      console.error('Error suspending agent:', userUpdateError);
      return NextResponse.json(
        { error: 'Failed to suspend agent' },
        { status: 500 }
      );
    }

    // Deactivate agent record
    const { error: agentUpdateError } = await supabase
      .from('Agent')
      .update({
        active: false,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', agentId);

    if (agentUpdateError) {
      console.error('Error deactivating agent:', agentUpdateError);
      // Continue anyway as user is already suspended
    }

    // Remove agent from all properties
    const propertyIds = properties?.map((p) => p.id) || [];
    if (propertyIds.length > 0) {
      const { error: updateError } = await supabase
        .from('Property')
        .update({
          agentId: null,
          updatedAt: new Date().toISOString(),
        })
        .in('id', propertyIds);

      if (updateError) {
        console.error('Error removing agent from properties:', updateError);
        // Continue anyway
      }
    }

    // Create audit log entry for suspension
    const suspensionId = generateId();
    try {
      await supabase.from('AuditLog').insert({
        id: suspensionId,
        userId: userId,
        action: 'AGENT_SUSPENDED',
        entityType: 'AGENT',
        entityId: agentId,
        details: {
          reason,
          suspensionDays: Number(suspensionDays),
          suspensionStartDate: suspensionStartDate.toISOString(),
          suspensionEndDate: suspensionEndDate.toISOString(),
          notes: notes || '',
          propertiesRemoved: propertyIds,
          agentUserId: agent.userId,
        },
        metadata: {
          reason,
          suspensionDays: Number(suspensionDays),
          suspensionStartDate: suspensionStartDate.toISOString(),
          suspensionEndDate: suspensionEndDate.toISOString(),
          notes: notes || '',
          propertiesRemoved: propertyIds,
          agentUserId: agent.userId,
        },
        createdAt: new Date().toISOString(),
      });
    } catch (auditError) {
      // Audit log is optional, don't fail if it doesn't exist
      console.log('Audit log not available:', auditError);
    }

    return NextResponse.json({
      message: 'Agent suspended successfully',
      agentId,
      suspensionDays: Number(suspensionDays),
      suspensionEndDate: suspensionEndDate.toISOString(),
      propertiesRemoved: propertyIds.length,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

