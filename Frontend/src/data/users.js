/**
 * Mock user credentials for demo authentication.
 * Replace with real API calls in production.
 */

export const MOCK_USERS = [
  {
    id: 'USR-001',
    name: 'Dr. Ananya Sharma',
    email: 'admin@dwarkadental.com',
    password: 'admin123',
    role: 'admin',
    avatar: null,
    phone: '+91 98765 00001',
    designation: 'Chief Administrator',
    joinedAt: '2020-01-15',
  },
  {
    id: 'USR-002',
    name: 'Dr. Neha Sharma',
    email: 'doctor@dwarkadental.com',
    password: 'doctor123',
    role: 'doctor',
    avatar: null,
    phone: '+91 98765 00002',
    designation: 'Senior Dentist',
    specialization: 'Orthodontics',
    doctorId: 'DOC-001',
    joinedAt: '2021-03-10',
  },
  {
    id: 'USR-003',
    name: 'Priya Patel',
    email: 'receptionist@dwarkadental.com',
    password: 'recep123',
    role: 'receptionist',
    avatar: null,
    phone: '+91 98765 00003',
    designation: 'Senior Receptionist',
    staffId: 'STF-001',
    joinedAt: '2022-06-01',
  },
];

/** Role-to-base-path mapping */
export const ROLE_HOME = {
  admin: '/admin',
  doctor: '/doctor',
  receptionist: '/receptionist',
};
