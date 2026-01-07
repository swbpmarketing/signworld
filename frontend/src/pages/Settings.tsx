import { useState, useEffect } from 'react';
import UserSettings from '../components/profile/UserSettings';
import emailService from '../services/emailService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { usePreviewMode } from '../context/PreviewModeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/axios';
import {
  EnvelopeIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  UsersIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface SystemSettings {
  platformName: string;
  supportEmail: string;
  requireStrongPasswords: boolean;
  autoApproveOwners: boolean;
  requireLibraryApproval: boolean;
  maxFileUploadSize: number;
  itemsPerPage: number;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newMessages: boolean;
  forumReplies: boolean;
  systemAnnouncements: boolean;
  marketplaceUpdates: boolean;
  weeklyDigest: boolean;
}

interface RolePermission {
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
}

interface RolePermissions {
  owner: RolePermission;
  vendor: RolePermission;
}

const Settings = () => {
  const { user } = useAuth();
  const { getEffectiveRole } = usePreviewMode();
  const queryClient = useQueryClient();
  const effectiveRole = getEffectiveRole();
  const isAdmin = effectiveRole === 'admin';
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'notifications' | 'broadcasts' | 'roles'>('profile');
  const [selectedRoleTab, setSelectedRoleTab] = useState<'owner' | 'vendor'>('owner');

  // System settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    platformName: 'Signworld Business Partners',
    supportEmail: 'support@signworld.org',
    requireStrongPasswords: true,
    autoApproveOwners: false,
    requireLibraryApproval: true,
    maxFileUploadSize: 50,
    itemsPerPage: 20,
  });

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    newMessages: true,
    forumReplies: true,
    systemAnnouncements: true,
    marketplaceUpdates: true,
    weeklyDigest: false,
  });

  // Broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Role permissions state
  const defaultRolePermissions: RolePermissions = {
    owner: {
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
    },
    vendor: {
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
    },
  };
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(defaultRolePermissions);

  // Fetch system settings (admin only)
  const { data: fetchedSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data?.data;
    },
    enabled: isAdmin,
  });

  // Update local state when settings are fetched
  useEffect(() => {
    if (fetchedSettings) {
      setSystemSettings({
        platformName: fetchedSettings.platformName || 'Signworld Business Partners',
        supportEmail: fetchedSettings.supportEmail || 'support@signworld.org',
        requireStrongPasswords: fetchedSettings.requireStrongPasswords ?? true,
        autoApproveOwners: fetchedSettings.autoApproveOwners ?? false,
        requireLibraryApproval: fetchedSettings.requireLibraryApproval ?? true,
        maxFileUploadSize: fetchedSettings.maxFileUploadSize || 50,
        itemsPerPage: fetchedSettings.itemsPerPage || 20,
      });
    }
  }, [fetchedSettings]);

  // Fetch notification preferences
  const { data: fetchedNotifPrefs } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await api.get('/settings/notifications');
      return response.data?.data;
    },
  });

  // Update local state when notification prefs are fetched
  useEffect(() => {
    if (fetchedNotifPrefs) {
      setNotificationPrefs({
        emailNotifications: fetchedNotifPrefs.emailNotifications ?? true,
        pushNotifications: fetchedNotifPrefs.pushNotifications ?? true,
        newMessages: fetchedNotifPrefs.newMessages ?? true,
        forumReplies: fetchedNotifPrefs.forumReplies ?? true,
        systemAnnouncements: fetchedNotifPrefs.systemAnnouncements ?? true,
        marketplaceUpdates: fetchedNotifPrefs.marketplaceUpdates ?? true,
        weeklyDigest: fetchedNotifPrefs.weeklyDigest ?? false,
      });
    }
  }, [fetchedNotifPrefs]);

  // Mutation for saving system settings
  const saveSystemSettings = useMutation({
    mutationFn: async (settings: SystemSettings) => {
      const response = await api.put('/settings', settings);
      return response.data;
    },
    onSuccess: () => {
      toast.success('System settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save settings');
    },
  });

  // Mutation for saving notification preferences
  const saveNotificationPrefs = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const response = await api.put('/settings/notifications', prefs);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Notification preferences saved!');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save preferences');
    },
  });

  // Fetch role permissions (admin only)
  const { data: fetchedRolePermissions, isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const response = await api.get('/settings/role-permissions');
      return response.data?.data;
    },
    enabled: isAdmin,
  });

  // Update local state when role permissions are fetched
  useEffect(() => {
    if (fetchedRolePermissions) {
      setRolePermissions({
        owner: { ...defaultRolePermissions.owner, ...fetchedRolePermissions.owner },
        vendor: { ...defaultRolePermissions.vendor, ...fetchedRolePermissions.vendor },
      });
    }
  }, [fetchedRolePermissions]);

  // Mutation for saving role permissions
  const saveRolePermissions = useMutation({
    mutationFn: async (perms: RolePermissions) => {
      const response = await api.put('/settings/role-permissions', perms);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Role permissions saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save role permissions');
    },
  });

  // Fetch broadcast history
  const { data: broadcastHistory } = useQuery({
    queryKey: ['broadcast-history'],
    queryFn: async () => {
      const response = await api.get('/notifications/broadcasts');
      return response.data?.data || [];
    },
    enabled: isAdmin && activeTab === 'broadcasts',
  });

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Please enter both title and message');
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const response = await api.post('/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage,
        targetRole: targetRole,
        type: 'announcement',
      });

      toast.success(response.data.message || 'Broadcast sent successfully!');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTargetRole('all');
      queryClient.invalidateQueries({ queryKey: ['broadcast-history'] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send broadcast');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const result = await emailService.testEmail();
      toast.success('Test email sent successfully! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test email');
      console.error('Email error:', error);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSystemSettingChange = (key: keyof SystemSettings, value: any) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNotificationPrefChange = (key: keyof NotificationPreferences, value: boolean) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleRolePermissionChange = (role: 'owner' | 'vendor', key: keyof RolePermission, value: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [key]: value },
    }));
  };

  // Permission labels for display
  const permissionLabels: Record<keyof RolePermission, { label: string; description: string }> = {
    canAccessDashboard: { label: 'Access Dashboard', description: 'View the main dashboard' },
    canAccessLibrary: { label: 'Access Library', description: 'View library files' },
    canUploadToLibrary: { label: 'Upload to Library', description: 'Upload files to the library' },
    canAccessForum: { label: 'Access Forum', description: 'View forum discussions' },
    canPostInForum: { label: 'Post in Forum', description: 'Create threads and replies' },
    canAccessChat: { label: 'Access Chat', description: 'Use the messaging system' },
    canAccessEvents: { label: 'Access Events', description: 'View events and calendar' },
    canAccessEquipment: { label: 'Access Equipment', description: 'View equipment marketplace' },
    canListEquipment: { label: 'List Equipment', description: 'Post equipment for sale' },
    canAccessBrags: { label: 'Access Success Stories', description: 'View success stories' },
    canPostBrags: { label: 'Post Success Stories', description: 'Share success stories' },
    canAccessVideos: { label: 'Access Videos', description: 'View training videos' },
    canAccessDirectory: { label: 'Access Directory', description: 'View member directory' },
    canAccessPartners: { label: 'Access Partners', description: 'View partner vendors' },
  };

  const tabs = isAdmin
    ? [
        { id: 'profile', name: 'Profile Settings', icon: UsersIcon },
        { id: 'system', name: 'System Configuration', icon: Cog6ToothIcon },
        { id: 'roles', name: 'Role Permissions', icon: UserGroupIcon },
        { id: 'notifications', name: 'Notification Settings', icon: BellIcon },
        { id: 'broadcasts', name: 'Broadcasts', icon: MegaphoneIcon },
      ]
    : [
        { id: 'profile', name: 'Profile Settings', icon: UsersIcon },
        { id: 'notifications', name: 'Notification Settings', icon: BellIcon },
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${isAdmin ? 'from-gray-700 to-gray-800' : 'from-primary-600 to-primary-700'} rounded-xl shadow-lg overflow-hidden`}>
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="h-8 w-8 text-white/80" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {isAdmin ? 'System Settings' : 'Settings'}
              </h2>
              <p className="mt-2 text-white/80">
                {isAdmin
                  ? 'Manage system configuration, user settings, and platform preferences.'
                  : 'Manage your account preferences and notification settings.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Email Test Section - Only for non-vendors */}
              {effectiveRole !== 'vendor' && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <EnvelopeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        Email Configuration Test
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Test your Resend email integration by sending a test email to your account.
                      </p>
                    </div>
                    <button
                      onClick={handleTestEmail}
                      disabled={isSendingTest}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSendingTest ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <EnvelopeIcon className="h-4 w-4" />
                          Send Test Email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* User Settings Component */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <UserSettings />
              </div>
            </div>
          )}

          {/* System Configuration Tab (Admin Only) */}
          {activeTab === 'system' && isAdmin && (
            <div className="space-y-6">
              {settingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <>
                  {/* Platform Settings */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <GlobeAltIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      Platform Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Platform Name
                        </label>
                        <input
                          type="text"
                          value={systemSettings.platformName}
                          onChange={(e) => handleSystemSettingChange('platformName', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Support Email
                        </label>
                        <input
                          type="email"
                          value={systemSettings.supportEmail}
                          onChange={(e) => handleSystemSettingChange('supportEmail', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      Security Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Require Strong Passwords</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Minimum 8 characters with numbers and symbols</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.requireStrongPasswords}
                            onChange={(e) => handleSystemSettingChange('requireStrongPasswords', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Auto-approve New Owners</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Automatically activate new owner accounts (skip admin approval)</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.autoApproveOwners}
                            onChange={(e) => handleSystemSettingChange('autoApproveOwners', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Require Library Approval</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Admin must approve uploaded library files before they're visible</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.requireLibraryApproval}
                            onChange={(e) => handleSystemSettingChange('requireLibraryApproval', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Content Settings */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <DocumentTextIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      Content Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max File Upload Size (MB)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={systemSettings.maxFileUploadSize}
                          onChange={(e) => handleSystemSettingChange('maxFileUploadSize', parseInt(e.target.value) || 50)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Items Per Page (Default)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="100"
                          value={systemSettings.itemsPerPage}
                          onChange={(e) => handleSystemSettingChange('itemsPerPage', parseInt(e.target.value) || 20)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => saveSystemSettings.mutate(systemSettings)}
                      disabled={saveSystemSettings.isPending}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveSystemSettings.isPending ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notification Settings Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <BellIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  Email Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications for important updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailNotifications}
                        onChange={(e) => handleNotificationPrefChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">New Messages</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications when you get a new chat message</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.newMessages}
                        onChange={(e) => handleNotificationPrefChange('newMessages', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Forum Replies</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications when someone replies to your posts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.forumReplies}
                        onChange={(e) => handleNotificationPrefChange('forumReplies', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">System Announcements</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive important system announcements and updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.systemAnnouncements}
                        onChange={(e) => handleNotificationPrefChange('systemAnnouncements', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Marketplace Updates</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about equipment marketplace activity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.marketplaceUpdates}
                        onChange={(e) => handleNotificationPrefChange('marketplaceUpdates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Weekly Digest</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly summary of platform activity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.weeklyDigest}
                        onChange={(e) => handleNotificationPrefChange('weeklyDigest', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => saveNotificationPrefs.mutate(notificationPrefs)}
                  disabled={saveNotificationPrefs.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveNotificationPrefs.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Role Permissions Tab (Admin Only) */}
          {activeTab === 'roles' && isAdmin && (
            <div className="space-y-6">
              {rolePermissionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <>
                  {/* Role Selector Tabs */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                      <UserGroupIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      User Type Permissions
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Configure what features each user type can access. Changes apply to all users of that type.
                    </p>

                    {/* Role Tabs */}
                    <div className="flex gap-2 mb-6">
                      <button
                        onClick={() => setSelectedRoleTab('owner')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedRoleTab === 'owner'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        Owner Permissions
                      </button>
                      <button
                        onClick={() => setSelectedRoleTab('vendor')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedRoleTab === 'vendor'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        Vendor Permissions
                      </button>
                    </div>

                    {/* Permissions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(Object.keys(permissionLabels) as Array<keyof RolePermission>).map((permKey) => (
                        <div
                          key={permKey}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {permissionLabels[permKey].label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {permissionLabels[permKey].description}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer ml-3">
                            <input
                              type="checkbox"
                              checked={rolePermissions[selectedRoleTab][permKey]}
                              onChange={(e) => handleRolePermissionChange(selectedRoleTab, permKey, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 ${
                              selectedRoleTab === 'owner' ? 'peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800' : 'peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800'
                            } rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${
                              selectedRoleTab === 'owner' ? 'peer-checked:bg-indigo-600' : 'peer-checked:bg-purple-600'
                            }`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => saveRolePermissions.mutate(rolePermissions)}
                      disabled={saveRolePermissions.isPending}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveRolePermissions.isPending ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Permissions'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Broadcasts Tab (Admin Only) */}
          {activeTab === 'broadcasts' && isAdmin && (
            <div className="space-y-6">
              {/* Send Broadcast */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <MegaphoneIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  Send Announcement
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Send a broadcast notification to all users or a specific role group.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience
                    </label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full sm:w-48 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All Users</option>
                      <option value="owner">Owners Only</option>
                      <option value="vendor">Vendors Only</option>
                      <option value="admin">Admins Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="Enter announcement title..."
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Enter your announcement message..."
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSendBroadcast}
                      disabled={isSendingBroadcast || !broadcastTitle.trim() || !broadcastMessage.trim()}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingBroadcast ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4" />
                          Send Broadcast
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Broadcast History */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  Recent Broadcasts
                </h3>
                {broadcastHistory && broadcastHistory.length > 0 ? (
                  <div className="space-y-3">
                    {broadcastHistory.map((broadcast: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{broadcast.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{broadcast.message}</p>
                          </div>
                          <span className="ml-4 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full whitespace-nowrap">
                            {broadcast.recipientCount} recipients
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                          Sent {new Date(broadcast.createdAt).toLocaleDateString()} at {new Date(broadcast.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MegaphoneIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No broadcasts sent yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
