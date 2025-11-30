# Real Estate Management System - Setup Guide

## Database Connection ✅

The application is **already connected** to your Supabase database!

- **Database URL**: `https://tzmpavfrxlbcjnfhryap.supabase.co`
- **Status**: Connected and working
- **Tables**: All tables are set up and ready

## Quick Start

1. **Install dependencies** (if not done):
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Open: http://localhost:3000
   - Login page: http://localhost:3000/auth/login

## Admin Login

You have an admin user in the database:
- **Email**: `admin@realestatepro.ke`
- **Role**: ADMIN
- **Status**: ACTIVE

**Note**: You'll need to set a password for this user. You can do this via:
1. Supabase dashboard SQL editor
2. Or create a new admin user through the registration API

## Test Database Connection

Visit: http://localhost:3000/api/test-db

This will show:
- Connection status
- User count
- Landlord count
- Property count

## Admin Dashboard Features

Once logged in as admin, you can:

1. **View Dashboard**: `/admin/dashboard`
   - Overview statistics
   - Quick actions

2. **Manage Landlords**: `/admin/landlords`
   - View all landlords
   - Add new landlord
   - Edit landlord details
   - View landlord details
   - Deactivate landlords

3. **Landlord Details**: `/admin/landlords/[id]`
   - Full landlord information
   - Properties list
   - Active leases
   - Contact information

4. **Edit Landlord**: `/admin/landlords/[id]/edit`
   - Update personal information
   - Update business information

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Admin - Landlords
- `GET /api/admin/landlords` - List all landlords
- `POST /api/admin/landlords` - Create new landlord
- `GET /api/admin/landlords/[id]` - Get landlord details
- `PATCH /api/admin/landlords/[id]` - Update landlord
- `DELETE /api/admin/landlords/[id]` - Deactivate landlord

### Properties
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create property
- `GET /api/properties/[id]` - Get property details
- `PATCH /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property

## Environment Variables

Create a `.env.local` file (optional, defaults are set):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tzmpavfrxlbcjnfhryap.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## Database Schema

All tables are already created:
- User
- Landlord
- Tenant
- Agent
- Property
- Lease
- Payment
- MaintenanceRequest
- Document
- Notification
- And more...

## Next Steps

1. ✅ Database connected
2. ✅ Admin dashboard created
3. ✅ Landlord management implemented
4. ⏭️ Add password reset functionality
5. ⏭️ Implement property management UI
6. ⏭️ Add tenant management
7. ⏭️ Implement payment processing
8. ⏭️ Add M-Pesa integration

## Troubleshooting

### Can't login?
- Check if user exists in database
- Verify password is hashed with bcrypt
- Check browser console for errors

### Database connection issues?
- Visit `/api/test-db` to check connection
- Verify Supabase URL and keys
- Check Supabase dashboard for service status

### API errors?
- Check browser console
- Check server logs
- Verify database permissions

## Support

For issues or questions, check:
- Supabase dashboard: https://supabase.com/dashboard
- Database logs via MCP tools
- Application logs in terminal

