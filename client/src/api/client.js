const BASE = (import.meta.env?.VITE_API_BASE || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const s = qs.toString();
    if (s) url += `?${s}`;
  }
  const opts = { method, credentials: 'include', headers: { Accept: 'application/json' } };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.', 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new ApiError(data?.error?.message || `Request failed (${res.status})`, res.status, data?.error?.details || []);
  }
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  listItems: (params) => request('/items', { params }),
  myItems: () => request('/items/mine'),
  getItem: (id) => request(`/items/${id}`),
  createItem: (formData) => request('/items', { method: 'POST', body: formData }),
  updateItem: (id, formData) => request(`/items/${id}`, { method: 'PATCH', body: formData }),
  closeItem: (id) => request(`/items/${id}/close`, { method: 'POST' }),
  deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),

  createClaim: (itemId, b) => request(`/items/${itemId}/claims`, { method: 'POST', body: b }),
  itemClaims: (itemId) => request(`/items/${itemId}/claims`),
  myClaims: () => request('/claims/mine'),
  updateClaim: (id, status) => request(`/claims/${id}`, { method: 'PATCH', body: { status } }),

  adminStats: () => request('/admin/stats'),
  adminItems: (params) => request('/admin/items', { params }),
  hideItem: (id, hidden) => request(`/admin/items/${id}/hide`, { method: 'PATCH', body: { hidden } }),
  adminUsers: () => request('/admin/users'),
};
