# Troubleshooting Guide

## Common Issues and Solutions

### 1. Validation Error When Creating Landlord

**Error**: `{"error":"Validation error"}`

**Common Causes:**
- Invalid phone number format
- Missing required fields
- Email already exists
- Password too short

**Solutions:**

#### Phone Number Format
Kenyan phone numbers must be in one of these formats:
- `+254712345678` (with +254)
- `254712345678` (without +)
- `0712345678` (starting with 0)

The system will automatically normalize:
- `0712345678` → `+254712345678`
- `254712345678` → `+254712345678`
- `+254712345678` → `+254712345678` (unchanged)

**Valid Examples:**
- ✅ `+254712345678`
- ✅ `0712345678`
- ✅ `254712345678`
- ❌ `712345678` (missing prefix)
- ❌ `1234567890` (wrong format)

#### Required Fields
Make sure all required fields are filled:
- First Name (minimum 2 characters)
- Last Name (minimum 2 characters)
- Email (valid email format)
- Phone (valid Kenyan phone number)
- Password (minimum 8 characters)

#### Optional Fields
These fields are optional and can be left empty:
- Company Name
- Bank Name
- Bank Account
- M-Pesa Number

### 2. Error Display

The error message now shows detailed validation errors:
- Field name
- Specific error message
- Multiple errors if multiple fields fail

**Example Error Display:**
```
Validation error:
phone: Invalid Kenyan phone number. Format: +254712345678 or 0712345678
email: Invalid email address
```

### 3. Phone Number Normalization

The system automatically:
1. Removes spaces and dashes
2. Converts `0` prefix to `+254`
3. Adds `+` to `254` prefix
4. Validates the final format

### 4. Testing Phone Numbers

To test if a phone number is valid:
- Must start with: `+254`, `254`, or `0`
- Second digit must be: `1` or `7`
- Total digits after prefix: 9 digits
- Example: `+254712345678` = 9 digits after `+254`

### 5. Database Connection Issues

If you see database errors:
1. Check Supabase connection: Visit `/api/test-db`
2. Verify environment variables
3. Check Supabase dashboard for service status

### 6. Authentication Issues

If login fails:
1. Verify user exists in database
2. Check password is correctly hashed
3. Verify user status is `ACTIVE`
4. Check browser console for errors

## Quick Fixes

### Fix Phone Number
```javascript
// In browser console
const phone = "0712345678";
const normalized = phone.startsWith('0') ? '+254' + phone.slice(1) : phone;
console.log(normalized); // +254712345678
```

### Check Validation
Visit the API directly:
```bash
curl -X POST http://localhost:3000/api/admin/landlords \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+254712345678"
  }'
```

## Still Having Issues?

1. Check browser console for detailed errors
2. Check server logs in terminal
3. Verify all required fields are filled
4. Test with a known good phone number format
5. Check network tab for API response details

