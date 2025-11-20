import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

interface PublicNavbarProps {
  hideLoginButton?: boolean;
}

const PublicNavbar = ({ hideLoginButton = false }: PublicNavbarProps) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <header className="sticky top-0 z-50">
      <nav className="container mx-auto px-6 pt-4">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 px-6 py-3">
          <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 group"
          >
            <img
              src="https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c08634a3ff3102330f5bf.png"
              alt="SignWorld Logo"
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
              style={{ maxWidth: '180px' }}
            />
          </button>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2.5">
            {/* Dark mode toggle */}
            <button
              type="button"
              className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-white/60 dark:bg-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-full transition-all shadow-sm hover:shadow-md backdrop-blur-sm"
              title={darkMode ? "Light mode" : "Dark mode"}
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Login button */}
            {!hideLoginButton && (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200"
              >
                Login
              </button>
            )}
          </div>
        </div>
        </div>
      </nav>
    </header>
  );
};

export default PublicNavbar;
