import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { emailSchema } from '@/lib/validators';
import crypto from 'node:crypto';

// POST - Send agent invitation link
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
    const { email, firstName, lastName } = body;

    // Validate email
    emailSchema.parse(email);

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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id, email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

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

    const invitationId = generateId();

    // Store invitation in AuditLog
    // Since we don't have an Invitation table, we'll use AuditLog to track invitations
    // In production, you should create a proper Invitation table
    // Store invitation in AuditLog - use both entity and entityType for compatibility
    const { error: inviteError } = await supabase
      .from('AuditLog')
      .insert({
        id: invitationId,
        userId: userId,
        action: 'AGENT_INVITATION_SENT',
        entity: 'AGENT', // Use existing 'entity' column
        entityType: 'AGENT', // Also set entityType if column exists
        entityId: invitationId,
        details: {
          email: email.trim().toLowerCase(),
          firstName: firstName || '',
          lastName: lastName || '',
          token,
          status: 'PENDING',
          expiresAt: expiresAt.toISOString(),
          landlordId: landlord.id,
        },
        metadata: {
          email: email.trim().toLowerCase(),
          firstName: firstName || '',
          lastName: lastName || '',
          token,
          status: 'PENDING',
          expiresAt: expiresAt.toISOString(),
          landlordId: landlord.id,
        },
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error storing invitation in AuditLog:', {
        message: inviteError.message,
        details: inviteError.details,
        hint: inviteError.hint,
        code: inviteError.code,
      });
      
      // If AuditLog doesn't exist, we'll still send the email but log a warning
      if (inviteError.code === '42P01' || inviteError.message?.includes('does not exist')) {
        console.warn('⚠️ AuditLog table not found. Invitation will be sent but cannot be tracked.');
        console.warn('💡 To fix: Create AuditLog table or use a different storage method.');
      } else {
        // For other errors, we should still try to send the email
        console.warn('⚠️ Failed to store invitation, but will still send email');
      }
    } else {
      console.log('✅ Invitation stored successfully:', {
        invitationId,
        email: email.trim().toLowerCase(),
        tokenPrefix: token.substring(0, 20) + '...',
      });
    }

    // Generate invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/register/agent?token=${token}&email=${encodeURIComponent(email)}`;

    // Send invitation email
    let emailSent = false;
    try {
      const { sendEmail, emailTemplates } = await import('@/lib/email');
      const template = emailTemplates.agentInvitation(
        firstName || 'Agent',
        email,
        '', // No password for invitation link
        invitationLink
      );

      const emailResult = await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (emailResult.success) {
        emailSent = true;
        console.log('✅ Agent invitation email sent successfully');
      } else {
        console.error('❌ Failed to send invitation email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending invitation email:', emailError);
    }

    // In development, log the invitation link
    if (process.env.NODE_ENV === 'development') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Agent Invitation Details:');
      console.log('To:', email);
      console.log('Invitation Link:', invitationLink);
      console.log('Token:', token);
      console.log('Email Sent:', emailSent ? '✅ Yes' : '❌ No');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitationId,
      invitationLink: process.env.NODE_ENV === 'development' ? invitationLink : undefined,
      emailSent,
    });
  } catch (error: any) {
    console.error('Error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

