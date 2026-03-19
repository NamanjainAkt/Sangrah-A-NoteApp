const API_BASE = import.meta.env.VITE_API_URL || '/api';

let accessToken = null;
let refreshToken = null;

export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
  if (refresh) {
    localStorage.setItem('refreshToken', refresh);
  }
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('refreshToken');
};

const refreshAccessToken = async () => {
  const storedRefresh = getRefreshToken();
  if (!storedRefresh) {
    throw new Error('No refresh token');
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefresh }),
    });

    if (!response.ok) {
      clearTokens();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (error) {
    clearTokens();
    throw error;
  }
};

const request = async (endpoint, options = {}) => {
  const { method = 'GET', body, requireAuth = true } = options;

  let token = accessToken;

  if (requireAuth && !token) {
    token = await refreshAccessToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(requireAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401 && requireAuth) {
      try {
        token = await refreshAccessToken();
        headers.Authorization = `Bearer ${token}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, { ...config, headers });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || 'Request failed');
        }
        return retryResponse.json();
      } catch {
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

const api = {
  auth: {
    register: (data) => request('/auth/register', { method: 'POST', body: data, requireAuth: false }),
    login: (data) => request('/auth/login', { method: 'POST', body: data, requireAuth: false }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me', { method: 'GET' }),
    refresh: () => request('/auth/refresh', { method: 'POST', requireAuth: false }),
  },

  notes: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/notes${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/notes/${id}`),
    create: (data) => request('/notes', { method: 'POST', body: data }),
    update: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
    permanentDelete: (id) => request(`/notes/${id}/permanent`, { method: 'DELETE' }),
    restore: (id) => request(`/notes/${id}/restore`, { method: 'PUT' }),
  },

  tags: {
    getAll: () => request('/tags'),
    create: (data) => request('/tags', { method: 'POST', body: data }),
    update: (id, data) => request(`/tags/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/tags/${id}`, { method: 'DELETE' }),
  },

  goals: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/goals${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/goals/${id}`),
    create: (data) => request('/goals', { method: 'POST', body: data }),
    update: (id, data) => request(`/goals/${id}`, { method: 'PUT', body: data }),
    increment: (id) => request(`/goals/${id}/increment`, { method: 'PUT' }),
    delete: (id) => request(`/goals/${id}`, { method: 'DELETE' }),
  },

  activity: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/activity${query ? `?${query}` : ''}`);
    },
    getHeatmap: (year) => request(`/activity/heatmap?year=${year || new Date().getFullYear()}`),
    log: (data) => request('/activity', { method: 'POST', body: data }),
  },

  notifications: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/notifications${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/notifications', { method: 'POST', body: data }),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
    delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
    deleteAll: () => request('/notifications', { method: 'DELETE' }),
  },

  reminders: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/reminders${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/reminders', { method: 'POST', body: data }),
    update: (id, data) => request(`/reminders/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/reminders/${id}`, { method: 'DELETE' }),
  },

  backups: {
    export: () => request('/backups/export'),
    import: (data) => request('/backups/import', { method: 'POST', body: data }),
    history: () => request('/backups/history'),
  },

  gamification: {
    get: () => request('/gamification'),
    update: (data) => request('/gamification', { method: 'PUT', body: data }),
  },
};

export default api;
