import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tzmpavfrxlbcjnfhryap.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bXBhdmZyeGxiY2puZmhyeWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDYxMTEsImV4cCI6MjA3OTg4MjExMX0.XLsiAyFozoHXZjl3dafxyvSPK3OckjXR6vlWcld4UHk';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side client (for API routes)
// Uses service role key if available for admin operations, otherwise uses anon key
export function createServerClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl).trim();
  let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey).trim();
  
  // Remove any extra whitespace, newlines, or line breaks
  key = key.replace(/\s+/g, '').replace(/\r?\n/g, '');
  
  // Log in development to help debug
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase client config:', {
      url,
      keyLength: key.length,
      keyPrefix: key.substring(0, 20) + '...',
      usingServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  }
  
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
