const BASE_URL = 'http://localhost:5000/api/v1';

/**
 * Custom fetch API wrapper for ERP system integration
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('erp_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Auto logout if unauthorized
      if (response.status === 401) {
        localStorage.removeItem('erp_token');
        // We can force window reload if needed to force user back to login, 
        // or let the Redux auth state intercept. We will check it inside slices.
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error.message);
    throw error;
  }
};

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiRequest(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => apiRequest(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options }),
};
