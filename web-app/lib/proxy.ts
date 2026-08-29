import { getToken, clearSession } from './session.utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function proxyFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const token = getToken();
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Unauthorized -> clear session
      clearSession();
    }

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        data: null,
        error: json?.message || `Request failed with status ${res.status}`,
        status: res.status,
      };
    }

    return {
      data: json?.data !== undefined ? json.data : json,
      error: null,
      status: res.status,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'Network error occurred',
      status: 0,
    };
  }
}
