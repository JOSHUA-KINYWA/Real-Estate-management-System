import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatPhone(phone: string): string {
  // Format Kenyan phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+254${cleaned.slice(1)}`;
  }
  return phone;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatSuspensionReason(reason: string | null | undefined): string {
  if (!reason) {
    return 'Account suspended';
  }

  const reasonMap: Record<string, string> = {
    'TERMINATING_CONTRACT': 'Terminating Contract',
    'POOR_PERFORMANCE': 'Poor Performance',
    'VIOLATION_OF_TERMS': 'Violation of Terms',
    'BREACH_OF_CONTRACT': 'Breach of Contract',
    'MUTUAL_AGREEMENT': 'Mutual Agreement',
    'OTHER': 'Other',
  };

  // If the reason matches an enum, convert it to human-readable format
  // Otherwise, it's a custom reason written by the landlord - display it as-is
  return reasonMap[reason] || reason || 'Account suspended';
}

export function formatBedrooms(bedrooms: number | null | undefined): string {
  if (bedrooms === null || bedrooms === undefined) {
    return 'Not specified';
  }
  
  if (bedrooms === 0) {
    return 'Studio / Single Room';
  }
  
  if (bedrooms >= 5) {
    return '5+ Bedrooms';
  }
  
  return `${bedrooms} Bedroom${bedrooms > 1 ? 's' : ''}`;
}

