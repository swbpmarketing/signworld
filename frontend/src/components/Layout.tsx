import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import { usePreviewMode } from "../context/PreviewModeContext";
import { usePermissions } from "../context/PermissionsContext";
import type { Permissions } from "../context/PermissionsContext";
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
  ChatBubbleLeftIcon,
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
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  InboxIcon,
  EyeIcon,
  XMarkIcon,
  BugAntIcon,
  LifebuoyIcon,
} from "@heroicons/react/24/outline";
import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import AISearchModal from "./AISearchModal";
import UserSelectionModal from "./UserSelectionModal";
import { NotificationPanel } from "./NotificationPanel";
import { useNotifications } from "../hooks/useNotifications";
import AnnouncementBanner from "./AnnouncementBanner";

const navigation: {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: string[];
  permission?: keyof Permissions;
  tourId: string;
}[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, roles: ['admin', 'owner', 'vendor'], permission: 'canAccessDashboard', tourId: 'nav-dashboard' },
  { name: "Reports", href: "/reports", icon: ChartBarIcon, roles: ['admin', 'owner', 'vendor'], permission: 'canAccessDashboard', tourId: 'nav-reports' },
  { name: "User Management", href: "/users", icon: UsersIcon, roles: ['admin'], permission: 'canManageUsers', tourId: 'nav-user-management' },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon, roles: ['admin', 'owner', 'vendor'], permission: 'canAccessEvents', tourId: 'nav-calendar' },
  { name: "Convention", href: "/convention", icon: BuildingOffice2Icon, roles: ['admin', 'owner', 'vendor'], permission: 'canAccessEvents', tourId: 'nav-convention' },
  { name: "Success Stories", href: "/brags", icon: NewspaperIcon, roles: ['admin', 'owner', 'vendor'], permission: 'canAccessBrags', tourId: 'nav-brags' },
  { name: "Forum", href: "/forum", icon: ChatBubbleLeftRightIcon, roles: ['admin', 'owner'], permission: 'canAccessForum', tourId: 'nav-forum' },
  { name: "Chat", href: "/chat", icon: ChatBubbleLeftIcon, roles: ['admin', 'owner', 'vendor'], permission: 'canAccessChat', tourId: 'nav-chat' },
  { name: "Library", href: "/library", icon: FolderIcon, roles: ['admin', 'owner'], permission: 'canAccessLibrary', tourId: 'nav-library' },
  { name: "Owners Roster", href: "/owners", icon: UserGroupIcon, roles: ['admin', 'vendor'], permission: 'canAccessDirectory', tourId: 'nav-owners' },
  { name: "Map Search", href: "/map", icon: MapIcon, roles: ['admin', 'owner', 'vendor'], permission: 'canAccessDirectory', tourId: 'nav-map' },
  { name: "Partners", href: "/partners", icon: UserGroupIcon, roles: ['admin', 'owner'], permission: 'canAccessPartners', tourId: 'nav-partners' },
  { name: "Videos", href: "/videos", icon: VideoCameraIcon, roles: ['admin', 'owner'], permission: 'canAccessVideos', tourId: 'nav-videos' },
  { name: "Equipment", href: "/equipment", icon: ShoppingBagIcon, roles: ['admin', 'owner', 'vendor'], permission: 'canAccessEquipment', tourId: 'nav-equipment' },
  { name: "My Listings", href: "/vendor-equipment", icon: ClipboardDocumentListIcon, roles: ['vendor'], permission: 'canListEquipment', tourId: 'nav-vendor-equipment' },
  { name: "My Inquiries", href: "/vendor-inquiries", icon: InboxIcon, roles: ['vendor'], permission: 'canAccessEquipment', tourId: 'nav-vendor-inquiries' },
  { name: "Business Profile", href: "/vendor-profile", icon: BuildingStorefrontIcon, roles: ['vendor'], permission: 'canAccessDashboard', tourId: 'nav-vendor-profile' },
  { name: "My Roster Profile", href: "/owner-profile-management", icon: UserIcon, roles: ['owner'], permission: 'canAccessDashboard', tourId: 'nav-owner-profile' },
  { name: "FAQs", href: "/faqs", icon: QuestionMarkCircleIcon, roles: ['admin', 'owner', 'vendor'], tourId: 'nav-faqs' },
  { name: "Support", href: "/support-tickets", icon: LifebuoyIcon, roles: ['admin', 'owner'], tourId: 'nav-support' },
  { name: "Bug Reports", href: "/bug-reports", icon: BugAntIcon, roles: ['admin', 'owner', 'vendor'], tourId: 'nav-bug-reports' },
];

