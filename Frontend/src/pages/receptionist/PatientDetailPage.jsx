// Receptionist patient detail — delegates to shared admin/PatientDetailPage component
import PatientDetailPage from '../admin/PatientDetailPage';

export default function ReceptionistPatientDetailPage() {
  return <PatientDetailPage basePath="/receptionist" />;
}
