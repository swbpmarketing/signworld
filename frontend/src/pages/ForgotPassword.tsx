import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../config/axios';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  useEffect(() => {
    document.title = 'Sign Company - Forgot Password';
  }, []);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password', {
        email: data.email,
      });

      if (response.data.success) {
        setSubmittedEmail(data.email);
        setSubmitted(true);
        toast.success('Check your email for reset instructions!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
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
                Reset Password
              </h2>
              <p className="mt-2 text-sm text-gray-300 font-medium">
                We'll send you a reset link
              </p>
            </div>

            {/* Content */}
            {submitted ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <p className="text-sm text-green-300 font-medium">
                    ✓ Reset email sent successfully!
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    We've sent a password reset link to:
                  </p>
                  <p className="text-blue-400 font-semibold text-center py-2 px-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    {submittedEmail}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    Follow the link in your email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <p className="text-xs text-blue-300 font-medium mb-2">
                    💡 Tip
                  </p>
                  <p className="text-xs text-gray-300">
                    Check your spam folder if you don't see the email in your inbox.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5 text-center block"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <>
                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      type="email"
                      autoComplete="email"
                      className="w-full px-4 py-3 border-2 border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/40 text-white placeholder-gray-500 transition-all font-medium backdrop-blur-sm"
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 text-lg overflow-hidden relative bg-[length:200%_auto]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] hover:translate-x-[200%] transition-transform duration-1000" />
                    {loading ? (
                      <span className="flex items-center justify-center relative z-10">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="relative z-10">Send Reset Link</span>
                    )}
                  </button>
                </form>

                {/* Info Box */}
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 backdrop-blur-md">
                  <p className="text-xs text-blue-300 font-medium mb-2">
                    ℹ️ How it works
                  </p>
                  <ol className="text-xs text-gray-300 space-y-1">
                    <li>1. Enter your email address</li>
                    <li>2. Check your email for a reset link</li>
                    <li>3. Click the link to create a new password</li>
                  </ol>
                </div>
              </>
            )}

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
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

export default ForgotPassword;
