import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';

// Only import Layout and contexts eagerly as they're needed immediately
import Layout from './components/Layout';

// Lazy load all pages for better code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
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
const Chat = lazy(() => import('./pages/Chat'));
const VendorProfile = lazy(() => import('./pages/VendorProfile'));
const VendorMap = lazy(() => import('./pages/VendorMap'));
const VendorEquipment = lazy(() => import('./pages/VendorEquipment'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-400"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
    </div>
  </div>
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  console.log('App component rendering');
  console.log('Environment:', import.meta.env.MODE);
  console.log('API URL:', import.meta.env.VITE_API_URL);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <DarkModeProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />

                {/* Protected routes with Layout */}
                <Route element={<Layout />}>
                  <Route path="dashboard" element={<DashboardRouter />} />
                  <Route path="reports" element={<ReportsRouter />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="convention" element={<Convention />} />
                  <Route path="brags" element={<Brags />} />
                  <Route path="forum" element={<Forum />} />
                  <Route path="forum/thread/:id" element={<ForumThread />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="library" element={<Library />} />
                  <Route path="library/pending" element={<PendingApproval />} />
                  <Route path="archive" element={<Archive />} />
                  <Route path="recently-deleted" element={<RecentlyDeleted />} />
                  <Route path="resources" element={<Resources />} />
                  <Route path="owners" element={<OwnersRoster />} />
                  <Route path="owners/:id" element={<OwnerProfileEnhanced />} />
                  <Route path="map" element={<MapSearch />} />
                  <Route path="partners" element={<Partners />} />
                  <Route path="videos" element={<Videos />} />
                  <Route path="equipment" element={<Equipment />} />
                  <Route path="faqs" element={<FAQs />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="billing" element={<Billing />} />
                  {/* Vendor-specific routes */}
                  <Route path="vendor-profile" element={<VendorProfile />} />
                  <Route path="vendor-map" element={<VendorMap />} />
                  <Route path="vendor-equipment" element={<VendorEquipment />} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </DarkModeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;