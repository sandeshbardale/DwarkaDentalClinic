/**
 * API endpoint path constants.
 * All backend route paths in one place — no hardcoded strings in components.
 */
export const API = {
  AUTH_LOGIN: '/auth/login',
  PATIENTS: '/patients',
  PATIENT: (id) => `/patients/${id}`,
  APPOINTMENTS: '/appointments',
  APPOINTMENT_STATUS: (id) => `/appointments/${id}/status`,
  APPOINTMENT: (id) => `/appointments/${id}`,
  PAYMENTS: '/payments',
  PAYMENTS_SUMMARY: '/payments/summary',
  PAYMENT: (id) => `/payments/${id}`,
  CLINICAL: (patientId) => `/clinical/${patientId}`,
  CLINICAL_ADD: '/clinical',
  AI_UPLOAD: '/ai/upload',
  AI_REPORTS: (patientId) => `/ai/reports/${patientId}`,
  SEND_REMINDERS: '/notifications/send-reminders',
};
