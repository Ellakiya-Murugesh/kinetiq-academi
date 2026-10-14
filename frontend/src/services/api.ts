// Central API client with JWT header injection & fallback handlers

const TOKEN_KEY = 'gate_auth_token';
const USER_KEY = 'gate_auth_user';
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://kinetiqacademi.onrender.com' : '')
).trim().replace(/\/+$/, '');

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function resolveApiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;

  const path = endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (import.meta.env.DEV) {
    // In local development, Vite proxies /api to the local Express server.
    return path;
  }

  if (API_BASE_URL) {
    const baseUrl = API_BASE_URL.replace(/\/api\/?$/i, '');
    return `${baseUrl}${path}`;
  }

  throw new Error('API configuration is missing. Set VITE_API_BASE_URL to the deployed Render API URL.');
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): any | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function downloadApiFile(endpoint: string, filename: string): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(resolveApiUrl(endpoint), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Download failed with status ${response.status}`);
  }

  const fileUrl = URL.createObjectURL(await response.blob());
  const downloadLink = document.createElement('a');
  downloadLink.href = fileUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(resolveApiUrl(endpoint), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.error || `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status);
  }

  return response.json();
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const api = {
  get: async <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const data = await apiRequest<T>(endpoint);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error executing request' };
    }
  },

  post: async <T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const data = await apiRequest<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error executing request' };
    }
  },

  put: async <T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const data = await apiRequest<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error executing request' };
    }
  },

  delete: async <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const data = await apiRequest<T>(endpoint, {
        method: 'DELETE',
      });
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error executing request' };
    }
  },
};
