import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
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
} from "@heroicons/react/24/outline";
import { useState } from "react";
import AISearchBox from "./AISearchBox";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, roles: ['admin', 'owner', 'vendor'] },
  { name: "Reports", href: "/reports", icon: ChartBarIcon, roles: ['admin', 'owner'] },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon, roles: ['admin', 'owner'] },
  { name: "Convention", href: "/convention", icon: CalendarIcon, roles: ['admin', 'owner'] },
  { name: "Success Stories", href: "/brags", icon: NewspaperIcon, roles: ['admin', 'owner'] },
  { name: "Forum", href: "/forum", icon: ChatBubbleLeftRightIcon, roles: ['admin', 'owner'] },
  { name: "Library", href: "/library", icon: FolderIcon, roles: ['admin', 'owner'] },
  { name: "Owners Roster", href: "/owners", icon: UserGroupIcon, roles: ['admin', 'owner'] },
  { name: "Map Search", href: "/map", icon: MapIcon, roles: ['admin', 'owner'] },
  { name: "Partners", href: "/partners", icon: UsersIcon, roles: ['admin', 'owner', 'vendor'] },
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

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item =>
    !user?.role || item.roles.includes(user.role)
  );

  console.log("Layout: Rendering with user:", user);

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
          <div className="flex h-16 items-center justify-center px-6 border-b border-gray-100 dark:border-gray-700 bg-primary-600/90 dark:bg-primary-700/90">
            <img
              src="https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c08634a3ff3102330f5bf.png"
              alt="Sign Company Logo"
              className="h-10 w-auto object-contain filter brightness-0 invert"
              style={{ maxWidth: '180px' }}
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
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6">
            <div className="flex h-14 items-center justify-between">
              {/* Left side - Mobile menu + Breadcrumbs */}
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none md:hidden transition-colors"
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
                <nav className="flex items-center space-x-2 text-sm">
                  <Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    <HomeIcon className="h-4 w-4" />
                  </Link>
                  <span className="text-gray-400 dark:text-gray-600">/</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {filteredNavigation.find((item) => item.href === location.pathname)
                      ?.name || "Dashboard"}
                  </span>
                </nav>
              </div>

              {/* Right side - Search + Actions */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <button
                  type="button"
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[200px] sm:min-w-[280px]"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="flex-1 text-left">Search</span>
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-gray-700 dark:text-gray-300">
                    CTRL K
                  </kbd>
                </button>

                {/* Dark mode toggle */}
                <button
                  type="button"
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
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
                <button
                  type="button"
                  className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Notifications"
                >
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                </button>

                {/* User Avatar */}
                <button
                  type="button"
                  className="relative"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <img
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 hover:ring-gray-300 transition-all"
                    src="https://i.pravatar.cc/150?img=8"
                    alt={user?.name || "User profile"}
                  />
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-6 top-14 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-50">
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
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
