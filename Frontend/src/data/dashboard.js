/**
 * Aggregated dashboard KPI data for all roles.
 */

export const ADMIN_DASHBOARD = {
  kpis: {
    totalPatients: 215,
    todayAppointments: 10,
    completedTreatments: 1847,
    totalDoctors: 5,
    activeReceptionists: 3,
    monthlyRevenue: 247800,
    pendingFollowUps: 8,
    newPatientsThisMonth: 24,
  },

  patientRegistrations: [
    { month: 'Jan', count: 18 },
    { month: 'Feb', count: 14 },
    { month: 'Mar', count: 22 },
    { month: 'Apr', count: 26 },
    { month: 'May', count: 19 },
    { month: 'Jun', count: 28 },
    { month: 'Jul', count: 31 },
    { month: 'Aug', count: 24 },
  ],

  appointmentTrend: [
    { day: 'Mon', scheduled: 12, completed: 10, cancelled: 2 },
    { day: 'Tue', scheduled: 15, completed: 13, cancelled: 1 },
    { day: 'Wed', scheduled: 18, completed: 16, cancelled: 2 },
    { day: 'Thu', scheduled: 14, completed: 12, cancelled: 0 },
    { day: 'Fri', scheduled: 16, completed: 15, cancelled: 1 },
    { day: 'Sat', scheduled: 20, completed: 18, cancelled: 1 },
  ],

  appointmentStatusDistribution: [
    { name: 'Completed', value: 68, color: '#10b981' },
    { name: 'Scheduled', value: 18, color: '#0b6ba7' },
    { name: 'In Progress', value: 5, color: '#f59e0b' },
    { name: 'Cancelled', value: 7, color: '#ef4444' },
    { name: 'No Show', value: 2, color: '#94a3b8' },
  ],

  doctorWorkload: [
    { name: 'Dr. Neha Sharma', appointments: 48, color: '#0b6ba7' },
    { name: 'Dr. Rohan Mehta', appointments: 62, color: '#0d9c8e' },
    { name: 'Dr. Kavita Iyer', appointments: 35, color: '#8b5cf6' },
    { name: 'Dr. Arjun Kapoor', appointments: 55, color: '#f59e0b' },
    { name: 'Dr. Shalini Verma', appointments: 12, color: '#94a3b8' },
  ],
};

export const DOCTOR_DASHBOARD = {
  todayStats: {
    totalAppointments: 4,
    completed: 0,
    inProgress: 1,
    upcoming: 3,
    followUpsDue: 2,
  },
  weeklyAppointments: [
    { day: 'Mon', count: 6 },
    { day: 'Tue', count: 8 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 7 },
    { day: 'Fri', count: 6 },
    { day: 'Sat', count: 4 },
  ],
};

export const RECEPTIONIST_DASHBOARD = {
  kpis: {
    totalPatients: 215,
    todayAppointments: 10,
    newRegistrationsToday: 2,
    pendingAppointments: 8,
    followUpsDueToday: 2,
    followUpsDueTomorrow: 1,
  },
};
