import { z } from 'zod';

// Kenya phone number validator - more flexible
export const phoneSchema = z.string()
  .min(9, 'Phone number is too short')
  .max(15, 'Phone number is too long')
  .refine(
    (val) => {
      // Remove spaces and dashes
      const cleaned = val.replace(/[\s\-]/g, '');
      // Check if it starts with +254, 254, or 0
      return /^(\+?254|0)[17]\d{8}$/.test(cleaned);
    },
    { message: 'Invalid Kenyan phone number. Format: +254712345678 or 0712345678' }
  );

// Email validator
export const emailSchema = z.string().email('Invalid email address');

// ID number validator (Kenya)
export const idNumberSchema = z.string()
  .regex(/^\d{7,8}$/, 'Invalid ID number format');

// Property schemas
export const propertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().transform((val) => val === '' ? undefined : val).optional(),
  type: z.enum([
    'APARTMENT',
    'BUNGALOW',
    'MAISONETTE',
    'TOWNHOUSE',
    'VILLA',
    'SINGLE_ROOM',
    'BEDSITTER',
    'HOUSE',
    'COMMERCIAL',
    'LAND',
  ]),
  rent: z.number().positive('Rent must be positive'),
  deposit: z.number().positive('Deposit must be positive').optional(),
  bedrooms: z.union([
    z.enum(['SINGLE_ROOM', 'BEDSITTER', '1_BEDROOM', '2_BEDROOM', '3_BEDROOM', '4_BEDROOM', '5_PLUS_BEDROOM']),
    z.number().int().min(0), // Support legacy numeric format
  ]).refine((val) => val !== '' && val !== null && val !== undefined, {
    message: 'Bedrooms/room type is required',
  }),
  bathrooms: z.number().int().min(0).optional(),
  area: z.number().positive().optional(),
  size: z.number().positive().optional(), // Legacy field
  county: z.string().min(1, 'County is required'),
  constituency: z.string().transform((val) => val === '' ? undefined : val).optional(),
  town: z.string().min(1, 'Town is required'),
  estate: z.string().transform((val) => val === '' ? undefined : val).optional(),
  address: z.string().min(1, 'Address is required'),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

// User registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: phoneSchema,
  role: z.enum(['ADMIN', 'AGENT', 'LANDLORD', 'TENANT']),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Tenant schema
export const tenantSchema = z.object({
  nationalId: idNumberSchema,
  dateOfBirth: z.string().optional(),
  employmentStatus: z.string().optional(),
  employerName: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: phoneSchema.optional(),
});

// Landlord schema
export const landlordSchema = z.object({
  companyName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  mpesaNumber: phoneSchema.optional(),
});

