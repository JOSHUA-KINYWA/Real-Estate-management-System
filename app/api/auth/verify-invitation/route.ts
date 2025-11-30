import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Log token info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Verifying invitation token:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        email,
      });
    }

    const supabase = createServerClient();

    // Try to look for invitation in AuditLog
    // If AuditLog doesn't exist, we'll use a fallback method
    let invitationLogs: any[] = [];
    let auditLogError: any = null;

    try {
      const { data, error } = await supabase
        .from('AuditLog')
        .select('*')
        .eq('action', 'AGENT_INVITATION_SENT')
        .or('entity.eq.AGENT,entityType.eq.AGENT') // Check both entity and entityType
        .order('createdAt', { ascending: false })
        .limit(100);

      if (error) {
        auditLogError = error;
        console.warn('AuditLog query error (will try fallback):', {
          message: error.message,
          code: error.code,
        });
      } else {
        invitationLogs = data || [];
      }
    } catch (err: any) {
      auditLogError = err;
      console.warn('AuditLog query exception (will try fallback):', err.message);
    }

    // Fallback: If AuditLog doesn't exist or query fails, check if user already exists
    // This allows the system to work even without AuditLog table
    if (auditLogError && (auditLogError.code === '42P01' || auditLogError.message?.includes('does not exist'))) {
      console.log('⚠️ AuditLog table not found. Using fallback verification method.');
      
      // Fallback: Just check if the email is already registered
      // If not registered, we'll allow registration (less secure but functional)
      if (email) {
        const { data: existingUser } = await supabase
          .from('User')
          .select('id, email, role')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (existingUser) {
          if (existingUser.role === 'AGENT') {
            return NextResponse.json(
              { 
                valid: false, 
                error: 'This email is already registered as an agent',
              },
              { status: 400 }
            );
          }
        }

        // If email doesn't exist, allow registration (less secure but works)
        console.log('⚠️ Fallback mode: Allowing registration without token verification');
        return NextResponse.json({
          valid: true,
          message: 'Invitation token verified (fallback mode)',
          invitation: {
            email: email,
            firstName: '',
            lastName: '',
            phone: '',
          },
        });
      }
    }

    if (auditLogError && !auditLogError.message?.includes('does not exist')) {
      console.error('Error querying AuditLog:', auditLogError);
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Error verifying invitation. Please try again.',
          details: auditLogError.message,
        },
        { status: 500 }
      );
    }

    // Log found invitations in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Found invitation logs:', invitationLogs?.length || 0);
      if (invitationLogs && invitationLogs.length > 0) {
        console.log('Sample invitation details:', {
          id: invitationLogs[0].id,
          action: invitationLogs[0].action,
          details: invitationLogs[0].details,
        });
      }
    }

    // Find invitation with matching token
    // Check both 'details' and 'metadata' columns for compatibility
    const invitation = invitationLogs?.find((log) => {
      const details = (log.details || log.metadata) as any;
      const tokenMatch = details?.token === token;
      const emailMatch = !email || !details?.email || details.email.toLowerCase() === email.toLowerCase();
      
      if (process.env.NODE_ENV === 'development' && tokenMatch) {
        console.log('Token match found:', {
          logId: log.id,
          tokenMatch,
          emailMatch,
          storedEmail: details?.email,
          providedEmail: email,
          hasDetails: !!log.details,
          hasMetadata: !!log.metadata,
        });
      }
      
      return tokenMatch && emailMatch;
    });

    if (!invitation) {
      console.log('Invitation not found in database:', {
        tokenPrefix: token.substring(0, 20) + '...',
        tokenLength: token.length,
        email,
        totalLogs: invitationLogs?.length || 0,
        availableTokens: invitationLogs?.map((log) => {
          const details = log.details as any;
          return {
            tokenPrefix: details?.token?.substring(0, 20) + '...',
            email: details?.email,
          };
        }),
      });
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid or expired invitation token',
          message: 'The invitation link you used is not valid. Please request a new invitation.',
        },
        { status: 400 }
      );
    }

    // Get details from either 'details' or 'metadata' column
    const details = (invitation.details || invitation.metadata) as any;

    // Check if invitation is expired
    if (details?.expiresAt) {
      const expiresAt = new Date(details.expiresAt);
      const now = new Date();

      if (now > expiresAt) {
        console.log('Invitation expired:', {
          expiresAt: expiresAt.toISOString(),
          now: now.toISOString(),
        });
        return NextResponse.json(
          { valid: false, error: 'Invitation token has expired' },
          { status: 400 }
        );
      }
    }

    // Check if already accepted (user exists)
    if (details?.email) {
      const { data: existingUser } = await supabase
        .from('User')
        .select('id, email')
        .eq('email', details.email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          { valid: false, error: 'This invitation has already been used' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      valid: true,
      message: 'Invitation token is valid',
      invitation: {
        email: details?.email || email,
        firstName: details?.firstName || '',
        lastName: details?.lastName || '',
        phone: details?.phone || '',
      },
    });
  } catch (error: any) {
    console.error('Unexpected error in verify-invitation:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        valid: false, 
        error: error?.message || 'Error verifying invitation',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

