# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `real-estate` directory with the following:

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email (Resend) - REQUIRED
RESEND_API_KEY=re_9DbikCj9_CuvyJ7kRqgnw6ahih2mGzvy7
EMAIL_FROM=onboarding@resend.dev
# Note: For production, verify your domain in Resend dashboard and use: noreply@yourdomain.com

# SMS (Africa's Talking) - Optional
SMS_PROVIDER=africastalking
AFRICASTALKING_API_KEY=your_africastalking_api_key
AFRICASTALKING_USERNAME=your_africastalking_username
SMS_SENDER_ID=RealEstateKE

# Enable Email/SMS in Development (set to true to actually send)
ENABLE_EMAIL=false
ENABLE_SMS=false
```

## Quick Setup

1. Copy the template above
2. Replace placeholder values with your actual credentials
3. For Resend, you can use `onboarding@resend.dev` for testing
4. For production, verify your domain in Resend and use your domain email

## Email Configuration Notes

- **Development**: Emails are logged to console by default (set `ENABLE_EMAIL=true` to send)
- **Production**: Emails are sent automatically
- **From Address**: Use `onboarding@resend.dev` for testing, or your verified domain for production

## SMS Configuration Notes

- **Development**: SMS are logged to console by default (set `ENABLE_SMS=true` to send)
- **Production**: SMS are sent automatically
- **Africa's Talking**: Best for Kenyan market, competitive pricing

