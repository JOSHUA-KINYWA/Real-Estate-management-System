import { createServerClient } from './supabase';

export async function getCurrentUser(request: Request) {
  try {
    // Get user from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const userId = authHeader?.replace('Bearer ', '');

    if (!userId) {
      return null;
    }

    const supabase = createServerClient();
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAdmin(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (user.role !== 'ADMIN') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { user };
}

// Helper to get user from localStorage (client-side)
export function getClientUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

