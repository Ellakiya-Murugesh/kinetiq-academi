function clearLegacyBrowserSession(): void {
  try {
    localStorage.removeItem('gate_auth_token');
    localStorage.removeItem('gate_auth_user');
  } catch {
    // The API session is held in an httpOnly cookie; local storage is not required.
  }
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiBaseUrl
  ? (() => {
      let parsed: URL;
      try {
        parsed = new URL(configuredApiBaseUrl);
      } catch {
        throw new Error('VITE_API_BASE_URL must be an absolute HTTP or HTTPS URL.');
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('VITE_API_BASE_URL must use HTTP or HTTPS.');
      }
      return parsed.origin;
    })()
  : '';

function resolveApiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const path = endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return apiBaseUrl ? new URL(path, `${apiBaseUrl}/`).toString() : path;
}

export function getStoredToken(): null {
  return null;
}

export function setStoredToken(_token: string): void {
  clearLegacyBrowserSession();
}

export function removeStoredToken(): void {
  clearLegacyBrowserSession();
}

export function getStoredUser(): null {
  return null;
}

export function setStoredUser(_user: unknown): void {
  clearLegacyBrowserSession();
}

export async function downloadApiFile(endpoint: string, filename: string): Promise<void> {
  const fullUrl = resolveApiUrl(endpoint);
  const response = await fetch(fullUrl, {
    credentials: 'include',
    headers: { 'X-Kinetiq-Request': '1' },
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
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Kinetiq-Request', '1');

  const fullUrl = resolveApiUrl(endpoint);

  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
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
      return { success: true, data: await apiRequest<T>(endpoint) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error executing request' };
    }
  },

  post: async <T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      return {
        success: true,
        data: await apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error executing request' };
    }
  },

  put: async <T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      return {
        success: true,
        data: await apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error executing request' };
    }
  },

  delete: async <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      return { success: true, data: await apiRequest<T>(endpoint, { method: 'DELETE' }) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error executing request' };
    }
  },
};
