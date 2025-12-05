import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import OwnerDashboard from './OwnerDashboard';
import VendorDashboard from './VendorDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  // If no user or role is undefined, redirect to login
  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case 'admin':
      return <Dashboard />;
    case 'owner':
      return <OwnerDashboard />;
    case 'vendor':
      return <VendorDashboard />;
    default:
      // Unknown role - redirect to login for security
      return <Navigate to="/login" replace />;
  }
};

export default DashboardRouter;
