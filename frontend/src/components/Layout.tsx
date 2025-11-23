import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import {
  CalendarIcon,
  HomeIcon,
  UserGroupIcon,
  VideoCameraIcon,
  MapIcon,
  ShoppingBagIcon,
  QuestionMarkCircleIcon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  ChartBarIcon,
  BellIcon,
  UserIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  MoonIcon,
  SunIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import AISearchModal from "./AISearchModal";
import { NotificationPanel } from "./NotificationPanel";
import { useEventNotifications } from "../hooks/useEventNotifications";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, roles: ['admin', 'owner', 'vendor'] },
  { name: "Reports", href: "/reports", icon: ChartBarIcon, roles: ['admin', 'owner'] },
  { name: "User Management", href: "/users", icon: UsersIcon, roles: ['admin'] },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon, roles: ['admin', 'owner'] },
  { name: "Convention", href: "/convention", icon: BuildingOffice2Icon, roles: ['admin', 'owner'] },
  { name: "Success Stories", href: "/brags", icon: NewspaperIcon, roles: ['admin', 'owner'] },
  { name: "Forum", href: "/forum", icon: ChatBubbleLeftRightIcon, roles: ['admin', 'owner'] },
  { name: "Library", href: "/library", icon: FolderIcon, roles: ['admin', 'owner'] },
  { name: "Owners Roster", href: "/owners", icon: UserGroupIcon, roles: ['admin', 'owner'] },
  { name: "Map Search", href: "/map", icon: MapIcon, roles: ['admin', 'owner'] },
  { name: "Partners", href: "/partners", icon: UserGroupIcon, roles: ['admin', 'owner', 'vendor'] },
  { name: "Videos", href: "/videos", icon: VideoCameraIcon, roles: ['admin', 'owner'] },
  { name: "Equipment", href: "/equipment", icon: ShoppingBagIcon, roles: ['admin', 'owner'] },
  { name: "FAQs", href: "/faqs", icon: QuestionMarkCircleIcon, roles: ['admin', 'owner', 'vendor'] },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  // Event notifications hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  } = useEventNotifications();

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item =>
    !user?.role || item.roles.includes(user.role)
  );

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  console.log("Layout: Rendering with user:", user);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col bg-white dark:bg-gray-800">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center px-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-white">
            <img
              src="https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c08634a3ff3102330f5bf.png"
              alt="Sign Company Logo"
              className="h-10 w-auto object-contain"
              style={{
                maxWidth: '180px',
                filter: 'invert(32%) sepia(100%) saturate(1500%) hue-rotate(190deg) brightness(65%) contrast(110%)'
              }}
            />
          </div>

          {/* Portal Title */}
          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {user?.role === 'admin' ? 'Admin Portal' : user?.role === 'vendor' ? 'Partner Portal' : 'Owner Portal'}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-0.5">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Mobile menu + Breadcrumbs */}
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                {/* Mobile menu button */}
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none md:hidden transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Breadcrumb Navigation */}
                <nav className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm min-w-0">
                  <Link to="/dashboard" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors flex-shrink-0">
                    <HomeIcon className="h-4 w-4" />
                  </Link>
                  <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">/</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {filteredNavigation.find((item) => item.href === location.pathname)
                      ?.name || "Dashboard"}
                  </span>
                </nav>
              </div>

              {/* Right side - Search + Actions */}
              <div className="flex items-center space-x-4">
                {/* Mobile view - Individual buttons */}
                <div className="flex sm:hidden items-center space-x-1.5">
                  {/* Search */}
                  <button
                    type="button"
                    onClick={() => setSearchModalOpen(true)}
                    className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    title="Search (Ctrl+K)"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  {/* Dark mode toggle */}
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    title={darkMode ? "Light mode" : "Dark mode"}
                    onClick={toggleDarkMode}
                  >
                    {darkMode ? (
                      <SunIcon className="h-4 w-4" />
                    ) : (
                      <MoonIcon className="h-4 w-4" />
                    )}
                  </button>

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      type="button"
                      className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                      title="Notifications"
                      onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                    >
                      <BellIcon className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 w-4 text-[10px] font-medium text-white bg-primary-500 rounded-full ring-1 ring-white dark:ring-gray-900">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <NotificationPanel
                      notifications={notifications}
                      unreadCount={unreadCount}
                      isOpen={notificationPanelOpen}
                      onClose={() => setNotificationPanelOpen(false)}
                      onMarkAsRead={markAsRead}
                      onMarkAllAsRead={markAllAsRead}
                      onDismiss={dismissNotification}
                      onClearAll={clearAll}
                    />
                  </div>

                  {/* User Avatar */}
                  <button
                    type="button"
                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <img
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                      src="https://i.pravatar.cc/150?img=8"
                      alt={user?.name || "User profile"}
                    />
                  </button>
                </div>

                {/* Desktop view - Pill Container */}
                <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                  {/* Search */}
                  <button
                    type="button"
                    onClick={() => setSearchModalOpen(true)}
                    className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="hidden sm:inline">Search</span>
                    <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      CTRL K
                    </kbd>
                  </button>

                  {/* Dark mode toggle */}
                  <button
                    type="button"
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    title={darkMode ? "Light mode" : "Dark mode"}
                    onClick={toggleDarkMode}
                  >
                    {darkMode ? (
                      <SunIcon className="h-5 w-5" />
                    ) : (
                      <MoonIcon className="h-5 w-5" />
                    )}
                  </button>

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      type="button"
                      className="relative p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      title="Notifications"
                      onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                    >
                      <BellIcon className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-medium text-white bg-primary-500 rounded-full ring-2 ring-white dark:ring-gray-800">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <NotificationPanel
                      notifications={notifications}
                      unreadCount={unreadCount}
                      isOpen={notificationPanelOpen}
                      onClose={() => setNotificationPanelOpen(false)}
                      onMarkAsRead={markAsRead}
                      onMarkAllAsRead={markAllAsRead}
                      onDismiss={dismissNotification}
                      onClearAll={clearAll}
                    />
                  </div>

                  {/* User Avatar */}
                  <button
                    type="button"
                    className="relative"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src="https://i.pravatar.cc/150?img=8"
                      alt={user?.name || "User profile"}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* User dropdown */}
          {userMenuOpen && (
            <div className="absolute right-3 sm:right-4 md:right-6 top-12 sm:top-14 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user?.name || "Guest User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {user?.email || "Not logged in"}
                </p>
              </div>
              {user && (
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserIcon className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Cog6ToothIcon className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={logout}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                  <Outlet />
                </PageTransition>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* AI Search Modal */}
      <AISearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        userRole={user?.role}
      />
    </div>
  );
};

export default Layout;
