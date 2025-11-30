import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Decode URL-encoded token (in case it was encoded)
    token = decodeURIComponent(token);

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z\d]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, number, and special character' },
        { status: 400 }
      );
    }

    // Hash the token to look it up
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const supabase = createServerClient();

    // Look up token in PasswordReset table - use maybeSingle to avoid errors when not found
    const { data: resetRecord, error: resetError } = await supabase
      .from('PasswordReset')
      .select('*, User:userId(id, email)')
      .eq('token', hashedToken)
      .eq('used', false)
      .maybeSingle();

    if (resetError) {
      console.error('Error querying PasswordReset table:', resetError);
      console.error('Error details:', {
        message: resetError.message,
        details: resetError.details,
        hint: resetError.hint,
        code: resetError.code,
      });
      return NextResponse.json(
        { error: 'Error verifying token. Please try again.' },
        { status: 500 }
      );
    }

    if (!resetRecord) {
      console.log('Token not found in database:', {
        hashedTokenPrefix: hashedToken.substring(0, 20) + '...',
        tokenLength: token.length,
      });
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(resetRecord.expiresAt);
    const now = new Date();

    if (now > expiresAt) {
      console.log('Token expired:', {
        expiresAt: expiresAt.toISOString(),
        now: now.toISOString(),
      });
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Get user ID from reset record
    const userId = resetRecord.userId;

    if (!userId) {
      console.error('No userId found in reset record:', resetRecord);
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    const { error: updateError } = await supabase
      .from('User')
      .update({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Mark reset token as used
    await supabase
      .from('PasswordReset')
      .update({
        used: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', resetRecord.id);

    return NextResponse.json({
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

