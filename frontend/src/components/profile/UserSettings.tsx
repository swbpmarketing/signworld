import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateUserSettings } from '../../utils/validation';
import type { ValidationError } from '../../utils/validation';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BellIcon,
  LanguageIcon,
  GlobeAltIcon,
  EyeIcon,
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  PaintBrushIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import CustomSelect from '../CustomSelect';

interface UserSettingsFormData {
  name: string;
  email: string;
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
  const [activeSection, setActiveSection] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [formData, setFormData] = useState<UserSettingsFormData>({
    name: user?.name || '',
    email: user?.email || '',
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
    // Reset form data to original values
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
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
    setIsEditing(false);
    setValidationErrors([]);
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message;
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                getFieldError('name') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {getFieldError('name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                getFieldError('email') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
            />
          </div>
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                getFieldError('phone') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number"
            />
          </div>
          {getFieldError('phone') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('phone')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <div className="relative">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              disabled={!isEditing}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                getFieldError('company') ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your company name"
            />
          </div>
          {getFieldError('company') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('company')}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-8">
      {/* Notifications */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2" />
          Notifications
        </h4>
        <div className="space-y-4">
          {(Object.entries(formData.notifications) as Array<[keyof UserSettingsFormData['notifications'], boolean]>).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 capitalize">
                  {key === 'sms' ? 'SMS' : key} Notifications
                </h5>
                <p className="text-sm text-gray-500">
                  {key === 'email' && 'Receive email notifications for important updates'}
                  {key === 'push' && 'Receive push notifications in your browser'}
                  {key === 'sms' && 'Receive SMS notifications for urgent alerts'}
                  {key === 'marketing' && 'Receive marketing emails and promotions'}
                </p>
              </div>
              <button
                onClick={() => handleNestedChange('notifications', key, !value)}
                disabled={!isEditing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${
                  value ? 'bg-primary-600' : 'bg-gray-200'
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <EyeIcon className="h-5 w-5 mr-2" />
        Privacy Controls
      </h4>
      <div className="space-y-4">
        {(Object.entries(formData.privacy) as Array<[keyof UserSettingsFormData['privacy'], boolean]>).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="text-sm font-medium text-gray-900">
                {key === 'profileVisible' && 'Profile Visibility'}
                {key === 'dataSharing' && 'Data Sharing'}
                {key === 'analytics' && 'Analytics & Tracking'}
              </h5>
              <p className="text-sm text-gray-500">
                {key === 'profileVisible' && 'Allow other members to view your profile information'}
                {key === 'dataSharing' && 'Share anonymized data to improve the platform'}
                {key === 'analytics' && 'Allow analytics tracking to improve your experience'}
              </p>
            </div>
            <button
              onClick={() => handleNestedChange('privacy', key, !value)}
              disabled={!isEditing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${
                value ? 'bg-primary-600' : 'bg-gray-200'
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
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <ShieldCheckIcon className="h-5 w-5 mr-2" />
        Security Settings
      </h4>
      
      {/* Password Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <KeyIcon className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <h5 className="text-sm font-medium text-gray-900">Password</h5>
              <p className="text-sm text-gray-500">
                Last changed: {new Date(formData.security.lastPasswordChange).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            disabled={!isEditing}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:text-gray-400"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <h5 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h5>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${formData.security.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`}>
              {formData.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => handleNestedChange('security', 'twoFactorEnabled', !formData.security.twoFactorEnabled)}
              disabled={!isEditing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${
                formData.security.twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
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

  const renderDisplay = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <PaintBrushIcon className="h-5 w-5 mr-2" />
        Display & Theme
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['light', 'dark', 'auto'].map((theme) => (
          <button
            key={theme}
            onClick={() => handleInputChange('theme', theme)}
            disabled={!isEditing}
            className={`relative p-4 border-2 rounded-lg transition-all duration-200 ${
              formData.theme === theme
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            } disabled:opacity-50`}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-12 h-8 rounded-md ${
                theme === 'light' ? 'bg-white border-2 border-gray-200' :
                theme === 'dark' ? 'bg-gray-800' :
                'bg-gradient-to-r from-white to-gray-800'
              }`} />
              <span className="text-sm font-medium capitalize">{theme}</span>
            </div>
            {formData.theme === theme && (
              <CheckIcon className="h-5 w-5 text-primary-600 absolute top-2 right-2" />
            )}
          </button>
        ))}
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
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeSection === section.id
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <section.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{section.name}</div>
                  <div className="text-xs text-gray-500 hidden lg:block">
                    {section.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;