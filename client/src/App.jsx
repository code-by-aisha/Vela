import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage        from './pages/LandingPage.jsx';
import LoginPage          from './pages/LoginPage.jsx';
import RegisterPage       from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage  from './pages/ResetPasswordPage.jsx';
import FeedPage           from './pages/FeedPage.jsx';
import ExplorePage        from './pages/ExplorePage.jsx';
import ProfilePage        from './pages/ProfilePage.jsx';
import MessagesPage       from './pages/MessagesPage.jsx';
import NotificationsPage  from './pages/NotificationsPage.jsx';
import StoriesPage        from './pages/StoriesPage.jsx';
import MomentPage         from './pages/MomentPage.jsx';
import CollectionsPage    from './pages/CollectionsPage.jsx';
import SettingsPage       from './pages/SettingsPage.jsx';
import AppLayout          from './components/layout/AppLayout.jsx';
import LoadingScreen      from './components/common/LoadingScreen.jsx';

// Guards that DON'T show their own loading screen —
// loading is handled once at the App level below.
const Require = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const Guest = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/feed" replace />;
};

export default function App() {
  const { loading } = useAuth();

  // Single loading gate — renders ONCE, exits ONCE (max 3 seconds)
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public root — redirects based on auth */}
      <Route path="/" element={<RootRedirect />} />

      {/* Guest-only */}
      <Route path="/login"               element={<Guest><LoginPage /></Guest>} />
      <Route path="/register"            element={<Guest><RegisterPage /></Guest>} />
      <Route path="/forgot-password"     element={<Guest><ForgotPasswordPage /></Guest>} />
      <Route path="/reset-password/:token" element={<Guest><ResetPasswordPage /></Guest>} />

      {/* Protected */}
      <Route element={<Require><AppLayout /></Require>}>
        <Route path="/feed"              element={<FeedPage />} />
        <Route path="/explore"           element={<ExplorePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/messages"          element={<MessagesPage />} />
        <Route path="/messages/:userId"  element={<MessagesPage />} />
        <Route path="/notifications"     element={<NotificationsPage />} />
        <Route path="/stories"           element={<StoriesPage />} />
        <Route path="/reels"             element={<Navigate to="/explore" replace />} />
        <Route path="/moment/:id"        element={<MomentPage />} />
        <Route path="/collections"       element={<CollectionsPage />} />
        <Route path="/settings"          element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  return user ? <Navigate to="/feed" replace /> : <LandingPage />;
}
