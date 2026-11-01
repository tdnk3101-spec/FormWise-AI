// FormWise AI API Service Client

const API_BASE = '/api/v1';

function getAuthHeader() {
  const token = localStorage.getItem('formwise_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  };

  // If body is not FormData, set Content-Type JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token invalid, clear
    localStorage.removeItem('formwise_token');
    localStorage.removeItem('formwise_user');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  // Handle file downloads
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('application/pdf') || contentType.includes('image/'))) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),

  // Profile
  getProfile: () => request('/users/profile'),
  updateProfile: (data) => request('/users/profile', { method: 'PUT', body: data }),
  getSettings: () => request('/users/settings'),

  // Document Vault
  uploadDocument: (formData) => request('/documents/upload', { method: 'POST', body: formData }),
  getDocuments: () => request('/documents'),
  getDocument: (id) => request(`/documents/${id}`),
  extractDocument: (id) => request(`/documents/${id}/extract`, { method: 'POST' }),
  approveDocument: (id, approvals) => request(`/documents/${id}/approve`, { method: 'POST', body: { approvals } }),
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  downloadDocumentUrl: (id) => `${API_BASE}/documents/${id}/download`,

  // Forms
  uploadForm: (formData) => request('/forms/upload', { method: 'POST', body: formData }),
  getForms: () => request('/forms'),
  getForm: (id) => request(`/forms/${id}`),
  getFormPagePreviewUrl: (id, pageNum) => `${API_BASE}/forms/${id}/preview/${pageNum}`,
  updateFormField: (formId, fieldId, data) => request(`/forms/${formId}/fields/${fieldId}`, { method: 'PUT', body: data }),
  explainField: (formId, fieldId, language) => request(`/forms/${formId}/explain`, { method: 'POST', body: { field_id: fieldId, language } }),
  chatFormAssistant: (formId, message, fieldId, language) => request(`/forms/${formId}/chat`, { method: 'POST', body: { message, field_id: fieldId, language } }),

  // Autofill
  triggerAutofill: (formId, mode) => request(`/forms/${formId}/autofill`, { method: 'POST', body: { mode } }),
  confirmAutofill: (formId, confirmations) => request(`/forms/${formId}/confirm`, { method: 'POST', body: { confirmations } }),

  // Validation & Export
  validateForm: (formId) => request(`/forms/${formId}/validate`, { method: 'POST' }),
  getChecklist: (formId) => request(`/forms/${formId}/checklist`),
  exportForm: (formId) => request(`/forms/${formId}/export`, { method: 'POST' }),
  downloadExportUrl: (formId, exportId) => `${API_BASE}/forms/${formId}/export/${exportId}/download`,

  // History & Admin
  getHistory: () => request('/history'),
  deleteHistoryItem: (id) => request(`/history/${id}`, { method: 'DELETE' }),
  getAdminStats: () => request('/admin/stats'),
};

