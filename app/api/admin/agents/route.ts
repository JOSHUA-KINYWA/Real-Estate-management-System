import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - List all agents
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Fetch all users with AGENT role
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('*')
      .eq('role', 'AGENT')
      .order('createdAt', { ascending: false });

    if (usersError) {
      console.error('Error fetching agents:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    // Fetch agent records for additional info
    const userIds = users?.map((u) => u.id) || [];
    const { data: agentRecords } = await supabase
      .from('Agent')
      .select('*')
      .in('userId', userIds);

    // Combine user and agent data
    const agents = users?.map((user) => {
      const agentRecord = agentRecords?.find((a) => a.userId === user.id);
      return {
        ...user,
        active: agentRecord?.active || false,
        joinedAt: agentRecord?.joinedAt || user.createdAt,
      };
    });

    return NextResponse.json({ agents: agents || [] }, { status: 200 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

