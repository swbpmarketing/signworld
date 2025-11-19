import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import VendorDashboard from './VendorDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'vendor') {
    return <VendorDashboard />;
  }

  return <Dashboard />;
};

export default DashboardRouter;
