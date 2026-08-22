import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '../layout/Rootlayout';
import DashboardLayout from '../layout/DashboardLayout';
import ProtectedRoute from '../layout/ProctectedRoute';

// Auth
import LoginPage from '../pages/auth/LoginPage';

// Shared
import AiXrayPage from '../pages/shared/AiXrayPage';

// Admin
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminPatientsPage from '../pages/admin/PatientsPage';
import AdminAppointmentsPage from '../pages/admin/AppointmentsPage';
import AdminDoctorsPage from '../pages/admin/DoctorsPage';
import AdminStaffPage from '../pages/admin/StaffPage';
import AdminRevenuePage from '../pages/admin/RevenuePage';
import AdminReportsPage from '../pages/admin/ReportsPage';
import AdminNotificationsPage from '../pages/admin/NotificationsPage';
import AdminSettingsPage from '../pages/admin/SettingsPage';
import AdminPatientDetailPage from '../pages/admin/PatientDetailPage';

// Doctor
import DoctorDashboardPage from '../pages/doctor/DoctorDashboardPage';
import DoctorAppointmentsPage from '../pages/doctor/DoctorAppointmentsPage';
import DoctorPatientsPage from '../pages/doctor/DoctorPatientsPage';
import DoctorPatientDetailPage from '../pages/doctor/PatientDetailPage';
import DoctorFollowUpsPage from '../pages/doctor/DoctorFollowUpsPage';
import DoctorHistoryPage from '../pages/doctor/DoctorHistoryPage';
import DoctorNotificationsPage from '../pages/doctor/DoctorNotificationsPage';
import DoctorProfilePage from '../pages/doctor/DoctorProfilePage';

// Receptionist
import ReceptionistDashboardPage from '../pages/receptionist/ReceptionistDashboardPage';
import ReceptionistPatientsPage from '../pages/receptionist/PatientsPage';
import RegisterPatientPage from '../pages/receptionist/RegisterPatientPage';
import ReceptionistPatientDetailPage from '../pages/receptionist/PatientDetailPage';
import ReceptionistAppointmentsPage from '../pages/receptionist/AppointmentsPage';
import ReceptionistFollowUpsPage from '../pages/receptionist/FollowUpsPage';
import ReceptionistNotificationsPage from '../pages/receptionist/NotificationsPage';
import ProfilePage from '../pages/receptionist/ProfilePage';

// Misc
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },

      // ─── Admin Routes ──────────────────────────────────────
      {
        path: 'admin',
        element: <ProtectedRoute allowedRoles="admin"><DashboardLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'patients', element: <AdminPatientsPage /> },
          { path: 'patients/:id', element: <AdminPatientDetailPage /> },
          { path: 'appointments', element: <AdminAppointmentsPage /> },
          { path: 'ai-xray', element: <AiXrayPage /> },
          { path: 'doctors', element: <AdminDoctorsPage /> },
          { path: 'staff', element: <AdminStaffPage /> },
          { path: 'revenue', element: <AdminRevenuePage /> },
          { path: 'reports', element: <AdminReportsPage /> },
          { path: 'notifications', element: <AdminNotificationsPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
        ],
      },

      // ─── Doctor Routes ─────────────────────────────────────
      {
        path: 'doctor',
        element: <ProtectedRoute allowedRoles="doctor"><DashboardLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <DoctorDashboardPage /> },
          { path: 'appointments', element: <DoctorAppointmentsPage /> },
          { path: 'patients', element: <DoctorPatientsPage /> },
          { path: 'patients/:id', element: <DoctorPatientDetailPage /> },
          { path: 'ai-xray', element: <AiXrayPage /> },
          { path: 'follow-ups', element: <DoctorFollowUpsPage /> },
          { path: 'history', element: <DoctorHistoryPage /> },
          { path: 'notifications', element: <DoctorNotificationsPage /> },
          { path: 'profile', element: <DoctorProfilePage /> },
        ],
      },

      // ─── Receptionist Routes ───────────────────────────────
      {
        path: 'receptionist',
        element: <ProtectedRoute allowedRoles="receptionist"><DashboardLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <ReceptionistDashboardPage /> },
          { path: 'patients', element: <ReceptionistPatientsPage /> },
          { path: 'patients/new', element: <RegisterPatientPage /> },
          { path: 'patients/:id', element: <ReceptionistPatientDetailPage /> },
          { path: 'appointments', element: <ReceptionistAppointmentsPage /> },
          { path: 'payments', element: <AdminRevenuePage /> },
          { path: 'ai-xray', element: <AiXrayPage /> },
          { path: 'follow-ups', element: <ReceptionistFollowUpsPage /> },
          { path: 'notifications', element: <ReceptionistNotificationsPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;