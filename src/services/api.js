/**
 * Centralized API Client for FDR SmartGuard Backend (FastAPI + PostgreSQL)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

/**
 * Generic request helper with error unwrapping
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = data?.detail || data?.message || (typeof data === 'string' ? data : `HTTP ${res.status}: ${res.statusText}`);
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.status) throw error;
    // Network or connection refused error
    const netErr = new Error(`Cannot connect to backend server at ${API_BASE_URL}. Verify PostgreSQL and FastAPI are running.`);
    netErr.isNetworkError = true;
    throw netErr;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Institutions
  getInstitutions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.state && params.state !== 'All') query.append('state', params.state);
    if (params.type && params.type !== 'All') query.append('type', params.type);
    const qs = query.toString();
    return request(`/institutions${qs ? `?${qs}` : ''}`);
  },

  getInstitution: (id) => request(`/institutions/${encodeURIComponent(id)}`),

  createInstitution: (data) => request('/institutions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateInstitution: (id, data) => request(`/institutions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  deleteInstitution: (id) => request(`/institutions/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),

  // Fixed Deposit Receipts (FDRs)
  getFdrs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.bank && params.bank !== 'All') query.append('bank', params.bank);
    if (params.institution && params.institution !== 'All') query.append('institution', params.institution);
    if (params.maturityStart) query.append('maturity_start', params.maturityStart);
    if (params.maturityEnd) query.append('maturity_end', params.maturityEnd);
    const qs = query.toString();
    return request(`/fdrs${qs ? `?${qs}` : ''}`);
  },

  getFdr: (id) => request(`/fdrs/${encodeURIComponent(id)}`),

  createFdr: (data) => request('/fdrs', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateFdr: (id, data) => request(`/fdrs/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  deleteFdr: (id) => request(`/fdrs/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),

  // Dashboard Analytics
  getDashboardSummary: () => request('/dashboard/summary'),
  getStatusDistribution: () => request('/dashboard/status-distribution'),
  getUpcomingMaturities: () => request('/dashboard/upcoming-maturities'),

  // Seed
  seedDatabase: () => request('/seed', { method: 'POST' })
};

export default api;
