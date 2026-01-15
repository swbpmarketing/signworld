import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../config/api';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    document.title = 'Sign Company - Verify Email';
  }, []);

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link');
      setVerifying(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        setVerifying(true);
        const response = await api.post('/auth/verify-email', { token });

        if (response.data.success) {
          setVerified(true);
          toast.success('Email verified successfully!');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to verify email. Please try again.');
        toast.error(err.response?.data?.error || 'Verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-0 right-0 bottom-0 opacity-40"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(0, 166, 251, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(0, 166, 251, 0.04) 0%, transparent 50%)
            `
          }}
        />
      </div>

      {/* Noise Background */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'
        }}
      />

      {/* Animated Gradient Orbs */}
      <div
        className="fixed -top-64 -right-32 w-[600px] h-[600px] rounded-full blur-[80px] opacity-60 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(0, 166, 251, 0.3) 0%, transparent 70%)',
          animation: 'float 25s infinite ease-in-out'
        }}
      />
      <div
        className="fixed -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-[80px] opacity-60 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.2) 0%, transparent 70%)',
          animation: 'float 25s infinite ease-in-out 10s'
        }}
      />

      {/* Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-blue-500/20">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4 p-4 bg-blue-500/10 rounded-2xl inline-block border border-blue-500/30">
                <img
                  src="/logo.png"
                  alt="Sign Company Logo"
                  className="h-16 w-auto mx-auto drop-shadow-lg"
                />
              </div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Verify Email
              </h2>
              <p className="mt-2 text-sm text-gray-300 font-medium">
                Completing your account setup
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {verifying ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="inline-block">
                    <svg
                      className="animate-spin h-12 w-12 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  <p className="mt-4 text-gray-300 text-center">
                    Verifying your email address...
                  </p>
                </div>
              ) : verified ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <CheckCircleIcon className="w-16 h-16 text-green-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-green-400 mb-2">
                      Email Verified!
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Your email has been successfully verified. You can now log in to your account.
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Redirecting to login page in a few seconds...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <ExclamationTriangleIcon className="w-16 h-16 text-red-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-red-400 mb-2">
                      Verification Failed
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {error || 'We couldn\'t verify your email. The link may have expired.'}
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5 text-center block"
                  >
                    Go to Login
                  </Link>
                </div>
              )}
            </div>

            {/* Help Text */}
            {!verifying && !verified && (
              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 backdrop-blur-md">
                <p className="text-xs text-blue-300 font-medium text-center mb-2">
                  Having trouble?
                </p>
                <p className="text-xs text-gray-300 text-center">
                  You can request a new verification email from the login page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
