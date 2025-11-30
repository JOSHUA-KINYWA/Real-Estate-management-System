import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import crypto from 'node:crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Decode URL-encoded token (in case it was encoded)
    token = decodeURIComponent(token);

    // Log token info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Verifying reset token:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        tokenPattern: /^[a-f0-9]{64}$/.test(token) ? 'Valid hex pattern' : 'Invalid hex pattern',
      });
    }

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const supabase = createServerClient();

    // Look up token in database - use maybeSingle to avoid errors when not found
    const { data: resetRecord, error } = await supabase
      .from('PasswordReset')
      .select('id, userId, token, expiresAt, used, createdAt')
      .eq('token', hashedToken)
      .eq('used', false)
      .maybeSingle();

    if (error) {
      console.error('Error querying PasswordReset table:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      console.error('Query details:', {
        hashedTokenPrefix: hashedToken.substring(0, 20) + '...',
        hashedTokenLength: hashedToken.length,
      });
      return NextResponse.json(
        { valid: false, error: 'Error verifying token. Please try again.' },
        { status: 500 }
      );
    }

    if (!resetRecord) {
      console.log('Token not found in database:', {
        hashedTokenPrefix: hashedToken.substring(0, 20) + '...',
        tokenLength: token.length,
        hashedTokenLength: hashedToken.length,
      });
      
      // In development, also check if there are any tokens in the database
      if (process.env.NODE_ENV === 'development') {
        const { data: allTokens } = await supabase
          .from('PasswordReset')
          .select('id, token, used, expiresAt')
          .eq('used', false)
          .limit(5);
        console.log('Available unused tokens in database:', allTokens?.map(t => ({
          tokenPrefix: t.token.substring(0, 20) + '...',
          expiresAt: t.expiresAt,
        })));
      }
      
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired reset token' },
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
        expiredBy: now.getTime() - expiresAt.getTime(),
      });
      return NextResponse.json(
        { valid: false, error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Get email from user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('email')
      .eq('id', resetRecord.userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      // Still return valid since token is valid, just email lookup failed
    }

    return NextResponse.json({
      valid: true,
      message: 'Token is valid',
      email: user?.email || '',
    });
  } catch (error: any) {
    console.error('Unexpected error in verify-reset-token:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        valid: false, 
        error: error?.message || 'Error verifying token',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

