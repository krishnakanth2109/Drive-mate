const BASE_URL = import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin;

export async function fetchApi(endpoint, options = {}) {
  const token = sessionStorage.getItem('vlt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      errorMessage = data.detail || errorMessage;
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
