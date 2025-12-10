import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import type { Permissions } from '../context/PermissionsContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  allowedRoles?: Array<'admin' | 'owner' | 'vendor'>;
  requiredPermission?: keyof Permissions;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  ownerOnly = false,
  allowedRoles,
  requiredPermission
}) => {
  const { user, loading } = useAuth();
  const { hasPermission, loading: permissionsLoading, permissions } = usePermissions();
  const { isPreviewMode, getEffectiveRole, previewRole } = usePreviewMode();

  // Force re-evaluation when these change (permissions object reference changes trigger re-render)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _permissionsKey = permissions ? Object.values(permissions).join(',') : 'none';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _previewKey = `${isPreviewMode}-${previewRole}`;

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Get the effective role (actual role or preview role for admins)
  const effectiveRole = getEffectiveRole();

  // Check allowed roles if specified (use effective role for preview mode)
  if (allowedRoles && allowedRoles.length > 0) {
    // In preview mode, check against the preview role
    if (isPreviewMode) {
      if (!allowedRoles.includes(effectiveRole)) {
        return <Navigate to="/dashboard" replace />;
      }
    } else {
      if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // Legacy adminOnly check - skip in preview mode since admin is previewing
  if (adminOnly && !isPreviewMode && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // In preview mode, check if admin-only routes should be blocked
  if (adminOnly && isPreviewMode) {
    return <Navigate to="/dashboard" replace />;
  }

  // Owner-only check (allows admin access too, but not in preview mode)
  if (ownerOnly) {
    if (isPreviewMode) {
      if (effectiveRole !== 'owner') {
        return <Navigate to="/dashboard" replace />;
      }
    } else if (user.role !== 'owner' && user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
