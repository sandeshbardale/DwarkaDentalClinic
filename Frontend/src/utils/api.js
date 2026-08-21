/**
 * Frontend API client communicating with the backend.
 * Routes are proxied via vite.config.js to http://localhost:5000.
 */

// Helper to make requests and handle response/headers
async function apiCall(endpoint, options = {}) {
  const url = `/api${endpoint}`;
  
  // Set JSON headers if not uploading FormData
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...options.headers,
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Retrieve current user role from Redux store/localStorage if available to authenticate operations
  const savedState = localStorage.getItem('persist:auth');
  if (savedState) {
    try {
      const auth = JSON.parse(savedState);
      if (auth.role) {
        headers['x-user-role'] = auth.role;
      }
    } catch (e) {}
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { error: text };
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Patients
  getPatients: () => apiCall('/patients'),
  addPatient: (patientData) => 
    apiCall('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    }),
  updatePatient: (id, patientData) => 
    apiCall(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    }),
  deletePatient: (id, role) => 
    apiCall(`/patients/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': role },
    }),

  // Appointments
  getAppointments: () => apiCall('/appointments'),
  bookAppointment: (appointmentData) => 
    apiCall('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    }),
  updateAppointmentStatus: (id, status, nextDate = null, nextTime = null, notes = undefined) => 
    apiCall(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, nextDate, nextTime, notes }),
    }),
  deleteAppointment: (id, role) => 
    apiCall(`/appointments/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': role },
    }),

  // Billing / Payments
  getPayments: () => apiCall('/payments'),
  addPayment: (paymentData) => 
    apiCall('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  deletePayment: (id, role) => 
    apiCall(`/payments/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': role },
    }),
  getRevenueSummary: () => apiCall('/payments/summary'),

  // Clinical History
  getClinicalRecords: (patientId) => apiCall(`/clinical/${patientId}`),
  addClinicalRecord: (recordData) => 
    apiCall('/clinical', {
      method: 'POST',
      body: JSON.stringify(recordData),
    }),

  // AI Cavity Detection
  uploadXray: (patientId, file) => {
    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('xray', file);
    return apiCall('/ai/upload', {
      method: 'POST',
      body: formData,
    });
  },
  getAiReports: (patientId) => apiCall(`/ai/reports/${patientId}`),

  // Reminders
  sendWhatsAppReminders: () => 
    apiCall('/notifications/send-reminders', {
      method: 'POST',
    }),
};
