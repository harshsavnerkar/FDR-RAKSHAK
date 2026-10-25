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
    credentials: 'include',
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
      if (res.status === 401 && !endpoint.startsWith('/auth/')) {
        window.dispatchEvent(new CustomEvent('fdr-session-expired', {
          detail: { message: 'Your administrative session has expired or was revoked. Please authenticate again.' }
        }));
      }
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

  // FDR Document Upload & OCR
  getDocumentOcrStatus: () => request('/documents/status'),

  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/documents/upload`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent('fdr-session-expired', {
            detail: { message: 'Your administrative session has expired. Please authenticate again.' }
          }));
        }
        const errorMsg = data?.detail || data?.message || (typeof data === 'string' ? data : `Upload error (HTTP ${res.status})`);
        const err = new Error(errorMsg);
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      const netErr = new Error(`Cannot connect to upload endpoint at ${url}. Verify backend server is running.`);
      netErr.isNetworkError = true;
      throw netErr;
    }
  },

  linkDocumentToFdr: (documentId, payload) => request(`/documents/${encodeURIComponent(documentId)}/link`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getDocumentPreviewUrl: (documentId) => `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/preview`,

  // Compliance & Discrepancy Engine (Step 5)
  getComplianceSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.approachingMaturityDays) query.append('approaching_maturity_days', params.approachingMaturityDays);
    if (params.amountTolerance) query.append('amount_tolerance', params.amountTolerance);
    if (params.ocrConfidenceThreshold) query.append('ocr_confidence_threshold', params.ocrConfidenceThreshold);
    if (params.asOf) query.append('as_of', params.asOf);
    const qs = query.toString();
    return request(`/compliance/summary${qs ? `?${qs}` : ''}`);
  },

  getFdrComplianceReport: (fdrId, params = {}) => {
    const query = new URLSearchParams();
    if (params.approachingMaturityDays) query.append('approaching_maturity_days', params.approachingMaturityDays);
    if (params.amountTolerance) query.append('amount_tolerance', params.amountTolerance);
    if (params.ocrConfidenceThreshold) query.append('ocr_confidence_threshold', params.ocrConfidenceThreshold);
    if (params.asOf) query.append('as_of', params.asOf);
    const qs = query.toString();
    return request(`/compliance/fdr/${encodeURIComponent(fdrId)}${qs ? `?${qs}` : ''}`);
  },

  evaluateCustomCompliance: (payload) => request('/compliance/evaluate-custom', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Maturity Tracking & Risk Prioritization (Step 6)
  getRiskSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.asOf) query.append('as_of', params.asOf);
    if (params.priority) query.append('priority', params.priority);
    if (params.maturity) query.append('maturity', params.maturity);
    if (params.compliance) query.append('compliance', params.compliance);
    const qs = query.toString();
    return request(`/risk/summary${qs ? `?${qs}` : ''}`);
  },

  getPrioritizedFdrs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.asOf) query.append('as_of', params.asOf);
    if (params.priority) query.append('priority', params.priority);
    if (params.maturity) query.append('maturity', params.maturity);
    if (params.compliance) query.append('compliance', params.compliance);
    const qs = query.toString();
    return request(`/risk/prioritized${qs ? `?${qs}` : ''}`);
  },

  getFdrRiskAssessment: (fdrId, params = {}) => {
    const query = new URLSearchParams();
    if (params.asOf) query.append('as_of', params.asOf);
    const qs = query.toString();
    return request(`/risk/fdr/${encodeURIComponent(fdrId)}${qs ? `?${qs}` : ''}`);
  },

  // Lifecycle & Controlled Workflows (Step 7)
  getWorkflowSummary: () => request('/workflows/summary'),

  getFdrLifecycleOverview: (fdrId) => request(`/workflows/fdr/${encodeURIComponent(fdrId)}`),

  initiateRenewal: (fdrId, payload) => request(`/workflows/fdr/${encodeURIComponent(fdrId)}/renew`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  initiateReplacement: (fdrId, payload) => request(`/workflows/fdr/${encodeURIComponent(fdrId)}/replace`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  initiateRelease: (fdrId, payload) => request(`/workflows/fdr/${encodeURIComponent(fdrId)}/release`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  decideWorkflow: (workflowId, payload) => request(`/workflows/${encodeURIComponent(workflowId)}/decide`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Authentication & Security (Step 8)
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  logout: () => request('/auth/logout', {
    method: 'POST'
  }),

  checkSession: () => request('/auth/session'),

  initiatePasswordRecovery: (data) => request('/auth/recover-initiate', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  resetPassword: (data) => request('/auth/recover-reset', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Security Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    if (params.eventType) query.append('event_type', params.eventType);
    const qs = query.toString();
    return request(`/audit-logs${qs ? `?${qs}` : ''}`);
  },

  // Seed
  seedDatabase: () => request('/seed', { method: 'POST' })
};

export default api;
