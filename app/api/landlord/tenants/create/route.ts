import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { emailSchema, phoneSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

// POST - Create tenant account directly
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
    const { email, firstName, lastName, phone, idNumber } = body;

    // Validate inputs
    emailSchema.parse(email);
    if (phone) {
      phoneSchema.parse(phone);
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

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    const { data: existingUser } = await supabase
      .from('User')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const tenantUserId = generateId();
    const tenantId = generateId();

    // Create user
    const { error: userError } = await supabase.from('User').insert({
      id: tenantUserId,
      email: normalizedEmail,
      password: hashedPassword,
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      phone: phone?.trim() || '',
      role: 'TENANT',
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

    // Create tenant record
    const { error: tenantError } = await supabase.from('Tenant').insert({
      id: tenantId,
      userId: tenantUserId,
      idNumber: idNumber?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (tenantError) {
      // Rollback user creation
      await supabase.from('User').delete().eq('id', tenantUserId);
      console.error('Error creating tenant:', tenantError);
      return NextResponse.json(
        { error: 'Failed to create tenant record' },
        { status: 500 }
      );
    }

    // Send welcome email with credentials
    let emailSent = false;
    try {
      const { sendEmail, emailTemplates } = await import('@/lib/email');
      const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`;
      const template = emailTemplates.tenantWelcome(
        firstName || 'Tenant',
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
        console.log('✅ Tenant welcome email sent successfully');
      } else {
        console.error('❌ Failed to send welcome email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError);
    }

    // In development, log the credentials
    if (process.env.NODE_ENV === 'development') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Tenant Account Created:');
      console.log('Email:', email);
      console.log('Temporary Password:', tempPassword);
      console.log('Email Sent:', emailSent ? '✅ Yes' : '❌ No');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    return NextResponse.json({
      message: 'Tenant account created successfully',
      tenantId,
      email,
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
      emailSent,
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

