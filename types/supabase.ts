export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Agent: {
        Row: {
          active: boolean
          bio: string | null
          commissionRate: number | null
          id: string
          joinedAt: string
          licenseNumber: string | null
          totalEarnings: number | null
          updatedAt: string
          userId: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          commissionRate?: number | null
          id: string
          joinedAt?: string
          licenseNumber?: string | null
          totalEarnings?: number | null
          updatedAt: string
          userId: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          commissionRate?: number | null
          id?: string
          joinedAt?: string
          licenseNumber?: string | null
          totalEarnings?: number | null
          updatedAt?: string
          userId?: string
        }
      }
      User: {
        Row: {
          avatar: string | null
          createdAt: string
          email: string
          firstName: string
          id: string
          lastName: string
          password: string | null
          phone: string
          role: 'ADMIN' | 'AGENT' | 'LANDLORD' | 'TENANT'
          status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
          updatedAt: string
        }
        Insert: {
          avatar?: string | null
          createdAt?: string
          email: string
          firstName: string
          id: string
          lastName: string
          password?: string | null
          phone: string
          role?: 'ADMIN' | 'AGENT' | 'LANDLORD' | 'TENANT'
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
          updatedAt: string
        }
        Update: {
          avatar?: string | null
          createdAt?: string
          email?: string
          firstName?: string
          id?: string
          lastName?: string
          password?: string | null
          phone?: string
          role?: 'ADMIN' | 'AGENT' | 'LANDLORD' | 'TENANT'
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
          updatedAt?: string
        }
      }
      Property: {
        Row: {
          address: string
          agentId: string | null
          amenities: string[] | null
          bathrooms: number
          bedrooms: number
          county: string
          createdAt: string
          deposit: number | null
          description: string | null
          estate: string
          id: string
          images: string[] | null
          landlordId: string | null
          latitude: number | null
          listedAt: string
          longitude: number | null
          rent: number
          size: number | null
          status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'DRAFT'
          title: string
          town: string
          type: 'APARTMENT' | 'HOUSE' | 'BEDSITTER' | 'COMMERCIAL' | 'LAND'
          updatedAt: string
        }
        Insert: {
          address: string
          agentId?: string | null
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          county: string
          createdAt?: string
          deposit?: number | null
          description?: string | null
          estate: string
          id: string
          images?: string[] | null
          landlordId?: string | null
          latitude?: number | null
          listedAt?: string
          longitude?: number | null
          rent: number
          size?: number | null
          status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'DRAFT'
          title: string
          town: string
          type: 'APARTMENT' | 'HOUSE' | 'BEDSITTER' | 'COMMERCIAL' | 'LAND'
          updatedAt: string
        }
        Update: {
          address?: string
          agentId?: string | null
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          county?: string
          createdAt?: string
          deposit?: number | null
          description?: string | null
          estate?: string
          id?: string
          images?: string[] | null
          landlordId?: string | null
          latitude?: number | null
          listedAt?: string
          longitude?: number | null
          rent?: number
          size?: number | null
          status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'DRAFT'
          title?: string
          town?: string
          type?: 'APARTMENT' | 'HOUSE' | 'BEDSITTER' | 'COMMERCIAL' | 'LAND'
          updatedAt?: string
        }
      }
      Tenant: {
        Row: {
          createdAt: string
          creditScore: number | null
          dateOfBirth: string | null
          emergencyContact: string | null
          emergencyPhone: string | null
          employerName: string | null
          employmentStatus: string | null
          id: string
          moveInDate: string | null
          nationalId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          creditScore?: number | null
          dateOfBirth?: string | null
          emergencyContact?: string | null
          emergencyPhone?: string | null
          employerName?: string | null
          employmentStatus?: string | null
          id: string
          moveInDate?: string | null
          nationalId: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          creditScore?: number | null
          dateOfBirth?: string | null
          emergencyContact?: string | null
          emergencyPhone?: string | null
          employerName?: string | null
          employmentStatus?: string | null
          id?: string
          moveInDate?: string | null
          nationalId?: string
          updatedAt?: string
          userId?: string
        }
      }
      Landlord: {
        Row: {
          bankAccount: string | null
          bankName: string | null
          companyName: string | null
          createdAt: string
          id: string
          mpesaNumber: string | null
          portfolioValue: number | null
          updatedAt: string
          userId: string
        }
        Insert: {
          bankAccount?: string | null
          bankName?: string | null
          companyName?: string | null
          createdAt?: string
          id: string
          mpesaNumber?: string | null
          portfolioValue?: number | null
          updatedAt: string
          userId: string
        }
        Update: {
          bankAccount?: string | null
          bankName?: string | null
          companyName?: string | null
          createdAt?: string
          id?: string
          mpesaNumber?: string | null
          portfolioValue?: number | null
          updatedAt?: string
          userId?: string
        }
      }
      Lease: {
        Row: {
          agentId: string | null
          autoRenew: boolean
          createdAt: string
          depositAmount: number | null
          endDate: string
          id: string
          landlordId: string | null
          paymentDay: number
          propertyId: string
          rentAmount: number
          startDate: string
          status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
          tenantId: string
          terms: string | null
          updatedAt: string
        }
        Insert: {
          agentId?: string | null
          autoRenew?: boolean
          createdAt?: string
          depositAmount?: number | null
          endDate: string
          id: string
          landlordId?: string | null
          paymentDay?: number
          propertyId: string
          rentAmount: number
          startDate: string
          status?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
          tenantId: string
          terms?: string | null
          updatedAt: string
        }
        Update: {
          agentId?: string | null
          autoRenew?: boolean
          createdAt?: string
          depositAmount?: number | null
          endDate?: string
          id?: string
          landlordId?: string | null
          paymentDay?: number
          propertyId?: string
          rentAmount?: number
          startDate?: string
          status?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
          tenantId?: string
          terms?: string | null
          updatedAt?: string
        }
      }
      Payment: {
        Row: {
          amount: number
          createdAt: string
          id: string
          leaseId: string | null
          method: 'MPESA' | 'BANK' | 'CASH' | 'CHEQUE'
          mpesaReceipt: string | null
          notes: string | null
          paidAt: string
          recordedById: string | null
          reference: string
          status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
          tenantId: string | null
        }
        Insert: {
          amount: number
          createdAt?: string
          id: string
          leaseId?: string | null
          method: 'MPESA' | 'BANK' | 'CASH' | 'CHEQUE'
          mpesaReceipt?: string | null
          notes?: string | null
          paidAt?: string
          recordedById?: string | null
          reference: string
          status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
          tenantId?: string | null
        }
        Update: {
          amount?: number
          createdAt?: string
          id?: string
          leaseId?: string | null
          method?: 'MPESA' | 'BANK' | 'CASH' | 'CHEQUE'
          mpesaReceipt?: string | null
          notes?: string | null
          paidAt?: string
          recordedById?: string | null
          reference?: string
          status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
          tenantId?: string | null
        }
      }
      MaintenanceRequest: {
        Row: {
          attachments: string[] | null
          completedAt: string | null
          cost: number | null
          createdAt: string
          description: string | null
          id: string
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          propertyId: string
          reporterId: string | null
          scheduledDate: string | null
          status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          tenantId: string | null
          title: string
          updatedAt: string
        }
        Insert: {
          attachments?: string[] | null
          completedAt?: string | null
          cost?: number | null
          createdAt?: string
          description?: string | null
          id: string
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          propertyId: string
          reporterId?: string | null
          scheduledDate?: string | null
          status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          tenantId?: string | null
          title: string
          updatedAt: string
        }
        Update: {
          attachments?: string[] | null
          completedAt?: string | null
          cost?: number | null
          createdAt?: string
          description?: string | null
          id?: string
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          propertyId?: string
          reporterId?: string | null
          scheduledDate?: string | null
          status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          tenantId?: string | null
          title?: string
          updatedAt?: string
        }
      }
    }
    Enums: {
      DocumentType: 'LEASE' | 'AGREEMENT' | 'RECEIPT' | 'ID_PROOF' | 'OTHER'
      LeaseStatus: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
      MaintenancePriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
      MaintenanceStatus: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
      NotificationChannel: 'EMAIL' | 'SMS' | 'IN_APP'
      NotificationStatus: 'QUEUED' | 'SENT' | 'FAILED' | 'READ'
      PaymentMethod: 'MPESA' | 'BANK' | 'CASH' | 'CHEQUE'
      PaymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
      PropertyStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'DRAFT'
      PropertyType: 'APARTMENT' | 'HOUSE' | 'BEDSITTER' | 'COMMERCIAL' | 'LAND'
      UserRole: 'ADMIN' | 'AGENT' | 'LANDLORD' | 'TENANT'
      UserStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    }
  }
}

