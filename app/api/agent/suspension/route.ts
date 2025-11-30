import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get agent suspension details
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

    // Get agent record
    const { data: agent } = await supabase
      .from('Agent')
      .select('id, userId')
      .eq('userId', userId)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get user status
    const { data: user } = await supabase
      .from('User')
      .select('status')
      .eq('id', userId)
      .single();

    if (user?.status !== 'SUSPENDED') {
      return NextResponse.json({
        suspended: false,
      });
    }

    // Find suspension record in AuditLog
    const { data: suspensionLogs } = await supabase
      .from('AuditLog')
      .select('*')
      .eq('entityId', agent.id)
      .eq('action', 'AGENT_SUSPENDED')
      .order('createdAt', { ascending: false })
      .limit(1);

    const suspensionLog = suspensionLogs?.[0];
    if (!suspensionLog) {
      return NextResponse.json({
        suspended: true,
        reason: 'Account suspended',
        suspensionEndDate: null,
      });
    }

    // Extract details - handle both JSON string and object formats
    let details: any = null;
    try {
      if (suspensionLog.details) {
        details = typeof suspensionLog.details === 'string' 
          ? JSON.parse(suspensionLog.details) 
          : suspensionLog.details;
      } else if (suspensionLog.metadata) {
        details = typeof suspensionLog.metadata === 'string' 
          ? JSON.parse(suspensionLog.metadata) 
          : suspensionLog.metadata;
      }
    } catch (parseError) {
      console.error('Error parsing suspension details:', parseError);
      // If parsing fails, try to get basic info from the log itself
      details = suspensionLog.details || suspensionLog.metadata || {};
    }

    // Ensure reason is always available with proper fallback
    // The reason can be either:
    // 1. An enum value (e.g., "TERMINATING_CONTRACT", "POOR_PERFORMANCE")
    // 2. A custom reason written by the landlord (when "OTHER" is selected)
    const reason = details?.reason || (typeof details === 'string' ? details : 'Account suspended');
    
    // Ensure reason is a string
    const reasonString = typeof reason === 'string' ? reason : String(reason || 'Account suspended');

    return NextResponse.json({
      suspended: true,
      reason: reasonString,
      suspensionDays: details?.suspensionDays || null,
      suspensionStartDate: details?.suspensionStartDate || suspensionLog.createdAt,
      suspensionEndDate: details?.suspensionEndDate || null,
      notes: details?.notes || '',
      createdAt: suspensionLog.createdAt,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

