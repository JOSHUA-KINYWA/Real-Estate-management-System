import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Test endpoint to verify database connection
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Test query - get user count
    const { count, error: countError } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json(
        {
          connected: false,
          error: countError.message,
        },
        { status: 500 }
      );
    }

    // Test query - get landlords count
    const { count: landlordCount, error: landlordError } = await supabase
      .from('Landlord')
      .select('*', { count: 'exact', head: true });

    // Test query - get properties count
    const { count: propertyCount, error: propertyError } = await supabase
      .from('Property')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      connected: true,
      message: 'Database connection successful',
      stats: {
        users: count || 0,
        landlords: landlordCount || 0,
        properties: propertyCount || 0,
      },
      errors: {
        landlord: landlordError?.message,
        property: propertyError?.message,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

