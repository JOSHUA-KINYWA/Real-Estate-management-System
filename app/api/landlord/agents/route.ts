import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - List agents assigned to landlord's properties
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

    // Get all properties for this landlord
    const { data: properties } = await supabase
      .from('Property')
      .select('id, agentId, title')
      .eq('landlordId', landlord.id)
      .not('agentId', 'is', null);

    // Get unique agent IDs from properties
    const agentIdsFromProperties = [...new Set(properties?.map((p) => p.agentId).filter(Boolean) || [])];

    // Also get all approved agents invited by this landlord
    // Find all invitations that were approved or have accounts created
    const { data: agentInvitations } = await supabase
      .from('AuditLog')
      .select('*')
      .eq('userId', userId)
      .in('action', ['AGENT_INVITATION_SENT', 'AGENT_ACCOUNT_CREATED', 'AGENT_ACCOUNT_APPROVED'])
      .or('entity.eq.AGENT,entityType.eq.AGENT')
      .order('createdAt', { ascending: false });

    // Extract agent IDs from invitations - include approved agents
    const agentIdsFromInvitations: string[] = [];
    const agentEmailMap = new Map<string, string>(); // email -> agentId
    
    agentInvitations?.forEach((log) => {
      const details = (log.details || log.metadata) as any;
      const email = details?.email?.trim().toLowerCase();
      const agentId = details?.agentId;
      
      // Store email -> agentId mapping
      if (email && agentId) {
        agentEmailMap.set(email, agentId);
      }
      
      // If this is an approval action or account created with APPROVED status, include the agent
      const isApproved = log.action === 'AGENT_ACCOUNT_APPROVED' || 
                        (log.action === 'AGENT_ACCOUNT_CREATED' && details?.status === 'APPROVED');
      if (isApproved && agentId) {
        agentIdsFromInvitations.push(agentId);
      }
    });
    
    // Also check for agents by email - if user exists and is active, include them
    const invitationEmails = Array.from(agentEmailMap.keys());
    if (invitationEmails.length > 0) {
      const { data: agentUsers } = await supabase
        .from('User')
        .select('id, email, status')
        .in('email', invitationEmails)
        .eq('role', 'AGENT')
        .eq('status', 'ACTIVE');
      
      agentUsers?.forEach((user) => {
        const agentId = agentEmailMap.get(user.email);
        if (agentId && !agentIdsFromInvitations.includes(agentId)) {
          agentIdsFromInvitations.push(agentId);
        }
      });
    }

    // Combine both sets of agent IDs
    const allAgentIds = [...new Set([...agentIdsFromProperties, ...agentIdsFromInvitations])];

    if (allAgentIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get agent records
    const { data: agentRecords } = await supabase
      .from('Agent')
      .select('*')
      .in('id', allAgentIds);

    // Get user records for agents
    const userIds = agentRecords?.map((a) => a.userId) || [];
    const { data: users } = await supabase
      .from('User')
      .select('*')
      .in('id', userIds);

    // Combine data and add assigned properties
    const agents = agentRecords?.map((agent) => {
      const user = users?.find((u) => u.id === agent.userId);
      const assignedProperties = properties?.filter((p) => p.agentId === agent.id) || [];
      
      // Check if agent is approved (active and user status is ACTIVE)
      const isApproved = agent.active === true && user?.status === 'ACTIVE';
      
      // Calculate pending commission (simplified - in production, calculate from actual payments)
      const pendingCommission = assignedProperties.reduce((sum, prop) => {
        const monthlyRent = (prop as any).rent || 0;
        const commission = agent.commissionRate 
          ? (monthlyRent * agent.commissionRate) / 100 
          : 0;
        return sum + commission;
      }, 0);

      return {
        ...agent,
        User: user,
        assignedProperties,
        pendingCommission,
        isApproved,
      };
    });

    return NextResponse.json(agents || []);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

