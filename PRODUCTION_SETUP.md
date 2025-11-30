# Production Setup Guide

## Environment Variables for Production

### Required Variables

Create a `.env.local` file (or set in your hosting platform) with these variables:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email (Resend) - REQUIRED
RESEND_API_KEY=re_9DbikCj9_CuvyJ7kRqgnw6ahih2mGzvy7
EMAIL_FROM=onboarding@resend.dev
# For production with verified domain: noreply@yourdomain.com

# SMS (Africa's Talking) - Optional
SMS_PROVIDER=africastalking
AFRICASTALKING_API_KEY=your_africastalking_api_key
AFRICASTALKING_USERNAME=your_africastalking_username
SMS_SENDER_ID=RealEstateKE
```

## Setting Up Environment Variables

### For Vercel (Recommended)

1. Go to your project settings in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `RESEND_API_KEY` = `re_9DbikCj9_CuvyJ7kRqgnw6ahih2mGzvy7`
   - `EMAIL_FROM` = `onboarding@resend.dev`
   - `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
   - Add other variables as needed

### For Other Platforms

- **Netlify**: Site Settings → Environment Variables
- **Railway**: Project Settings → Variables
- **Heroku**: Settings → Config Vars
- **AWS/Docker**: Use `.env` file or secrets management

## Email Configuration

### Current Setup
- **API Key**: `re_9DbikCj9_CuvyJ7kRqgnw6ahih2mGzvy7`
- **From Address**: `onboarding@resend.dev` (Resend test domain)

### Production Recommendations

1. **Verify Your Domain in Resend**:
   - Go to Resend Dashboard → Domains
   - Add your domain (e.g., `realestatepro.ke`)
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for verification

2. **Update EMAIL_FROM**:
   ```env
   EMAIL_FROM=noreply@realestatepro.ke
   ```

3. **Benefits of Verified Domain**:
   - Better deliverability
   - Professional appearance
   - Higher email limits
   - Custom branding

## Testing Email in Production

1. **Test Endpoint**: `GET /api/test-email?to=your@email.com`
2. **Test Password Reset**: Use the forgot password feature
3. **Check Resend Dashboard**: Monitor email delivery and analytics

## Security Notes

✅ **DO**:
- Store API keys in environment variables only
- Never commit `.env.local` to git
- Use different API keys for dev/staging/production
- Rotate API keys periodically

❌ **DON'T**:
- Hardcode API keys in source code
- Share API keys publicly
- Use production keys in development

## Verification Checklist

- [ ] `RESEND_API_KEY` set in environment variables
- [ ] `EMAIL_FROM` configured
- [ ] Domain verified in Resend (optional but recommended)
- [ ] Test email sent successfully
- [ ] Password reset emails working
- [ ] Environment variables not in git

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is set correctly
2. **Check From Address**: Must be `onboarding@resend.dev` or verified domain
3. **Check Resend Dashboard**: Look for errors or rate limits
4. **Check Logs**: Look for error messages in server logs

### Common Errors

- `Resend API key not configured`: Set `RESEND_API_KEY` in environment
- `Invalid from address`: Use `onboarding@resend.dev` or verified domain
- `Rate limit exceeded`: Check Resend dashboard for limits

## Next Steps

1. ✅ Set environment variables
2. ✅ Test email sending
3. ⬜ Verify domain in Resend (optional)
4. ⬜ Update `EMAIL_FROM` to verified domain
5. ⬜ Monitor email delivery in Resend dashboard

