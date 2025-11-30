import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { emailSchema } from '@/lib/validators';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email } = body;

    // Trim and lowercase email for consistent checking
    email = email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', emailExists: false },
        { status: 400 }
      );
    }

    // Validate email format
    emailSchema.parse(email);

    const supabase = createServerClient();

    // Check if user exists - use case-insensitive search
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, email, firstName, lastName')
      .ilike('email', email); // Case-insensitive match

    // Get first matching user or try exact match
    let user = users?.[0];
    if (!user && !userError) {
      const { data: exactMatch } = await supabase
        .from('User')
        .select('id, email, firstName, lastName')
        .eq('email', email)
        .maybeSingle();
      
      user = exactMatch;
    }

    // Check if email is registered
    if (userError || !user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
        emailExists: false,
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Hash the token for storage
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Generate ID for password reset record
    const resetId = crypto.randomBytes(16).toString('hex');

    // Store reset token in database
    const { error: resetError } = await supabase
      .from('PasswordReset')
      .insert({
        id: resetId,
        userId: user.id,
        token: hashedToken,
        expiresAt: expiresAt.toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    if (resetError) {
      console.error('Error storing reset token:', resetError);
      // Still return success to prevent email enumeration
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Token is a hex string (URL-safe), but encode it to be safe
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    // Send email with reset link
    let emailSent = false;
    let emailError: string | undefined;
    
    try {
      const { sendEmail, emailTemplates } = await import('@/lib/email');
      const template = emailTemplates.passwordReset(user.firstName || 'User', resetLink);
      
      const emailResult = await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (emailResult.success) {
        emailSent = true;
        console.log('✅ Password reset email sent successfully to:', user.email);
        console.log('Email ID:', emailResult.messageId);
      } else {
        emailError = emailResult.error;
        console.error('❌ Failed to send password reset email:', emailResult.error);
      }
    } catch (emailError_) {
      emailError = emailError_ instanceof Error ? emailError_.message : 'Unknown error';
      console.error('❌ Error sending password reset email:', emailError_);
    }

    // For development, always log the reset link (even if email failed)
    if (process.env.NODE_ENV === 'development') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Password Reset Email Details:');
      console.log('To:', user.email);
      console.log('Reset Link:', resetLink);
      console.log('Token:', resetToken);
      console.log('Email Sent:', emailSent ? '✅ Yes' : '❌ No');
      if (emailError) {
        console.log('Error:', emailError);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      emailExists: true,
      // Only return link in development
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    });
  } catch (error: any) {
    console.error('Error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      emailExists: false,
    });
  }
}

