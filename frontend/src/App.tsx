import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { PreviewModeProvider } from './context/PreviewModeContext';
import { PermissionsProvider } from './context/PermissionsContext';

// Only import Layout and contexts eagerly as they're needed immediately
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ProductTour from './components/ProductTour';

// Lazy load all pages for better code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const DashboardRouter = lazy(() => import('./pages/DashboardRouter'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Convention = lazy(() => import('./pages/Convention'));
const Brags = lazy(() => import('./pages/Brags'));
const Forum = lazy(() => import('./pages/Forum'));
const ForumThread = lazy(() => import('./pages/ForumThread'));
const Library = lazy(() => import('./pages/Library'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));
const Archive = lazy(() => import('./pages/Archive'));
const RecentlyDeleted = lazy(() => import('./pages/RecentlyDeleted'));
const Resources = lazy(() => import('./pages/Resources'));
const OwnersRoster = lazy(() => import('./pages/OwnersRoster'));
const OwnerProfileEnhanced = lazy(() => import('./pages/OwnerProfileEnhanced'));
const OwnerProfileManagement = lazy(() => import('./pages/OwnerProfileManagement'));
const MapSearch = lazy(() => import('./pages/MapSearch'));
const Partners = lazy(() => import('./pages/Partners'));
const Videos = lazy(() => import('./pages/Videos'));
const Equipment = lazy(() => import('./pages/Equipment'));
const FAQs = lazy(() => import('./pages/FAQs'));
const ReportsRouter = lazy(() => import('./pages/ReportsRouter'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const Billing = lazy(() => import('./pages/Billing'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const NewUsers = lazy(() => import('./pages/NewUsers'));
const Chat = lazy(() => import('./pages/Chat'));
const VendorProfile = lazy(() => import('./pages/VendorProfile'));
const VendorMap = lazy(() => import('./pages/VendorMap'));
const VendorEquipment = lazy(() => import('./pages/VendorEquipment'));
const VendorReports = lazy(() => import('./pages/VendorReports'));
const VendorInquiries = lazy(() => import('./pages/VendorInquiries'));
const BugReports = lazy(() => import('./pages/BugReports'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-400"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
    </div>
  </div>
);

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, // 1 minute - better for frequently changing data
      gcTime: 1000 * 60 * 5, // 5 minutes garbage collection (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false, // Disable auto-refetch on window focus for better UX
    },
  },
});

// Wrapper component to access auth context for the product tour
function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-right" />
      <ProductTour userId={user?._id} userRole={user?.role} />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected routes with Layout */}
                <Route element={<Layout />}>
                  <Route path="dashboard" element={
                    <ProtectedRoute requiredPermission="canAccessDashboard">
                      <DashboardRouter />
                    </ProtectedRoute>
                  } />
                  <Route path="reports" element={
                    <ProtectedRoute requiredPermission="canAccessDashboard">
                      <ReportsRouter />
                    </ProtectedRoute>
                  } />
                  <Route path="users" element={
                    <ProtectedRoute adminOnly requiredPermission="canManageUsers">
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="new-users" element={
                    <ProtectedRoute adminOnly requiredPermission="canManageUsers">
                      <NewUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="calendar" element={
                    <ProtectedRoute requiredPermission="canAccessEvents">
                      <Calendar />
                    </ProtectedRoute>
                  } />
                  <Route path="convention" element={
                    <ProtectedRoute requiredPermission="canAccessEvents">
                      <Convention />
                    </ProtectedRoute>
                  } />
                  <Route path="brags" element={
                    <ProtectedRoute requiredPermission="canAccessBrags">
                      <Brags />
                    </ProtectedRoute>
                  } />
                  <Route path="forum" element={
                    <ProtectedRoute requiredPermission="canAccessForum">
                      <Forum />
                    </ProtectedRoute>
                  } />
                  <Route path="forum/thread/:id" element={
                    <ProtectedRoute requiredPermission="canAccessForum">
                      <ForumThread />
                    </ProtectedRoute>
                  } />
                  <Route path="chat" element={
                    <ProtectedRoute requiredPermission="canAccessChat">
                      <Chat />
                    </ProtectedRoute>
                  } />
                  <Route path="library" element={
                    <ProtectedRoute requiredPermission="canAccessLibrary">
                      <Library />
                    </ProtectedRoute>
                  } />
                  <Route path="library/pending" element={
                    <ProtectedRoute adminOnly requiredPermission="canApprovePending">
                      <PendingApproval />
                    </ProtectedRoute>
                  } />
                  <Route path="pending-approval" element={
                    <ProtectedRoute adminOnly requiredPermission="canApprovePending">
                      <PendingApproval />
                    </ProtectedRoute>
                  } />
                  <Route path="archive" element={
                    <ProtectedRoute adminOnly>
                      <Archive />
                    </ProtectedRoute>
                  } />
                  <Route path="recently-deleted" element={
                    <ProtectedRoute adminOnly>
                      <RecentlyDeleted />
                    </ProtectedRoute>
                  } />
                  <Route path="resources" element={
                    <ProtectedRoute requiredPermission="canAccessLibrary">
                      <Resources />
                    </ProtectedRoute>
                  } />
                  <Route path="owners" element={
                    <ProtectedRoute allowedRoles={['admin', 'vendor']} requiredPermission="canAccessDirectory">
                      <OwnersRoster />
                    </ProtectedRoute>
                  } />
                  <Route path="owners/:id" element={
                    <ProtectedRoute allowedRoles={['admin', 'vendor']} requiredPermission="canAccessDirectory">
                      <OwnerProfileEnhanced />
                    </ProtectedRoute>
                  } />
                  <Route path="map" element={
                    <ProtectedRoute requiredPermission="canAccessDirectory">
                      <MapSearch />
                    </ProtectedRoute>
                  } />
                  <Route path="partners" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner']} requiredPermission="canAccessPartners">
                      <Partners />
                    </ProtectedRoute>
                  } />
                  <Route path="videos" element={
                    <ProtectedRoute requiredPermission="canAccessVideos">
                      <Videos />
                    </ProtectedRoute>
                  } />
                  <Route path="equipment" element={
                    <ProtectedRoute requiredPermission="canAccessEquipment">
                      <Equipment />
                    </ProtectedRoute>
                  } />
                  <Route path="equipment/:id" element={
                    <ProtectedRoute requiredPermission="canAccessEquipment">
                      <Equipment />
                    </ProtectedRoute>
                  } />
                  <Route path="faqs" element={<FAQs />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="billing" element={<Billing />} />
                  {/* Vendor-specific routes - accessible to vendors and admins */}
                  <Route path="vendor-profile" element={
                    <ProtectedRoute allowedRoles={['admin', 'vendor']} requiredPermission="canAccessDashboard">
                      <VendorProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="vendor-map" element={
                    <ProtectedRoute allowedRoles={['admin', 'vendor']} requiredPermission="canAccessDirectory">
                      <VendorMap />
                    </ProtectedRoute>
                  } />
                  <Route path="vendor-equipment" element={
                    <ProtectedRoute allowedRoles={['admin', 'vendor']} requiredPermission="canListEquipment">
                      <VendorEquipment />
                    </ProtectedRoute>
                  } />
                  <Route path="vendor-reports" element={
                    <ProtectedRoute allowedRoles={['admin', 'vendor']} requiredPermission="canAccessDashboard">
                      <VendorReports />
                    </ProtectedRoute>
                  } />
                  <Route path="vendor-inquiries" element={
                    <ProtectedRoute allowedRoles={['admin', 'vendor']} requiredPermission="canAccessEquipment">
                      <VendorInquiries />
                    </ProtectedRoute>
                  } />
                  <Route path="bug-reports" element={
                    <ProtectedRoute>
                      <BugReports />
                    </ProtectedRoute>
                  } />
                  {/* Owner-specific routes */}
                  <Route path="owner-profile-management" element={
                    <ProtectedRoute allowedRoles={['owner']} requiredPermission="canAccessDashboard">
                      <OwnerProfileManagement />
                    </ProtectedRoute>
                  } />
                </Route>
                </Routes>
              </Suspense>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <DarkModeProvider>
          <AuthProvider>
            <PreviewModeProvider>
              <PermissionsProvider>
                <AppContent />
              </PermissionsProvider>
            </PreviewModeProvider>
          </AuthProvider>
        </DarkModeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;