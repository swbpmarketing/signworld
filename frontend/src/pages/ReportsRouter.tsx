import { useAuth } from '../context/AuthContext';
import Reports from './Reports';
import OwnerReports from './OwnerReports';

const ReportsRouter = () => {
  const { user } = useAuth();

  // Show owner-specific reports for owner role
  if (user?.role === 'owner') {
    return <OwnerReports />;
  }

  // Show admin reports for admin role
  // Vendors don't have reports access per rolePermissions.ts
  return <Reports />;
};

export default ReportsRouter;
