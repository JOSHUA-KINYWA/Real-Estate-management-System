import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validators';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Only allow LANDLORD role registration
    if (body.role && body.role !== 'LANDLORD') {
      return NextResponse.json(
        {
          error: 'Only landlords can register directly. Agents and tenants require invitation.',
        },
        { status: 403 }
      );
    }

    // Force role to LANDLORD
    const registrationData = {
      ...body,
      role: 'LANDLORD',
    };

    const validated = registerSchema.parse(registrationData);

    const supabase = createServerClient();
    
    // Verify Supabase connection and API key
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { 
          error: 'Database configuration error. Please check environment variables.',
        },
        { status: 500 }
      );
    }

    // Normalize email for checking
    const normalizedEmail = validated.email.trim().toLowerCase();

    // Check if user already exists - case-insensitive check
    const { data: existingUsers } = await supabase
      .from('User')
      .select('id, email')
      .ilike('email', normalizedEmail);

    // Also check exact match as fallback
    let existingUser = existingUsers?.[0];
    if (!existingUser) {
      const { data: exactMatch } = await supabase
        .from('User')
        .select('id, email')
        .eq('email', normalizedEmail)
        .maybeSingle();
      
      existingUser = exactMatch;
    }

    if (existingUser) {
      console.log('Registration blocked - email already exists:', {
        searchedEmail: normalizedEmail,
        foundEmail: existingUser.email,
      });
      return NextResponse.json(
        { 
          error: 'An account with this email already exists. Please sign in instead.',
          existingAccount: true
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create user with normalized email
    const userId = generateId();
    const now = new Date().toISOString();
    
    // Prepare user data - ensure all required fields are present
    const userData: {
      id: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      role: 'LANDLORD';
      status: 'ACTIVE';
      createdAt: string;
      updatedAt: string;
    } = {
      id: userId,
      email: normalizedEmail, // Use normalized email
      password: hashedPassword,
      firstName: validated.firstName.trim(),
      lastName: validated.lastName.trim(),
      phone: validated.phone.trim(),
      role: 'LANDLORD', // Explicitly set to LANDLORD
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    console.log('Creating user with data:', {
      ...userData,
      password: '[HIDDEN]',
    });

    // Insert user - don't use .single() initially to avoid errors
    const { data: insertedUsers, error: userError } = await supabase
      .from('User')
      .insert(userData)
      .select();

    const user = insertedUsers?.[0];

    if (userError || !user) {
      console.error('User creation error:', userError);
      console.error('Error details:', {
        code: userError?.code,
        message: userError?.message,
        details: userError?.details,
        hint: userError?.hint,
        insertedUsers,
      });
      
      // Return more detailed error message
      let errorMessage = 'Failed to create user';
      if (userError?.message) {
        errorMessage = userError.message;
      } else if (userError?.code === '23505') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (userError?.code === '23502') {
        errorMessage = 'Missing required field. Please check all fields are filled.';
      } else if (!user) {
        errorMessage = 'User was not created. Please try again.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: userError?.details || userError?.message || 'No user returned from database',
          code: userError?.code,
          debug: process.env.NODE_ENV === 'development' ? {
            userData: { ...userData, password: '[HIDDEN]' },
            error: userError,
          } : undefined,
        },
        { status: 500 }
      );
    }

    // Create landlord record
    const landlordId = generateId();
    const landlordData = {
      id: landlordId,
      userId: userId,
      companyName: body.companyName?.trim() || null,
      updatedAt: now,
      createdAt: now,
    };

    console.log('Creating landlord with data:', landlordData);

    const { error: landlordError } = await supabase
      .from('Landlord')
      .insert(landlordData);

    if (landlordError) {
      console.error('Landlord creation error:', landlordError);
      // Rollback user creation if landlord creation fails
      await supabase.from('User').delete().eq('id', userId);
      return NextResponse.json(
        { 
          error: 'Failed to create landlord profile',
          details: landlordError.message,
        },
        { status: 500 }
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    console.log('✅ Registration successful:', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        user: userWithoutPassword,
        message: 'Registration successful',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors,
          message: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
}

