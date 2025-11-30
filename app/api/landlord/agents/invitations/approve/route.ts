import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST - Approve agent invitation and create account
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
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
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

    // Find the invitation
    const { data: invitationLog } = await supabase
      .from('AuditLog')
      .select('*')
      .eq('id', invitationId)
      .eq('userId', userId)
      .eq('action', 'AGENT_INVITATION_SENT')
      .or('entity.eq.AGENT,entityType.eq.AGENT') // Check both entity and entityType
      .single();

    if (!invitationLog) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Get details from either 'details' or 'metadata' column
    const details = (invitationLog.details || invitationLog.metadata) as any;
    const email = details?.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid invitation data' },
        { status: 400 }
      );
    }

    // Check if account already exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({
        message: 'Agent account already exists',
        invitationId,
        agentId: existingUser.id,
      });
    }

    // Create agent account
    const { generateId } = await import('@/lib/utils');
    const bcrypt = await import('bcryptjs');
    const crypto = await import('node:crypto');

    const tempPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.default.hash(tempPassword, 10);

    const agentUserId = generateId();
    const agentId = generateId();

    // Create user
    const { error: userError } = await supabase.from('User').insert({
      id: agentUserId,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      firstName: details?.firstName || '',
      lastName: details?.lastName || '',
      phone: details?.phone || '',
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

    // Update invitation status
    const updatedDetails = {
      ...details,
      status: 'ACCEPTED',
      agentId,
      approvedAt: new Date().toISOString(),
    };
    
    await supabase
      .from('AuditLog')
      .update({
        action: 'AGENT_INVITATION_APPROVED',
        details: updatedDetails,
        metadata: updatedDetails, // Update both for compatibility
      })
      .eq('id', invitationId);

    // Send welcome email
    let emailSent = false;
    try {
      const { sendEmail, emailTemplates } = await import('@/lib/email');
      const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`;
      const template = emailTemplates.agentInvitation(
        details?.firstName || 'Agent',
        email,
        tempPassword,
        loginLink
      );

      const emailResult = await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (emailResult.success) {
        emailSent = true;
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    return NextResponse.json({
      message: 'Invitation approved and agent account created successfully',
      invitationId,
      agentId,
      emailSent,
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

