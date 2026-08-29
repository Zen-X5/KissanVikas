export interface UserSession {
  id: string;
  name: string;
  role: 'admin' | 'customer' | string;
  email?: string;
}

const COOKIE_NAME = 'kissan_token';

export function setSession(token: string) {
  if (typeof window === 'undefined') return;
  // Store in cookie for 30 days
  const maxAge = 30 * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  try {
    localStorage.setItem(COOKIE_NAME, token);
  } catch {}
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Try cookie first
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }

  // Fallback to localStorage
  try {
    return localStorage.getItem(COOKIE_NAME);
  } catch {
    return null;
  }
}

export function getUser(): UserSession | null {
  const token = getToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode Base64Url
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const decoded = JSON.parse(jsonPayload);
    return {
      id: decoded.id || decoded.sub || '',
      name: decoded.name || 'User',
      role: decoded.role || 'customer',
      email: decoded.email,
    };
  } catch (e) {
    console.error('Failed to decode JWT token:', e);
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  try {
    localStorage.removeItem(COOKIE_NAME);
  } catch {}
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'admin';
}

export function isCustomer(): boolean {
  const user = getUser();
  return user?.role === 'customer';
}
