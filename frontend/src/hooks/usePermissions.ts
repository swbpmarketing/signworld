import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPermissions,
  hasPermission,
  isOwnOnly,
  requiresApproval,
  type UserRole,
  type FeaturePermissions,
  type RoleConfig,
} from '../config/rolePermissions';

type FeatureKey = keyof RoleConfig['features'];

interface UsePermissionsReturn {
  // Current user role
  role: UserRole | undefined;

  // Check if user has a specific permission for a feature
  can: (feature: FeatureKey, permission: keyof FeaturePermissions) => boolean;

  // Get all permissions for a feature
  getFeaturePermissions: (feature: FeatureKey) => FeaturePermissions;

  // Check if user can only manage their own items
  isOwnItemsOnly: (feature: FeatureKey) => boolean;

  // Check if action requires approval
  needsApproval: (feature: FeatureKey) => boolean;

  // Check if user is admin
  isAdmin: boolean;

  // Check if user is owner
  isOwner: boolean;

  // Check if user is vendor
  isVendor: boolean;

  // Check if user can view a feature
  canView: (feature: FeatureKey) => boolean;

  // Check if user can create in a feature
  canCreate: (feature: FeatureKey) => boolean;

  // Check if user can edit in a feature
  canEdit: (feature: FeatureKey) => boolean;

  // Check if user can delete in a feature
  canDelete: (feature: FeatureKey) => boolean;

  // Check if user can manage (all items) in a feature
  canManage: (feature: FeatureKey) => boolean;

  // Check if user can edit/delete a specific item (considering ownOnly)
  canEditItem: (feature: FeatureKey, itemOwnerId: string) => boolean;
  canDeleteItem: (feature: FeatureKey, itemOwnerId: string) => boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const userId = user?.id;

  return useMemo(() => {
    const can = (feature: FeatureKey, permission: keyof FeaturePermissions): boolean => {
      return hasPermission(role, feature, permission);
    };

    const getFeaturePermissions = (feature: FeatureKey): FeaturePermissions => {
      return getPermissions(role, feature);
    };

    const isOwnItemsOnly = (feature: FeatureKey): boolean => {
      return isOwnOnly(role, feature);
    };

    const needsApproval = (feature: FeatureKey): boolean => {
      return requiresApproval(role, feature);
    };

    const canView = (feature: FeatureKey): boolean => can(feature, 'view');
    const canCreate = (feature: FeatureKey): boolean => can(feature, 'create');
    const canEdit = (feature: FeatureKey): boolean => can(feature, 'edit');
    const canDelete = (feature: FeatureKey): boolean => can(feature, 'delete');
    const canManage = (feature: FeatureKey): boolean => can(feature, 'manage');

    // Check if user can edit a specific item
    const canEditItem = (feature: FeatureKey, itemOwnerId: string): boolean => {
      if (!canEdit(feature)) return false;
      if (canManage(feature)) return true; // Admin can edit all
      if (isOwnItemsOnly(feature)) {
        return userId === itemOwnerId;
      }
      return true;
    };

    // Check if user can delete a specific item
    const canDeleteItem = (feature: FeatureKey, itemOwnerId: string): boolean => {
      if (!canDelete(feature)) return false;
      if (canManage(feature)) return true; // Admin can delete all
      if (isOwnItemsOnly(feature)) {
        return userId === itemOwnerId;
      }
      return true;
    };

    return {
      role,
      can,
      getFeaturePermissions,
      isOwnItemsOnly,
      needsApproval,
      isAdmin: role === 'admin',
      isOwner: role === 'owner',
      isVendor: role === 'vendor',
      canView,
      canCreate,
      canEdit,
      canDelete,
      canManage,
      canEditItem,
      canDeleteItem,
    };
  }, [role, userId]);
};

export default usePermissions;
