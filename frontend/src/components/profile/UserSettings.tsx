import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode, type ThemeMode } from '../../context/DarkModeContext';
import { getCurrentUser } from '../../services/userService';
import { validateUserSettings } from '../../utils/validation';
import type { ValidationError } from '../../utils/validation';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BellIcon,
  LanguageIcon,
  GlobeAltIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  PaintBrushIcon,
  CheckIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import CustomSelect from '../CustomSelect';

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

// Helper function to extract country code from phone number
const extractCountryCode = (phone: string | undefined): { countryCode: string; number: string } => {
  if (!phone) return { countryCode: '+1', number: '' };

  // Try to match country codes (sorted by length to match longer codes first)
  const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
  for (const cc of sortedCodes) {
    if (phone.startsWith(cc.code)) {
      return { countryCode: cc.code, number: phone.slice(cc.code.length).trim() };
    }
  }

  return { countryCode: '+1', number: phone };
};

interface UserSettingsFormData {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  company: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  language: string;
  timezone: string;
  privacy: {
    profileVisible: boolean;
    dataSharing: boolean;
    analytics: boolean;
  };
  theme: string;
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
  };
}

type NestedObjectKeys = 'notifications' | 'privacy' | 'security';

const UserSettings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useDarkMode();
  const [activeSection, setActiveSection] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Fetch user profile data from API
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getCurrentUser,
  });

  const userProfile = profileData?.data;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState<UserSettingsFormData>({
    name: user?.name || '',
    email: user?.email || '',
    countryCode: '+1',
    phone: '',
    company: user?.company || '',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
    },
    language: 'en',
    timezone: 'America/New_York',
    privacy: {
      profileVisible: true,
      dataSharing: false,
      analytics: true,
    },
    theme: 'light',
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: '2024-01-15',
    },
  });

  // Update form data when user profile is loaded
  useEffect(() => {
    if (userProfile) {
      const phoneData = extractCountryCode(userProfile.phone);
      setFormData(prev => ({
        ...prev,
        name: userProfile.name || prev.name,
        email: userProfile.email || prev.email,
        countryCode: phoneData.countryCode,
        phone: phoneData.number,
        company: userProfile.company || prev.company,
      }));
    }
  }, [userProfile]);

  const sections = [
    {
      id: 'personal',
      name: 'Personal Information',
      icon: UserIcon,
      description: 'Update your personal details',
    },
    {
      id: 'preferences',
      name: 'Account Preferences',
      icon: BellIcon,
      description: 'Notifications, language, and timezone',
    },
    {
      id: 'privacy',
      name: 'Privacy Settings',
      icon: EyeIcon,
      description: 'Control your profile visibility and data sharing',
    },
    {
      id: 'security',
      name: 'Security Settings',
      icon: ShieldCheckIcon,
      description: 'Password and two-factor authentication',
    },
    {
      id: 'display',
      name: 'Display & Theme',
      icon: PaintBrushIcon,
      description: 'Customize your dashboard appearance',
    },
  ];

  const handleInputChange = <K extends keyof UserSettingsFormData>(
    field: K,
    value: UserSettingsFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = <K extends NestedObjectKeys>(
    section: K,
    field: keyof UserSettingsFormData[K],
    value: boolean | string
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleSave = async () => {
    // Validate form data
    const validation = validateUserSettings(formData);
    setValidationErrors(validation.errors);
    
    if (!validation.isValid) {
      showError('Please fix the validation errors before saving.');
      return;
    }
    
    setIsSaving(true);
    const loadingToast = showLoading('Saving your settings...');
    
    try {
      // Here you would typically make an API call to save the settings
      // Example: await updateUserSettings(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      dismissToast(loadingToast);
      showSuccess('Settings saved successfully!');
      setIsEditing(false);
      setValidationErrors([]);
    } catch (error) {
      dismissToast(loadingToast);
      showError('Failed to save settings. Please try again.');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values from API
    const phoneData = extractCountryCode(userProfile?.phone);
    setFormData({
      name: userProfile?.name || user?.name || '',
      email: userProfile?.email || user?.email || '',
      countryCode: phoneData.countryCode,
      phone: phoneData.number,
      company: userProfile?.company || user?.company || '',
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false,
      },
      language: 'en',
      timezone: 'America/New_York',
      privacy: {
        profileVisible: true,
        dataSharing: false,
        analytics: true,
      },
      theme: 'light',
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: '2024-01-15',
      },
    });
    setIsEditing(false);
    setValidationErrors([]);
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message;
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    const loadingToast = showLoading('Updating password...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/updatepassword', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      // Update token if returned
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      dismissToast(loadingToast);
      showSuccess('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Update last changed date
      handleNestedChange('security', 'lastPasswordChange', new Date().toISOString().split('T')[0]);
    } catch (error) {
      dismissToast(loadingToast);
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password');
    }
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 ${
                getFieldError('name') ? 'border-red-300 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {getFieldError('name') && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('name')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 ${
                getFieldError('email') ? 'border-red-300 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your email address"
            />
          </div>
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('email')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <div className="flex">
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => isEditing && setShowCountryDropdown(!showCountryDropdown)}
                disabled={!isEditing}
                className={`flex items-center gap-2 pl-3 pr-2 py-3 border border-r-0 rounded-l-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 text-sm cursor-pointer ${
                  getFieldError('phone') ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <span>{countryCodes.find(cc => cc.code === formData.countryCode)?.flag} {formData.countryCode}</span>
                <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showCountryDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {countryCodes.map((cc, index) => (
                    <button
                      key={`${cc.code}-${cc.country}-${index}`}
                      type="button"
                      onClick={() => {
                        handleInputChange('countryCode', cc.code);
                        setShowCountryDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 ${
                        formData.countryCode === cc.code ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <span>{cc.flag}</span>
                      <span>{cc.code}</span>
                      <span className="text-gray-500 dark:text-gray-400">({cc.country})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              className={`flex-1 px-4 py-3 border rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 ${
                getFieldError('phone') ? 'border-red-300 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="123-456-7890"
            />
          </div>
          {getFieldError('phone') && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('phone')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Name
          </label>
          <div className="relative">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 ${
                getFieldError('company') ? 'border-red-300 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your company name"
            />
          </div>
          {getFieldError('company') && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('company')}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-8">
      {/* Notifications */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
          Notifications
        </h4>
        <div className="space-y-4">
          {(Object.entries(formData.notifications) as Array<[keyof UserSettingsFormData['notifications'], boolean]>).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {key === 'sms' ? 'SMS' : key} Notifications
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {key === 'email' && 'Receive email notifications for important updates'}
                  {key === 'push' && 'Receive push notifications in your browser'}
                  {key === 'sms' && 'Receive SMS notifications for urgent alerts'}
                  {key === 'marketing' && 'Receive marketing emails and promotions'}
                </p>
              </div>
              <button
                onClick={() => handleNestedChange('notifications', key, !value)}
                disabled={!isEditing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 ${
                  value ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Language & Timezone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <LanguageIcon className="h-5 w-5 inline mr-2" />
            Language
          </label>
          <CustomSelect
            value={formData.language}
            onChange={(value) => handleInputChange('language', value)}
            disabled={!isEditing}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <GlobeAltIcon className="h-5 w-5 inline mr-2" />
            Timezone
          </label>
          <CustomSelect
            value={formData.timezone}
            onChange={(value) => handleInputChange('timezone', value)}
            disabled={!isEditing}
            options={[
              { value: 'America/New_York', label: 'Eastern Time (ET)' },
              { value: 'America/Chicago', label: 'Central Time (CT)' },
              { value: 'America/Denver', label: 'Mountain Time (MT)' },
              { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
            ]}
          />
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <EyeIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
        Privacy Controls
      </h4>
      <div className="space-y-4">
        {(Object.entries(formData.privacy) as Array<[keyof UserSettingsFormData['privacy'], boolean]>).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                {key === 'profileVisible' && 'Profile Visibility'}
                {key === 'dataSharing' && 'Data Sharing'}
                {key === 'analytics' && 'Analytics & Tracking'}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {key === 'profileVisible' && 'Allow other members to view your profile information'}
                {key === 'dataSharing' && 'Share anonymized data to improve the platform'}
                {key === 'analytics' && 'Allow analytics tracking to improve your experience'}
              </p>
            </div>
            <button
              onClick={() => handleNestedChange('privacy', key, !value)}
              disabled={!isEditing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 ${
                value ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
        Security Settings
      </h4>

      {/* Password Section */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <KeyIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Password</h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last changed: {new Date(formData.security.lastPasswordChange).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setShowPasswords({ current: false, new: false, confirm: false });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.current ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setShowPasswords({ current: false, new: false, confirm: false });
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${formData.security.twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {formData.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => handleNestedChange('security', 'twoFactorEnabled', !formData.security.twoFactorEnabled)}
              disabled={!isEditing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 ${
                formData.security.twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const themeOptions = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean, bright interface',
      icon: SunIcon,
      preview: {
        bg: 'bg-gray-100',
        sidebar: 'bg-white',
        header: 'bg-primary-600',
        content: 'bg-white',
        text: 'bg-gray-300',
      },
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes',
      icon: MoonIcon,
      preview: {
        bg: 'bg-gray-900',
        sidebar: 'bg-gray-800',
        header: 'bg-primary-700',
        content: 'bg-gray-800',
        text: 'bg-gray-600',
      },
    },
    {
      id: 'auto',
      name: 'System',
      description: 'Match device settings',
      icon: ComputerDesktopIcon,
      preview: {
        bg: 'bg-gradient-to-r from-gray-100 to-gray-900',
        sidebar: 'bg-gradient-to-r from-white to-gray-800',
        header: 'bg-primary-600',
        content: 'bg-gradient-to-r from-white to-gray-800',
        text: 'bg-gradient-to-r from-gray-300 to-gray-600',
      },
    },
  ];

  const renderDisplay = () => (
    <div className="space-y-8">
      {/* Theme Selection */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
          <PaintBrushIcon className="h-5 w-5 mr-2 text-primary-500" />
          Theme
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Choose how the dashboard looks to you
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((themeOption) => {
            const isSelected = theme === themeOption.id;
            const ThemeIcon = themeOption.icon;

            return (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id as ThemeMode)}
                className={`relative group rounded-xl transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                    : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 hover:ring-offset-2 dark:hover:ring-offset-gray-800'
                }`}
              >
                {/* Mini Dashboard Preview */}
                <div className={`${themeOption.preview.bg} p-2 h-28 relative`}>
                  {/* Mini sidebar */}
                  <div className={`absolute left-2 top-2 bottom-2 w-8 ${themeOption.preview.sidebar} rounded-md shadow-sm`}>
                    <div className="p-1 space-y-1">
                      <div className={`h-1.5 w-4 ${themeOption.preview.text} rounded-full mx-auto`}></div>
                      <div className={`h-1.5 w-4 ${themeOption.preview.text} rounded-full mx-auto opacity-60`}></div>
                      <div className={`h-1.5 w-4 ${themeOption.preview.text} rounded-full mx-auto opacity-40`}></div>
                    </div>
                  </div>
                  {/* Mini content area */}
                  <div className="absolute left-12 right-2 top-2 bottom-2 flex flex-col gap-1">
                    {/* Header */}
                    <div className={`${themeOption.preview.header} h-5 rounded-md`}></div>
                    {/* Content */}
                    <div className={`${themeOption.preview.content} flex-1 rounded-md p-1.5 shadow-sm`}>
                      <div className="flex gap-1 h-full">
                        <div className={`${themeOption.preview.text} flex-1 rounded opacity-50`}></div>
                        <div className={`${themeOption.preview.text} flex-1 rounded opacity-30`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 h-5 w-5 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
                      <CheckIcon className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Theme info */}
                <div className={`p-3 ${isSelected ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary-100 dark:bg-primary-800/50' : 'bg-gray-200 dark:bg-gray-600'}`}>
                      <ThemeIcon className={`h-4 w-4 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`} />
                    </div>
                    <div className="text-left">
                      <h5 className={`text-sm font-semibold ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                        {themeOption.name}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{themeOption.description}</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'personal':
        return renderPersonalInfo();
      case 'preferences':
        return renderPreferences();
      case 'privacy':
        return renderPrivacy();
      case 'security':
        return renderSecurity();
      case 'display':
        return renderDisplay();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <XMarkIcon className="h-4 w-4 inline mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 inline mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 inline mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Edit Settings
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeSection === section.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-l-4 border-primary-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <section.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  activeSection === section.id
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
                <div className="flex-1 text-left">
                  <div className="font-medium">{section.name}</div>
                  <div className={`text-xs hidden lg:block ${
                    activeSection === section.id
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {section.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;