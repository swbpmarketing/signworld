import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import OwnerDashboard from './OwnerDashboard';
import VendorDashboard from './VendorDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  // Route to role-specific dashboard
  switch (user?.role) {
    case 'admin':
      return <Dashboard />;
    case 'owner':
      return <OwnerDashboard />;
    case 'vendor':
      return <VendorDashboard />;
    default:
      return <OwnerDashboard />; // Default to owner dashboard
  }
};

export default DashboardRouter;
