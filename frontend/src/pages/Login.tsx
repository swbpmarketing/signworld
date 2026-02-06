import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, ChevronDownIcon, ChevronUpIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

interface LoginFormData {
  email: string;
  password: string;
}

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // Set page title
  useEffect(() => {
    console.log('🎬 Login component MOUNTED');
    document.title = 'Sign Company - Login';

    return () => {
      console.log('💥 Login component UNMOUNTING');
    };
  }, []);

  // Redirect to dashboard if already logged in (check once on mount)
  useEffect(() => {
    console.log('🔄 Login mount effect running, user:', user ? 'exists' : 'null');
    if (user) {
      console.log('✅ User already logged in on mount, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const onSubmit = async (data: LoginFormData) => {
    console.log('🎯 onSubmit called with data:', { email: data.email });

    // Prevent multiple submissions
    if (loading) {
      console.log('⏳ Already loading, ignoring duplicate submission');
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Calling login()...');
      await login(data.email, data.password);
      console.log('✅ Login successful, navigating to dashboard');
      toast.success('Welcome back!');
      navigate('/dashboard');
      setLoading(false);
    } catch (error: any) {
      console.error('❌ Login failed:', error.message);
      setLoading(false);

      // Check if error is due to unverified email
      if (error.emailNotVerified) {
        console.log('🔒 Email not verified, redirecting to verification page');
        // Navigate to verification prompt page with email as query parameter
        navigate(`/verify-email-prompt?email=${encodeURIComponent(data.email)}`);
      } else {
        toast.error(error.message || 'Login failed');
      }
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
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

      {/* Login Form Container */}
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
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-gray-300 font-medium">
                Sign in to your account
              </p>
            </div>

            {/* Form */}
            <form
              className="space-y-5"
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
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

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    {...register('password', { required: 'Password is required' })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full px-4 py-3 border-2 border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/40 text-white placeholder-gray-500 transition-all font-medium backdrop-blur-sm pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
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
                    Signing in...
                  </span>
                ) : (
                  <span className="relative z-10">Sign In</span>
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 bg-blue-500/10 rounded-lg border border-blue-500/30 backdrop-blur-md overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCredentials(!showCredentials)}
                className="w-full p-4 flex items-center justify-between text-blue-300 hover:bg-blue-500/10 transition-colors"
              >
                <span className="text-xs font-medium">📝 Demo Credentials</span>
                {showCredentials ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  showCredentials ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                } overflow-hidden`}
              >
                <div className="px-4 pb-4 space-y-3">
                  {/* Admin */}
                  <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/40">
                    <p className="text-xs font-semibold text-blue-300 mb-1">Admin</p>
                    <div className="flex items-center justify-between group">
                      <p className="text-xs text-gray-300">
                        Email: <span className="font-semibold text-gray-100">admin@signcompany.com</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('admin@signcompany.com', 'Email')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700/40 rounded"
                        title="Copy email"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between group">
                      <p className="text-xs text-gray-300">
                        Password: <span className="font-semibold text-gray-100">admin123</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('admin123', 'Password')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700/40 rounded"
                        title="Copy password"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                      </button>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/40">
                    <p className="text-xs font-semibold text-green-300 mb-1">Owner</p>
                    <div className="flex items-center justify-between group">
                      <p className="text-xs text-gray-300">
                        Email: <span className="font-semibold text-gray-100">owner@signcompany.com</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('owner@signcompany.com', 'Email')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700/40 rounded"
                        title="Copy email"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-400 hover:text-green-400" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between group">
                      <p className="text-xs text-gray-300">
                        Password: <span className="font-semibold text-gray-100">owner123</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('owner123', 'Password')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700/40 rounded"
                        title="Copy password"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-400 hover:text-green-400" />
                      </button>
                    </div>
                  </div>

                  {/* Vendor */}
                  <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/40">
                    <p className="text-xs font-semibold text-purple-300 mb-1">Vendor</p>
                    <div className="flex items-center justify-between group">
                      <p className="text-xs text-gray-300">
                        Email: <span className="font-semibold text-gray-100">vendor@example.com</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('vendor@example.com', 'Email')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700/40 rounded"
                        title="Copy email"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between group">
                      <p className="text-xs text-gray-300">
                        Password: <span className="font-semibold text-gray-100">vendor123</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('vendor123', 'Password')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700/40 rounded"
                        title="Copy password"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signup Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Sign Up
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

export default Login;
