import { useAuth } from '../context/AuthContext';
import Reports from './Reports';
import OwnerReports from './OwnerReports';
import VendorReports from './VendorReports';

const ReportsRouter = () => {
  const { user } = useAuth();

  // Show owner-specific reports for owner role
  if (user?.role === 'owner') {
    return <OwnerReports />;
  }

  // Show vendor-specific reports for vendor role
  if (user?.role === 'vendor') {
    return <VendorReports />;
  }

  // Show admin reports for admin role
  return <Reports />;
};

export default ReportsRouter;
