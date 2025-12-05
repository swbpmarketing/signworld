// Role-based permissions configuration
// Defines what each user role can access and their permission levels

export type UserRole = 'admin' | 'owner' | 'vendor';

export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'manage' | 'full';

export interface FeaturePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean; // Can manage all items (not just own)
  ownOnly?: boolean; // Can only manage own items
  requiresApproval?: boolean; // Actions require admin approval
}

export interface RoleConfig {
  dashboard: string; // Dashboard type: 'admin' | 'owner' | 'vendor'
  features: {
    dashboard: FeaturePermissions;
    reports: FeaturePermissions;
    userManagement: FeaturePermissions;
    calendar: FeaturePermissions;
    convention: FeaturePermissions;
    successStories: FeaturePermissions;
    forum: FeaturePermissions;
    chat: FeaturePermissions;
    library: FeaturePermissions;
    ownersRoster: FeaturePermissions;
    partners: FeaturePermissions;
    videos: FeaturePermissions;
    equipment: FeaturePermissions;
    map: FeaturePermissions;
    faqs: FeaturePermissions;
  };
}

// Default permission set (no access)
const noAccess: FeaturePermissions = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  manage: false,
};

// View only permissions
const viewOnly: FeaturePermissions = {
  view: true,
  create: false,
  edit: false,
  delete: false,
  manage: false,
};

// Full access permissions
const fullAccess: FeaturePermissions = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  manage: true,
};

// Role configurations
export const rolePermissions: Record<UserRole, RoleConfig> = {
  admin: {
    dashboard: 'admin',
    features: {
      dashboard: fullAccess,
      reports: fullAccess,
      userManagement: fullAccess,
      calendar: fullAccess,
      convention: fullAccess,
      successStories: fullAccess,
      forum: fullAccess,
      chat: fullAccess,
      library: fullAccess,
      ownersRoster: fullAccess,
      partners: fullAccess,
      videos: fullAccess,
      equipment: fullAccess,
      map: fullAccess,
      faqs: fullAccess,
    },
  },
  owner: {
    dashboard: 'owner',
    features: {
      dashboard: viewOnly,
      reports: viewOnly, // Owner-specific reports (view only)
      userManagement: noAccess,
      calendar: { ...viewOnly, create: false }, // View events and reminders
      convention: viewOnly, // View schedules
      successStories: {
        view: true,
        create: true, // Can create (for approval)
        edit: true, // Can edit own
        delete: true, // Can delete own
        manage: false,
        ownOnly: true,
        requiresApproval: true,
      },
      forum: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        manage: false,
        ownOnly: true, // Can only manage own posts
      },
      chat: fullAccess,
      library: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        manage: false,
      }, // Browse and download only
      ownersRoster: viewOnly, // Search and view profiles
      partners: viewOnly, // View only
      videos: viewOnly, // View only
      equipment: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        manage: false,
      }, // Browse, inquire, wishlist, cart
      map: fullAccess, // Full access
      faqs: viewOnly, // Search and view
    },
  },
  vendor: {
    dashboard: 'vendor',
    features: {
      dashboard: viewOnly,
      reports: viewOnly, // Vendor-specific reports (view only)
      userManagement: noAccess,
      calendar: viewOnly,
      convention: viewOnly,
      successStories: viewOnly,
      forum: noAccess,
      chat: fullAccess,
      library: noAccess,
      ownersRoster: noAccess,
      partners: viewOnly,
      videos: noAccess,
      equipment: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        manage: false,
        ownOnly: true, // Can manage own equipment listings
      },
      map: viewOnly,
      faqs: viewOnly,
    },
  },
};

// Helper function to get permissions for a role and feature
export const getPermissions = (
  role: UserRole | undefined,
  feature: keyof RoleConfig['features']
): FeaturePermissions => {
  if (!role) return noAccess;
  return rolePermissions[role]?.features[feature] || noAccess;
};

// Helper function to check if user has specific permission
export const hasPermission = (
  role: UserRole | undefined,
  feature: keyof RoleConfig['features'],
  permission: keyof FeaturePermissions
): boolean => {
  const permissions = getPermissions(role, feature);
  return permissions[permission] === true;
};

// Helper function to check if user can only manage own items
export const isOwnOnly = (
  role: UserRole | undefined,
  feature: keyof RoleConfig['features']
): boolean => {
  const permissions = getPermissions(role, feature);
  return permissions.ownOnly === true;
};

// Helper function to check if action requires approval
export const requiresApproval = (
  role: UserRole | undefined,
  feature: keyof RoleConfig['features']
): boolean => {
  const permissions = getPermissions(role, feature);
  return permissions.requiresApproval === true;
};

// Helper function to get dashboard type for role
export const getDashboardType = (role: UserRole | undefined): string => {
  if (!role) return 'owner';
  return rolePermissions[role]?.dashboard || 'owner';
};
