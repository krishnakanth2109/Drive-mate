const RAW_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');
export const SOCKET_BASE_URL =
  import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Resolves static asset or document URLs safely from Cloudinary or backend /uploads.
 */
export function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:image/')) {
    return path;
  }
  return `${SOCKET_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken(authScope = 'auto') {
  if (authScope === 'user') {
    return sessionStorage.getItem('dm_user_token') || localStorage.getItem('token');
  }
  if (authScope === 'admin') {
    return sessionStorage.getItem('vlt_master_token') || sessionStorage.getItem('vlt_token');
  }
  return (
    sessionStorage.getItem('vlt_master_token') ||
    sessionStorage.getItem('vlt_token') ||
    sessionStorage.getItem('dm_user_token') ||
    localStorage.getItem('token')
  );
}

/**
 * Centralized HTTP client with auth headers, timeout protection, Envelope unwrapping,
 * and automatic safe retry for idempotent GET requests.
 */
export async function fetchApi(endpoint, options = {}) {
  const {
    timeout = 15000,
    retries = undefined,
    authScope = 'auto',
    token: explicitToken,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const method = (fetchOptions.method || 'GET').toUpperCase();
  const maxRetries = retries !== undefined ? retries : method === 'GET' ? 1 : 0;
  const token = explicitToken !== undefined ? explicitToken : getAuthToken(authScope);

  const headers = {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
          'x-auth-token': token,
        }
      : {}),
    ...customHeaders,
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('http') ? cleanEndpoint : `${API_BASE_URL}${cleanEndpoint}`;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;
        try {
          const errData = await response.json();
          errorMessage = errData.message || errData.detail || errData.error || errorMessage;
        } catch {
          // Ignore non-JSON error body
        }
        const err = new Error(errorMessage);
        err.status = response.status;
        if (response.status >= 400 && response.status < 500) {
          throw err;
        }
        throw err;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        return json.data !== undefined ? json.data : json;
      }
      return response.text();
    } catch (err) {
      clearTimeout(timer);
      lastError = err.name === 'AbortError' ? new Error('Request timed out. Please retry.') : err;
      if ((err.status && err.status >= 400 && err.status < 500) || attempt >= maxRetries) {
        throw lastError;
      }
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }

  throw lastError;
}
