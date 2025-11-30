# Real Estate Management System

A comprehensive web-based platform for managing real estate properties, landlords, agents, tenants, and all related operations. Built with Next.js, TypeScript, and Supabase.

## 🏗️ Features

### 👨‍💼 Admin Dashboard
- Complete system administration
- Manage landlords, agents, and tenants
- System-wide analytics and reporting
- User management and permissions

### 🏠 Landlord Portal
- Property management (create, edit, view properties)
- Agent management (invite, approve, assign, suspend agents)
- Tenant management
- Payment tracking and commission management
- Dashboard with statistics and analytics
- Property assignment to agents

### 🤝 Agent Dashboard
- View assigned properties
- Track occupancy (occupied/available rooms)
- View landlord information
- Commission tracking
- Property notes and documentation
- Tenant management for assigned properties

### 🏘️ Tenant Portal
- Property viewing
- Lease management
- Payment history
- Maintenance requests

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui patterns
- **Authentication**: Custom auth system with Supabase
- **State Management**: React Context API

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JOSHUA-KINYWA/Real-Estate-management-System.git
   cd Real-Estate-management-System/real-estate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

The application uses Supabase (PostgreSQL). Make sure you have:

1. Created a Supabase project
2. Run the necessary migrations to set up tables:
   - User
   - Landlord
   - Agent
   - Tenant
   - Property
   - Lease
   - Payment
   - MaintenanceRequest
   - Document
   - AuditLog
   - And other related tables

## 👥 User Roles

### Admin
- Full system access
- Manage all users and properties
- System configuration

### Landlord
- Manage properties
- Invite and manage agents
- View tenants and payments
- Assign properties to agents

### Agent
- View assigned properties
- Track occupancy
- Manage tenants for assigned properties
- View commission information

### Tenant
- View properties
- Manage leases
- Make payments
- Submit maintenance requests

## 📁 Project Structure

```
real-estate/
├── app/
│   ├── admin/          # Admin dashboard pages
│   ├── agent/          # Agent dashboard pages
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── landlord/       # Landlord dashboard pages
│   └── tenant/         # Tenant dashboard pages
├── components/         # React components
├── lib/               # Utility functions and helpers
├── types/             # TypeScript type definitions
└── public/            # Static assets
```

## 🔐 Authentication

The system supports:
- Email/password authentication
- Role-based access control (RBAC)
- Session management
- Password reset functionality
- Agent invitation system

## 🎨 Features Highlights

- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Live data synchronization
- **Property Management**: Full CRUD operations for properties
- **Commission Tracking**: Automatic commission calculations
- **Occupancy Tracking**: Real-time room/unit availability
- **Notes System**: Agents can add notes to properties
- **Kenyan Locations**: Support for all 47 Kenyan counties and constituencies

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📝 License

This project is private and proprietary.

## 👤 Author

**Joshua Kinywa**
- GitHub: [@JOSHUA-KINYWA](https://github.com/JOSHUA-KINYWA)

## 🤝 Contributing

This is a private project. Contributions are not currently accepted.

## 📞 Support

For support, please contact the project maintainer.

---

**Built with ❤️ using Next.js and Supabase**
