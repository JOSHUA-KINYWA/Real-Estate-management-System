import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { generateId } from '@/lib/utils';
import { z } from 'zod';

const agentRegisterSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z\d]/, 'Password must contain at least one special character'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = agentRegisterSchema.parse(body);

    const supabase = createServerClient();

    // Verify invitation token
    const { data: invitationLogs } = await supabase
      .from('AuditLog')
      .select('*')
      .eq('action', 'AGENT_INVITATION_SENT')
      .or('entity.eq.AGENT,entityType.eq.AGENT') // Check both entity and entityType
      .order('createdAt', { ascending: false })
      .limit(100);

    const invitation = invitationLogs?.find((log) => {
      // Check both 'details' and 'metadata' columns for compatibility
      const details = (log.details || log.metadata) as any;
      return details?.token === validated.token;
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    const details = invitation.details as any;

    // Check if expired
    if (details?.expiresAt) {
      const expiresAt = new Date(details.expiresAt);
      if (new Date() > expiresAt) {
        return NextResponse.json(
          { error: 'Invitation token has expired' },
          { status: 400 }
        );
      }
    }

    // Check if already used
    const normalizedEmail = validated.email.trim().toLowerCase();
    const { data: existingUser } = await supabase
      .from('User')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const agentUserId = generateId();
    const agentId = generateId();

    // Create user
    const { error: userError } = await supabase.from('User').insert({
      id: agentUserId,
      email: normalizedEmail,
      password: hashedPassword,
      firstName: validated.firstName.trim(),
      lastName: validated.lastName.trim(),
      phone: validated.phone?.trim() || '',
      role: 'AGENT',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to create user', details: userError.message },
        { status: 500 }
      );
    }

    // Create agent record
    const { error: agentError } = await supabase.from('Agent').insert({
      id: agentId,
      userId: agentUserId,
      active: true,
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (agentError) {
      // Rollback user creation
      await supabase.from('User').delete().eq('id', agentUserId);
      console.error('Error creating agent:', agentError);
      return NextResponse.json(
        { error: 'Failed to create agent record' },
        { status: 500 }
      );
    }

    // Update invitation status to PENDING_APPROVAL (landlord needs to approve)
    const updatedDetails = {
      ...details,
      status: 'PENDING_APPROVAL',
      agentId,
      agentUserId,
      accountCreatedAt: new Date().toISOString(),
    };
    
    await supabase
      .from('AuditLog')
      .update({
        action: 'AGENT_ACCOUNT_CREATED',
        details: updatedDetails,
        metadata: updatedDetails, // Update both for compatibility
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      message: 'Agent account created successfully',
      agentId,
      email: normalizedEmail,
    });
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

