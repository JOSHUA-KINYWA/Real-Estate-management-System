/**
 * SMS Service Utility
 * Supports Africa's Talking (Recommended for Kenya) and Twilio
 * 
 * Recommended: Africa's Talking (best for Kenyan market)
 */

// Africa's Talking (Recommended for Kenya)
let africastalking: any = null;
try {
  // Dynamic import to avoid errors if package not installed
  africastalking = require('africastalking');
} catch {
  // Package not installed - will throw error when used
}

// Twilio (Alternative)
// import twilio from 'twilio';

const SMS_PROVIDER = process.env.SMS_PROVIDER || 'africastalking'; // 'africastalking' | 'twilio'

// Initialize Africa's Talking
let atClient: any = null;
if (SMS_PROVIDER === 'africastalking' && process.env.AFRICASTALKING_API_KEY && africastalking) {
  atClient = africastalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME || '',
  });
}

// Initialize Twilio (if using)
// const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
//   ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
//   : null;

export interface SMSOptions {
  to: string | string[];
  message: string;
  from?: string; // Sender ID (for Africa's Talking) or phone number (for Twilio)
}

/**
 * Send SMS using configured provider
 */
export async function sendSMS(options: SMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const senderId = options.from || process.env.SMS_SENDER_ID || 'RealEstateKE';

  // Development mode - log instead of sending
  if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_SMS) {
    console.log('📱 SMS (Development Mode):');
    console.log('To:', options.to);
    console.log('From:', senderId);
    console.log('Message:', options.message);
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    switch (SMS_PROVIDER) {
      case 'africastalking':
        return await sendWithAfricasTalking(options, senderId);
      
      case 'twilio':
        return await sendWithTwilio(options, senderId);
      
      default:
        throw new Error(`Unknown SMS provider: ${SMS_PROVIDER}`);
    }
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send SMS using Africa's Talking
 */
async function sendWithAfricasTalking(
  options: SMSOptions,
  senderId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!atClient) {
    throw new Error('Africa\'s Talking not configured. Install africastalking package and set API credentials.');
  }

  const sms = atClient.SMS;

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    // Format phone numbers (ensure they start with +254 for Kenya)
    const formattedRecipients = recipients.map((phone) => {
      // Remove spaces and dashes
      let cleaned = phone.replaceAll(/\s/g, '').replaceAll('-', '');
      
      // Convert to international format if needed
      if (cleaned.startsWith('0')) {
        cleaned = '+254' + cleaned.substring(1);
      } else if (cleaned.startsWith('254')) {
        cleaned = '+' + cleaned;
      } else if (!cleaned.startsWith('+')) {
        cleaned = '+254' + cleaned;
      }
      
      return cleaned;
    });

    const response = await sms.send({
      to: formattedRecipients,
      message: options.message,
      from: senderId, // Sender ID (max 11 characters, alphanumeric)
    });

    if (response.SMSMessageData?.Recipients) {
      const recipients = response.SMSMessageData.Recipients;
      const successCount = recipients.filter((r: any) => r.status === 'Success').length;
      
      if (successCount === recipients.length) {
        return {
          success: true,
          messageId: response.SMSMessageData.Recipients[0]?.messageId,
        };
      } else {
        return {
          success: false,
          error: 'Some messages failed to send',
        };
      }
    }

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send SMS using Twilio
 */
async function sendWithTwilio(
  options: SMSOptions,
  from: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Uncomment and install twilio to use
  // if (!twilioClient) {
  //   throw new Error('Twilio not configured');
  // }

  // const recipients = Array.isArray(options.to) ? options.to : [options.to];
  
  // // Format phone numbers
  // const formattedRecipients = recipients.map((phone) => {
  //   let cleaned = phone.replace(/[\s\-]/g, '');
  //   if (cleaned.startsWith('0')) {
  //     cleaned = '+254' + cleaned.substring(1);
  //   } else if (cleaned.startsWith('254')) {
  //     cleaned = '+' + cleaned;
  //   } else if (!cleaned.startsWith('+')) {
  //     cleaned = '+254' + cleaned;
  //   }
  //   return cleaned;
  // });

  // try {
  //   const results = await Promise.all(
  //     formattedRecipients.map((to) =>
  //       twilioClient.messages.create({
  //         body: options.message,
  //         from: from, // Twilio phone number (e.g., +1234567890)
  //         to,
  //       })
  //     )
  //   );

  //   return {
  //     success: true,
  //     messageId: results[0]?.sid,
  //   };
  // } catch (error: any) {
  //   return {
  //     success: false,
  //     error: error.message || 'Failed to send SMS',
  //   };
  // }

  throw new Error('Twilio not implemented. Install twilio package and uncomment code.');
}

/**
 * SMS Templates
 */
export const smsTemplates = {
  /**
   * Password Reset SMS
   */
  passwordReset: (resetLink: string) => ({
    message: `Real Estate KE: Reset your password by clicking: ${resetLink}. Link expires in 1 hour.`,
  }),

  /**
   * Agent Invitation SMS
   */
  agentInvitation: (email: string, password: string, loginLink: string) => ({
    message: `Welcome to Real Estate KE! Your agent account is ready. Email: ${email}, Password: ${password}. Login: ${loginLink}. Please change your password after first login.`,
  }),

  /**
   * Tenant Welcome SMS
   */
  tenantWelcome: (email: string, password: string, loginLink: string) => ({
    message: `Welcome to Real Estate KE! Your tenant account is ready. Email: ${email}, Password: ${password}. Login: ${loginLink}. Please change your password after first login.`,
  }),

  /**
   * Payment Reminder SMS
   */
  paymentReminder: (amount: number, dueDate: string, propertyAddress: string) => ({
    message: `Reminder: Rent payment of KES ${amount.toLocaleString()} for ${propertyAddress} is due on ${dueDate}. Please make payment to avoid penalties.`,
  }),

  /**
   * Payment Confirmation SMS
   */
  paymentConfirmation: (amount: number, reference: string) => ({
    message: `Payment confirmed! Amount: KES ${amount.toLocaleString()}, Reference: ${reference}. Thank you for your payment.`,
  }),
};

