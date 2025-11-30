import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import bcrypt from 'bcryptjs';
import { emailSchema, phoneSchema } from '@/lib/validators';
import crypto from 'node:crypto';

// POST - Create tenant by agent/admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      nationalId,
      dateOfBirth,
      employmentStatus,
      employerName,
      emergencyContact,
      emergencyPhone,
    } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !phone || !nationalId) {
      return NextResponse.json(
        { error: 'Email, name, phone, and national ID are required' },
        { status: 400 }
      );
    }

    emailSchema.parse(email);
    phoneSchema.parse(phone);

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

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const userId = generateId();
    const tenantId = generateId();

    // Create user
    const { error: userError } = await supabase.from('User').insert({
      id: userId,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: 'TENANT',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (userError) {
      console.error('Error creating tenant user:', userError);
      return NextResponse.json(
        { error: 'Failed to create tenant' },
        { status: 500 }
      );
    }

    // Create tenant record
    const { error: tenantError } = await supabase.from('Tenant').insert({
      id: tenantId,
      userId: userId,
      nationalId,
      dateOfBirth: dateOfBirth || null,
      employmentStatus: employmentStatus || null,
      employerName: employerName || null,
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    if (tenantError) {
      // Rollback user creation
      await supabase.from('User').delete().eq('id', userId);
      console.error('Error creating tenant record:', tenantError);
      return NextResponse.json(
        { error: 'Failed to create tenant' },
        { status: 500 }
      );
    }

    // Generate login link
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`;

    // TODO: Send email/SMS with login credentials

    return NextResponse.json(
      {
        message: 'Tenant created successfully',
        tenant: {
          id: tenantId,
          email,
          firstName,
          lastName,
        },
        credentials: {
          email,
          password: tempPassword, // In production, send this via email/SMS
          loginLink,
        },
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

