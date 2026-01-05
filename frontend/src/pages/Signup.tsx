import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>();

  const password = watch('password');

  // Set page title
  useEffect(() => {
    document.title = 'Sign Company - Sign Up';
  }, []);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);

      // Call signup API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const result = await response.json();
      toast.success('Account created successfully! Please log in.');
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const strength = passwordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500'];

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

      {/* Signup Form Container */}
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
                Create Account
              </h2>
              <p className="mt-2 text-sm text-gray-300 font-medium">
                Join SignWorld Franchise Network
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters',
                    },
                  })}
                  type="text"
                  autoComplete="given-name"
                  className="w-full px-4 py-3 border-2 border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/40 text-white placeholder-gray-500 transition-all font-medium backdrop-blur-sm"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters',
                    },
                  })}
                  type="text"
                  autoComplete="family-name"
                  className="w-full px-4 py-3 border-2 border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/40 text-white placeholder-gray-500 transition-all font-medium backdrop-blur-sm"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>
                )}
              </div>

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

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Password strength:</span>
                      <span className="text-xs text-gray-400">{strengthLabels[strength] || 'Weak'}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${strengthColors[strength] || 'bg-red-500'} transition-all duration-300`}
                        style={{ width: `${((strength + 1) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === password || 'Passwords do not match',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 border-2 border-blue-500/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-900/40 text-white placeholder-gray-500 transition-all font-medium backdrop-blur-sm pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-gray-300 font-medium mb-2 flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-2 text-blue-400" />
                  Password requirements:
                </p>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li className={password?.length >= 8 ? 'text-green-400' : ''}>
                    ✓ At least 8 characters
                  </li>
                  <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-400' : ''}>
                    ✓ Mix of uppercase and lowercase
                  </li>
                  <li className={/\d/.test(password) ? 'text-green-400' : ''}>
                    ✓ At least one number
                  </li>
                  <li className={/[!@#$%^&*]/.test(password) ? 'text-green-400' : ''}>
                    ✓ One special character (!@#$%^&*)
                  </li>
                </ul>
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
                    Creating account...
                  </span>
                ) : (
                  <span className="relative z-10">Create Account</span>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>

            {/* Terms & Conditions */}
            <p className="mt-6 text-center text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                Privacy Policy
              </a>
            </p>
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

export default Signup;
