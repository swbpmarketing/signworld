import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { usePreviewMode } from './PreviewModeContext';
import { useQuery } from '@tanstack/react-query';
import api from '../config/axios';

export interface Permissions {
  canAccessDashboard: boolean;
  canAccessLibrary: boolean;
  canUploadToLibrary: boolean;
  canAccessForum: boolean;
  canPostInForum: boolean;
  canAccessChat: boolean;
  canAccessEvents: boolean;
  canAccessEquipment: boolean;
  canListEquipment: boolean;
  canAccessBrags: boolean;
  canPostBrags: boolean;
  canAccessVideos: boolean;
  canAccessDirectory: boolean;
  canAccessPartners: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canApprovePending: boolean;
}

interface RolePermissions {
  owner: Permissions;
  vendor: Permissions;
}

interface PermissionsContextType {
  permissions: Permissions | null;
  loading: boolean;
  hasPermission: (permission: keyof Permissions) => boolean;
  refetchPermissions: () => void;
}

const defaultAdminPermissions: Permissions = {
  canAccessDashboard: true,
  canAccessLibrary: true,
  canUploadToLibrary: true,
  canAccessForum: true,
  canPostInForum: true,
  canAccessChat: true,
  canAccessEvents: true,
  canAccessEquipment: true,
  canListEquipment: true,
  canAccessBrags: true,
  canPostBrags: true,
  canAccessVideos: true,
  canAccessDirectory: true,
  canAccessPartners: true,
  canManageUsers: true,
  canManageSettings: true,
  canApprovePending: true,
};

const defaultOwnerPermissions: Permissions = {
  canAccessDashboard: true,
  canAccessLibrary: true,
  canUploadToLibrary: true,
  canAccessForum: true,
  canPostInForum: true,
  canAccessChat: true,
  canAccessEvents: true,
  canAccessEquipment: true,
  canListEquipment: true,
  canAccessBrags: true,
  canPostBrags: true,
  canAccessVideos: true,
  canAccessDirectory: true,
  canAccessPartners: true,
  canManageUsers: false,
  canManageSettings: false,
  canApprovePending: false,
};

const defaultVendorPermissions: Permissions = {
  canAccessDashboard: true,
  canAccessLibrary: true,
  canUploadToLibrary: false,
  canAccessForum: true,
  canPostInForum: true,
  canAccessChat: true,
  canAccessEvents: true,
  canAccessEquipment: true,
  canListEquipment: true,
  canAccessBrags: true,
  canPostBrags: false,
  canAccessVideos: true,
  canAccessDirectory: true,
  canAccessPartners: false,
  canManageUsers: false,
  canManageSettings: false,
  canApprovePending: false,
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isPreviewMode, previewState } = usePreviewMode();
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  // Fetch user's own permissions
  const { data: myPermissions, isLoading: myPermissionsLoading, refetch: refetchMyPermissions } = useQuery({
    queryKey: ['my-permissions'],
    queryFn: async () => {
      const response = await api.get('/settings/my-permissions');
      return response.data?.data as Permissions;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Admin fetches all role permissions for preview mode
  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const response = await api.get('/settings/role-permissions');
      return response.data?.data as RolePermissions;
    },
    enabled: user?.role === 'admin',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch specific user's permissions for user preview mode
  const { data: userPreviewData, isLoading: userPreviewLoading } = useQuery({
    queryKey: ['user-permissions', previewState.userId],
    queryFn: async () => {
      const response = await api.get(`/settings/user-permissions/${previewState.userId}`);
      return response.data?.data as { permissions: Permissions; user: any };
    },
    enabled: user?.role === 'admin' && previewState.type === 'user' && !!previewState.userId,
    staleTime: 5 * 60 * 1000,
  });

  // Determine which permissions to use based on preview mode
  useEffect(() => {
    if (!user) {
      setPermissions(null);
      return;
    }

    // If admin is previewing a specific user
    if (isPreviewMode && previewState.type === 'user' && user.role === 'admin' && userPreviewData) {
      setPermissions(userPreviewData.permissions);
      return;
    }

    // If admin is in role-based preview mode, use the previewed role's permissions
    if (isPreviewMode && previewState.type === 'role' && user.role === 'admin' && rolePermissions && previewState.role) {
      const previewPermissions = rolePermissions[previewState.role];
      if (previewPermissions) {
        setPermissions({
          ...previewPermissions,
          canManageUsers: false,
          canManageSettings: false,
          canApprovePending: false,
        });
        return;
      }
    }

    // Otherwise use the user's actual permissions
    if (myPermissions) {
      setPermissions(myPermissions);
    } else {
      // Fallback to defaults based on role
      switch (user.role) {
        case 'admin':
          setPermissions(defaultAdminPermissions);
          break;
        case 'owner':
          setPermissions(defaultOwnerPermissions);
          break;
        case 'vendor':
          setPermissions(defaultVendorPermissions);
          break;
        default:
          setPermissions(defaultOwnerPermissions);
      }
    }
  }, [user, isPreviewMode, previewState, myPermissions, rolePermissions, userPreviewData]);

  const hasPermission = useCallback((permission: keyof Permissions): boolean => {
    // Admin always has all permissions when not in preview mode
    if (user?.role === 'admin' && !isPreviewMode) {
      return true;
    }
    if (!permissions) return false;
    return permissions[permission] === true;
  }, [user?.role, isPreviewMode, permissions]);

  const refetchPermissions = useCallback(() => {
    refetchMyPermissions();
  }, [refetchMyPermissions]);

  // Include rolePermissionsLoading and userPreviewLoading for admin users who need those permissions for preview mode
  const isLoading = myPermissionsLoading || (user?.role === 'admin' && (rolePermissionsLoading || userPreviewLoading));

  const contextValue = useMemo(() => ({
    permissions,
    loading: isLoading,
    hasPermission,
    refetchPermissions,
  }), [permissions, isLoading, hasPermission, refetchPermissions]);

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
};
