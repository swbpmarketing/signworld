import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';

const PublicNavbar = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <img
              src="/logo.png"
              alt="SignWorld Logo"
              className="h-10 w-auto object-contain"
              style={{
                maxWidth: '200px',
                filter: darkMode ? 'invert(32%) sepia(100%) saturate(1500%) hue-rotate(190deg) brightness(65%) contrast(110%)' : undefined
              }}
            />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default PublicNavbar;
