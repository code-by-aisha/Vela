import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import MobileNav from './MobileNav.jsx';
import audioManager from '../../utils/audioManager.js';

export default function AppLayout() {
  const location = useLocation();

  // Stop all audio whenever the user navigates to a different route
  useEffect(() => {
    audioManager.stop();
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
