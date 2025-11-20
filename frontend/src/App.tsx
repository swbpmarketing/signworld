import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import Layout from './components/Layout';
// import ErrorBoundary from './components/ErrorBoundary';
// import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import DashboardRouter from './pages/DashboardRouter';
import Calendar from './pages/Calendar';
// import Calendar from './pages/CalendarFixed';
import Convention from './pages/Convention';
import Brags from './pages/Brags';
import Forum from './pages/Forum';
import ForumThread from './pages/ForumThread';
import Library from './pages/Library';
import Resources from './pages/Resources';
import OwnersRoster from './pages/OwnersRoster';
import OwnerProfileEnhanced from './pages/OwnerProfileEnhanced';
import MapSearch from './pages/MapSearch';
import Partners from './pages/Partners';
import Videos from './pages/Videos';
import Equipment from './pages/Equipment';
import FAQs from './pages/FAQs';
import Reports from './pages/Reports';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import Billing from './pages/Billing';

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
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* Protected routes with Layout */}
              <Route element={<Layout />}>
                <Route path="dashboard" element={<DashboardRouter />} />
                <Route path="reports" element={<Reports />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="convention" element={<Convention />} />
                <Route path="brags" element={<Brags />} />
                <Route path="forum" element={<Forum />} />
                <Route path="forum/thread/:id" element={<ForumThread />} />
                <Route path="library" element={<Library />} />
                <Route path="library/*" element={<Library />} />
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
              </Route>
            </Routes>
          </AuthProvider>
        </DarkModeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;