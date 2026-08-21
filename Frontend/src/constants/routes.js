/**
 * Centralized route path constants.
 * Import from here instead of repeating magic strings across files.
 */
export const ROUTES = {
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',

  // Admin
  ADMIN: '/admin',
  ADMIN_PATIENTS: '/admin/patients',
  ADMIN_PATIENT_DETAIL: (id = ':id') => `/admin/patients/${id}`,
  ADMIN_APPOINTMENTS: '/admin/appointments',
  ADMIN_DOCTORS: '/admin/doctors',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_REVENUE: '/admin/revenue',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_SETTINGS: '/admin/settings',

  // Doctor
  DOCTOR: '/doctor',
  DOCTOR_APPOINTMENTS: '/doctor/appointments',
  DOCTOR_PATIENTS: '/doctor/patients',
  DOCTOR_PATIENT_DETAIL: (id = ':id') => `/doctor/patients/${id}`,
  DOCTOR_FOLLOW_UPS: '/doctor/follow-ups',
  DOCTOR_HISTORY: '/doctor/history',
  DOCTOR_NOTIFICATIONS: '/doctor/notifications',
  DOCTOR_PROFILE: '/doctor/profile',

  // Receptionist
  RECEPTIONIST: '/receptionist',
  RECEPTIONIST_PATIENTS: '/receptionist/patients',
  RECEPTIONIST_REGISTER_PATIENT: '/receptionist/patients/new',
  RECEPTIONIST_PATIENT_DETAIL: (id = ':id') => `/receptionist/patients/${id}`,
  RECEPTIONIST_APPOINTMENTS: '/receptionist/appointments',
  RECEPTIONIST_FOLLOW_UPS: '/receptionist/follow-ups',
  RECEPTIONIST_NOTIFICATIONS: '/receptionist/notifications',
  RECEPTIONIST_PROFILE: '/receptionist/profile',
};

/** Maps a role string to its home dashboard path */
export const ROLE_HOME = {
  admin: ROUTES.ADMIN,
  doctor: ROUTES.DOCTOR,
  receptionist: ROUTES.RECEPTIONIST,
};
