import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - List agent invitations sent by landlord
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

    // Fetch invitations from AuditLog
    // Query for both AGENT_INVITATION_SENT and AGENT_ACCOUNT_CREATED actions
    // In production, create a proper Invitation table
    const { data: auditLogs } = await supabase
      .from('AuditLog')
      .select('*')
      .eq('userId', userId)
      .in('action', ['AGENT_INVITATION_SENT', 'AGENT_ACCOUNT_CREATED', 'AGENT_ACCOUNT_APPROVED'])
      .or('entity.eq.AGENT,entityType.eq.AGENT') // Check both entity and entityType
      .order('createdAt', { ascending: false });

    // Transform audit logs to invitation format
    // Group by email to handle multiple actions for the same invitation
    const invitationMap = new Map<string, any>();
    
    auditLogs?.forEach((log) => {
      // Get details from either 'details' or 'metadata' column
      const details = (log.details || log.metadata) as any;
      const email = details?.email?.trim().toLowerCase() || '';
      
      if (email === '') return; // Skip if no email
      
      // If we already have this invitation, update it with newer information
      const existing = invitationMap.get(email);
      
      // Determine status based on action and details
      let status = details?.status || 'PENDING';
      
      // If action is AGENT_ACCOUNT_CREATED, status should be PENDING_APPROVAL
      if (log.action === 'AGENT_ACCOUNT_CREATED') {
        status = 'PENDING_APPROVAL';
      } else if (log.action === 'AGENT_ACCOUNT_APPROVED') {
        status = 'APPROVED';
      }
      
      // Check expiration
      const expiresAt = details?.expiresAt ? new Date(details.expiresAt) : null;
      const isExpired = expiresAt && new Date() > expiresAt;
      if (isExpired && status === 'PENDING') {
        status = 'EXPIRED';
      }
      
      // Use the most recent log entry or merge information
      if (!existing || new Date(log.createdAt) > new Date(existing.createdAt)) {
        invitationMap.set(email, {
          id: log.id,
          email,
          firstName: details?.firstName || '',
          lastName: details?.lastName || '',
          phone: details?.phone || '',
          status,
          createdAt: log.createdAt,
          expiresAt: details?.expiresAt || null,
          token: details?.token || null,
          agentId: details?.agentId || null,
          agentUserId: details?.agentUserId || null,
          accountCreatedAt: details?.accountCreatedAt || null,
          invitationSentAt: log.action === 'AGENT_INVITATION_SENT' ? log.createdAt : (existing?.invitationSentAt || log.createdAt),
          logDetails: details,
          action: log.action, // Store action for debugging
        });
      } else {
        // Merge information from newer log if it has more details
        const existingDetails = existing.logDetails || {};
        const mergedDetails = { ...existingDetails, ...details };
        
        invitationMap.set(email, {
          ...existing,
          status: status === 'PENDING' ? existing.status : status, // Prefer non-pending status
          agentId: details?.agentId || existing.agentId,
          agentUserId: details?.agentUserId || existing.agentUserId,
          accountCreatedAt: details?.accountCreatedAt || existing.accountCreatedAt,
          logDetails: mergedDetails,
        });
      }
    });
    
    const invitations = Array.from(invitationMap.values());

    // Check which invitations have been accepted (agent account created)
    const emails = invitations.map((inv) => inv.email).filter(Boolean);
    if (emails.length > 0) {
      const { data: users } = await supabase
        .from('User')
        .select('email, role, id')
        .in('email', emails)
        .eq('role', 'AGENT');

      const userMap = new Map(users?.map((u) => [u.email, u]) || []);

      invitations.forEach((inv) => {
        const user = userMap.get(inv.email);
        if (user) {
          inv.userId = user.id;
          
          // If user exists but status is still PENDING, check if it should be PENDING_APPROVAL
          if (inv.status === 'PENDING' && inv.action !== 'AGENT_INVITATION_SENT') {
            // Account was created, so it should be PENDING_APPROVAL
            inv.status = 'PENDING_APPROVAL';
          }
        }
      });

      // Clean up internal fields before returning
      invitations.forEach((inv) => {
        const invAny = inv as { logDetails?: any; action?: string };
        delete invAny.logDetails;
        delete invAny.action;
      });
    }

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

