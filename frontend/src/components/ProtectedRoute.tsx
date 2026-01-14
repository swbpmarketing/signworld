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

  if (loading) {
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

  // Admin-only check: If adminOnly is true, check immediately (don't wait for permissions to load)
  // This allows admins to access admin-only routes without waiting for permission checks
  if (adminOnly) {
    if (isPreviewMode) {
      // Block admin-only routes in preview mode
      return <Navigate to="/dashboard" replace />;
    }
    if (user.role === 'admin') {
      // Admin has full access to admin-only routes, skip permission check
      return children;
    }
    // Non-admin users cannot access admin-only routes
    return <Navigate to="/dashboard" replace />;
  }

  // For non-adminOnly routes, wait for permissions to load if needed
  if (permissionsLoading && requiredPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
  // hasPermission already handles admin users correctly (returns true for all permissions when admin and not in preview)
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
