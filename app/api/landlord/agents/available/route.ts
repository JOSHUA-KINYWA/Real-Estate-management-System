import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - List all available agents that can be assigned
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

    // Fetch all active agents
    const { data: agentRecords, error: agentError } = await supabase
      .from('Agent')
      .select('*')
      .eq('active', true)
      .order('joinedAt', { ascending: false });

    if (agentError) {
      console.error('Error fetching agents:', agentError);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    // Get user records for agents
    const userIds = agentRecords?.map((a) => a.userId) || [];
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('*')
      .in('id', userIds)
      .eq('status', 'ACTIVE');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch agent users' },
        { status: 500 }
      );
    }

    // Combine agent and user data
    const agents = agentRecords?.map((agent) => {
      const user = users?.find((u) => u.id === agent.userId);
      return {
        ...agent,
        User: user,
      };
    }).filter((agent) => agent.User); // Only return agents with valid users

    return NextResponse.json(agents || []);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

