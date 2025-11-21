import { useState } from 'react';
import UserSettings from '../components/profile/UserSettings';
import emailService from '../services/emailService';
import toast from 'react-hot-toast';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const result = await emailService.testEmail();
      toast.success('Test email sent successfully! Check your inbox.');
      console.log('Email result:', result);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test email');
      console.error('Email error:', error);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account preferences, notifications, and security settings.
          </p>
        </div>
      </div>

      {/* Email Test Section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700 sm:rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <EnvelopeIcon className="h-6 w-6 text-primary-600" />
              Email Configuration Test
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Test your Resend email integration by sending a test email to your account.
            </p>
          </div>
          <button
            onClick={handleTestEmail}
            disabled={isSendingTest}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700 sm:rounded-xl">
        <UserSettings />
      </div>
    </div>
  );
};

export default Settings;