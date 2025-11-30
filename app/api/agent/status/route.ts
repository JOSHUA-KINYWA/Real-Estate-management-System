import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Check agent approval status
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
    const { data: agent, error: agentError } = await supabase
      .from('Agent')
      .select('*')
      .eq('userId', userId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get user record
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if agent is suspended
    const suspended = user.status === 'SUSPENDED';
    
    // Check if agent is approved (active and user status is ACTIVE)
    const approved = agent.active === true && user.status === 'ACTIVE';
    
    // Suspended agents were previously approved, so allow dashboard access
    // They can see dashboard but cannot perform actions
    // Even if agent.active is false when suspended, they should still access dashboard
    const canAccessDashboard = approved || suspended;
    
    let status = 'PENDING_APPROVAL';
    if (suspended) {
      status = 'SUSPENDED';
    } else if (approved) {
      status = 'APPROVED';
    }

    return NextResponse.json({
      agent,
      user,
      approved: canAccessDashboard, // Suspended agents can access dashboard
      suspended,
      status,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

