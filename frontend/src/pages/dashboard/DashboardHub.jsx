import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import OwnerDashboard from './owner/OwnerDashboard';
import DoctorDashboard from './doctor/DoctorDashboard';
import ReceptionistDashboard from './receptionist/ReceptionistDashboard';
import EmployeeDashboard from './employee/EmployeeDashboard';
import PatientDashboard from './patient/PatientDashboard';

export default function DashboardHub() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const components = {
    owner: <OwnerDashboard />,
    doctor: <DoctorDashboard />,
    receptionist: <ReceptionistDashboard />,
    employee: <EmployeeDashboard />,
    patient: <PatientDashboard />,
    nurse: <DoctorDashboard />,
    pharmacist: <ReceptionistDashboard />,
    accountant: <ReceptionistDashboard />,
    marketing: <EmployeeDashboard />,
  };

  return components[user.role] || <Navigate to="/login" replace />;
}