// Memoized Sidebar component - only re-renders when props change
// Note: isPreviewMode and permissions are passed to trigger re-renders when they change
const Sidebar = memo(({
  sidebarOpen,
  sidebarCollapsed,
  userRole,
  actualUserRole,
  currentPath,
  onClose,
  onToggleCollapse,
  hasPermission,
  isPreviewMode: _isPreviewMode,
  permissions: _permissions,
  onHoverChange
}: {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  userRole?: string;
  actualUserRole?: string;
  currentPath: string;
  onClose: () => void;
  onToggleCollapse: () => void;
  hasPermission: (permission: keyof Permissions) => boolean;
  isPreviewMode: boolean;
  permissions: Permissions | null;
  onHoverChange: (isHovering: boolean) => void;
}) => {
  // Sidebar is expanded when not collapsed, or when hovering while collapsed
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    if (sidebarCollapsed) {
      setIsHovering(true);
      onHoverChange(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    onHoverChange(false);
  };

  // Expanded when: not collapsed OR (collapsed but hovering)
  const isExpanded = !sidebarCollapsed || isHovering;

  const filteredNavigation = navigation.filter(item => {
    // Always use actualUserRole for role checks (the role from JWT token)
    // Preview mode permissions are handled separately via hasPermission()
    const roleToCheck = actualUserRole;

    // First check role-based access
    if (roleToCheck && !item.roles.includes(roleToCheck)) {
      return false;
    }
    // Then check permission-based access
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  // Separate Support & Bug Reports to pin at bottom
  const bottomNavNames = ['Support', 'Bug Reports'];
  const mainNavigation = filteredNavigation.filter(item => !bottomNavNames.includes(item.name));
  const bottomNavItems = filteredNavigation.filter(item => bottomNavNames.includes(item.name));

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform md:translate-x-0 transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isExpanded ? "w-64" : "w-16"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex h-full flex-col bg-white dark:bg-gray-800">
          {/* Logo - with explicit dimensions to prevent layout shift */}
          <div className="flex h-16 items-center justify-center px-2 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 relative overflow-hidden">
            <img
              src="/logo.png"
              alt="Sign Company Logo"
              className={`w-full max-w-[200px] h-auto object-contain brightness-[0.2] dark:brightness-0 dark:invert absolute transition-all duration-300 ${
                isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
            <img
              src="/logo-csb.png"
              alt="Sign Company Logo"
              className={`w-10 h-10 object-contain brightness-[0.2] dark:brightness-0 dark:invert transition-all duration-300 ${
                !isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
          </div>

          {/* Portal Title */}
          {isExpanded && (
            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 animate-fadeIn">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                {actualUserRole === 'admin' || userRole === 'admin' ? 'Admin Portal' :
                 actualUserRole === 'vendor' || userRole === 'vendor' ? 'Partner Portal' : 'Owner Portal'}
              </p>
            </div>
          )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col">
          <div className="space-y-0.5 flex-1">
            {mainNavigation.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  data-tour={item.tourId}
                  className={`group flex items-center ${!isExpanded ? 'justify-center px-3' : 'px-3'} py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                  onClick={onClose}
                  title={!isExpanded ? item.name : undefined}
                >
                  <item.icon
                    className={`${!isExpanded ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 sidebar-icon transition-all duration-300 ${
                      isActive
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                  {isExpanded && <span className="animate-fadeIn">{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Support & Bug Reports pinned at bottom */}
          {bottomNavItems.length > 0 && (
            <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
              {bottomNavItems.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    data-tour={item.tourId}
                    className={`group flex items-center ${!isExpanded ? 'justify-center px-3' : 'px-3'} py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                    onClick={onClose}
                    title={!isExpanded ? item.name : undefined}
                  >
                    <item.icon
                      className={`${!isExpanded ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 sidebar-icon transition-all duration-300 ${
                        isActive
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    />
                    {isExpanded && <span className="animate-fadeIn">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          )}

        </nav>

        </div>
      </aside>

      {/* Sidebar Toggle Button - Floating at sidebar edge, Desktop only */}
      <button
        onClick={onToggleCollapse}
        className={`hidden md:flex fixed top-4 z-50 items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 ${
          isExpanded ? 'left-[252px]' : 'left-[52px]'
        }`}
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? (
          /* Expand icon - chevron right */
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          /* Collapse icon - chevron left */
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

// Memoized Breadcrumb component - only re-renders when location changes
const Breadcrumb = memo(({ pathname }: { pathname: string }) => {
  const pageName = navigation.find((item) => item.href === pathname)?.name || "Dashboard";

  // Helper to render nested breadcrumbs
  const renderBreadcrumbContent = () => {
    // Forum thread pages
    if (pathname.startsWith('/forum/')) {
      return (
        <>
          <Link to="/forum" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Forum
          </Link>
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">&gt;</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            Thread
          </span>
        </>
      );
    }

    // Recently Deleted page (sub-page of Library)
    if (pathname === '/recently-deleted') {
      return (
        <>
          <Link to="/library" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Library
          </Link>
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">&gt;</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            Recently Deleted
          </span>
        </>
      );
    }

    // Archive page (sub-page of Library)
    if (pathname === '/archive') {
      return (
        <>
          <Link to="/library" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Library
          </Link>
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">&gt;</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            Archive
          </span>
        </>
      );
    }

    // Pending Approval page (sub-page of Library, admin only)
    if (pathname === '/library/pending' || pathname === '/pending-approval') {
      return (
        <>
          <Link to="/library" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Library
          </Link>
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">&gt;</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            Pending Approval
          </span>
        </>
      );
    }

    // New Users page (sub-page of Users, admin only)
    if (pathname === '/new-users') {
      return (
        <>
          <Link to="/users" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Users
          </Link>
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">&gt;</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            New Users
          </span>
        </>
      );
    }

    // Owner Profile pages
    if (pathname.startsWith('/owners/') && pathname !== '/owners') {
      return (
        <>
          <Link to="/owners" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Owners Roster
          </Link>
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">&gt;</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            Owner Profile
          </span>
        </>
      );
    }

    // Default page name
    return (
      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
        {pageName}
      </span>
    );
  };

  return (
    <nav className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm min-w-0">
      <Link to="/dashboard" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors flex-shrink-0">
        <HomeIcon className="h-4 w-4" />
      </Link>
      <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">&gt;</span>
      {renderBreadcrumbContent()}
    </nav>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

const Layout = () => {
  const { user, logout, loading } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { previewState, isPreviewMode, startPreview, startUserPreview, exitPreview, getEffectiveRole, getPreviewedUser } = usePreviewMode();
  const { hasPermission, permissions } = usePermissions();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Initialize collapsed state from localStorage, default to true (collapsed)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [sidebarHovering, setSidebarHovering] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [userSelectionModalOpen, setUserSelectionModalOpen] = useState(false);

  // Get the effective role for UI (actual role or preview role)
  const effectiveRole = getEffectiveRole();

  // Notifications hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    loading: notificationsLoading,
  } = useNotifications();

  // Set page title for dashboard
  useEffect(() => {
    document.title = 'Sign Company Dashboard';
  }, []);

  // Memoized handlers to prevent re-renders
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleToggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const handleSidebarHoverChange = useCallback((isHovering: boolean) => {
    setSidebarHovering(isHovering);
  }, []);

  const handleUserMenuToggle = useCallback(() => {
    setUserMenuOpen(prev => !prev);
  }, []);

  const handleSearchModalOpen = useCallback(() => {
    setSearchModalOpen(true);
  }, []);

  const handleSearchModalClose = useCallback(() => {
    setSearchModalOpen(false);
  }, []);

  const handleNotificationToggle = useCallback(() => {
    setNotificationPanelOpen(prev => !prev);
  }, []);

  const handleNotificationClose = useCallback(() => {
    setNotificationPanelOpen(false);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setUserMenuOpen(false);
  }, []);

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

  // Don't redirect while loading, and redirect to login if not authenticated
  if (loading) {
    return null; // Return nothing while checking auth
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex overflow-x-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 md:hidden"
          onClick={handleSidebarClose}
        />
      )}

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2">
          <div className="flex items-center justify-center gap-3">
            <EyeIcon className="h-5 w-5" />
            <span className="font-medium">
              {previewState.type === 'role'
                ? `Preview Mode: Viewing as ${previewState.role === 'owner' ? 'Owner' : 'Vendor'}`
                : `Preview Mode: Viewing as ${previewState.userName} (${previewState.userEmail})`}
            </span>
            <button
              onClick={exitPreview}
              className="ml-4 inline-flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Exit Preview
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        userRole={effectiveRole}
        actualUserRole={user?.role}
        currentPath={location.pathname}
        onClose={handleSidebarClose}
        onToggleCollapse={handleToggleSidebarCollapse}
        hasPermission={hasPermission}
        isPreviewMode={isPreviewMode}
        permissions={permissions}
        onHoverChange={handleSidebarHoverChange}
      />

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden transition-all duration-300 ${sidebarCollapsed && !sidebarHovering ? 'md:ml-16' : 'md:ml-64'} ${isPreviewMode ? 'pt-10' : ''}`}>
        {/* Top bar */}
        <header className={`sticky ${isPreviewMode ? 'top-10' : 'top-0'} z-30 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-md pt-3`}>
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-12">
              {/* Left side - Mobile menu + Breadcrumbs */}
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                {/* Mobile menu button */}
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 md:hidden transition-colors"
                  onClick={handleSidebarToggle}
                  aria-label="Open sidebar"
                >
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

                {/* Breadcrumb Navigation */}
                <Breadcrumb pathname={location.pathname} />
              </div>

              {/* Right side - Search + Actions */}
              <div className="flex items-center space-x-4">
                {/* Mobile view - Individual buttons */}
                <div className="flex sm:hidden items-center space-x-1.5">
                  {/* Search */}
                  <button
                    type="button"
                    onClick={handleSearchModalOpen}
                    className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Search (Ctrl+K)"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  {/* Dark mode toggle */}
                  <button
                    type="button"
                    className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
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
                      className="relative p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationToggle();
                      }}
                    >
                      <BellIcon className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-5 w-5 text-[10px] font-bold text-white bg-primary-500 rounded-full ring-2 ring-white dark:ring-gray-900">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <NotificationPanel
                      notifications={notifications}
                      unreadCount={unreadCount}
                      isOpen={notificationPanelOpen}
                      onClose={handleNotificationClose}
                      onMarkAsRead={markAsRead}
                      onMarkAllAsRead={markAllAsRead}
                      onDismiss={dismissNotification}
                      onClearAll={clearAll}
                      loading={notificationsLoading}
                    />
                  </div>

                  {/* User Avatar */}
                  <button
                    type="button"
                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={handleUserMenuToggle}
                    aria-label="User menu"
                  >
                    {user?.profileImage ? (
                      <img
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                        src={user.profileImage}
                        alt={user?.name || "User profile"}
                        width={32}
                        height={32}
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700">
                        <span className="text-xs font-medium text-white">
                          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Desktop view - Pill Container */}
                <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                  {/* Search */}
                  <button
                    type="button"
                    onClick={handleSearchModalOpen}
                    data-tour="search-button"
                    className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md px-2 py-1"
                    aria-label="Search (Ctrl+K)"
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
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
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
                      data-tour="notifications-button"
                      className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationToggle();
                      }}
                    >
                      <BellIcon className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-primary-500 rounded-full ring-2 ring-white dark:ring-gray-800">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <NotificationPanel
                      notifications={notifications}
                      unreadCount={unreadCount}
                      isOpen={notificationPanelOpen}
                      onClose={handleNotificationClose}
                      onMarkAsRead={markAsRead}
                      onMarkAllAsRead={markAllAsRead}
                      onDismiss={dismissNotification}
                      onClearAll={clearAll}
                      loading={notificationsLoading}
                    />
                  </div>

                  {/* User Avatar */}
                  <button
                    type="button"
                    data-tour="user-menu"
                    className="relative focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
                    onClick={handleUserMenuToggle}
                    aria-label="User menu"
                  >
                    {user?.profileImage ? (
                      <img
                        className="h-9 w-9 rounded-full object-cover"
                        src={user.profileImage}
                        alt={user?.name || "User profile"}
                        width={36}
                        height={36}
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Announcement Banner - full width below top bar */}
          <div className="px-4 sm:px-6 pt-2 pb-2">
            <AnnouncementBanner />
          </div>

          {/* User dropdown */}
          {userMenuOpen && (
            <div className="absolute right-3 sm:right-4 md:right-6 top-10 sm:top-10 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-50">
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
                    onClick={handleUserMenuClose}
                  >
                    <UserIcon className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={handleUserMenuClose}
                  >
                    <Cog6ToothIcon className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Settings
                  </Link>
                  {/* Preview Mode - Admin Only */}
                  {user?.role === 'admin' && (
                    <>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <div className="px-4 py-2 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Preview Mode
                        </p>

                        {/* Role-based preview */}
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">By Role</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                startPreview('owner');
                                handleUserMenuClose();
                              }}
                              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                previewState.type === 'role' && previewState.role === 'owner'
                                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 cursor-default'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300'
                              }`}
                            >
                              Owner
                            </button>
                            <button
                              onClick={() => {
                                startPreview('vendor');
                                handleUserMenuClose();
                              }}
                              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                previewState.type === 'role' && previewState.role === 'vendor'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 cursor-default'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300'
                              }`}
                            >
                              Vendor
                            </button>
                          </div>
                        </div>

                        {/* User-specific preview */}
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">As Specific User</p>
                          <button
                            onClick={() => {
                              setUserSelectionModalOpen(true);
                              handleUserMenuClose();
                            }}
                            className="w-full text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                          >
                            {previewState.type === 'user'
                              ? `Change User (${previewState.userName})`
                              : 'Select User...'}
                          </button>
                        </div>

                        {/* Exit preview */}
                        {isPreviewMode && (
                          <button
                            onClick={() => {
                              exitPreview();
                              handleUserMenuClose();
                            }}
                            className="w-full px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            Exit Preview Mode
                          </button>
                        )}
                      </div>
                    </>
                  )}
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth min-w-0">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl w-full">
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      {/* AI Search Modal */}
      <AISearchModal
        isOpen={searchModalOpen}
        onClose={handleSearchModalClose}
        userRole={effectiveRole}
        userName={isPreviewMode && getPreviewedUser()?.name ? getPreviewedUser()?.name : user?.name}
        userCompany={isPreviewMode && getPreviewedUser()?.name ? '' : user?.company}
      />

      {/* User Selection Modal for Preview */}
      <UserSelectionModal
        isOpen={userSelectionModalOpen}
        onClose={() => setUserSelectionModalOpen(false)}
        onSelectUser={(selectedUser) => {
          startUserPreview(selectedUser._id, selectedUser.name, selectedUser.email, selectedUser.role);
          setUserSelectionModalOpen(false);
        }}
      />
    </div>
  );
};

export default Layout;
