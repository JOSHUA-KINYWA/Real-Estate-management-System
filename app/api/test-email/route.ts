import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';

/**
 * Test endpoint to verify Resend email integration
 * GET /api/test-email?to=your@email.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const to = searchParams.get('to') || 'joshuakinywa087@gmail.com';

    // Test with simple email
    const result = await sendEmail({
      to,
      subject: 'Test Email from Real Estate KE',
      html: '<p>This is a <strong>test email</strong> from your Real Estate application!</p><p>If you received this, Resend is working correctly. ✅</p>',
      text: 'This is a test email from your Real Estate application! If you received this, Resend is working correctly.',
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId,
        to,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Test password reset email template
 * POST /api/test-email
 * Body: { type: 'password-reset', to: 'email@example.com' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, firstName } = body;

    const testEmail = to || 'joshuakinywa087@gmail.com';
    const testFirstName = firstName || 'Test User';

    let template;
    let resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=test_token_12345`;

    switch (type) {
      case 'password-reset':
        template = emailTemplates.passwordReset(testFirstName, resetLink);
        break;
      case 'agent-invitation':
        template = emailTemplates.agentInvitation(
          testFirstName,
          testEmail,
          'TempPassword123!',
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`
        );
        break;
      case 'tenant-welcome':
        template = emailTemplates.tenantWelcome(
          testFirstName,
          testEmail,
          'TempPassword123!',
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use: password-reset, agent-invitation, or tenant-welcome' },
          { status: 400 }
        );
    }

    const result = await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${type} email sent successfully!`,
        messageId: result.messageId,
        to: testEmail,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

