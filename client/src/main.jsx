import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { MessageProvider } from './context/MessageContext.jsx';

// Detect mobile for toast position — mobile = top-center, desktop = bottom-right
const isMobile = () => window.innerWidth < 768;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <MessageProvider>
              <App />
              <Toaster
                position={isMobile() ? 'top-center' : 'bottom-right'}
                gutter={10}
                containerStyle={{ zIndex: 99999 }}
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: 'rgba(15,13,18,0.97)',
                    color: '#fff',
                    border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px',
                    backdropFilter: 'blur(20px)',
                    maxWidth: '340px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  },
                  success: { iconTheme: { primary: '#A78BFA', secondary: '#0F0D12' } },
                  error:   { iconTheme: { primary: '#EF4444', secondary: '#0F0D12' } },
                }}
              />
            </MessageProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
