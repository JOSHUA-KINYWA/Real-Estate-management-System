import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import bcrypt from 'bcryptjs';
import { registerSchema, landlordSchema } from '@/lib/validators';

// GET - List all landlords with stats
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    let query = supabase
      .from('Landlord')
      .select(`
        *,
        User:userId (
          id,
          firstName,
          lastName,
          email,
          phone,
          status,
          createdAt
        ),
        Property:Property!landlordId (
          id,
          title,
          status,
          rent
        )
      `)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) {
      query = query.eq('User.status', status);
    }

    const { data: landlords, error } = await query;

    if (error) {
      console.error('Error fetching landlords:', error);
      return NextResponse.json(
        { error: 'Failed to fetch landlords' },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabase
      .from('Landlord')
      .select('*', { count: 'exact', head: true });

    // Calculate stats for each landlord
    const landlordsWithStats = await Promise.all(
      (landlords || []).map(async (landlord: any) => {
        const properties = landlord.Property || [];
        const occupiedProperties = properties.filter(
          (p: any) => p.status === 'OCCUPIED'
        ).length;

        // Get active leases count
        const { count: activeLeases } = await supabase
          .from('Lease')
          .select('*', { count: 'exact', head: true })
          .eq('landlordId', landlord.id)
          .eq('status', 'ACTIVE');

        // Get monthly revenue
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: payments } = await supabase
          .from('Payment')
          .select('amount')
          .eq('status', 'COMPLETED')
          .gte('paidAt', `${currentMonth}-01`)
          .lt('paidAt', `${currentMonth}-32`);

        const monthlyRevenue =
          payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        return {
          ...landlord,
          stats: {
            totalProperties: properties.length,
            occupiedProperties,
            vacantProperties: properties.length - occupiedProperties,
            activeLeases: activeLeases || 0,
            monthlyRevenue,
            occupancyRate:
              properties.length > 0
                ? (occupiedProperties / properties.length) * 100
                : 0,
          },
        };
      })
    );

    return NextResponse.json({
      landlords: landlordsWithStats,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new landlord
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      companyName,
      bankName,
      bankAccount,
      mpesaNumber,
    } = body;

    // Normalize phone number (remove spaces, ensure +254 format)
    const normalizePhone = (phone: string) => {
      if (!phone) return phone;
      const cleaned = phone.replaceAll(/\s/g, '').replaceAll('-', '');
      if (cleaned.startsWith('0')) {
        return '+254' + cleaned.slice(1);
      }
      if (cleaned.startsWith('254')) {
        return '+' + cleaned;
      }
      if (cleaned.startsWith('+254')) {
        return cleaned;
      }
      return cleaned;
    };

    const normalizedPhone = normalizePhone(phone);
    const normalizedMpesa = mpesaNumber ? normalizePhone(mpesaNumber) : undefined;

    // Validate user data
    let userData;
    try {
      userData = registerSchema.pick({
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        phone: true,
      }).parse({
        email,
        password,
        firstName,
        lastName,
        phone: normalizedPhone,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: error.errors.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Validate landlord data (only validate if provided)
    let landlordData;
    try {
      const landlordInput: any = {};
      if (companyName && companyName.trim()) {
        landlordInput.companyName = companyName.trim();
      }
      if (bankName && bankName.trim()) {
        landlordInput.bankName = bankName.trim();
      }
      if (bankAccount && bankAccount.trim()) {
        landlordInput.bankAccount = bankAccount.trim();
      }
      if (normalizedMpesa && normalizedMpesa.trim()) {
        landlordInput.mpesaNumber = normalizedMpesa.trim();
      }
      landlordData = landlordSchema.parse(landlordInput);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: error.errors.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and landlord in transaction
    const userId = generateId();
    const landlordId = generateId();

    // Create user
    const { error: userError } = await supabase
      .from('User')
      .insert({
        id: userId,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: normalizedPhone,
        role: 'LANDLORD',
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

    // Create landlord
    const { data: landlord, error: landlordError } = await supabase
      .from('Landlord')
      .insert({
        id: landlordId,
        userId: userId,
        companyName: landlordData?.companyName || null,
        bankName: landlordData?.bankName || null,
        bankAccount: landlordData?.bankAccount || null,
        mpesaNumber: normalizedMpesa || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select(`
        *,
        User:userId (
          id,
          firstName,
          lastName,
          email,
          phone,
          status
        )
      `)
      .single();

    if (landlordError) {
      // Rollback: delete user if landlord creation fails
      await supabase.from('User').delete().eq('id', userId);
      console.error('Error creating landlord:', landlordError);
      return NextResponse.json(
        { error: 'Failed to create landlord' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        landlord,
        message: 'Landlord created successfully',
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

