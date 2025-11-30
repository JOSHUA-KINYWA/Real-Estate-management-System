import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { emailSchema } from '@/lib/validators';
import crypto from 'node:crypto';

// POST - Create agent invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, phone } = body;

    // Validate email
    emailSchema.parse(email);

    const supabase = createServerClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Store invitation (you might want to create an Invitation table)
    // For now, we'll create the user with a temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const userId = generateId();
    const agentId = generateId();

    // Create user
    const { error: userError } = await supabase.from('User').insert({
      id: userId,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      role: 'AGENT',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (userError) {
      console.error('Error creating agent:', userError);
      return NextResponse.json(
        { error: 'Failed to create agent invitation' },
        { status: 500 }
      );
    }

    // Create agent record
    const { error: agentError } = await supabase.from('Agent').insert({
      id: agentId,
      userId: userId,
      active: true,
      updatedAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    });

    if (agentError) {
      // Rollback user creation
      await supabase.from('User').delete().eq('id', userId);
      console.error('Error creating agent record:', agentError);
      return NextResponse.json(
        { error: 'Failed to create agent invitation' },
        { status: 500 }
      );
    }

    // Generate invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/invite/agent?token=${token}&email=${encodeURIComponent(email)}`;

    // TODO: Send invitation email with link and temporary password

    return NextResponse.json(
      {
        message: 'Agent invitation created successfully',
        invitationLink,
        tempPassword, // In production, send this via email
        email,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

