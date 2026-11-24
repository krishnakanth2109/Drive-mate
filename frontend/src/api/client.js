const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : `${window.location.origin}/api`);

export async function fetchApi(endpoint, options = {}) {
  const token = sessionStorage.getItem('vlt_master_token') || sessionStorage.getItem('vlt_token') || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 
      'Authorization': `Bearer ${token}`,
      'x-auth-token': token
    } : {}),
    ...options.headers,
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      errorMessage = data.message || data.detail || errorMessage;
    } catch {
      // Ignored
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  }
  return response.text();
}
