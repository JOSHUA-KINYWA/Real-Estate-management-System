/**
 * Email Service Utility
 * Supports multiple email providers (SMTP/Gmail, Resend, SendGrid, Mailgun)
 * 
 * Default: SMTP (Gmail with app password)
 */

// Resend (Alternative)
import { Resend } from 'resend';

// Nodemailer for SMTP (Gmail, etc.)
import nodemailer from 'nodemailer';

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp'; // 'smtp' | 'resend' | 'sendgrid' | 'mailgun'

// Initialize Resend (if using)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Initialize Nodemailer SMTP transporter (Gmail, etc.)
let smtpTransporter: nodemailer.Transporter | null = null;
if (EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

// Initialize SendGrid (if using)
// if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// }

// Initialize Mailgun (if using)
// const mailgun = process.env.MAILGUN_API_KEY
//   ? new Mailgun(formData).client({
//       username: 'api',
//       key: process.env.MAILGUN_API_KEY || '',
//     })
//   : null;

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send email using configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Use email from env or default
  const from = options.from || process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@realestatepro.ke';

  // In production, always send emails
  // In development, send if ENABLE_EMAIL is true, otherwise log
  const isDevelopment = process.env.NODE_ENV === 'development';
  const enableEmail = process.env.ENABLE_EMAIL === 'true';
  
  if (isDevelopment && !enableEmail) {
    console.log('📧 Email (Development Mode - set ENABLE_EMAIL=true in .env.local to send):');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('From:', from);
    const htmlPreview = options.html.length > 100 ? options.html.substring(0, 100) + '...' : options.html;
    console.log('HTML Preview:', htmlPreview);
    console.log('💡 Tip: Add ENABLE_EMAIL=true to .env.local to actually send emails');
    return { success: true, messageId: 'dev-mode' };
  }
  
  // Check if email provider is configured
  if (EMAIL_PROVIDER === 'smtp' && !smtpTransporter) {
    const errorMsg = 'SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in environment variables.';
    console.error(errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
  
  if (EMAIL_PROVIDER === 'resend' && !resend) {
    const errorMsg = 'Resend API key not configured. Please set RESEND_API_KEY in environment variables.';
    console.error(errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
  
  // Log that we're sending email (in both dev and prod)
  if (isDevelopment && enableEmail) {
    console.log('📧 Sending email (Development with ENABLE_EMAIL=true):');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Provider:', EMAIL_PROVIDER);
  }

  try {
    switch (EMAIL_PROVIDER) {
      case 'smtp':
        return await sendWithSMTP(options, from);
      
      case 'resend':
        return await sendWithResend(options, from);
      
      case 'sendgrid':
        return await sendWithSendGrid(options, from);
      
      case 'mailgun':
        return await sendWithMailgun(options, from);
      
      default:
        throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`);
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send email using SMTP (Gmail, etc.)
 */
async function sendWithSMTP(
  options: EmailOptions,
  from: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!smtpTransporter) {
    return {
      success: false,
      error: 'SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in environment variables.',
    };
  }

  try {
    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    
    const info = await smtpTransporter.sendMail({
      from: `"Real Estate KE" <${from}>`,
      to: toArray.join(', '),
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: (() => {
        if (!options.cc) return undefined;
        return Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
      })(),
      bcc: (() => {
        if (!options.bcc) return undefined;
        return Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;
      })(),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email via SMTP',
    };
  }
}

/**
 * Send email using Resend
 */
async function sendWithResend(
  options: EmailOptions,
  from: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    return {
      success: false,
      error: 'Resend API key not configured. Please set RESEND_API_KEY in environment variables.',
    };
  }

    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    const ccArray = (() => {
      if (!options.cc) return undefined;
      return Array.isArray(options.cc) ? options.cc : [options.cc];
    })();
    const bccArray = (() => {
      if (!options.bcc) return undefined;
      return Array.isArray(options.bcc) ? options.bcc : [options.bcc];
    })();

    const { data, error } = await resend.emails.send({
      from,
      to: toArray,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      cc: ccArray,
      bcc: bccArray,
    });

  if (error) {
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }

  return {
    success: true,
    messageId: data?.id,
  };
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(
  options: EmailOptions,
  from: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  throw new Error('SendGrid not implemented. Install @sendgrid/mail package to use.');
}

/**
 * Send email using Mailgun
 */
async function sendWithMailgun(
  options: EmailOptions,
  from: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  throw new Error('Mailgun not implemented. Install mailgun.js package to use.');
}

/**
 * Email Templates
 */

export const emailTemplates = {
  /**
   * Password Reset Email
   */
  passwordReset: (firstName: string, resetLink: string) => ({
    subject: 'Password Reset Request - Real Estate KE',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Real Estate KE</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p>Hello ${firstName},</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #667eea; font-size: 12px; word-break: break-all;">${resetLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              This link will expire in 1 hour.<br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request - Real Estate KE

      Hello ${firstName},

      You requested to reset your password. Click the link below to reset it:

      ${resetLink}

      This link will expire in 1 hour.

      If you didn't request this, please ignore this email.
    `,
  }),

  /**
   * Agent Invitation Email
   */
  agentInvitation: (firstName: string, email: string, password: string, link: string) => {
    const isInvitation = !password; // If no password, it's an invitation link
    return {
      subject: isInvitation 
        ? 'Agent Invitation - Real Estate KE' 
        : 'Welcome to Real Estate KE - Agent Account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Real Estate KE</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">${isInvitation ? 'You\'ve been invited!' : 'Welcome, ' + firstName + '!'}</h2>
              <p>${isInvitation 
                ? `You've been invited to join Real Estate KE as an Agent. Click the link below to create your account.` 
                : `You've been approved to join Real Estate KE as an Agent.`}</p>
              ${!isInvitation ? `
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Your Login Credentials:</strong></p>
                  <p>Email: <strong>${email}</strong></p>
                  <p>Password: <strong>${password}</strong></p>
                </div>
                <p style="color: #ff6b6b; font-size: 14px;"><strong>Please change your password after first login.</strong></p>
              ` : ''}
              <div style="text-align: center; margin: 30px 0;">
                <a href="${link}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  ${isInvitation ? 'Create Account' : 'Login Now'}
                </a>
              </div>
              ${isInvitation ? `
                <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                  This invitation link will expire in 7 days.<br>
                  If you didn't expect this invitation, please ignore this email.
                </p>
              ` : ''}
            </div>
          </body>
        </html>
      `,
      text: isInvitation
        ? `
          Agent Invitation - Real Estate KE

          Hello ${firstName},

          You've been invited to join Real Estate KE as an Agent. Click the link below to create your account:

          ${link}

          This invitation link will expire in 7 days.

          If you didn't expect this invitation, please ignore this email.
        `
        : `
          Welcome to Real Estate KE - Agent Account

          Hello ${firstName},

          You've been approved to join Real Estate KE as an Agent.

          Your Login Credentials:
          Email: ${email}
          Password: ${password}

          Please change your password after first login.

          Login: ${link}
        `,
    };
  },

  /**
   * Tenant Account Creation Email
   */
  tenantWelcome: (firstName: string, email: string, password: string, loginLink: string) => ({
    subject: 'Welcome to Real Estate KE - Tenant Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Real Estate KE</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${firstName}!</h2>
            <p>Your tenant account has been created on Real Estate KE.</p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Your Login Credentials:</strong></p>
              <p>Email: <strong>${email}</strong></p>
              <p>Password: <strong>${password}</strong></p>
            </div>
            <p style="color: #ff6b6b; font-size: 14px;"><strong>Please change your password after first login.</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Login Now</a>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

