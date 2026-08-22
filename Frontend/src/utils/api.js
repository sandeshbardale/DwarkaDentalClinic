/**
 * Frontend API client — communicates with the backend via Vite proxy.
 * All authenticated requests send the JWT token from localStorage in
 * the Authorization: Bearer header. Role is NEVER sent from the client.
 */

const SESSION_KEY = 'ddc:session';

/** Read JWT token from localStorage session */
function getToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token || null;
  } catch {
    return null;
  }
}

/** Core HTTP client — attaches JWT, handles JSON/FormData */
async function apiCall(endpoint, options = {}) {
  const url = `/api${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const headers = { ...options.headers };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; }
  catch { data = { error: text }; }

  if (!response.ok) {
    if (response.status === 401) {
      console.warn('Authentication status 401 on endpoint:', endpoint);
    }
    throw new Error(data.message || data.error || `HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  login: (email, password) =>
    apiCall('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => apiCall('/auth/me'),

  // ── Dashboard ───────────────────────────────────────────────────────────────
  getDashboardStats: () => apiCall('/stats/dashboard'),

  // ── Treatment Categories ────────────────────────────────────────────────────
  getCategories: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/categories${q ? '?' + q : ''}`);
  },
  createCategory: (data) =>
    apiCall('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) =>
    apiCall(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleCategory: (id, isActive) =>
    apiCall(`/categories/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),

  // ── Patients ────────────────────────────────────────────────────────────────
  getPatients: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/patients${q ? '?' + q : ''}`);
  },
  getPatient: (id) => apiCall(`/patients/${id}`),
  addPatient: (data) =>
    apiCall('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id, data) =>
    apiCall(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (id) =>
    apiCall(`/patients/${id}`, { method: 'DELETE' }),

  // ── Appointments ────────────────────────────────────────────────────────────
  getAppointments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/appointments${q ? '?' + q : ''}`);
  },
  getAppointmentsByPatient: (patientId) =>
    apiCall(`/appointments/patient/${patientId}`),
  bookAppointment: (data) =>
    apiCall('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id, body) =>
    apiCall(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAppointment: (id) =>
    apiCall(`/appointments/${id}`, { method: 'DELETE' }),

  // ── Payments ────────────────────────────────────────────────────────────────
  getPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/payments${q ? '?' + q : ''}`);
  },
  getPaymentsByPatient: (patientId) =>
    apiCall(`/payments/patient/${patientId}`),
  addPayment: (data) =>
    apiCall('/payments', { method: 'POST', body: JSON.stringify(data) }),
  deletePayment: (id) =>
    apiCall(`/payments/${id}`, { method: 'DELETE' }),
  getRevenueSummary: () => apiCall('/payments/summary'),

  // ── Clinical Records ────────────────────────────────────────────────────────
  getClinicalRecords: (patientId) => apiCall(`/clinical/${patientId}`),
  addClinicalRecord: (data) =>
    apiCall('/clinical', { method: 'POST', body: JSON.stringify(data) }),

  // ── AI X-Ray ────────────────────────────────────────────────────────────────
  uploadXray: (patientId, file) => {
    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('xray', file);
    return apiCall('/ai/upload', { method: 'POST', body: formData });
  },
  getAiReports: (patientId) => apiCall(`/ai/reports/${patientId}`),
  reviewAiReport: (reportId, body) =>
    apiCall(`/ai/reports/${reportId}/review`, { method: 'PATCH', body: JSON.stringify(body) }),

  // ── Notifications ───────────────────────────────────────────────────────────
  sendWhatsAppReminders: () =>
    apiCall('/notifications/send-reminders', { method: 'POST' }),

  // ── Staff (doctors list for dropdowns & management) ─────────────────────────
  getDoctors: () => apiCall('/auth/doctors'),
  getStaff: () => apiCall('/auth/staff'),
  createStaff: (data) => apiCall('/auth/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id, data) => apiCall(`/auth/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
