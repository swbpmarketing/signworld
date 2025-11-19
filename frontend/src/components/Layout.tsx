import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  ChevronDownIcon,
  UsersIcon,
  ChartBarIcon,
  BellIcon,
  UserIcon,
  Cog6ToothIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import AISearchBox from "./AISearchBox";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Reports", href: "/reports", icon: ChartBarIcon },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Convention", href: "/convention", icon: CalendarIcon },
  { name: "Success Stories", href: "/brags", icon: NewspaperIcon },
  { name: "Forum", href: "/forum", icon: ChatBubbleLeftRightIcon },
  { name: "Library", href: "/library", icon: FolderIcon },
  { name: "Owners Roster", href: "/owners", icon: UserGroupIcon },
  { name: "Map Search", href: "/map", icon: MapIcon },
  { name: "Partners", href: "/partners", icon: UsersIcon },
  { name: "Videos", href: "/videos", icon: VideoCameraIcon },
  { name: "Equipment", href: "/equipment", icon: ShoppingBagIcon },
  { name: "FAQs", href: "/faqs", icon: QuestionMarkCircleIcon },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  console.log("Layout: Rendering with user:", user);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col bg-white">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center px-4 bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
            <div className="flex-shrink-0">
              <img
                src="https://storage.googleapis.com/msgsndr/DecfA7BjYEDxFe8pqRZs/media/688c08634a3ff3102330f5bf.png"
                alt="Sign Company Logo"
                className="h-12 w-auto filter brightness-0 invert drop-shadow-md"
              />
            </div>
          </div>

          {/* Portal Title */}
          <div className="px-4 py-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900 text-center">
              {user?.role === 'admin' ? 'Admin Portal' : 'Owner Portal'}
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-hidden bg-gray-50">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive
                          ? "text-primary-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Profile Section - Sidebar */}
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="relative">
              <button
                type="button"
                className="w-full flex items-center px-4 py-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <img
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  src="https://i.pravatar.cc/150?img=8"
                  alt={user?.name || "User profile"}
                />
                <div className="ml-3 flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || "Guest User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role || "Not logged in"}
                  </p>
                </div>
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 mx-4 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || "Guest User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || "Not logged in"}
                    </p>
                  </div>
                  {user && (
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Profile Settings
                      </Link>
                      <button
                        onClick={logout}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
              {/* Mobile menu button */}
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="h-6 w-6"
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

              <div className="flex items-center">
                {/* Page title - shows on larger screens */}
                <div className="hidden lg:block min-w-0 mr-4">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {navigation.find((item) => item.href === location.pathname)
                      ?.name || "Dashboard"}
                  </h2>
                </div>

                {/* AI Search Box - takes center stage */}
                <div className="flex-1 max-w-2xl mr-4">
                  <AISearchBox compact={true} onSearchFocus={() => {}} />
                </div>
              </div>

              {/* Right side actions */}
              <div className="flex items-end space-x-3">
                {/* Notifications */}
                <button
                  type="button"
                  className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  title="Notifications"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-5 w-5" />
                  {/* Notification badge */}
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white animate-pulse"></span>
                </button>

                {/* User menu */}
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center space-x-2 p-1 text-sm rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <img
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 hover:ring-primary-300 transition-all"
                      src="https://i.pravatar.cc/150?img=8"
                      alt={user?.name || "User profile"}
                    />
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || "Guest"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.role || "User"}
                      </p>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 hidden sm:block" />
                  </button>

                  {/* User dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name || "Guest User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email || "Not logged in"}
                        </p>
                      </div>
                      {user && (
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <UserIcon className="mr-3 h-4 w-4 text-gray-400" />
                            Profile
                          </Link>
                          <Link
                            to="/settings"
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Cog6ToothIcon className="mr-3 h-4 w-4 text-gray-400" />
                            Settings
                          </Link>
                          <Link
                            to="/billing"
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <CreditCardIcon className="mr-3 h-4 w-4 text-gray-400" />
                            Billing
                          </Link>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={logout}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4 text-gray-400" />
                            Sign out
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
