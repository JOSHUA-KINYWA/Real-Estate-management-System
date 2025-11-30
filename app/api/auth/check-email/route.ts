import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { emailSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email } = body;

    // Trim and lowercase email for consistent checking
    email = email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', exists: false },
        { status: 400 }
      );
    }

    // Validate email format
    emailSchema.parse(email);

    const supabase = createServerClient();

    // Check if user exists - use multiple methods for reliability
    // Method 1: Case-insensitive search with ilike
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, email')
      .ilike('email', email);

    let user = users?.[0];

    // Method 2: If ilike didn't work, try exact match
    if (!user) {
      const { data: exactMatch } = await supabase
        .from('User')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();
      
      user = exactMatch ?? undefined;
    }

    // Note: If ilike and eq don't work, the email doesn't exist
    // We rely on the first two methods which should be sufficient

    // Debug logging for troubleshooting
    if (process.env.NODE_ENV === 'development') {
      console.log('Email check debug:', {
        searchedEmail: email,
        foundUsers: users?.length || 0,
        userFound: !!user,
        userEmail: user?.email,
        userError: userError?.message,
      });
    }

    // Return whether email exists
    const exists = !!user;
    
    return NextResponse.json({
      exists,
      email: user?.email || email, // Return the actual email from DB if found
    });
  } catch (error: any) {
    console.error('Error checking email:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid email address format', exists: false },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error checking email', exists: false },
      { status: 500 }
    );
  }
}

