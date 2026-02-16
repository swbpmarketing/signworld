import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import api from '../config/axios';

const VerifyEmailPrompt = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sendingVerification, setSendingVerification] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const email = searchParams.get('email');

  useEffect(() => {
    document.title = 'Sign Company - Email Verification Required';
  }, []);

  // Redirect to login if no email provided (after a delay to allow user to see error)
  useEffect(() => {
    if (!email) {
      toast.error('No email provided. Redirecting to login...');
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [email, navigate]);

  const handleSendVerification = async () => {
    if (!email) return;

    try {
      setSendingVerification(true);
      const response = await api.post('/auth/resend-verification', { email });

      if (response.data.success) {
        toast.success('Verification email sent! Check your inbox.');
        setEmailSent(true);
      }
    } catch (error: any) {
      console.error('❌ Failed to send verification email:', error);
      toast.error(error.response?.data?.error || 'Failed to send verification email');
    } finally {
      setSendingVerification(false);
    }
  };

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
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-yellow-500/20">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4 p-4 bg-yellow-500/10 rounded-2xl inline-block border border-yellow-500/30">
                <EnvelopeIcon className="h-16 w-16 text-yellow-400" />
              </div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Email Verification Required
              </h2>
              <p className="mt-2 text-sm text-gray-300 font-medium">
                Please verify your email address before logging in
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {!emailSent ? (
                <>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-blue-300 font-medium mb-2">
                      We'll send a verification link to:
                    </p>
                    <p className="text-white font-semibold break-all">
                      {email}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleSendVerification}
                      disabled={sendingVerification}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                      {sendingVerification ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        'Send Verification Email'
                      )}
                    </button>

                    <Link
                      to="/login"
                      className="w-full px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-all duration-300 text-center block"
                    >
                      Back to Login
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <EnvelopeIcon className="w-20 h-20 text-green-400 animate-pulse" />
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                          ✓
                        </div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-green-400 mb-3">
                      Verification Email Sent!
                    </h3>
                    <p className="text-gray-300 text-base mb-2">
                      We've sent a verification link to your email address.
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      Please check your inbox and click the verification link to activate your account.
                    </p>
                  </div>

                  <Link
                    to="/login"
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5 text-center block"
                  >
                    Back to Login
                  </Link>
                </div>
              )}
            </div>

            {/* Help Text */}
            {!emailSent && (
              <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 backdrop-blur-md">
                <p className="text-xs text-gray-300 text-center">
                  After verifying your email, you can return here to log in.
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

export default VerifyEmailPrompt;
