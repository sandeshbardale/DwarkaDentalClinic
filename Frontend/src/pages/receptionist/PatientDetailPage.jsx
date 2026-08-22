import { useParams } from 'react-router-dom';
import AdminPatientDetailPage from '../admin/PatientDetailPage';

/**
 * Receptionist Patient Detail — re-uses the admin PatientDetailPage.
 * The admin page renders appropriate actions based on user role.
 */
export default function ReceptionistPatientDetailPage() {
  return <AdminPatientDetailPage />;
}
