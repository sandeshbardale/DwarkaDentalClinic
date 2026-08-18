/**
 * Mock notifications for all roles.
 */

export const MOCK_NOTIFICATIONS = [
  // Admin notifications
  { id: 'NTF-001', role: 'admin', type: 'info', title: 'New Patient Registered', message: 'Vijay Desai (DWK-2024-011) has been registered by Priya Patel.', time: '2024-08-18T08:30:00', read: false, icon: 'user-plus' },
  { id: 'NTF-002', role: 'admin', type: 'warning', title: 'Doctor Schedule Update', message: 'Dr. Shalini Verma has marked herself unavailable for 19–22 August.', time: '2024-08-17T17:00:00', read: false, icon: 'calendar-x' },
  { id: 'NTF-003', role: 'admin', type: 'success', title: 'Monthly Revenue Target Met', message: 'August revenue has crossed ₹2,00,000 — target achieved ahead of schedule.', time: '2024-08-17T12:00:00', read: true, icon: 'trending-up' },
  { id: 'NTF-004', role: 'admin', type: 'info', title: 'Appointment Cancelled', message: 'Appointment APT-017 with Aarav Patil was cancelled by patient.', time: '2024-08-17T09:15:00', read: true, icon: 'calendar-x' },
  { id: 'NTF-005', role: 'admin', type: 'info', title: 'New Doctor Added', message: 'Dr. Shalini Verma has been added to the system by Admin.', time: '2024-08-15T10:00:00', read: true, icon: 'user-check' },

  // Doctor notifications
  { id: 'NTF-006', role: 'doctor', type: 'warning', title: 'Follow-up Due Today', message: 'Aarav Patil has a follow-up appointment at 10:30 AM today.', time: '2024-08-18T08:00:00', read: false, icon: 'bell' },
  { id: 'NTF-007', role: 'doctor', type: 'warning', title: 'Follow-up Due Today', message: 'Gaurav Singh has a follow-up at 11:30 AM today.', time: '2024-08-18T08:00:00', read: false, icon: 'bell' },
  { id: 'NTF-008', role: 'doctor', type: 'info', title: 'New Appointment Booked', message: 'Priya Patel has booked a consultation for Pooja Reddy on 22 Aug at 10:30 AM.', time: '2024-08-17T15:30:00', read: false, icon: 'calendar-check' },
  { id: 'NTF-009', role: 'doctor', type: 'warning', title: 'Follow-up Due Tomorrow', message: 'Preethi Rajan has a sensitivity follow-up scheduled for tomorrow.', time: '2024-08-17T08:00:00', read: true, icon: 'clock' },
  { id: 'NTF-010', role: 'doctor', type: 'info', title: 'Prescription Reminder', message: 'Sneha Kulkarni\'s prescription course ends today. Verify recovery at next visit.', time: '2024-08-18T09:00:00', read: true, icon: 'pill' },

  // Receptionist notifications
  { id: 'NTF-011', role: 'receptionist', type: 'info', title: 'Today\'s Appointments', message: '10 appointments scheduled for today across all doctors.', time: '2024-08-18T08:00:00', read: false, icon: 'calendar' },
  { id: 'NTF-012', role: 'receptionist', type: 'warning', title: 'Follow-up Due Today', message: 'Aarav Patil and Gaurav Singh have follow-ups due today. Please confirm arrival.', time: '2024-08-18T08:05:00', read: false, icon: 'clock' },
  { id: 'NTF-013', role: 'receptionist', type: 'info', title: 'New Patient Walk-in', message: 'A walk-in patient has arrived. Please complete registration.', time: '2024-08-18T10:00:00', read: false, icon: 'user-plus' },
  { id: 'NTF-014', role: 'receptionist', type: 'success', title: 'Patient Registered', message: 'Vijay Desai has been successfully registered.', time: '2024-08-18T08:35:00', read: true, icon: 'check-circle' },
  { id: 'NTF-015', role: 'receptionist', type: 'warning', title: 'Appointment Reminder', message: 'Send SMS reminders for tomorrow\'s 8 appointments.', time: '2024-08-18T12:00:00', read: true, icon: 'message-square' },
];
