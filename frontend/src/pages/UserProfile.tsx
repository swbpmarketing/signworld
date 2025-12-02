import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  CameraIcon,
  PencilIcon,
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  getCurrentUser,
  updateProfile,
  updatePassword,
  uploadProfilePhoto,
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from '../services/userService';

// Common country codes
const countryCodes = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+1', country: 'CA', flag: '🇨🇦' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+63', country: 'PH', flag: '🇵🇭' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
];

const UserProfile = () => {
  const { user, isVendor, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch full user profile
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getCurrentUser,
  });

  const fullProfile = profileData?.data;

  // Helper to safely get string value
  const safeString = (value: unknown): string => {
    return typeof value === 'string' ? value : '';
  };

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    countryCode: '+1',
    phone: '',
    company: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    events: true,
    forum: true,
    library: true,
    announcements: true,
  });

  // Load notification settings
  useEffect(() => {
    const settings = getNotificationSettings();
    setNotifications(settings);
  }, []);

  // Helper to extract country code from phone number
  const extractCountryCode = (phone: string): { code: string; number: string } => {
    if (!phone) return { code: '+1', number: '' };
    // Check if phone starts with a country code
    for (const cc of countryCodes) {
      if (phone.startsWith(cc.code)) {
        return { code: cc.code, number: phone.slice(cc.code.length).trim() };
      }
    }
    return { code: '+1', number: phone };
  };

  // Update edit form when profile data loads
  useEffect(() => {
    if (fullProfile) {
      const phoneInfo = extractCountryCode(safeString(fullProfile.phone));
      setEditForm({
        name: safeString(fullProfile.name),
        email: safeString(fullProfile.email),
        countryCode: phoneInfo.code,
        phone: phoneInfo.number,
        company: safeString(fullProfile.company),
        street: safeString(fullProfile.address?.street),
        city: safeString(fullProfile.address?.city),
        state: safeString(fullProfile.address?.state),
        zipCode: safeString(fullProfile.address?.zipCode),
      });
    }
  }, [fullProfile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      refreshUser();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      toast.success('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update password');
    },
  });

  // Upload profile photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => uploadProfilePhoto(user?._id || user?.id || '', file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      refreshUser();
      toast.success('Profile photo updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload photo');
    },
  });

  // Handle photo file selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleSave = () => {
    // Combine country code with phone number
    const fullPhone = editForm.phone ? `${editForm.countryCode}${editForm.phone}` : undefined;
    updateProfileMutation.mutate({
      name: editForm.name,
      email: editForm.email,
      phone: fullPhone,
      company: editForm.company || undefined,
      address: {
        street: editForm.street || undefined,
        city: editForm.city || undefined,
        state: editForm.state || undefined,
        zipCode: editForm.zipCode || undefined,
      },
    });
  };

  const handleCancel = () => {
    if (fullProfile) {
      const phoneInfo = extractCountryCode(safeString(fullProfile.phone));
      setEditForm({
        name: safeString(fullProfile.name),
        email: safeString(fullProfile.email),
        countryCode: phoneInfo.code,
        phone: phoneInfo.number,
        company: safeString(fullProfile.company),
        street: safeString(fullProfile.address?.street),
        city: safeString(fullProfile.address?.city),
        state: safeString(fullProfile.address?.state),
        zipCode: safeString(fullProfile.address?.zipCode),
      });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    const newSettings = { ...notifications, [key]: !notifications[key] };
    setNotifications(newSettings);
    saveNotificationSettings(newSettings);
    toast.success('Notification preferences saved');
  };

  const tabs = [
    { id: 'profile', name: 'Profile Information', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
  ];

  // Password Change Modal
  const PasswordModal = () => {
    if (!showPasswordModal) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={updatePasswordMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-8">
      <PasswordModal />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                  {uploadPhotoMutation.isPending ? (
                    <div className="h-20 w-20 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                    </div>
                  ) : fullProfile?.profileImage ? (
                    <img
                      src={fullProfile.profileImage}
                      alt={fullProfile.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-10 w-10 text-white" />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadPhotoMutation.isPending}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white text-primary-600 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <CameraIcon className="h-3 w-3" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {fullProfile?.name || user?.name || 'Your Profile'}
                </h1>
                <p className="mt-1 text-lg text-primary-100">
                  {user?.role === 'vendor' ? 'Partner' : user?.role === 'admin' ? 'Administrator' : 'Owner'}
                  {fullProfile?.company ? ` at ${fullProfile.company}` : ''}
                  {' - Joined '}{fullProfile?.createdAt ? new Date(fullProfile.createdAt).getFullYear() : new Date().getFullYear()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isVendor && (
                <Link
                  to="/settings"
                  className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors duration-200"
                >
                  <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                  Partner Settings
                </Link>
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors duration-200"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Note */}
      {isVendor && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                This is your account profile
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                To manage your company listing visible to owners, go to{' '}
                <Link to="/settings" className="font-medium underline hover:text-blue-900 dark:hover:text-blue-200">
                  Partner Settings
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <div className="mt-1 flex items-center space-x-2">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{fullProfile?.name || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <div className="mt-1 flex items-center space-x-2">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{fullProfile?.email || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                      {isEditing ? (
                        <div className="mt-1 flex">
                          <select
                            value={editForm.countryCode}
                            onChange={(e) => setEditForm({ ...editForm, countryCode: e.target.value })}
                            className="flex-shrink-0 px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          >
                            {countryCodes.map((cc, index) => (
                              <option key={`${cc.code}-${cc.country}-${index}`} value={cc.code}>
                                {cc.flag} {cc.code} ({cc.country})
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="123-456-7890"
                          />
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center space-x-2">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{fullProfile?.phone || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.company}
                          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                          className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Your company name"
                        />
                      ) : (
                        <div className="mt-1 flex items-center space-x-2">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{fullProfile?.company || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Address</h3>
                    {isEditing ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={editForm.street}
                            onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Street address"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={editForm.city}
                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="City"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={editForm.state}
                            onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="State"
                          />
                          <input
                            type="text"
                            value={editForm.zipCode}
                            onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                            className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="ZIP Code"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-2">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {fullProfile?.address?.street || fullProfile?.address?.city || fullProfile?.address?.state
                            ? `${fullProfile.address.street || ''}${fullProfile.address.street && fullProfile.address.city ? ', ' : ''}${fullProfile.address.city || ''} ${fullProfile.address.state || ''} ${fullProfile.address.zipCode || ''}`
                            : 'Not provided'}
                        </span>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <KeyIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Password & Security</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Manage your password and security settings to keep your account safe.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Add an extra layer of security to your account with two-factor authentication.
                    </p>
                    <div className="mt-4">
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <BellIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                      Email Notifications
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Choose what updates you want to receive via email.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { id: 'events' as const, label: 'Upcoming Events', description: 'Get notified about new events and updates' },
                      { id: 'forum' as const, label: 'Forum Activity', description: 'New posts and replies in discussions you follow' },
                      { id: 'library' as const, label: 'Library Updates', description: 'New files and resources added to the library' },
                      { id: 'announcements' as const, label: 'Announcements', description: 'Important updates from the platform' },
                    ].map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between py-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{notification.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNotificationToggle(notification.id)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            notifications[notification.id] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                          role="switch"
                          aria-checked={notifications[notification.id]}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              notifications[notification.id] ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <Cog6ToothIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                      Account Settings
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Manage your account preferences and settings.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Account Status</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Your account is active and verified</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Member Since</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {fullProfile?.createdAt ? new Date(fullProfile.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Account Type</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                      </div>
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="pt-4">
                      <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                        Delete Account
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
